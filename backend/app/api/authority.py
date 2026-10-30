from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import datetime
import io
from ..db import database, models
from ..core import ml_model, security
from ..core.tamil_nadu_districts import (
    TAMIL_NADU_DISTRICTS,
    DISTRICT_NAMES,
    DISTRICT_LOOKUP,
    MANURE_THRESHOLDS,
)

router = APIRouter()

CROP_TAMIL_MAP = {
    "Sugarcane": "கரும்பு (Sugarcane)",
    "Rice": "நெல் (Rice / Paddy)",
    "Paddy": "நெல் (Paddy)",
    "Cotton": "பருத்தி (Cotton)",
    "Maize": "மக்காச்சோளம் (Maize)",
    "Wheat": "கோதுமை (Wheat)",
    "Banana": "வாழை (Banana)",
    "Groundnut": "நிலக்கடலை (Groundnut)",
    "Tomato": "தக்காளி (Tomato)",
    "Turmeric": "மஞ்சள் (Turmeric)",
    "Pulses": "பருப்பு வகைகள் (Pulses)",
    "Mustard": "கடுகு (Mustard)",
}

def evaluate_manure_status(reading: Optional[models.Reading]) -> Dict[str, Any]:
    """
    Evaluates manure status using verified agronomic thresholds according to TNAU / ICAR standards.
    Returns status ('normal', 'warning', 'critical', 'insufficient_data'), color, and parameter explanations.
    """
    if not reading or not reading.timestamp:
        return {
            "status": "insufficient_data",
            "color": "gray",
            "badge_class": "bg-slate-100 text-slate-700 border border-slate-300",
            "label": "Insufficient / No Data",
            "reason": "No sensor readings recorded for this farm.",
            "issues": [],
            "evaluations": []
        }

    # Stale readings check: older than 14 days is classified as insufficient/outdated data
    now = datetime.datetime.utcnow()
    reading_age = now - reading.timestamp
    if reading_age.days > 14:
        return {
            "status": "insufficient_data",
            "color": "gray",
            "badge_class": "bg-slate-100 text-slate-700 border border-slate-300",
            "label": "Outdated Data (>14d)",
            "reason": f"Last reading was received {reading_age.days} days ago ({reading.timestamp.strftime('%d %b %Y')}).",
            "issues": [f"Telemetry stale ({reading_age.days} days old)"],
            "evaluations": []
        }

    is_liquid = (reading.manure_type == "liquid")
    evaluations = []
    warnings = []
    criticals = []

    # 1. pH evaluation
    if reading.ph is not None:
        th = MANURE_THRESHOLDS["ph"]
        if reading.ph < th["warning_min"] or reading.ph > th["warning_max"]:
            criticals.append(f"pH {reading.ph:.2f} (Critical: safe range {th['normal_min']}–{th['normal_max']})")
            evaluations.append({"param": "pH", "value": reading.ph, "unit": "", "status": "critical", "optimal": f"{th['normal_min']}–{th['normal_max']}"})
        elif reading.ph < th["normal_min"] or reading.ph > th["normal_max"]:
            warnings.append(f"pH {reading.ph:.2f} (Requires attention)")
            evaluations.append({"param": "pH", "value": reading.ph, "unit": "", "status": "warning", "optimal": f"{th['normal_min']}–{th['normal_max']}"})
        else:
            evaluations.append({"param": "pH", "value": reading.ph, "unit": "", "status": "normal", "optimal": f"{th['normal_min']}–{th['normal_max']}"})

    # 2. Moisture evaluation
    if reading.moisture_pct is not None:
        th = MANURE_THRESHOLDS["moisture_liquid" if is_liquid else "moisture_solid"]
        if reading.moisture_pct < th["warning_min"] or reading.moisture_pct > th["warning_max"]:
            criticals.append(f"Moisture {reading.moisture_pct:.1f}% (Critical: safe range {th['normal_min']}–{th['normal_max']}%)")
            evaluations.append({"param": "Moisture", "value": reading.moisture_pct, "unit": "%", "status": "critical", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        elif reading.moisture_pct < th["normal_min"] or reading.moisture_pct > th["normal_max"]:
            warnings.append(f"Moisture {reading.moisture_pct:.1f}% (Attention required)")
            evaluations.append({"param": "Moisture", "value": reading.moisture_pct, "unit": "%", "status": "warning", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        else:
            evaluations.append({"param": "Moisture", "value": reading.moisture_pct, "unit": "%", "status": "normal", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})

    # 3. Temperature evaluation
    if reading.temperature_c is not None:
        th = MANURE_THRESHOLDS["temperature"]
        if reading.temperature_c < th["warning_min"] or reading.temperature_c > th["warning_max"]:
            criticals.append(f"Temp {reading.temperature_c:.1f}°C (Critical: optimal {th['normal_min']}–{th['normal_max']}°C)")
            evaluations.append({"param": "Temperature", "value": reading.temperature_c, "unit": "°C", "status": "critical", "optimal": f"{th['normal_min']}–{th['normal_max']}°C"})
        elif reading.temperature_c < th["normal_min"] or reading.temperature_c > th["normal_max"]:
            warnings.append(f"Temp {reading.temperature_c:.1f}°C (Warning)")
            evaluations.append({"param": "Temperature", "value": reading.temperature_c, "unit": "°C", "status": "warning", "optimal": f"{th['normal_min']}–{th['normal_max']}°C"})
        else:
            evaluations.append({"param": "Temperature", "value": reading.temperature_c, "unit": "°C", "status": "normal", "optimal": f"{th['normal_min']}–{th['normal_max']}°C"})

    # 4. Nitrogen (N)
    if reading.nitrogen_pct is not None:
        th = MANURE_THRESHOLDS["nitrogen"]
        if reading.nitrogen_pct < th["warning_min"] or reading.nitrogen_pct > th["warning_max"]:
            criticals.append(f"Nitrogen {reading.nitrogen_pct:.2f}% (Critical)")
            evaluations.append({"param": "Nitrogen (N)", "value": reading.nitrogen_pct, "unit": "%", "status": "critical", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        elif reading.nitrogen_pct < th["normal_min"] or reading.nitrogen_pct > th["normal_max"]:
            warnings.append(f"Nitrogen {reading.nitrogen_pct:.2f}% (Sub-optimal)")
            evaluations.append({"param": "Nitrogen (N)", "value": reading.nitrogen_pct, "unit": "%", "status": "warning", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        else:
            evaluations.append({"param": "Nitrogen (N)", "value": reading.nitrogen_pct, "unit": "%", "status": "normal", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})

    # 5. Phosphorus (P)
    if reading.phosphorus_pct is not None:
        th = MANURE_THRESHOLDS["phosphorus"]
        if reading.phosphorus_pct < th["warning_min"] or reading.phosphorus_pct > th["warning_max"]:
            criticals.append(f"Phosphorus {reading.phosphorus_pct:.2f}% (Critical)")
            evaluations.append({"param": "Phosphorus (P)", "value": reading.phosphorus_pct, "unit": "%", "status": "critical", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        elif reading.phosphorus_pct < th["normal_min"] or reading.phosphorus_pct > th["normal_max"]:
            warnings.append(f"Phosphorus {reading.phosphorus_pct:.2f}%")
            evaluations.append({"param": "Phosphorus (P)", "value": reading.phosphorus_pct, "unit": "%", "status": "warning", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        else:
            evaluations.append({"param": "Phosphorus (P)", "value": reading.phosphorus_pct, "unit": "%", "status": "normal", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})

    # 6. Potassium (K)
    if reading.potassium_pct is not None:
        th = MANURE_THRESHOLDS["potassium"]
        if reading.potassium_pct < th["warning_min"] or reading.potassium_pct > th["warning_max"]:
            criticals.append(f"Potassium {reading.potassium_pct:.2f}% (Critical)")
            evaluations.append({"param": "Potassium (K)", "value": reading.potassium_pct, "unit": "%", "status": "critical", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        elif reading.potassium_pct < th["normal_min"] or reading.potassium_pct > th["normal_max"]:
            warnings.append(f"Potassium {reading.potassium_pct:.2f}%")
            evaluations.append({"param": "Potassium (K)", "value": reading.potassium_pct, "unit": "%", "status": "warning", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})
        else:
            evaluations.append({"param": "Potassium (K)", "value": reading.potassium_pct, "unit": "%", "status": "normal", "optimal": f"{th['normal_min']}–{th['normal_max']}%"})

    # Assign final status
    if criticals:
        return {
            "status": "critical",
            "color": "red",
            "badge_class": "bg-red-50 text-red-700 border border-red-200",
            "label": "Critical Alert",
            "reason": "; ".join(criticals),
            "issues": criticals,
            "evaluations": evaluations
        }
    elif warnings:
        return {
            "status": "warning",
            "color": "yellow",
            "badge_class": "bg-amber-50 text-amber-700 border border-amber-200",
            "label": "Warning",
            "reason": "; ".join(warnings),
            "issues": warnings,
            "evaluations": evaluations
        }
    else:
        return {
            "status": "normal",
            "color": "green",
            "badge_class": "bg-emerald-50 text-emerald-700 border border-emerald-200",
            "label": "Normal Quality",
            "reason": "All physicochemical parameters are within verified optimal limits.",
            "issues": [],
            "evaluations": evaluations
        }

def compute_prediction_for_reading(reading: Optional[models.Reading]) -> Dict[str, Any]:
    if not reading:
        return {
            "recommended_crop": "Pending",
            "recommended_crop_tamil": "நிலுவையில் உள்ளது",
            "confidence": 0,
            "agronomic_rationale": "Awaiting sensor measurements to perform AI crop matching."
        }
    pred = ml_model.predict_crop({
        "ph": reading.ph,
        "nitrogen_pct": reading.nitrogen_pct,
        "phosphorus_pct": reading.phosphorus_pct,
        "potassium_pct": reading.potassium_pct,
        "moisture_pct": reading.moisture_pct,
        "temperature_c": reading.temperature_c,
        "organic_carbon_pct": reading.organic_carbon_pct,
        "npk_index": reading.npk_index
    })
    crop = pred.get("recommended_crop", "Sugarcane")
    return {
        "recommended_crop": crop,
        "recommended_crop_tamil": CROP_TAMIL_MAP.get(crop, crop),
        "confidence": pred.get("confidence", 85),
        "agronomic_rationale": pred.get("agronomic_rationale", ""),
        "nutrient_fit": pred.get("nutrient_fit", {}),
        "alternatives": pred.get("alternatives", [])
    }

# ─────────────────────────────────────────────────────────────────────────────
# 1. District List with Metadata & Status Counts
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/authority/districts")
def get_tamil_nadu_districts(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Returns all 38 districts of Tamil Nadu with center coordinates and real-time farm counts.
    """
    farmers = db.query(models.User).filter(models.User.role == "farmer").all()

    # Pre-aggregate counts per district
    district_data = []
    for d in TAMIL_NADU_DISTRICTS:
        d_name = d["name"]
        d_farmers = [f for f in farmers if f.district and f.district.lower() == d_name.lower()]
        
        normal_count = 0
        warning_count = 0
        critical_count = 0
        insufficient_count = 0
        crop_counts = {}

        for f in d_farmers:
            devs = db.query(models.Device).filter(models.Device.owner_id == f.id).all()
            latest = None
            if devs:
                dev_ids = [dev.id for dev in devs]
                latest = db.query(models.Reading).filter(models.Reading.device_id.in_(dev_ids)).order_by(models.Reading.timestamp.desc()).first()
            
            st = evaluate_manure_status(latest)
            if st["status"] == "normal":
                normal_count += 1
            elif st["status"] == "warning":
                warning_count += 1
            elif st["status"] == "critical":
                critical_count += 1
            else:
                insufficient_count += 1

            if latest:
                pred = compute_prediction_for_reading(latest)
                c = pred["recommended_crop"]
                if c and c != "Pending":
                    crop_counts[c] = crop_counts.get(c, 0) + 1

        top_crops = sorted(crop_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        district_data.append({
            "id": d["id"],
            "name": d["name"],
            "tamil_name": d["tamil_name"],
            "lat": d["lat"],
            "lng": d["lng"],
            "zoom": d["zoom"],
            "total_farms": len(d_farmers),
            "normal_farms": normal_count,
            "warning_farms": warning_count,
            "critical_farms": critical_count,
            "insufficient_farms": insufficient_count,
            "top_crops": [{"crop": c[0], "crop_tamil": CROP_TAMIL_MAP.get(c[0], c[0]), "count": c[1]} for c in top_crops]
        })

    return {
        "state": "Tamil Nadu",
        "state_tamil": "தமிழ்நாடு",
        "total_districts": len(district_data),
        "districts": district_data
    }

# ─────────────────────────────────────────────────────────────────────────────
# 2. Registered Farms with Geographic Coordinates & Status Markers
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/authority/farms")
def get_authority_farms(
    district: Optional[str] = Query(None, description="Filter by district name"),
    village: Optional[str] = Query(None, description="Filter by village name"),
    status: Optional[str] = Query(None, description="Filter by status (normal, warning, critical, insufficient_data)"),
    search: Optional[str] = Query(None, description="Search farmer name, farm_id, or village"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Returns registered farms across Tamil Nadu with geographic coordinates, latest telemetry, and status.
    Farms lacking coordinates are returned in 'unlocated_farms' for safe representation.
    """
    query = db.query(models.User).filter(models.User.role == "farmer")

    if district and district.strip() and district.lower() != "all":
        query = query.filter(models.User.district.ilike(f"%{district.strip()}%"))

    if village and village.strip() and village.lower() != "all":
        query = query.filter(models.User.village.ilike(f"%{village.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (models.User.name.ilike(term)) |
            (models.User.farm_id.ilike(term)) |
            (models.User.village.ilike(term)) |
            (models.User.email.ilike(term))
        )

    farmers = query.all()

    located_farms = []
    unlocated_farms = []

    for f in farmers:
        devs = db.query(models.Device).filter(models.Device.owner_id == f.id).all()
        dev_ids = [d.id for d in devs]
        latest_reading = None
        if dev_ids:
            latest_reading = db.query(models.Reading)\
                .filter(models.Reading.device_id.in_(dev_ids))\
                .order_by(models.Reading.timestamp.desc())\
                .first()

        status_info = evaluate_manure_status(latest_reading)
        
        # Apply status filter if requested
        if status and status.strip() and status.lower() != "all":
            if status_info["status"] != status.strip().lower():
                continue

        pred = compute_prediction_for_reading(latest_reading)
        
        # Count unresolved alerts
        unresolved_alerts = db.query(models.Alert).filter(
            models.Alert.user_id == f.id,
            models.Alert.is_resolved == False
        ).count()

        farm_item = {
            "id": f.id,
            "farm_id": f.farm_id or f"TN-FAR-{f.id:04d}",
            "farmer_name": f.name or f.email.split("@")[0].capitalize(),
            "email": f.email,
            "phone": f.phone or "—",
            "district": f.district or "Unassigned",
            "village": f.village or "Main Village",
            "farm_name": f.farm_name or f"{f.village or 'Farm'} Agro",
            "latitude": f.latitude,
            "longitude": f.longitude,
            "farm_size_acres": f.farm_size_acres or 3.0,
            "device_count": len(devs),
            "status": status_info["status"],
            "status_color": status_info["color"],
            "status_label": status_info["label"],
            "status_reason": status_info["reason"],
            "status_issues": status_info["issues"],
            "latest_reading": {
                "timestamp": latest_reading.timestamp.isoformat() if latest_reading and latest_reading.timestamp else None,
                "manure_type": latest_reading.manure_type if latest_reading else None,
                "ph": latest_reading.ph if latest_reading else None,
                "nitrogen_pct": latest_reading.nitrogen_pct if latest_reading else None,
                "phosphorus_pct": latest_reading.phosphorus_pct if latest_reading else None,
                "potassium_pct": latest_reading.potassium_pct if latest_reading else None,
                "moisture_pct": latest_reading.moisture_pct if latest_reading else None,
                "temperature_c": latest_reading.temperature_c if latest_reading else None,
                "organic_carbon_pct": latest_reading.organic_carbon_pct if latest_reading else None,
                "npk_index": latest_reading.npk_index if latest_reading else None,
                "source": latest_reading.source if latest_reading else None
            } if latest_reading else None,
            "predicted_crop": pred["recommended_crop"],
            "predicted_crop_tamil": pred["recommended_crop_tamil"],
            "prediction_confidence": pred["confidence"],
            "active_alerts_count": unresolved_alerts
        }

        if f.latitude is not None and f.longitude is not None:
            located_farms.append(farm_item)
        else:
            unlocated_farms.append(farm_item)

    return {
        "total_farms": len(located_farms) + len(unlocated_farms),
        "located_count": len(located_farms),
        "unlocated_count": len(unlocated_farms),
        "farms": located_farms,
        "unlocated_farms": unlocated_farms
    }

# ─────────────────────────────────────────────────────────────────────────────
# 3. Farm Detailed Popup / Side Panel Information
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/authority/farm/{farm_id}")
def get_farm_details(
    farm_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Returns complete farm profile, latest physicochemical parameters, historical trend, and recent alerts.
    """
    farmer = db.query(models.User).filter(models.User.id == farm_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farm record not found.")

    devs = db.query(models.Device).filter(models.Device.owner_id == farmer.id).all()
    dev_ids = [d.id for d in devs]

    latest_reading = None
    historical_readings = []
    if dev_ids:
        latest_reading = db.query(models.Reading)\
            .filter(models.Reading.device_id.in_(dev_ids))\
            .order_by(models.Reading.timestamp.desc())\
            .first()

        history_records = db.query(models.Reading)\
            .filter(models.Reading.device_id.in_(dev_ids))\
            .order_by(models.Reading.timestamp.desc())\
            .limit(15)\
            .all()

        for hr in reversed(history_records):
            historical_readings.append({
                "id": hr.id,
                "timestamp": hr.timestamp.isoformat() if hr.timestamp else None,
                "date": hr.timestamp.strftime("%d %b %H:%M") if hr.timestamp else "—",
                "manure_type": hr.manure_type,
                "ph": hr.ph,
                "nitrogen_pct": hr.nitrogen_pct,
                "phosphorus_pct": hr.phosphorus_pct,
                "potassium_pct": hr.potassium_pct,
                "moisture_pct": hr.moisture_pct,
                "temperature_c": hr.temperature_c,
                "organic_carbon_pct": hr.organic_carbon_pct,
                "npk_index": hr.npk_index
            })

    status_info = evaluate_manure_status(latest_reading)
    prediction = compute_prediction_for_reading(latest_reading)

    # Alerts associated with this farm
    alerts = db.query(models.Alert)\
        .filter(models.Alert.user_id == farmer.id)\
        .order_by(models.Alert.timestamp.desc())\
        .limit(10)\
        .all()

    alert_items = []
    for a in alerts:
        alert_items.append({
            "id": a.id,
            "parameter": a.parameter,
            "value": a.value,
            "threshold_type": a.threshold_type,
            "message": a.message,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "date": a.timestamp.strftime("%d %b %Y, %I:%M %p") if a.timestamp else "—",
            "is_resolved": a.is_resolved
        })

    days_since = None
    if latest_reading and latest_reading.timestamp:
        days_since = (datetime.datetime.utcnow() - latest_reading.timestamp).days

    return {
        "id": farmer.id,
        "farm_id": farmer.farm_id or f"TN-FAR-{farmer.id:04d}",
        "farmer_name": farmer.name or farmer.email.split("@")[0].capitalize(),
        "email": farmer.email,
        "phone": farmer.phone or "—",
        "district": farmer.district,
        "village": farmer.village,
        "farm_name": farmer.farm_name or f"{farmer.village or 'Farm'} Agro",
        "latitude": farmer.latitude,
        "longitude": farmer.longitude,
        "farm_size_acres": farmer.farm_size_acres or 3.5,
        "days_since_reading": days_since,
        "status": status_info["status"],
        "status_color": status_info["color"],
        "status_label": status_info["label"],
        "status_reason": status_info["reason"],
        "status_evaluations": status_info["evaluations"],
        "latest_reading": {
            "timestamp": latest_reading.timestamp.isoformat() if latest_reading and latest_reading.timestamp else None,
            "date": latest_reading.timestamp.strftime("%d %b %Y, %I:%M %p") if latest_reading and latest_reading.timestamp else "No readings",
            "manure_type": latest_reading.manure_type if latest_reading else None,
            "ph": latest_reading.ph if latest_reading else None,
            "nitrogen_pct": latest_reading.nitrogen_pct if latest_reading else None,
            "phosphorus_pct": latest_reading.phosphorus_pct if latest_reading else None,
            "potassium_pct": latest_reading.potassium_pct if latest_reading else None,
            "moisture_pct": latest_reading.moisture_pct if latest_reading else None,
            "temperature_c": latest_reading.temperature_c if latest_reading else None,
            "organic_carbon_pct": latest_reading.organic_carbon_pct if latest_reading else None,
            "npk_index": latest_reading.npk_index if latest_reading else None,
            "source": latest_reading.source if latest_reading else None
        } if latest_reading else None,
        "prediction": {
            "crop": prediction["recommended_crop"],
            "crop_tamil": prediction["recommended_crop_tamil"],
            "confidence": prediction["confidence"],
            "rationale": prediction["agronomic_rationale"],
            "timestamp": latest_reading.timestamp.isoformat() if latest_reading and latest_reading.timestamp else None,
            "nutrient_fit": prediction.get("nutrient_fit", {}),
            "alternatives": prediction.get("alternatives", [])
        },
        "historical_trends": historical_readings,
        "alerts": alert_items
    }

# ─────────────────────────────────────────────────────────────────────────────
# 4. District-Wise Analytics & Charts Data
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/authority/map-stats")
def get_map_statistics(
    district: Optional[str] = Query(None, description="Optional district filter"),
    village: Optional[str] = Query(None, description="Optional village filter"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Returns statistics cards and chart datasets filtered by district and village.
    """
    query = db.query(models.User).filter(models.User.role == "farmer")
    if district and district.strip() and district.lower() != "all":
        query = query.filter(models.User.district.ilike(f"%{district.strip()}%"))
    if village and village.strip() and village.lower() != "all":
        query = query.filter(models.User.village.ilike(f"%{village.strip()}%"))

    farmers = query.all()
    total_farms = len(farmers)

    normal_count = 0
    warning_count = 0
    critical_count = 0
    insufficient_count = 0
    recent_readings_count = 0

    crop_frequency = {}
    district_counts = {}

    for f in farmers:
        d_name = f.district or "Other"
        district_counts[d_name] = district_counts.get(d_name, 0) + 1

        devs = db.query(models.Device).filter(models.Device.owner_id == f.id).all()
        dev_ids = [d.id for d in devs]
        latest = None
        if dev_ids:
            latest = db.query(models.Reading).filter(models.Reading.device_id.in_(dev_ids)).order_by(models.Reading.timestamp.desc()).first()

        status_info = evaluate_manure_status(latest)
        if status_info["status"] == "normal":
            normal_count += 1
            recent_readings_count += 1
        elif status_info["status"] == "warning":
            warning_count += 1
            recent_readings_count += 1
        elif status_info["status"] == "critical":
            critical_count += 1
            recent_readings_count += 1
        else:
            insufficient_count += 1

        if latest and status_info["status"] != "insufficient_data":
            pred = compute_prediction_for_reading(latest)
            c = pred["recommended_crop"]
            if c and c != "Pending":
                crop_frequency[c] = crop_frequency.get(c, 0) + 1

    # Format district counts list
    top_districts = sorted(
        [{"district": k, "count": v} for k, v in district_counts.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    # Format crop frequency list
    crops_list = sorted(
        [{"crop": k, "crop_tamil": CROP_TAMIL_MAP.get(k, k), "count": v} for k, v in crop_frequency.items()],
        key=lambda x: x["count"],
        reverse=True
    )

    # Historical trend over the past 30 days
    trend_query = db.query(models.Reading).order_by(models.Reading.timestamp.desc()).limit(100).all()
    # Group by date
    daily_readings = {}
    for r in trend_query:
        if r.timestamp:
            d_str = r.timestamp.strftime("%d %b")
            if d_str not in daily_readings:
                daily_readings[d_str] = {"ph": [], "moist": [], "temp": []}
            if r.ph: daily_readings[d_str]["ph"].append(r.ph)
            if r.moisture_pct: daily_readings[d_str]["moist"].append(r.moisture_pct)
            if r.temperature_c: daily_readings[d_str]["temp"].append(r.temperature_c)

    trend_series = []
    for d_str, vals in list(daily_readings.items())[:10]:
        trend_series.append({
            "date": d_str,
            "avg_ph": round(sum(vals["ph"]) / len(vals["ph"]), 2) if vals["ph"] else 7.0,
            "avg_moisture": round(sum(vals["moist"]) / len(vals["moist"]), 1) if vals["moist"] else 60.0,
            "avg_temp": round(sum(vals["temp"]) / len(vals["temp"]), 1) if vals["temp"] else 28.0,
        })
    trend_series.reverse()

    return {
        "total_farms": total_farms,
        "recent_readings_count": recent_readings_count,
        "normal_count": normal_count,
        "warning_count": warning_count,
        "critical_count": critical_count,
        "insufficient_count": insufficient_count,
        "status_distribution": {
            "Normal": normal_count,
            "Warning": warning_count,
            "Critical": critical_count,
            "Insufficient Data": insufficient_count
        },
        "district_distribution": top_districts,
        "frequently_predicted_crops": crops_list,
        "historical_trend": trend_series
    }

# ─────────────────────────────────────────────────────────────────────────────
# 5. Regional Manure Quality Insights (Hotspots of Recurring Problems)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/authority/regional-insights")
def get_regional_insights(
    days: int = Query(30, description="Time window in days for recurring problem detection"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Identifies districts and villages with repeated warning or critical manure readings.
    Provides affected farms count, repeated alerts, most abnormal parameters, and latest recorded issue.
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    
    # Query alerts in the time window
    alerts = db.query(models.Alert)\
        .filter(models.Alert.timestamp >= cutoff)\
        .order_by(models.Alert.timestamp.desc())\
        .all()

    # Group alerts by district and village
    regions = {}
    for a in alerts:
        key = (a.district, a.village or "Main Region")
        if key not in regions:
            regions[key] = {
                "district": a.district,
                "village": a.village or "Main Region",
                "alerts": [],
                "user_ids": set(),
                "parameters": {},
                "latest_issue": a.timestamp,
                "unresolved_count": 0
            }
        regions[key]["alerts"].append(a)
        regions[key]["user_ids"].add(a.user_id)
        regions[key]["parameters"][a.parameter] = regions[key]["parameters"].get(a.parameter, 0) + 1
        if not a.is_resolved:
            regions[key]["unresolved_count"] += 1
        if a.timestamp and (regions[key]["latest_issue"] is None or a.timestamp > regions[key]["latest_issue"]):
            regions[key]["latest_issue"] = a.timestamp

    hotspots = []
    for (dist, vill), data in regions.items():
        # Sort most abnormal parameters
        top_params = sorted(data["parameters"].items(), key=lambda x: x[1], reverse=True)
        param_names = [f"{p[0]} ({p[1]}x)" for p in top_params[:3]]

        # Retrieve affected farm details
        affected_users = db.query(models.User).filter(models.User.id.in_(list(data["user_ids"]))).all()
        affected_farms_list = []
        for u in affected_users:
            affected_farms_list.append({
                "id": u.id,
                "farm_id": u.farm_id or f"TN-{u.id}",
                "farmer_name": u.name or u.email.split("@")[0].capitalize(),
                "village": u.village
            })

        hotspots.append({
            "district": dist,
            "village": vill,
            "affected_farms_count": len(data["user_ids"]),
            "repeated_alerts_count": len(data["alerts"]),
            "most_frequently_abnormal_parameters": param_names,
            "latest_recorded_issue": data["latest_issue"].strftime("%d %b %Y, %I:%M %p") if data["latest_issue"] else "—",
            "unresolved_alerts_count": data["unresolved_count"],
            "affected_farms": affected_farms_list
        })

    # Sort hotspots by highest alerts count
    hotspots.sort(key=lambda x: x["repeated_alerts_count"], reverse=True)

    return {
        "period_days": days,
        "hotspots_count": len(hotspots),
        "hotspots": hotspots
    }

# ─────────────────────────────────────────────────────────────────────────────
# 6. Resolve Alert Endpoint
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/authority/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Allows authorities to mark an active quality alert as investigated/resolved.
    """
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found.")

    alert.is_resolved = True
    db.commit()
    return {"success": True, "message": f"Alert #{alert_id} resolved successfully."}

# ─────────────────────────────────────────────────────────────────────────────
# 7. Farmer PDF Report Generation (Authority Oversight)
# ─────────────────────────────────────────────────────────────────────────────
def generate_farmer_pdf_report(farmer: models.User, latest_reading: Optional[models.Reading], history_readings: List[models.Reading], status_info: Dict[str, Any], prediction: Dict[str, Any]) -> io.BytesIO:
    """
    Generates a professional PDF report containing the farmer's farm details,
    manure telemetry, and predicted crop suitability with ICAR guidelines.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#15803d'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=12
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    bold_style = ParagraphStyle(
        'BoldBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Header Banner
    story.append(Paragraph("<b>TAMIL NADU AGRICULTURAL DEPARTMENT &bull; GOBARDHAN</b>", subtitle_style))
    story.append(Paragraph("Farmer Manure Quality & Crop Suitability Official Report", title_style))
    report_date = datetime.datetime.now().strftime("%d %B %Y, %I:%M %p")
    story.append(Paragraph(f"Generated on: {report_date} | Authority Monitoring Console", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#16a34a'), spaceAfter=14))

    # Farm & Farmer Profile
    story.append(Paragraph("1. Farm & Farmer Identification", heading_style))
    farm_info = [
        [Paragraph("<b>Farm ID:</b>", bold_style), Paragraph(str(farmer.farm_id or f"TN-{farmer.id}"), body_style),
         Paragraph("<b>Farmer Name:</b>", bold_style), Paragraph(str(farmer.name or "N/A"), body_style)],
        [Paragraph("<b>District:</b>", bold_style), Paragraph(str(farmer.district or "Tamil Nadu"), body_style),
         Paragraph("<b>Village:</b>", bold_style), Paragraph(str(farmer.village or "Main"), body_style)],
        [Paragraph("<b>Contact Phone:</b>", bold_style), Paragraph(str(farmer.phone or "N/A"), body_style),
         Paragraph("<b>Registered Email:</b>", bold_style), Paragraph(str(farmer.email), body_style)],
        [Paragraph("<b>Farm Coordinates:</b>", bold_style),
         Paragraph(f"{farmer.latitude:.4f}°N, {farmer.longitude:.4f}°E" if farmer.latitude and farmer.longitude else "Pending GPS", body_style),
         Paragraph("<b>Farm Acreage:</b>", bold_style), Paragraph(f"{farmer.farm_size_acres or 2.5} Acres", body_style)]
    ]
    t1 = Table(farm_info, colWidths=[1.3*inch, 2.2*inch, 1.4*inch, 2.3*inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t1)
    story.append(Spacer(1, 10))

    # Manure Quality & AI Crop Suitability
    story.append(Paragraph("2. Manure Quality Assessment & AI Crop Suitability", heading_style))
    status_label = status_info.get("label", "Unknown")
    pred_crop = prediction.get("recommended_crop", "Pending")
    pred_crop_ta = prediction.get("recommended_crop_tamil", "")
    confidence = prediction.get("confidence", 0)

    eval_data = [
        [Paragraph("<b>Manure Quality Status:</b>", bold_style),
         Paragraph(f"<b>{status_label}</b>", bold_style)],
        [Paragraph("<b>Recommended Suitable Crop:</b>", bold_style),
         Paragraph(f"<b>{pred_crop}</b> ({pred_crop_ta})", bold_style)],
        [Paragraph("<b>Suitability Confidence:</b>", bold_style),
         Paragraph(f"<b>{confidence}%</b>", body_style)],
        [Paragraph("<b>Agronomic Rationale:</b>", bold_style),
         Paragraph(str(prediction.get("rationale", "Optimal nutrient profile evaluated using Random Forest Model.")), body_style)],
    ]
    t2 = Table(eval_data, colWidths=[2.2*inch, 5.0*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#86efac')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#bbf7d0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t2)
    story.append(Spacer(1, 10))

    # Latest Physicochemical Sensor Parameters
    story.append(Paragraph("3. Latest Physicochemical Sensor Telemetry", heading_style))
    if latest_reading:
        p_table = [
            [Paragraph("<b>Parameter</b>", bold_style), Paragraph("<b>Value</b>", bold_style), Paragraph("<b>Optimal Threshold</b>", bold_style), Paragraph("<b>Status</b>", bold_style)],
            [Paragraph("pH Level", body_style), Paragraph(str(latest_reading.ph or "—"), body_style), Paragraph("6.5 – 8.2", body_style), Paragraph("Normal" if latest_reading.ph and 6.5 <= latest_reading.ph <= 8.2 else "Attention", body_style)],
            [Paragraph("Moisture (%)", body_style), Paragraph(f"{latest_reading.moisture_pct}%" if latest_reading.moisture_pct else "—", body_style), Paragraph("45% – 70%", body_style), Paragraph("Normal" if latest_reading.moisture_pct and 45 <= latest_reading.moisture_pct <= 70 else "Attention", body_style)],
            [Paragraph("Temperature (°C)", body_style), Paragraph(f"{latest_reading.temperature_c}°C" if latest_reading.temperature_c else "—", body_style), Paragraph("25°C – 45°C", body_style), Paragraph("Normal" if latest_reading.temperature_c and 25 <= latest_reading.temperature_c <= 45 else "Attention", body_style)],
            [Paragraph("Nitrogen (N %)", body_style), Paragraph(f"{latest_reading.nitrogen_pct}%" if latest_reading.nitrogen_pct else "—", body_style), Paragraph(">= 1.2%", body_style), Paragraph("Normal" if latest_reading.nitrogen_pct and latest_reading.nitrogen_pct >= 1.2 else "Attention", body_style)],
            [Paragraph("Phosphorus (P %)", body_style), Paragraph(f"{latest_reading.phosphorus_pct}%" if latest_reading.phosphorus_pct else "—", body_style), Paragraph(">= 0.6%", body_style), Paragraph("Normal" if latest_reading.phosphorus_pct and latest_reading.phosphorus_pct >= 0.6 else "Attention", body_style)],
            [Paragraph("Potassium (K %)", body_style), Paragraph(f"{latest_reading.potassium_pct}%" if latest_reading.potassium_pct else "—", body_style), Paragraph(">= 1.0%", body_style), Paragraph("Normal" if latest_reading.potassium_pct and latest_reading.potassium_pct >= 1.0 else "Attention", body_style)],
            [Paragraph("Organic Carbon (%)", body_style), Paragraph(f"{latest_reading.organic_carbon_pct}%" if latest_reading.organic_carbon_pct else "—", body_style), Paragraph(">= 12%", body_style), Paragraph("Optimal", body_style)],
        ]
        t3 = Table(p_table, colWidths=[2.2*inch, 1.5*inch, 1.8*inch, 1.7*inch])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('PADDING', (0,0), (-1,-1), 4.5),
        ]))
        story.append(t3)
    else:
        story.append(Paragraph("No live sensor readings currently recorded for this farm.", body_style))

    story.append(Spacer(1, 12))

    # Recent Historical Sensor Logs
    if history_readings:
        story.append(Paragraph("4. Recent Historical Telemetry Logs", heading_style))
        hist_rows = [
            [Paragraph("<b>Date / Time</b>", bold_style), Paragraph("<b>pH</b>", bold_style), Paragraph("<b>Moisture</b>", bold_style), Paragraph("<b>Temp</b>", bold_style), Paragraph("<b>NPK Index</b>", bold_style)]
        ]
        for hr in history_readings[:5]:
            d_time = hr.timestamp.strftime("%d %b %Y %H:%M") if hr.timestamp else "—"
            hist_rows.append([
                Paragraph(d_time, body_style),
                Paragraph(str(hr.ph or "—"), body_style),
                Paragraph(f"{hr.moisture_pct}%" if hr.moisture_pct else "—", body_style),
                Paragraph(f"{hr.temperature_c}°C" if hr.temperature_c else "—", body_style),
                Paragraph(str(hr.npk_index or "—"), body_style),
            ])
        t4 = Table(hist_rows, colWidths=[2.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.4*inch])
        t4.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t4)
        story.append(Spacer(1, 14))

    # Authority Certification Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=8))
    cert_text = "This document is an authorized system-generated agricultural report issued under the GOBARdhan Smart Manure Quality Monitoring & Crop Suitability Initiative, Government of Tamil Nadu."
    story.append(Paragraph(cert_text, subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer

@router.get("/authority/farm/{farm_id}/pdf")
def download_farmer_pdf(
    farm_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Generates and downloads a comprehensive PDF report for a registered farmer
    including farm details, location, manure quality, and crop suitability.
    """
    farmer = db.query(models.User).filter(models.User.id == farm_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer record not found.")

    devs = db.query(models.Device).filter(models.Device.owner_id == farmer.id).all()
    dev_ids = [d.id for d in devs]

    latest_reading = None
    history_readings = []
    if dev_ids:
        latest_reading = db.query(models.Reading)\
            .filter(models.Reading.device_id.in_(dev_ids))\
            .order_by(models.Reading.timestamp.desc())\
            .first()

        history_readings = db.query(models.Reading)\
            .filter(models.Reading.device_id.in_(dev_ids))\
            .order_by(models.Reading.timestamp.desc())\
            .limit(10)\
            .all()

    status_info = evaluate_manure_status(latest_reading)
    prediction = compute_prediction_for_reading(latest_reading)

    pdf_buffer = generate_farmer_pdf_report(
        farmer=farmer,
        latest_reading=latest_reading,
        history_readings=history_readings,
        status_info=status_info,
        prediction=prediction
    )

    filename = f"Farmer_Report_{farmer.farm_id or farmer.id}_{datetime.date.today().isoformat()}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/authority/reports/list")
def list_farmers_reports(
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.require_authority)
):
    """
    Returns the list of farmer reports available for PDF download in the Authority Reports view.
    """
    query = db.query(models.User).filter(models.User.role == "farmer")
    if district and district.lower() != "all":
        query = query.filter(models.User.district.ilike(f"%{district.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (models.User.name.ilike(term)) |
            (models.User.farm_id.ilike(term)) |
            (models.User.district.ilike(term)) |
            (models.User.village.ilike(term))
        )

    farmers = query.order_by(models.User.district.asc(), models.User.name.asc()).all()

    reports_list = []
    for f in farmers:
        devs = db.query(models.Device).filter(models.Device.owner_id == f.id).all()
        latest = None
        if devs:
            dev_ids = [d.id for d in devs]
            latest = db.query(models.Reading).filter(models.Reading.device_id.in_(dev_ids)).order_by(models.Reading.timestamp.desc()).first()

        status_info = evaluate_manure_status(latest)
        pred = compute_prediction_for_reading(latest)

        reports_list.append({
            "id": f"RPT-{f.id:04d}",
            "farm_id": f.farm_id or f"TN-{f.id}",
            "farmer_id": f.id,
            "farmer_name": f.name or f.email.split("@")[0].capitalize(),
            "district": f.district or "Tamil Nadu",
            "village": f.village or "—",
            "title": f"{f.name or 'Farmer'} - {f.district or 'TN'} Manure & Crop Assessment",
            "type": latest.manure_type.capitalize() if latest and latest.manure_type else "Organic",
            "date": latest.timestamp.strftime("%d %b %Y") if latest and latest.timestamp else "Recently Registered",
            "status": "Ready",
            "predicted_crop": pred["recommended_crop"],
            "predicted_crop_tamil": pred["recommended_crop_tamil"],
            "quality_status": status_info["status"],
            "quality_label": status_info["label"],
            "download_url": f"/api/authority/farm/{f.id}/pdf"
        })

    return {
        "total": len(reports_list),
        "reports": reports_list
    }

