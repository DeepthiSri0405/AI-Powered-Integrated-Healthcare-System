from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HealthRecordModel(BaseModel):
    patientId: str = Field(...)
    title: str
    description: Optional[str] = None
    recordType: str # "Diagnosis", "LabReport", "General"
    fileUrl: Optional[str] = None
    doctorId: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
