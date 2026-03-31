from fastapi import APIRouter, Depends
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from services.admissionService import get_pending_admissions, accept_admission

router = APIRouter()

@router.get("/pending")
async def pending_admissions(current_user: dict = Depends(role_required(["Citizen"]))):
    return await get_pending_admissions(current_user["medicalId"])

@router.post("/{admission_id}/accept")
async def admit_patient(admission_id: str, current_user: dict = Depends(role_required(["Citizen"]))):
    return await accept_admission(admission_id, current_user["medicalId"])
