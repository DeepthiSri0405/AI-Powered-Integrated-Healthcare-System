from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from models.MedicationLog import MedicationLogModel
from services.wardService import add_medication_log, get_medication_logs, get_ward_dashboard, update_ward_handover, trigger_iot_alert
from utils.email_utils import send_email_notification

router = APIRouter()

class HandoverRequest(BaseModel):
    notes: str

class AlertDoctorRequest(BaseModel):
    patientId: str
    medicineName: str
    doctorEmail: str

class IotTriggerRequest(BaseModel):
    wardId: str
    patientId: str
    metric: str
    value: int
    threshold: int

@router.get("/dashboard")
async def view_dashboard(current_user: dict = Depends(role_required(["WardRoom"]))):
    # current_user represents the Terminal here
    wardId = current_user.get("identifier")
    dashboard = await get_ward_dashboard(wardId)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Ward Terminal Not Configured Globally")
    return {"dashboard": dashboard}

@router.put("/handover")
async def submit_handover(req: HandoverRequest, current_user: dict = Depends(role_required(["WardRoom"]))):
    wardId = current_user.get("identifier")
    success = await update_ward_handover(wardId, req.notes)
    if not success:
         raise HTTPException(status_code=500, detail="Handover failed to save")
    return {"message": "Shift notes handed over securely"}

@router.post("/alert-doctor")
async def alert_doctor(req: AlertDoctorRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(role_required(["WardRoom"]))):
    wardId = current_user.get("identifier")
    
    # Send emergency email
    html_msg = f"<h2>EMERGENCY: Patient Abnormalities Detected</h2><p>Ward Terminal <b>{wardId}</b> has escalated an issue.</p><p>Patient ID: {req.patientId}</p><p>Medication Trigger: {req.medicineName}</p><p>Please log in immediately and review the Active Prescription agenda for alteration.</p>"
    
    background_tasks.add_task(
        send_email_notification,
        req.doctorEmail,
        "URGENT: Medication Reaction Triggered in Ward",
        html_msg
    )
    return {"message": "Doctor Alerted via Email Successfully"}

@router.post("/iot-trigger")
async def hardware_iot_trigger(req: IotTriggerRequest):
    # This route is unprotected so physical external devices (e.g. Raspberry Pi) can POST safely or easily with an API Key in standard situations
    result = await trigger_iot_alert({
        "wardId": req.wardId,
        "patientId": req.patientId,
        "metric": req.metric,
        "value": req.value,
        "threshold": req.threshold,
        "status": "Active"
    })
    return {"message": "IoT Hardware Alert triggered", "alert": result}

@router.post("/medication")
async def log_medication(log: MedicationLogModel, current_user: dict = Depends(role_required(["WardRoom", "WardStaff", "Guardian", "Admin"]))):
    data = log.model_dump()
    data["updatedBy"] = current_user.get("identifier", current_user["id"])
    result = await add_medication_log(data)
    return {"message": "Medication logged", "log": result}

@router.get("/medication/{patient_id}")
async def view_logs(patient_id: str, current_user: dict = Depends(get_current_user)):
    logs = await get_medication_logs(patient_id)
    return {"logs": logs}
