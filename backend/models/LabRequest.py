from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LabRequestModel(BaseModel):
    patientId: str = Field(...)
    hospitalId: str = Field(..., description="The ID of the lab/hospital the citizen explicitly chose")
    prescriptionId: str = Field(..., description="Link to the prescription containing the requested tests")
    testsRequested: List[str] = Field(..., description="Array of requested tests e.g. X-Ray, Blood")
    status: str = Field(default="Pending", description="Pending, Accepted, or Completed")
    operatorId: Optional[str] = Field(default=None, description="The specific lab operator handling this request")
    reportId: Optional[str] = Field(default=None, description="The final uploaded file result ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
