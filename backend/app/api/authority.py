from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from ..db import database, models
from ..core import ml_model

router = APIRouter()

@router.get("/authority/overview")
def get_authority_overview(
    district: Optional[str] = Query(None, description="Optional text filter by district"),
    db: Session = Depends(database.get_db)
):
    """
    Global read-only overview for authorities, with optional district text filter.
    No district-level permission constraints required.
    """
    # Filter users query
    user_query = db.query(models.User).filter(models.User.role == "farmer")
    if district and district.strip():
        user_query = user_query.filter(models.User.district.ilike(f"%{district.strip()}%"))
    farmers = user_query.all()
    farmer_ids = [f.id for f in farmers]

    # Filter devices
    devices = db.query(models.Device).filter(models.Device.owner_id.in_(farmer_ids)).all() if farmer_ids else []
    device_ids = [d.id for d in devices]

    # Filter readings
    readings = db.query(models.Reading).filter(models.Reading.device_id.in_(device_ids)).all() if device_ids else []

    # Quality alerts count (anomalous pH or moisture levels)
    quality_alerts = 0
    for r in readings:
        is_alert = False
        if r.ph is not None and (r.ph < 6.0 or r.ph > 8.5):
            is_alert = True
        if r.moisture_pct is not None and (r.moisture_pct < 40.0 or r.moisture_pct > 75.0):
            is_alert = True
        if is_alert:
            quality_alerts += 1

    # Districts covered
    all_districts = list(set([f.district for f in farmers if f.district]))

    return {
        "filter_district": district or "ALL",
        "registered_farmers_count": len(farmers),
        "active_devices_count": len(devices),
        "total_readings_count": len(readings),
        "quality_alerts_count": quality_alerts,
        "districts_covered": all_districts,
        "districts_count": len(all_districts)
    }

@router.get("/authority/farmers")
def get_authority_farmers(
    district: Optional[str] = Query(None, description="Optional text filter by district"),
    db: Session = Depends(database.get_db)
):
    """
    Returns list of farmers with device stats and latest activity, filtered optionally by district.
    """
    user_query = db.query(models.User).filter(models.User.role == "farmer")
    if district and district.strip():
        user_query = user_query.filter(models.User.district.ilike(f"%{district.strip()}%"))
    farmers = user_query.all()

    result = []
    for f in farmers:
        devs = db.query(models.Device).filter(models.Device.owner_id == f.id).all()
        dev_ids = [d.id for d in devs]
        latest_reading = None
        if dev_ids:
            latest_reading = db.query(models.Reading)\
                .filter(models.Reading.device_id.in_(dev_ids))\
                .order_by(models.Reading.timestamp.desc())\
                .first()

        status = "Good"
        predicted_crop = "Pending"
        if latest_reading:
            if (latest_reading.ph and (latest_reading.ph < 6.0 or latest_reading.ph > 8.5)) or \
               (latest_reading.moisture_pct and (latest_reading.moisture_pct < 40.0 or latest_reading.moisture_pct > 75.0)):
                status = "Attention"
            pred = ml_model.predict_crop({
                "ph": latest_reading.ph,
                "nitrogen_pct": latest_reading.nitrogen_pct,
                "phosphorus_pct": latest_reading.phosphorus_pct,
                "potassium_pct": latest_reading.potassium_pct,
                "moisture_pct": latest_reading.moisture_pct,
                "temperature_c": latest_reading.temperature_c,
                "organic_carbon_pct": latest_reading.organic_carbon_pct,
                "npk_index": latest_reading.npk_index
            })
            predicted_crop = pred.get("recommended_crop", "Wheat")

        result.append({
            "id": f.id,
            "email": f.email,
            "district": f.district or "Unassigned",
            "device_count": len(devs),
            "status": status,
            "predicted_crop": predicted_crop,
            "latest_reading_time": latest_reading.timestamp.isoformat() if latest_reading and latest_reading.timestamp else None
        })

    return result

@router.get("/authority/readings")
def get_authority_readings(
    district: Optional[str] = Query(None, description="Optional text filter by district"),
    limit: int = 50,
    db: Session = Depends(database.get_db)
):
    """
    Returns latest readings across all devices with farmer district details.
    """
    query = db.query(models.Reading, models.Device, models.User)\
        .join(models.Device, models.Reading.device_id == models.Device.id)\
        .join(models.User, models.Device.owner_id == models.User.id)

    if district and district.strip():
        query = query.filter(models.User.district.ilike(f"%{district.strip()}%"))

    records = query.order_by(models.Reading.timestamp.desc()).limit(limit).all()

    items = []
    for r, d, u in records:
        items.append({
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "device_id": d.id,
            "farmer_email": u.email,
            "district": u.district or "Unassigned",
            "manure_type": r.manure_type,
            "source": r.source,
            "ph": r.ph,
            "nitrogen_pct": r.nitrogen_pct,
            "phosphorus_pct": r.phosphorus_pct,
            "potassium_pct": r.potassium_pct,
            "moisture_pct": r.moisture_pct,
            "temperature_c": r.temperature_c,
            "organic_carbon_pct": r.organic_carbon_pct,
            "npk_index": r.npk_index,
            "is_synthetic": r.is_synthetic
        })

    return items
