from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from models.MedicationLog import MedicationLogModel
from services.wardService import add_medication_log, get_medication_logs, get_ward_dashboard, update_ward_handover, trigger_iot_alert, submit_medical_remark
from utils.email_utils import send_email_notification

router = APIRouter()

class HandoverRequest(BaseModel):
    notes: str

class RemarkRequest(BaseModel):
    patientId: str
    prescriptionId: str
    medicineName: str
    remark: str
    severity: str

class IotTriggerRequest(BaseModel):
    wardId: str
    patientId: str
    metric: str
    value: int
    threshold: int

# Hardcoded assignment for MVP as decided with User
def get_user_ward(current_user: dict):
    # Depending on how they login (Ward Room direct OR Ward Staff profile mapping)
    if current_user.get("role") == "WardRoom":
        return current_user.get("identifier")
    elif current_user.get("role") == "WardStaff":
        # Hackathon hardcode mapping to Ward 1
        return "WARD-1"
    else:
        raise HTTPException(status_code=403, detail="Not authorized to access Ward space")

@router.get("/dashboard")
async def view_dashboard(current_user: dict = Depends(role_required(["WardStaff", "WardRoom"]))):
    wardId = get_user_ward(current_user)
    dashboard = await get_ward_dashboard(wardId)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Ward Room Profile Not Configured Properly. Please run DB Seeder.")
    return {"dashboard": dashboard}

@router.put("/handover")
async def submit_handover(req: HandoverRequest, current_user: dict = Depends(role_required(["WardStaff", "WardRoom"]))):
    wardId = get_user_ward(current_user)
    success = await update_ward_handover(wardId, req.notes)
    if not success:
         raise HTTPException(status_code=500, detail="Handover failed to save")
    return {"message": "Shift notes handed over securely"}

@router.post("/remark")
async def submit_remark(req: RemarkRequest, current_user: dict = Depends(role_required(["WardStaff", "WardRoom"]))):
    wardId = get_user_ward(current_user)
    memberId = current_user.get("identifier", "Unknown Staff")
    
    result = await submit_medical_remark(wardId, memberId, req.patientId, req.prescriptionId, req.medicineName, req.remark, req.severity)
    return result

@router.post("/iot-trigger")
async def hardware_iot_trigger(req: IotTriggerRequest):
    # This simulated hardware route acts passively.
    result = await trigger_iot_alert({
        "wardId": req.wardId,
        "patientId": req.patientId,
        "alertType": "EmergencyVital",
        "message": f"CRITICAL: {req.metric} dropped to {req.value}! (Threshold: {req.threshold})",
        "severity": "Emergency",
        "isRead": False,
        "created_at": datetime.utcnow()
    })
    return {"message": "IoT Dummy Alert triggered globally", "alert": result}

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

@router.post("/patients/{patient_id}/discharge")
async def api_discharge_patient(patient_id: str, current_user: dict = Depends(role_required(["WardStaff", "WardRoom", "Admin"]))):
    from services.wardService import discharge_patient
    wardId = get_user_ward(current_user)
    return await discharge_patient(patient_id, wardId)

@router.post("/patients/{patient_id}/logs")
async def api_add_patient_log(patient_id: str, req: dict, current_user: dict = Depends(role_required(["WardStaff", "WardRoom", "Admin"]))):
    from services.wardService import add_patient_log
    from models.PatientLog import PatientLogModel
    
    # Optional logic if log requires validation:
    log_model = PatientLogModel(
        patient_id=patient_id,
        ward_staff_id=current_user.get("identifier"),
        remark=req.get("remark")
    )
    return await add_patient_log(log_model.model_dump())

@router.get("/patients/{patient_id}/logs")
async def api_get_patient_logs(patient_id: str, current_user: dict = Depends(get_current_user)):
    from services.wardService import get_patient_logs
    logs = await get_patient_logs(patient_id)
    return {"logs": logs}
