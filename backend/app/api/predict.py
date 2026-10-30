from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from ..db import database, models
from ..core import ml_model, pipeline

router = APIRouter()

class PredictionRequest(BaseModel):
    reading_id: Optional[int] = None
    manure_type: Optional[str] = "liquid"
    ph: Optional[float] = None
    nitrogen_pct: Optional[float] = None
    phosphorus_pct: Optional[float] = None
    potassium_pct: Optional[float] = None
    moisture_pct: Optional[float] = None
    temperature_c: Optional[float] = None
    organic_carbon_pct: Optional[float] = None
    npk_index: Optional[float] = None

@router.post("/predict")
def predict_crop_suitability(payload: PredictionRequest, db: Session = Depends(database.get_db)):
    """
    Predicts suitable crops based on live manure readings or custom inputs.
    Returns recommended crop, alternative crops, confidence, data provenance, and model method.
    """
    params = payload.dict(exclude_unset=True)

    # If reading_id is provided, pull stored sensor values
    if payload.reading_id:
        reading = db.query(models.Reading).filter(models.Reading.id == payload.reading_id).first()
        if not reading:
            raise HTTPException(status_code=404, detail="Reading not found")
        params.update({
            "ph": reading.ph,
            "nitrogen_pct": reading.nitrogen_pct,
            "phosphorus_pct": reading.phosphorus_pct,
            "potassium_pct": reading.potassium_pct,
            "moisture_pct": reading.moisture_pct,
            "temperature_c": reading.temperature_c,
            "organic_carbon_pct": reading.organic_carbon_pct,
            "npk_index": reading.npk_index
        })

    # Validate and normalize
    normalized = pipeline.validate_and_normalize(params)

    # Perform inference
    result = ml_model.predict_crop(normalized)
    return result
