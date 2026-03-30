from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BedResource(BaseModel):
    total: int = Field(default=100)
    occupied: int = Field(default=0)

class OxygenResource(BaseModel):
    current: int = Field(default=1000, description="Available Liters")
    threshold: int = Field(default=200, description="Critical Alert Level")

class EquipmentResource(BaseModel):
    total: int = Field(default=50)
    functional: int = Field(default=50)

class ResourceModel(BaseModel):
    hospitalId: str = Field(...)
    beds: BedResource = Field(default_factory=BedResource)
    icu: BedResource = Field(default_factory=BedResource)
    oxygen: OxygenResource = Field(default_factory=OxygenResource)
    medicineStockStatus: str = Field(default="Stable") # Stable, Low, Critical
    staffOnDuty: int = Field(default=10)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
