from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MedicineStockModel(BaseModel):
    hospitalId: str = Field(...)
    name: str = Field(..., description="Exact name of the medicine")
    currentCount: int = Field(default=0, description="Available stock to dispense")
    reorderLevel: int = Field(default=10, description="Alert when count falls below this level")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
