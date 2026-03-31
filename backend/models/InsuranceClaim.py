from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class InsuranceClaimModel(BaseModel):
    patient_id: str
    hospital_id: str
    policy_number: str
    insurance_provider: str
    documents_url: List[str] = Field(default_factory=list, description="Pointers to physical/uploaded files")
    claim_amount: float
    approved_amount: float = Field(0.0, description="Amount approved by Admin/System")
    extracted_data: dict = Field(default_factory=dict, description="OCR parsed metadata")
    fraud_score: float = Field(0.0, description="Calculated by NLP heuristics")
    status: str = Field("pending", description="pending, under_review, approved, rejected")
    verified_by: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
