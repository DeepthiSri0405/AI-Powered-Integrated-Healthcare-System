from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from services.citizenService import get_citizen_profile, get_citizen_records, get_citizen_medications, get_citizen_reminders
from services.labService import extract_text_from_file, detect_tests_from_text

router = APIRouter()

class FeedbackSchema(BaseModel):
    doctorId: str
    appointmentId: str
    rating: int
    comment: str = ""

@router.post("/feedback")
async def submit_feedback(feedback: FeedbackSchema, current_user: dict = Depends(role_required(["Citizen"]))):
    from config.db import get_database
    db = get_database()
    
    try:
        appt_id = ObjectId(feedback.appointmentId)
    except:
        appt_id = feedback.appointmentId

    # Use string matched check or ObjectId since appointment IDs could be string
    appt = await db["appointments"].find_one({"$or": [{"_id": appt_id}, {"_id": str(feedback.appointmentId)}], "patientId": current_user["medicalId"]})
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found or unauthorized")
    
    if appt.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Cannot leave feedback for incomplete appointment")
        
    existing = await db["feedbacks"].find_one({"appointmentId": feedback.appointmentId})
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this appointment")
        
    doc = {
        "doctorId": feedback.doctorId,
        "patientId": current_user["medicalId"],
        "appointmentId": feedback.appointmentId,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": datetime.utcnow()
    }
    await db["feedbacks"].insert_one(doc)
    return {"message": "Feedback submitted successfully"}

@router.post("/verify-certificate")
async def verify_certificate(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    from utils.cv_utils import detect_image_morphing
    contents = await file.read()
    analysis = detect_image_morphing(contents)
    return {"analysis": analysis}

@router.post("/upload-prescription")
async def upload_prescription(
    file: UploadFile = File(...),
    current_user: dict = Depends(role_required(["Citizen"]))
):
    medical_id = current_user.get("medicalId")
    if not medical_id:
        raise HTTPException(status_code=400, detail="Health Profile not found.")
        
    contents = await file.read()
    text = await extract_text_from_file(contents, file.filename)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from document.")
        
    detected_tests = await detect_tests_from_text(text, medical_id)
    
    return {
        "message": "Prescription processed",
        "detected_tests": detected_tests,
        "raw_text_preview": text[:200]
    }

@router.get("/profile")
async def get_profile(current_user: dict = Depends(role_required(["Citizen"]))):
    medical_id = current_user.get("medicalId")
    if not medical_id:
        raise HTTPException(status_code=400, detail="User does not have a medical ID")
    profile = await get_citizen_profile(medical_id)
    return {"profile": profile}

@router.get("/records/{patient_id}")
async def get_records(patient_id: str, current_user: dict = Depends(get_current_user)):
    # Can add further checks here if caller is authorized
    records = await get_citizen_records(patient_id)
    return {"records": records}

@router.get("/medications")
async def get_meds(current_user: dict = Depends(role_required(["Citizen"]))):
    medical_id = current_user.get("medicalId")
    meds = await get_citizen_medications(medical_id)
    return {"medications": meds}

@router.get("/reminders")
async def get_reminders(current_user: dict = Depends(role_required(["Citizen"]))):
    medical_id = current_user.get("medicalId")
    reminders = await get_citizen_reminders(medical_id)
    return {"reminders": reminders}
