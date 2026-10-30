from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import Base, engine
from .db import models
from .api import auth, readings, upload, predict, authority
import os

# Ensure database tables exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GOBARdhan - Smart Manure Monitoring and Crop Suitability Prediction API",
    version="1.0.0",
    description="IoT Manure Quality Monitoring and Scikit-Learn Crop Recommendation System"
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# IMPORTANT: `allow_credentials=True` cannot be combined with `allow_origins=["*"]`.
# Browsers will block the request. We must list explicit origins.
#
# Set ALLOWED_ORIGINS env var (comma-separated) in Render:
#   ALLOWED_ORIGINS=https://your-project.vercel.app,https://your-custom-domain.com
#
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
)
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]

# Also allow all *.vercel.app subdomains as a fallback pattern
ALLOW_ALL_ORIGINS = os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOW_ALL_ORIGINS else ALLOWED_ORIGINS,
    allow_credentials=not ALLOW_ALL_ORIGINS,  # credentials incompatible with wildcard
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
