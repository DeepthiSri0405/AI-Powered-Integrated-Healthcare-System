from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MedicationLogModel(BaseModel):
    patientId: str = Field(...)
    updatedBy: Optional[str] = None # Will be set by controller
    medicineName: str
    dosage: str
    timeGiven: datetime
    status: str # "taken", "missed"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
