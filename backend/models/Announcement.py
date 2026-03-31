from pydantic import BaseModel, Field
from datetime import datetime, timedelta

class AnnouncementModel(BaseModel):
    title: str
    message: str
    target_role: str = Field("ALL", description="Target role e.g. Doctors, WardStaff, Patients, ALL")
    hospital_id: str = Field("SYSTEM", description="Specific hospital ID or SYSTEM for all")
    priority: str = Field("Normal", description="Normal, High, Emergency")
    valid_till: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=2))
    created_at: datetime = Field(default_factory=datetime.utcnow)
