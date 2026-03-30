from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

class LabReportModel(BaseModel):
    patientId: str = Field(...)
    labOperatorId: str = Field(...)
    reportTitle: str
    extractedText: Optional[str] = None
    abnormalValues: Optional[Dict[str, str]] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
