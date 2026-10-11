from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
import pandas as pd
from ..db import database, models
from sqlalchemy.orm import Session
from ..core import pipeline

router = APIRouter()

@router.post("/upload")
def upload_file(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    # Read file (basic CSV for now)
    try:
        df = pd.read_csv(file.file)
        # Validation/Normalization and saving...
        return {"message": "File processed", "rows": len(df)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
