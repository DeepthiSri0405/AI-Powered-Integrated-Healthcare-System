from pydantic import BaseModel, Field
from datetime import datetime

class IotTelemetryPayload(BaseModel):
    patientId: str = Field(..., description="The unique Health ID of the patient wearing the device.")
    heartRate: float = Field(...)
    spo2: float = Field(...)
    temperature: float = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
