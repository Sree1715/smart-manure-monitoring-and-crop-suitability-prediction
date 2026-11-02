"""
readings.py — Device management, session management, and hardware ingest endpoints.

ESP32 Integration Flow:
  1. Farmer registers on the website → a Device is registered via POST /api/devices
     (done once, gives back an api_key to put in the firmware).
  2. Farmer logs in → enters N, P, K → clicks "Start Measurement Session"
     → POST /api/sessions  (creates an open session with NPK values).
  3. ESP32 sends POST /api/readings/ingest with X-Device-Key header.
     Backend finds the device's open session, reads NPK from it, combines
     with ESP32 moisture + temperature, stores a complete Reading, closes session.
  4. Authority dashboard shows the combined record.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import secrets
import datetime
from ..db import database, models
from ..schemas import schemas
from ..core import pipeline, security

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Helper: convert raw ADC to moisture percentage using device calibration
# ─────────────────────────────────────────────────────────────────────────────
def adc_to_moisture_pct(raw_adc: int, dry_adc: int, wet_adc: int) -> float:
    """
    Converts HW-080 resistive moisture probe raw ADC reading (0-4095) to
    a moisture percentage using two-point calibration.

    Formula:  moisture_pct = (dry_adc - raw_adc) / (dry_adc - wet_adc) * 100

    Note: Resistive probes give HIGH ADC values when DRY (high resistance = less voltage)
    and LOW ADC values when WET (low resistance = more voltage to divider).
    The HW-103 module inverts this, so higher ADC = drier.
    Clamp the result to [0.0, 100.0].
    """
    if dry_adc == wet_adc:
        return 0.0
    pct = (dry_adc - raw_adc) / (dry_adc - wet_adc) * 100.0
    return round(max(0.0, min(100.0, pct)), 1)


# ─────────────────────────────────────────────────────────────────────────────
# Device Registration
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/devices")
def register_device(
    owner_id: int,
    db: Session = Depends(database.get_db)
):
    """
    Registers a new ESP32 hardware device for a farmer and generates a secure API key.
    Call this once from the website after logging in. The returned api_key goes into
    the ESP32 firmware as DEVICE_API_KEY.
    """
    user = db.query(models.User).filter(models.User.id == owner_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    api_key = f"dev_key_{secrets.token_hex(16)}"
    new_device = models.Device(owner_id=user.id, api_key=api_key)
    db.add(new_device)
    db.commit()
    db.refresh(new_device)

    # Create default calibration for this device
    calibration = models.DeviceCalibrationConfig(
        device_id=new_device.id,
        dry_adc=3200,
        wet_adc=800
    )
    db.add(calibration)
    db.commit()

    return {
        "device_id": new_device.id,
        "api_key": new_device.api_key,
        "owner_id": new_device.owner_id,
        "calibration": {
            "dry_adc": 3200,
            "wet_adc": 800,
            "note": "Default calibration values. Update using POST /api/devices/{device_id}/calibrate after performing dry/wet tests."
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Device Calibration (update dry/wet ADC constants)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/devices/{device_id}/calibrate")
def set_device_calibration(
    device_id: int,
    calibration_data: schemas.DeviceCalibration,
    x_device_key: str = Header(...),
    db: Session = Depends(database.get_db)
):
    """
    Updates the moisture calibration constants for a device.
    The ESP32 can send this when in calibration mode, or the farmer
    can set it via the website.

    dry_adc: ADC reading when probe is in completely DRY manure/open air.
    wet_adc: ADC reading when probe is fully inserted in WET manure/water.
    """
    device = db.query(models.Device).filter(
        models.Device.id == device_id,
        models.Device.api_key == x_device_key
    ).first()
    if not device:
        raise HTTPException(status_code=401, detail="Invalid device key or device not found")

    if calibration_data.dry_adc <= calibration_data.wet_adc:
        raise HTTPException(
            status_code=400,
            detail=f"dry_adc ({calibration_data.dry_adc}) must be greater than wet_adc ({calibration_data.wet_adc}). "
                   "For the HW-080 resistive probe: dry reading has HIGHER ADC than wet reading."
        )

    cal = db.query(models.DeviceCalibrationConfig).filter(
        models.DeviceCalibrationConfig.device_id == device_id
    ).first()

    if cal:
        cal.dry_adc = calibration_data.dry_adc
        cal.wet_adc = calibration_data.wet_adc
        cal.updated_at = datetime.datetime.utcnow()
    else:
        cal = models.DeviceCalibrationConfig(
            device_id=device_id,
            dry_adc=calibration_data.dry_adc,
            wet_adc=calibration_data.wet_adc
        )
        db.add(cal)

    db.commit()
    return {
        "status": "success",
        "device_id": device_id,
        "dry_adc": calibration_data.dry_adc,
        "wet_adc": calibration_data.wet_adc,
        "message": "Calibration constants updated successfully."
    }


# ─────────────────────────────────────────────────────────────────────────────
# Get device calibration (for ESP32 to retrieve its calibration constants)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/devices/my")
def get_my_device(
    x_device_key: str = Header(...),
    db: Session = Depends(database.get_db)
):
    """
    Returns device info and calibration constants for the authenticating device.
    ESP32 can call this on startup to retrieve its calibration constants.
    """
    device = db.query(models.Device).filter(models.Device.api_key == x_device_key).first()
    if not device:
        raise HTTPException(status_code=401, detail="Invalid device key")

    cal = device.calibration
    open_session = db.query(models.MeasurementSession).filter(
        models.MeasurementSession.device_id == device.id,
        models.MeasurementSession.status == "open"
    ).order_by(models.MeasurementSession.created_at.desc()).first()

    return {
        "device_id": device.id,
        "owner_id": device.owner_id,
        "calibration": {
            "dry_adc": cal.dry_adc if cal else 3200,
            "wet_adc": cal.wet_adc if cal else 800
        },
        "open_session": {
            "session_id": open_session.id,
            "nitrogen_pct": open_session.nitrogen_pct,
            "phosphorus_pct": open_session.phosphorus_pct,
            "potassium_pct": open_session.potassium_pct,
            "manure_type": open_session.manure_type,
            "created_at": open_session.created_at.isoformat()
        } if open_session else None
    }


# ─────────────────────────────────────────────────────────────────────────────
# Measurement Sessions (created by farmer on website before ESP32 sends data)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/sessions")
def create_measurement_session(
    session_data: schemas.SessionCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Opens a new measurement session for the authenticated farmer.
    The farmer enters N, P, K values on the website, then clicks
    'Start Measurement'. This creates an open session.
    When the ESP32 sends its next hardware reading, it will be linked
    to this session, combining NPK + moisture + temperature.
    """
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can create measurement sessions.")

    # Find this farmer's registered device
    device = db.query(models.Device).filter(
        models.Device.owner_id == current_user.id
    ).first()

    # Close any previously open sessions for this farmer (only one open session at a time)
    old_open = db.query(models.MeasurementSession).filter(
        models.MeasurementSession.farmer_id == current_user.id,
        models.MeasurementSession.status == "open"
    ).all()
    for old in old_open:
        old.status = "expired"
    if old_open:
        db.commit()

    new_session = models.MeasurementSession(
        farmer_id=current_user.id,
        device_id=device.id if device else None,
        status="open",
        nitrogen_pct=session_data.nitrogen_pct,
        phosphorus_pct=session_data.phosphorus_pct,
        potassium_pct=session_data.potassium_pct,
        manure_type=session_data.manure_type,
        notes=session_data.notes
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "status": "success",
        "message": "Measurement session opened. Your ESP32 device will now send moisture and temperature readings to complete this session.",
        "session_id": new_session.id,
        "farmer_id": current_user.id,
        "device_id": device.id if device else None,
        "device_registered": device is not None,
        "npk": {
            "nitrogen_pct": session_data.nitrogen_pct,
            "phosphorus_pct": session_data.phosphorus_pct,
            "potassium_pct": session_data.potassium_pct
        },
        "manure_type": session_data.manure_type,
        "waiting_for": "ESP32 hardware reading (moisture + temperature)"
    }


@router.get("/sessions")
def list_my_sessions(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db),
    limit: int = 10
):
    """Returns the farmer's measurement sessions, most recent first."""
    sessions = db.query(models.MeasurementSession).filter(
        models.MeasurementSession.farmer_id == current_user.id
    ).order_by(models.MeasurementSession.created_at.desc()).limit(limit).all()

    result = []
    for s in sessions:
        result.append({
            "session_id": s.id,
            "status": s.status,
            "manure_type": s.manure_type,
            "nitrogen_pct": s.nitrogen_pct,
            "phosphorus_pct": s.phosphorus_pct,
            "potassium_pct": s.potassium_pct,
            "notes": s.notes,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "reading_id": s.reading_id
        })
    return {"sessions": result, "total": len(result)}


@router.get("/sessions/active")
def get_active_session(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Returns the currently open measurement session for the farmer, if any."""
    session = db.query(models.MeasurementSession).filter(
        models.MeasurementSession.farmer_id == current_user.id,
        models.MeasurementSession.status == "open"
    ).order_by(models.MeasurementSession.created_at.desc()).first()

    if not session:
        return {"active_session": None, "message": "No active session. Start a new one by entering NPK values."}

    # Check if the session is older than 2 hours — auto-expire it
    age_hours = (datetime.datetime.utcnow() - session.created_at).total_seconds() / 3600
    if age_hours > 2:
        session.status = "expired"
        db.commit()
        return {"active_session": None, "message": "Previous session expired (>2 hours). Please start a new one."}

    device = db.query(models.Device).filter(
        models.Device.owner_id == current_user.id
    ).first()

    return {
        "active_session": {
            "session_id": session.id,
            "status": session.status,
            "manure_type": session.manure_type,
            "nitrogen_pct": session.nitrogen_pct,
            "phosphorus_pct": session.phosphorus_pct,
            "potassium_pct": session.potassium_pct,
            "notes": session.notes,
            "created_at": session.created_at.isoformat(),
            "age_minutes": round(age_hours * 60, 1),
            "device_id": device.id if device else None,
            "device_registered": device is not None
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# ESP32 Hardware Ingest — PRIMARY ENDPOINT FOR THE PHYSICAL DEVICE
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/readings/ingest")
def ingest_reading(
    reading_data: schemas.ESP32HardwareIngest,
    x_device_key: str = Header(...),
    db: Session = Depends(database.get_db)
):
    """
    Primary hardware endpoint used by the ESP32 to send sensor readings.

    Authentication: X-Device-Key header must match a registered device api_key.

    The ESP32 sends ONLY:
      - moisture_raw_adc: raw 12-bit ADC value from GPIO 34 (HW-080 resistive probe)
      - temperature_c:    DS18B20 reading from GPIO 4
      - (optional) dry_adc / wet_adc for calibration update

    The backend:
      1. Authenticates the device via X-Device-Key
      2. Converts raw ADC to moisture_pct using device calibration constants
      3. Finds the farmer's open measurement session (which holds N, P, K)
      4. Combines everything into one Reading record
      5. Closes the session

    If no open session exists, the reading is stored without NPK (moisture+temp only).
    """
    # 1. Authenticate device
    device = db.query(models.Device).filter(models.Device.api_key == x_device_key).first()
    if not device:
        raise HTTPException(status_code=401, detail="Invalid device key. Register your device first.")

    # 2. Get calibration constants
    cal = device.calibration
    dry_adc = cal.dry_adc if cal else 3200
    wet_adc = cal.wet_adc if cal else 800

    # If calibration update is included in this request, save it
    if reading_data.dry_adc is not None and reading_data.wet_adc is not None:
        if reading_data.dry_adc > reading_data.wet_adc:
            if cal:
                cal.dry_adc = reading_data.dry_adc
                cal.wet_adc = reading_data.wet_adc
                cal.updated_at = datetime.datetime.utcnow()
            else:
                cal = models.DeviceCalibrationConfig(
                    device_id=device.id,
                    dry_adc=reading_data.dry_adc,
                    wet_adc=reading_data.wet_adc
                )
                db.add(cal)
            dry_adc = reading_data.dry_adc
            wet_adc = reading_data.wet_adc
            db.commit()

    # 3. Convert raw ADC to moisture percentage
    moisture_pct = adc_to_moisture_pct(reading_data.moisture_raw_adc, dry_adc, wet_adc)

    # 4. Find open measurement session for this device's owner
    open_session = db.query(models.MeasurementSession).filter(
        models.MeasurementSession.farmer_id == device.owner_id,
        models.MeasurementSession.status == "open"
    ).order_by(models.MeasurementSession.created_at.desc()).first()

    # Auto-expire sessions older than 2 hours
    if open_session:
        age_hours = (datetime.datetime.utcnow() - open_session.created_at).total_seconds() / 3600
        if age_hours > 2:
            open_session.status = "expired"
            db.commit()
            open_session = None

    # 5. Build the combined reading data
    n_pct = open_session.nitrogen_pct if open_session else None
    p_pct = open_session.phosphorus_pct if open_session else None
    k_pct = open_session.potassium_pct if open_session else None
    manure_type = open_session.manure_type if open_session else "solid"
    session_id = open_session.id if open_session else None

    data_for_pipeline = {
        "manure_type": manure_type,
        "moisture_pct": moisture_pct,
        "temperature_c": reading_data.temperature_c,
        "nitrogen_pct": n_pct,
        "phosphorus_pct": p_pct,
        "potassium_pct": k_pct,
    }
    normalized = pipeline.validate_and_normalize(data_for_pipeline)

    new_reading = models.Reading(
        device_id=device.id,
        session_id=session_id,
        source="HARDWARE",
        is_synthetic=False,
        moisture_raw_adc=reading_data.moisture_raw_adc,
        **normalized
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    # 6. Close the session and link the reading
    if open_session:
        open_session.status = "completed"
        open_session.completed_at = datetime.datetime.utcnow()
        open_session.reading_id = new_reading.id
        db.commit()

    return {
        "status": "success",
        "message": "Reading ingested successfully" + (" and linked to your measurement session." if open_session else " (no active session found — NPK values not included)."),
        "reading_id": new_reading.id,
        "session_id": session_id,
        "session_linked": open_session is not None,
        "values": {
            "moisture_raw_adc": reading_data.moisture_raw_adc,
            "moisture_pct": moisture_pct,
            "temperature_c": round(reading_data.temperature_c, 1),
            "nitrogen_pct": n_pct,
            "phosphorus_pct": p_pct,
            "potassium_pct": k_pct,
            "npk_index": new_reading.npk_index
        },
        "calibration_used": {
            "dry_adc": dry_adc,
            "wet_adc": wet_adc
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Manual Reading Entry (web dashboard, no hardware)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/readings/manual")
def submit_manual_reading(
    reading_data: schemas.ReadingCreate,
    db: Session = Depends(database.get_db)
):
    """
    Manual reading entry (e.g. lab-tested organic carbon % or manual farmer measurement).
    """
    device = db.query(models.Device).filter(models.Device.id == reading_data.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    data_dict = reading_data.dict()
    data_dict.pop("device_id", None)
    data_dict.pop("moisture_raw_adc", None)
    normalized = pipeline.validate_and_normalize(data_dict)

    new_reading = models.Reading(
        device_id=device.id,
        source="MANUAL",
        is_synthetic=False,
        **normalized
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return {
        "status": "success",
        "message": "Manual reading recorded",
        "reading_id": new_reading.id,
        "npk_index": new_reading.npk_index
    }


# ─────────────────────────────────────────────────────────────────────────────
# List readings
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/readings")
def list_readings(
    device_id: Optional[int] = Query(None),
    limit: int = 50,
    db: Session = Depends(database.get_db)
):
    """
    Lists recent readings, optionally filtered by device.
    """
    query = db.query(models.Reading)
    if device_id:
        query = query.filter(models.Reading.device_id == device_id)
    readings = query.order_by(models.Reading.timestamp.desc()).limit(limit).all()
    return readings


@router.get("/readings/stats")
def get_farmer_stats(
    device_id: Optional[int] = Query(None),
    db: Session = Depends(database.get_db)
):
    """
    Returns aggregated latest statistics for farmer dashboard cards.
    """
    query = db.query(models.Reading)
    if device_id:
        query = query.filter(models.Reading.device_id == device_id)

    latest_liquid = query.filter(models.Reading.manure_type == "liquid")\
                         .order_by(models.Reading.timestamp.desc()).first()
    latest_solid = query.filter(models.Reading.manure_type == "solid")\
                        .order_by(models.Reading.timestamp.desc()).first()
    latest_any = query.order_by(models.Reading.timestamp.desc()).first()

    return {
        "liquid_ph": latest_liquid.ph if latest_liquid else 6.8,
        "solid_moisture_pct": latest_solid.moisture_pct if latest_solid else 58.0,
        "temperature_c": latest_any.temperature_c if latest_any else 28.0,
        "npk_index": latest_any.npk_index if latest_any and latest_any.npk_index else 7.2,
        "organic_carbon_pct": latest_any.organic_carbon_pct if latest_any and latest_any.organic_carbon_pct else 14.0
    }
