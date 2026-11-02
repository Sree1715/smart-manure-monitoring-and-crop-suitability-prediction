from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime

class UserBase(BaseModel):
    email: EmailStr
    district: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    district: Optional[str] = None
    location: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "farmer"
    otp: Optional[str] = None

class SendOtpRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "registration"

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class User(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class ReadingBase(BaseModel):
    manure_type: str
    ph: Optional[float] = None
    nitrogen_pct: Optional[float] = None
    phosphorus_pct: Optional[float] = None
    potassium_pct: Optional[float] = None
    moisture_pct: Optional[float] = None
    moisture_raw_adc: Optional[int] = None
    temperature_c: Optional[float] = None
    organic_carbon_pct: Optional[float] = None

class ReadingCreate(ReadingBase):
    device_id: int

class Reading(ReadingBase):
    id: int
    device_id: int
    session_id: Optional[int] = None
    timestamp: datetime.datetime
    source: str
    is_synthetic: bool
    npk_index: Optional[float] = None
    class Config:
        from_attributes = True

class Device(BaseModel):
    id: int
    owner_id: int
    api_key: str
    class Config:
        from_attributes = True

# ─── Measurement Session Schemas ─────────────────────────────────────────────

class SessionCreate(BaseModel):
    """
    Sent by the farmer from the web UI to open a new measurement session.
    NPK values are manually entered by the farmer (lab test or purchased nutrient kit results).
    Manure type defaults to 'solid' for the HW-080 resistive moisture probe setup.
    """
    nitrogen_pct: float
    phosphorus_pct: float
    potassium_pct: float
    manure_type: Optional[str] = "solid"
    notes: Optional[str] = None

class SessionResponse(BaseModel):
    id: int
    farmer_id: int
    device_id: Optional[int] = None
    status: str
    nitrogen_pct: Optional[float] = None
    phosphorus_pct: Optional[float] = None
    potassium_pct: Optional[float] = None
    manure_type: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    reading_id: Optional[int] = None
    class Config:
        from_attributes = True

# ─── ESP32 Hardware Ingest Schema ─────────────────────────────────────────────

class ESP32HardwareIngest(BaseModel):
    """
    The ONLY fields the ESP32 sends. The backend looks up the open session
    to retrieve NPK values entered by the farmer on the web UI.
    
    moisture_raw_adc: Raw 12-bit ADC reading (0-4095) from the HW-080 resistive probe
                      connected to GPIO 34. The backend converts this to moisture_pct
                      using the calibration constants stored for this device.
    temperature_c:    DS18B20 temperature in Celsius from GPIO 4.
    
    calibration (optional): If sent, updates the device calibration constants.
      dry_adc  - ADC reading when probe is in completely dry manure/air
      wet_adc  - ADC reading when probe is in fully saturated/wet manure
    """
    moisture_raw_adc: int      # 0–4095 raw ADC from GPIO 34
    temperature_c: float       # DS18B20 reading in °C
    # Optional calibration override (sent during calibration mode)
    dry_adc: Optional[int] = None   # ADC value in completely dry condition
    wet_adc: Optional[int] = None   # ADC value in fully wet condition

class DeviceCalibration(BaseModel):
    """
    Stores per-device moisture calibration constants for the HW-080 resistive probe.
    dry_adc: ADC reading with probe in open air / completely dry manure (~3200 typical)
    wet_adc: ADC reading with probe fully submerged in water / wet manure (~800 typical)
    """
    dry_adc: int = 3200
    wet_adc: int = 800
