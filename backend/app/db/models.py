from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
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
    sessions = relationship("MeasurementSession", back_populates="farmer")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    api_key = Column(String, unique=True, index=True)
    owner = relationship("User", back_populates="devices")
    readings = relationship("Reading", back_populates="device")
    calibration = relationship("DeviceCalibrationConfig", back_populates="device", uselist=False)


class DeviceCalibrationConfig(Base):
    """
    Per-device calibration constants for the HW-080 resistive moisture probe.
    dry_adc: ADC reading (0-4095) when probe is in open air / completely dry manure.
    wet_adc: ADC reading (0-4095) when probe is fully inserted in wet manure / water.
    These values are used to convert raw ADC to moisture percentage:
      moisture_pct = (dry_adc - raw_adc) / (dry_adc - wet_adc) * 100.0
    """
    __tablename__ = "device_calibrations"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), unique=True, index=True)
    dry_adc = Column(Integer, default=3200)   # Typical open-air reading for HW-080
    wet_adc = Column(Integer, default=800)    # Typical fully-wet reading for HW-080
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    device = relationship("Device", back_populates="calibration")

class MeasurementSession(Base):
    """
    A measurement session is opened by the farmer on the web dashboard.
    It stores the manually-entered NPK values and stays open until the
    ESP32 hardware sends its moisture + temperature reading, which closes
    the session and creates a combined Reading record.
    """
    __tablename__ = "measurement_sessions"
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    # Status: "open" | "completed" | "expired"
    status = Column(String, default="open", index=True)
    # Manually entered NPK values (entered by farmer on web UI)
    nitrogen_pct = Column(Float, nullable=True)
    phosphorus_pct = Column(Float, nullable=True)
    potassium_pct = Column(Float, nullable=True)
    manure_type = Column(String, default="solid")  # "liquid" | "solid"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    # The reading produced when ESP32 sends hardware data to this session
    reading_id = Column(Integer, ForeignKey("readings.id"), nullable=True)

    farmer = relationship("User", back_populates="sessions")
    device = relationship("Device")
    reading = relationship("Reading", foreign_keys=[reading_id])


class Reading(Base):
    __tablename__ = "readings"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    session_id = Column(Integer, ForeignKey("measurement_sessions.id"), nullable=True, index=True)
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
    moisture_raw_adc = Column(Integer, nullable=True)  # Raw ADC value from resistive sensor (0-4095)
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
