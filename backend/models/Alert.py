from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AlertModel(BaseModel):
    patientId: str = Field(...)
    alertType: str # "AbnormalLab", "MissedMedication", "EmergencyVital", "SeriousRemark"
    message: str
    isRead: bool = False
    wardId: Optional[str] = None
    bedId: Optional[str] = None
    severity: str = Field(default="High")
    created_at: datetime = Field(default_factory=datetime.utcnow)
