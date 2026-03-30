from fastapi import APIRouter, Depends
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from services.alertService import get_patient_alerts
from config.db import get_database
from datetime import datetime
from bson import ObjectId
from models.Resource import ResourceModel

router = APIRouter()

@router.get("/dashboard/stats")
async def get_admin_stats(current_user: dict = Depends(role_required(["Admin", "HealthOfficer"]))):
    db = get_database()
    users_count = await db["users"].count_documents({})
    alerts_count = await db["alerts"].count_documents({})
    prescriptions_count = await db["prescriptions"].count_documents({})
    return {
        "total_users": users_count,
        "total_alerts": alerts_count,
        "total_prescriptions": prescriptions_count
    }

@router.get("/alerts/{patient_id}")
async def view_alerts(patient_id: str, current_user: dict = Depends(get_current_user)):
    alerts = await get_patient_alerts(patient_id)
    return {"alerts": alerts}

@router.get("/metrics/appointments")
async def get_appointment_metrics(current_user: dict = Depends(role_required(["Admin"]))):
    db = get_database()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    total = await db["appointments"].count_documents({})
    virtual = await db["appointments"].count_documents({"appointmentType": "Virtual"})
    in_person = await db["appointments"].count_documents({"appointmentType": "In-Person"})
    
    return {
        "totalAppointments": total,
        "virtualAppointments": virtual,
        "inPersonAppointments": in_person,
        "date": today
    }

@router.get("/resources")
async def get_hospital_resources(hospital_id: str, current_user: dict = Depends(role_required(["Admin", "HealthOfficer"]))):
    db = get_database()
    resource = await db["resources"].find_one({"hospitalId": hospital_id})
    if not resource:
        # Default mock if not found
        mock_resource = ResourceModel(hospitalId=hospital_id)
        return mock_resource.dict()
    return resource

@router.post("/appointments/approve/{appointment_id}")
async def approve_appointment(appointment_id: str, current_user: dict = Depends(role_required(["Admin"]))):
    db = get_database()
    result = await db["appointments"].update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "Approved"}}
    )
    if result.modified_count == 0:
        return {"error": "Appointment not found or already approved"}
    return {"message": "Appointment approved successfully"}

@router.post("/resources/request")
async def create_resource_request(request_data: dict, current_user: dict = Depends(role_required(["Admin"]))):
    db = get_database()
    request_data["requestedBy"] = current_user["userId"]
    request_data["timestamp"] = datetime.utcnow()
    request_data["status"] = "Pending"
    await db["resource_requests"].insert_one(request_data)
    return {"message": "Resource request submitted to central health panel"}
