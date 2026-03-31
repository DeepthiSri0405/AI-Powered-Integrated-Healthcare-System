from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AdmissionModel(BaseModel):
    patientId: str = Field(...)
    doctorId: str = Field(...)
    hospitalId: str = Field(...)
    prescriptionId: str = Field(...)
    wardId: Optional[str] = None
    bedId: Optional[str] = None
    status: str = Field(default="Pending", description="Pending, Admitted, Discharged")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    admitted_at: Optional[datetime] = None
    discharged_at: Optional[datetime] = None
