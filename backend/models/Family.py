from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FamilyModel(BaseModel):
    name: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FamilyMemberModel(BaseModel):
    family_id: str = Field(...)
    user_id: str = Field(...) # Reference to User's medicalId
    role: str = Field(...) # "Admin", "Member", "Dependent"
    relationship: str = Field(...) # "Parent", "Child", "Self", "Spouse", etc.
    status: str = Field(default="active") # "active", "removed", "restricted"
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class AccessControlModel(BaseModel):
    owner_user_id: str = Field(...) # The user owning the health data (medicalId)
    access_user_id: str = Field(...) # The user given access
    permission_type: str = Field(...) # "view", "edit", "full"
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
