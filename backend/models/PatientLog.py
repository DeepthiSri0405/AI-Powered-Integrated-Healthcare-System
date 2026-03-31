from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PatientLogModel(BaseModel):
    patient_id: str = Field(...)
    ward_staff_id: str = Field(...)
    remark: str = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
