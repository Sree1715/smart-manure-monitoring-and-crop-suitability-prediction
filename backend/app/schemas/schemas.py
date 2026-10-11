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
    temperature_c: Optional[float] = None
    organic_carbon_pct: Optional[float] = None

class ReadingCreate(ReadingBase):
    device_id: int

class Reading(ReadingBase):
    id: int
    device_id: int
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
