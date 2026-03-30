from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AppointmentModel(BaseModel):
    patientId: str = Field(...) 
    doctorId: str = Field(...)
    hospitalId: str = Field(...)
    hospitalName: str = Field(..., description="Readable name of the facility")
    date: str = Field(..., description="YYYY-MM-DD format")
    timeSlot: str = Field(..., description="HH:MM format Range e.g. 08:00 - 09:00")
    appointmentType: str = Field(default="In-Person", description="'In-Person' or 'Virtual'")
    meetingLink: Optional[str] = Field(default=None, description="Auto-generated Jitsi URL")
    tokenNumber: Optional[str] = Field(default=None, description="Auto-generated Queue string e.g., A101")
    status: str = Field(default="Approved") # Fast-Track Auto Approval Enabled
    symptoms: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
