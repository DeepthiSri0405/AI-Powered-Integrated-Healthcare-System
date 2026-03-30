from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import Optional
from services.authService import citizen_onboard_service, citizen_set_password_service, worker_create_service, login_user

router = APIRouter()

class CitizenOnboardRequest(BaseModel):
    aadhaarId: str = Field(..., pattern=r"^\d{12}$", description="Must be exactly a 12-digit number")
    name: str = Field(..., description="Legal name matching Government IDs")
    dob: str = Field(..., description="YYYY-MM-DD for OpenCV dependency verification tests")

class CitizenSetPasswordRequest(BaseModel):
    medicalId: str
    aadhaarId: str = Field(..., pattern=r"^\d{12}$", description="Must be exactly a 12-digit number")
    password: str

class WorkerCreateRequest(BaseModel):
    name: str
    role: str # "Doctor", "LabOperator", "WardStaff", "Admin", "Guardian"
    password: str

@router.post("/citizen/onboard")
async def citizen_onboard(req: CitizenOnboardRequest):
    result = await citizen_onboard_service(req.model_dump())
    from services.email_service import send_medical_id_email
    send_medical_id_email("default", req.name, result["medicalId"])
    return {"message": "Citizen onboarded successfully", "data": result}

@router.post("/citizen/set-password")
async def citizen_set_password(req: CitizenSetPasswordRequest):
    result = await citizen_set_password_service(req.medicalId, req.aadhaarId, req.password)
    return {"message": "Citizen password set successfully", "data": result}

class WardRoomCreateRequest(BaseModel):
    wardId: str = Field(..., description="Must start with WARD-")
    password: str
    hospitalId: str

@router.post("/worker/create")
async def worker_create(req: WorkerCreateRequest):
    result = await worker_create_service(req.model_dump())
    return {"message": "Worker created successfully", "data": result}

@router.post("/ward-room/create")
async def ward_room_create(req: WardRoomCreateRequest):
    from config.db import get_database
    from utils.validators import get_password_hash
    db = get_database()
    
    if not req.wardId.startswith("WARD-"):
         raise HTTPException(status_code=400, detail="Ward IDs must strictly start with WARD-")
         
    if await db["ward_rooms"].find_one({"wardId": req.wardId}):
         raise HTTPException(status_code=400, detail="Ward Room Terminal already configured.")
         
    new_ward = {
         "wardId": req.wardId,
         "hospitalId": req.hospitalId,
         "password": get_password_hash(req.password),
         "assignedPatients": [],
         "shiftNotes": "System Init: Ward terminal deployed.",
    }
    await db["ward_rooms"].insert_one(new_ward)
    return {"message": "Shared Terminal Activated", "wardId": req.wardId}

@router.post("/login")
async def login(req: OAuth2PasswordRequestForm = Depends()):
    # Swagger sends the user ID in the `req.username` field for OAuth2 compatibility!
    result = await login_user({"identifier": req.username, "password": req.password})
    return result
