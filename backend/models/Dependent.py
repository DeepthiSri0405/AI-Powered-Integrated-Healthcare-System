from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DependentModel(BaseModel):
    guardianId: str = Field(..., description="The user ID of the guardian who created this link")
    dependentType: str = Field(..., description="'Child' or 'Elderly'")
    verificationStatus: str = Field(default="Pending Verification", description="'Verified', 'Pending Verification', 'Limited Trust'")
    patientName: str = Field(...)
    dob: str = Field(...)
    relationship: str = Field(...)
    medicalId: Optional[str] = Field(None, description="The 6-digit medical ID that was assigned or linked to them")
    proofUrl: Optional[str] = Field(None, description="URL or path to uploaded proof (Birth Cert/ID)")
    consentStatus: Optional[str] = Field(None, description="'Granted', 'Pending', 'Not Required'")
    trustScore: Optional[int] = Field(None, description="0-100 Autonomous Tesseract & OpenCV Analysis Score")
    verificationMetadata: Optional[dict] = Field(None, description="Detailed JSON breakdown of OCR matches and Image Tamper metrics")
    created_at: datetime = Field(default_factory=datetime.utcnow)
