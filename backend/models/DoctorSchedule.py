from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class DoctorScheduleModel(BaseModel):
    doctorId: str = Field(...)
    hospitalId: str = Field(...)
    date: str = Field(..., description="Format: YYYY-MM-DD")
    availableSlots: List[str] = Field(..., description="List of HH:MM strings")
    created_at: datetime = Field(default_factory=datetime.utcnow)
