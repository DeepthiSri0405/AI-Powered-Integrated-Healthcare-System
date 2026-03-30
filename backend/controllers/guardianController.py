from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from services.guardianService import link_child_service, link_elderly_mobile_service, link_elderly_assisted_service, get_linked_dependents
from pydantic import BaseModel

router = APIRouter()

class ElderlyMobileRequest(BaseModel):
    medicalId: str
    patientName: str
    dob: str
    relationship: str
    mobileNumber: str

@router.post("/link-child")
async def link_child(
    patientName: str = Form(...),
    dob: str = Form(...),
    relationship: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["Guardian", "Citizen"])) # Citizens can act as guardians too eventually
):
    # In a real app, upload `file` to S3 and get proof_url
    proof_url = f"mocked_s3_url/proofs/{file.filename}"
    file_bytes = await file.read()
    
    payload = {"patientName": patientName, "dob": dob, "relationship": relationship}
    
    result = await link_child_service(current_user["id"], payload, proof_url, file_bytes)
    return result

@router.post("/link-elderly/mobile")
async def link_elderly_mobile(
    req: ElderlyMobileRequest, 
    current_user: dict = Depends(role_required(["Guardian", "Citizen"]))
):
    result = await link_elderly_mobile_service(current_user["id"], req.model_dump())
    return result

@router.post("/link-elderly/assisted")
async def link_elderly_assisted(
    medicalId: str = Form(...),
    patientName: str = Form(...),
    dob: str = Form(...),
    relationship: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["Guardian", "Citizen"]))
):
    proof_url = f"mocked_s3_url/proofs/{file.filename}"
    payload = {"medicalId": medicalId, "patientName": patientName, "dob": dob, "relationship": relationship}
    
    result = await link_elderly_assisted_service(current_user["id"], payload, proof_url)
    return result

@router.get("/dependents")
async def view_linked_dependents(current_user: dict = Depends(get_current_user)):
    # Any logged in user could technically be queried for dependents
    dependents = await get_linked_dependents(current_user["id"])
    return {"dependents": dependents}
