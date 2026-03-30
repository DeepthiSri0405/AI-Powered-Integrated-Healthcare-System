from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class GeoJSONPoint(BaseModel):
    type: str = Field(default="Point")
    coordinates: List[float] = Field(..., description="[longitude, latitude]")

class HospitalModel(BaseModel):
    name: str = Field(...)
    address: str = Field(...)
    contactInfo: str
    location: GeoJSONPoint = Field(...)  # GeoJSON format for the $near queries
    specialties: List[str] = Field(default=[])
    created_at: datetime = Field(default_factory=datetime.utcnow)
