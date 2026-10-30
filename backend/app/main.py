from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import Base, engine
from .db import models
from .api import auth, readings, upload, predict, authority

# Ensure database tables exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GOBARdhan - Smart Manure Monitoring and Crop Suitability Prediction API",
    version="1.0.0",
    description="IoT Manure Quality Monitoring and Scikit-Learn Crop Recommendation System"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(readings.router, prefix="/api", tags=["Readings & Devices"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(predict.router, prefix="/api", tags=["AI Prediction"])
app.include_router(authority.router, prefix="/api", tags=["Authority"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to GOBARdhan Smart Manure Monitoring & Crop Suitability Prediction API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI",
        "database": "SQLite",
        "model": "RandomForest"
    }
