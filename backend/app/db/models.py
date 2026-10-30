from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # "farmer" | "authority"
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    district = Column(String, nullable=True, index=True)
    village = Column(String, nullable=True, index=True)
    farm_id = Column(String, unique=True, index=True, nullable=True)
    farm_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    farm_size_acres = Column(Float, nullable=True)
    
    devices = relationship("Device", back_populates="owner")
    alerts = relationship("Alert", back_populates="user")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    api_key = Column(String, unique=True, index=True)
    owner = relationship("User", back_populates="devices")
    readings = relationship("Reading", back_populates="device")

class Reading(Base):
    __tablename__ = "readings"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    manure_type = Column(String) # "liquid" | "solid"
    source = Column(String)      # "HARDWARE" | "FILE_UPLOAD" | "MANUAL" | "SIMULATED"
    is_synthetic = Column(Boolean, default=False)
    
    # Liquid fields
    ph = Column(Float, nullable=True)
    nitrogen_pct = Column(Float, nullable=True)
    phosphorus_pct = Column(Float, nullable=True)
    potassium_pct = Column(Float, nullable=True)
    
    # Solid fields
    moisture_pct = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    
    # Combined/Manual
    organic_carbon_pct = Column(Float, nullable=True)
    npk_index = Column(Float, nullable=True)
    
    device = relationship("Device", back_populates="readings")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    district = Column(String, index=True)
    village = Column(String, nullable=True)
    parameter = Column(String) # "pH", "moisture", "temperature", "nitrogen", "phosphorus", "potassium"
    value = Column(Float)
    threshold_type = Column(String) # "warning" | "critical"
    message = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_resolved = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="alerts")
