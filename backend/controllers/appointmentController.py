from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from middleware.authMiddleware import get_current_user
from services.appointmentService import create_appointment, get_patient_appointments
from models.Appointment import AppointmentModel
from utils.email_utils import send_email_notification

router = APIRouter()

@router.post("/book")
async def book_appointment(req: AppointmentModel, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    result = await create_appointment(req.model_dump())
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    # Hackathon Integration: Send email asynchronously
    email_body = f"<h3>Appointment Confirmed</h3><p>Date: {result['date']} at {result['timeSlot']}</p>"
    if result.get("appointmentType") == "Virtual":
        email_body += f"<p><b>Jitsi Meet Link:</b> <a href='{result['meetingLink']}'>{result['meetingLink']}</a></p>"
    else:
        email_body += f"<p><b>Your Queue Token Number:</b> {result['tokenNumber']}</p>"
        
    background_tasks.add_task(
        send_email_notification,
        "dasharadhideepthisri@gmail.com", # Hardcoded for Demo per USER request
        "Your Health System Appointment",
        email_body
    )
    
    return {"message": "Appointment successfully scheduled and auto-approved!", "appointment": result}

@router.get("/patient/{patient_id}")
async def view_appointments(patient_id: str, current_user: dict = Depends(get_current_user)):
    appointments = await get_patient_appointments(patient_id)
    return {"appointments": appointments}

@router.get("/queue/status")
async def queue_status(doctor_id: str, my_token: str, date: str, current_user: dict = Depends(get_current_user)):
    from services.appointmentService import get_queue_wait_time
    return await get_queue_wait_time(doctor_id, my_token, date)
