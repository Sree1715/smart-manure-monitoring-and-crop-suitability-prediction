from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import Base, engine, SessionLocal
from .db import models
from .db.auto_seed import ensure_seed_data
from .api import auth, readings, upload, predict, authority
import os

# Ensure all database tables exist.
models.Base.metadata.create_all(bind=engine)

# Automatically seed default authority and demo farmers on startup
try:
    with SessionLocal() as db_session:
        ensure_seed_data(db_session)
except Exception as _e:
    print(f"[!] Startup seed notice: {_e}")

app = FastAPI(
    title="GOBARdhan - Smart Manure Monitoring and Crop Suitability Prediction API",
    version="1.0.0",
    description="IoT Manure Quality Monitoring and Scikit-Learn Crop Recommendation System"
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allows seamless access from Vercel deployments (*.vercel.app), custom domains,
# localhost, and mobile devices on local WiFi without CORS errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Request-ID"],
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
