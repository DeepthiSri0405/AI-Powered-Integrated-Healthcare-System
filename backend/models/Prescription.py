from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Medicine(BaseModel):
    name: str
    dosage: str
    timing: str # e.g. "Morning, Night"
    duration: str # e.g. "5 days"
    quantity: int = Field(default=1, description="Number of items to decrement from hospital stock")
    shortBrief: Optional[str] = Field(default=None, description="A brief summary for the tablet popup UI")
    
class PrescriptionModel(BaseModel):
    patientId: str = Field(...)
    doctorId: str = Field(...)
    appointmentId: Optional[str] = None
    hospitalId: str = Field(..., description="Used to decrement correct hospital inventory")
    diagnosis: str
    medicines: List[Medicine] = []
    notes: Optional[str] = None
    labTests: List[str] = Field(default=[], description="List of suggested lab tests, highlighted in the UI")
    followUpDays: Optional[int] = Field(default=None, description="Number of days until the automated virtual or offline follow-up notification")
    created_at: datetime = Field(default_factory=datetime.utcnow)
