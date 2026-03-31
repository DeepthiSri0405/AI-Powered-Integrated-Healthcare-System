from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AdminNotificationModel(BaseModel):
    title: str = Field(...)
    message: str = Field(...)
    priority: str = Field(default="Normal")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    valid_till: Optional[datetime] = None
    ward_id: str = Field(default="ALL") # Can target a specific ward or 'ALL'
