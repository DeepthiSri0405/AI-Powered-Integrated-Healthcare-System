from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AttendanceModel(BaseModel):
    user_id: str = Field(..., description="Worker identifier")
    role: str = Field(..., description="doctor, ward_member, etc.")
    login_time: datetime = Field(default_factory=datetime.utcnow)
    logout_time: Optional[datetime] = None
    total_hours: float = Field(0.0, description="Calculated on logout")
    status: str = Field("present", description="present, absent, late")
    date: str = Field(..., description="YYYY-MM-DD")
