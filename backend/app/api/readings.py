from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import secrets
from ..db import database, models
from ..schemas import schemas
from ..core import pipeline

router = APIRouter()

@router.post("/devices")
def register_device(
    owner_id: int,
    db: Session = Depends(database.get_db)
):
    """
    Registers a new hardware device for a farmer and generates a secure API key.
    """
    user = db.query(models.User).filter(models.User.id == owner_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    api_key = f"dev_key_{secrets.token_hex(16)}"
    new_device = models.Device(owner_id=user.id, api_key=api_key)
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return {
        "device_id": new_device.id,
        "api_key": new_device.api_key,
        "owner_id": new_device.owner_id
    }

@router.post("/readings/ingest")
def ingest_reading(
    reading_data: schemas.ReadingCreate, 
    x_device_key: str = Header(...), 
    db: Session = Depends(database.get_db)
):
    """
    Hardware endpoint used by ESP32 firmware to ingest live sensor readings.
    """
    device = db.query(models.Device).filter(models.Device.api_key == x_device_key).first()
    if not device:
        raise HTTPException(status_code=401, detail="Invalid device key")
    
    data_dict = reading_data.dict()
    # Remove device_id from dict since we assign device.id explicitly
    data_dict.pop("device_id", None)
    normalized = pipeline.validate_and_normalize(data_dict)

    new_reading = models.Reading(
        device_id=device.id,
        source="HARDWARE",
        is_synthetic=False,
        **normalized
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return {
        "status": "success",
        "message": "Reading ingested successfully",
        "reading_id": new_reading.id,
        "npk_index": new_reading.npk_index
    }

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
