from fastapi import APIRouter, Depends
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from services.alertService import get_patient_alerts
from config.db import get_database
from datetime import datetime
from bson import ObjectId
from models.Resource import ResourceModel

router = APIRouter()

@router.get("/attendance")
async def get_all_attendance(date: str = None, current_user: dict = Depends(role_required(["Admin", "HealthOfficer"]))):
    db = get_database()
    today = date if date else datetime.utcnow().strftime("%Y-%m-%d")
    
    # Fetch all records for today
    cursor = db["attendance"].find({"date": today}).sort("login_time", -1)
    records = await cursor.to_list(1000)
    
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
        
    return {"status": "success", "date": today, "attendance": records}

@router.get("/analytics")
async def get_hospital_analytics(current_user: dict = Depends(role_required(["Admin", "HealthOfficer"]))):
    db = get_database()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # 1. Patients per day (Appointments today)
    patients_today = await db["appointments"].count_documents({"date": today})
    
    # 2. Bed Occupancy
    ward_rooms = await db["ward_rooms"].find({}).to_list(100)
    total_beds = 0
    occupied_beds = 0
    for w in ward_rooms:
        beds = w.get("beds", [])
        total_beds += len(beds)
        occupied_beds += sum(1 for b in beds if b.get("status") == "Occupied")
        
    occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
    
    # 3. Staff Attendance %
    total_staff = await db["users"].count_documents({"role": {"$in": ["Doctor", "WardStaff", "LabOperator"]}})
    present_staff = await db["attendance"].count_documents({"date": today, "status": "present"})
    attendance_rate = (present_staff / total_staff * 100) if total_staff > 0 else 0
    
    # 4. Financial (Hospital Revenue from Prescriptions)
    pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_bill"}}}
    ]
    cursor = db["prescriptions"].aggregate(pipeline)
    res = await cursor.to_list(1)
    revenue = res[0].get("total_revenue", 0.0) if res else 0.0
    
    pending_claims = await db["insurance_claims"].count_documents({"status": "pending"})
    
    # 5. Global Core Stats
    total_system_users = await db["users"].count_documents({})
    total_prescriptions = await db["prescriptions"].count_documents({})
    total_alerts = await db["alerts"].count_documents({})
    
    # 6. Monthly Visits (Last 6 Months)
    # Group appointments by substring of "date" (YYYY-MM)
    monthly_pipeline = [
        {"$project": {"month": {"$substr": ["$date", 0, 7]}}},
        {"$group": {"_id": "$month", "visits": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$limit": 6}
    ]
    monthly_res = await db["appointments"].aggregate(monthly_pipeline).to_list(6)
    monthly_visits = [{"name": r["_id"], "visits": r["visits"]} for r in monthly_res]
    
    return {
        "status": "success",
        "metrics": {
            "patients_today": patients_today,
            "bed_occupancy_rate": round(occupancy_rate, 1),
            "attendance_rate": round(attendance_rate, 1),
            "revenue": revenue,
            "pending_claims": pending_claims,
            "occupied_beds": occupied_beds,
            "total_beds": total_beds,
            "present_staff": present_staff,
            "total_staff": total_staff,
            "system_users": total_system_users,
            "system_prescriptions": total_prescriptions,
            "system_alerts": total_alerts,
            "monthly_visits_trend": monthly_visits
        }
    }

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

@router.get("/resources/requests")
async def get_resource_requests(current_user: dict = Depends(role_required(["Admin", "HealthOfficer"]))):
    db = get_database()
    requests = await db["resource_requests"].find({}).sort("timestamp", -1).to_list(100)
    for r in requests:
        r["id"] = str(r["_id"])
        del r["_id"]
        # Format date natively
        r["date"] = r["timestamp"].strftime("%Y-%m-%d") if "timestamp" in r else "N/A"
    return {"requests": requests}

@router.post("/resources/request")
async def create_resource_request(request_data: dict, current_user: dict = Depends(role_required(["Admin"]))):
    db = get_database()
    request_data["requestedBy"] = current_user["userId"]
    request_data["timestamp"] = datetime.utcnow()
    request_data["status"] = "Pending"
    await db["resource_requests"].insert_one(request_data)
    return {"message": "Resource request submitted to central health panel"}

@router.get("/notifications")
async def get_admin_notifications(ward_id: str, current_user: dict = Depends(role_required(["WardStaff", "WardRoom", "Admin"]))):
    db = get_database()
    # Find notifications meant for this ward_id, or "ALL"
    query = {"$or": [{"ward_id": ward_id}, {"ward_id": "ALL"}]}
    
    cursor = db["admin_notifications"].find(query).sort("created_at", -1)
    notifications = await cursor.to_list(100)
    for n in notifications:
        n["id"] = str(n["_id"])
        del n["_id"]
        # Format datetime strings manually for frontend safety if raw objects are fetched
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
        if isinstance(n.get("valid_till"), datetime):
            n["valid_till"] = n["valid_till"].isoformat()
            
    return notifications

@router.post("/notifications")
async def create_admin_notification(payload: dict, current_user: dict = Depends(role_required(["Admin"]))):
    db = get_database()
    from models.AdminNotification import AdminNotificationModel
    import json
    
    notification = AdminNotificationModel(
        title=payload.get("title"),
        message=payload.get("message"),
        priority=payload.get("priority", "Normal"),
        ward_id=payload.get("ward_id", "ALL")
    )
    
    data = notification.model_dump()
    result = await db["admin_notifications"].insert_one(data)
    data["id"] = str(result.inserted_id)
    del data["_id"]
    
    if isinstance(data.get("created_at"), datetime):
        data["created_at"] = data["created_at"].isoformat()
        
    # Broadcast notification
    from realtime.socket import manager
    try:
        await manager.broadcast(json.dumps({"type": "NEW_NOTIFICATION", "notification": data}))
    except Exception as e:
        print(f"WS error: {e}")
        
    return {"message": "Notification broadcasted successfully", "notification": data}

@router.delete("/notifications/{notif_id}")
async def delete_admin_notification(notif_id: str, current_user: dict = Depends(role_required(["Admin"]))):
    db = get_database()
    from bson import ObjectId
    
    result = await db["admin_notifications"].delete_one({"_id": ObjectId(notif_id)})
    if result.deleted_count == 0:
        return {"message": "Notification not found or already deleted"}
        
    return {"message": "Notification deleted successfully"}

