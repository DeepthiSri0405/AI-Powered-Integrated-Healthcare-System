from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AlertModel(BaseModel):
    patientId: str = Field(...)
    alertType: str # "AbnormalLab", "MissedMedication", "EmergencyVital"
    message: str
    isRead: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
