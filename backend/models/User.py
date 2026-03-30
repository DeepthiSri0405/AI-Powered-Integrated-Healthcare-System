from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class UserModel(BaseModel):
    name: Optional[str] = None # Optional since citizen might just start with Aadhaar
    dob: Optional[str] = Field(None, description="Critical for authentic structural Aadhaar verification")
    role: str = Field(...) # "Citizen", "Doctor", "LabOperator", "WardStaff", "Admin", "Guardian"
    aadhaarId: Optional[str] = None # 12 digit Aadhaar
    medicalId: Optional[str] = None # 6 digit Generated numeric string for citizens
    employeeId: Optional[str] = None # 6 digit Generated numeric string for employees
    email: Optional[EmailStr] = None # Optional fallback
    password: Optional[str] = None # Optional initially for Citizens
    guardianIds: Optional[List[str]] = [] # IDs of guardians linked to this citizen
    
    # Hybrid Family & Autonomy Fields
    age: Optional[int] = None
    is_adult: Optional[bool] = None
    autonomy_enabled: Optional[bool] = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GuardianMapping(BaseModel):
    guardianId: str = Field(...)
    patientIds: List[str] = Field(default=[])
