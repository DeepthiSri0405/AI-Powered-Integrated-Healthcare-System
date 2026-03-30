from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WardRoomModel(BaseModel):
    wardId: str = Field(..., description="E.g., WARD-ICU-1")
    password: str = Field(...)
    hospitalId: str = Field(...)
    assignedPatients: List[str] = Field(default=[])
    shiftNotes: Optional[str] = Field(default="No shift notes recorded currently. Welcome to the new shift.")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IotAlertModel(BaseModel):
    patientId: str = Field(...)
    wardId: str = Field(...)
    metric: str = Field(..., description="E.g., Pulse Rate")
    value: int = Field(..., description="The highly elevated/depressed value")
    threshold: int = Field(..., description="The standard healthy baseline limit")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="Active", description="Active or Resolved")
