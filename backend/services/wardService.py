from config.db import get_database
from bson import ObjectId
from datetime import datetime
import json

async def add_medication_log(log_data: dict):
    db = get_database()
    result = await db["medication_logs"].insert_one(log_data)
    log_data["_id"] = str(result.inserted_id)
    return log_data

async def get_medication_logs(patient_id: str):
    db = get_database()
    logs = await db["medication_logs"].find({"patientId": patient_id}).sort("timeGiven", -1).to_list(100)
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
    return logs

async def get_ward_dashboard(ward_identifier: str):
    db = get_database()
    # 1. Fetch Ward Room profile 
    ward = await db["ward_rooms"].find_one({"wardId": ward_identifier})
    if not ward:
        return None
        
    ward["id"] = str(ward["_id"])
    del ward["_id"]
    if "password" in ward:
        del ward["password"] # Security
    
    # 2. Extract beds logic
    beds = ward.get("beds", [])
    
    # 3. For each occupied bed, hydrate the patient and prescription data
    patients_data = []
    for bed in beds:
        patient_id = bed.get("patientId")
        if bed.get("status") == "Occupied" and patient_id:
            patient = await db["users"].find_one({"medicalId": patient_id})
            if patient:
                # Get the active admission for the corresponding exact prescription
                admission = await db["admissions"].find_one({"patientId": patient_id, "status": "Admitted"})
                presc = None
                if admission and admission.get("prescriptionId"):
                    try:
                        from bson import ObjectId
                        p_id = ObjectId(admission["prescriptionId"])
                    except:
                        p_id = admission["prescriptionId"]
                    presc = await db["prescriptions"].find_one({"_id": p_id})
                    
                if not presc:
                    # Fallback to latest
                    presc = await db["prescriptions"].find_one({"patientId": patient_id}, sort=[("created_at", -1)])
                    
                if presc:
                    presc["id"] = str(presc["_id"])
                    del presc["_id"]
                    
                patients_data.append({
                    "bedId": bed.get("bedId"),
                    "medicalId": patient["medicalId"],
                    "name": patient.get("name", "Unknown Patient"),
                    "activePrescription": presc
                })
         
    ward["patientAgendas"] = patients_data
    
    # 4. Harvest Active hardware/IoT alerts or serious remarks targeted at this ward
    active_alerts = await db["alerts"].find({"wardId": ward_identifier, "isRead": False}).sort("created_at", -1).to_list(50)
    for alert in active_alerts:
        alert["id"] = str(alert["_id"])
        del alert["_id"]
        
    ward["activeAlerts"] = active_alerts
    return ward

async def update_ward_handover(ward_identifier: str, new_notes: str):
    db = get_database()
    result = await db["ward_rooms"].update_one(
        {"wardId": ward_identifier},
        {"$set": {"shiftNotes": new_notes}}
    )
    return result.modified_count > 0

async def submit_medical_remark(ward_id: str, ward_member: str, patient_id: str, presc_id: str, medicine_name: str, remark_text: str, severity: str):
    db = get_database()
    try:
        p_id = ObjectId(presc_id)
    except:
        p_id = presc_id
        
    remark_obj = {
        "remarkText": remark_text,
        "wardMemberId": ward_member,
        "severity": severity,
        "timestamp": datetime.utcnow()
    }
    
    # Needs $push into the specific medicine array element inside the prescription
    # We do this securely by searching array elements
    await db["prescriptions"].update_one(
        {"_id": p_id, "medicines.name": medicine_name},
        {"$push": {"medicines.$.remarks": remark_obj}}
    )
    
    # Generate Alert if "Serious"
    if severity == "Serious":
        from realtime.socket import manager
        
        # Get Patient logic just for displaying
        patient = await db["users"].find_one({"medicalId": patient_id})
        p_name = patient.get("name", patient_id) if patient else patient_id
        
        # Get Doctor ID from the prescription
        presc = await db["prescriptions"].find_one({"_id": p_id})
        doctor_id = presc.get("doctorId") if presc else None
        
        alert_msg = f"Serious reaction recorded for {p_name} taking {medicine_name}. Remark: {remark_text}"
        
        alert_data = {
            "patientId": patient_id,
            "wardId": ward_id,
            "doctorId": doctor_id,
            "prescriptionId": str(p_id),
            "alertType": "SeriousRemark",
            "message": alert_msg,
            "severity": "High",
            "isRead": False,
            "created_at": datetime.utcnow()
        }
        res = await db["alerts"].insert_one(alert_data)
        
        # Broadcast via WebSockets explicitly to doctor
        try:
            alert_data["_id"] = str(res.inserted_id)
            alert_data["created_at"] = alert_data["created_at"].isoformat()
            if doctor_id:
                await manager.send_personal_message(json.dumps({"type": "NEW_ALERT", "alert": alert_data}), doctor_id)
            else:
                await manager.broadcast(json.dumps({"type": "NEW_ALERT", "alert": alert_data}))
        except:
            pass
            
    return {"status": "success", "remark": remark_obj}

async def trigger_iot_alert(alert_data: dict):
    db = get_database()
    
    # Try to resolve linked doctor and prescription wrapper
    patient_id = alert_data.get("patientId")
    doctor_id = None
    if patient_id:
        latest_presc = await db["prescriptions"].find_one({"patientId": patient_id}, sort=[("created_at", -1)])
        if latest_presc:
            doctor_id = latest_presc.get("doctorId")
            alert_data["doctorId"] = doctor_id
            alert_data["prescriptionId"] = str(latest_presc["_id"])
            
    result = await db["alerts"].insert_one(alert_data)
    alert_data["_id"] = str(result.inserted_id)
    
    from realtime.socket import manager
    try:
        ws_copy = alert_data.copy()
        ws_copy["_id"] = alert_data["_id"]
        ws_copy["created_at"] = ws_copy["created_at"].isoformat()
        if doctor_id:
            await manager.send_personal_message(json.dumps({"type": "NEW_ALERT", "alert": ws_copy}), doctor_id)
        else:
            await manager.broadcast(json.dumps({"type": "NEW_ALERT", "alert": ws_copy}))
    except:
        pass
        
    return alert_data

async def add_patient_log(log_data: dict):
    db = get_database()
    result = await db["patient_logs"].insert_one(log_data)
    log_data["_id"] = str(result.inserted_id)
    
    # Broadcast new remark
    from realtime.socket import manager
    try:
        broadcast_data = log_data.copy()
        broadcast_data["id"] = log_data["_id"]
        del broadcast_data["_id"]
        if isinstance(broadcast_data.get("timestamp"), datetime):
            broadcast_data["timestamp"] = broadcast_data["timestamp"].isoformat()
        await manager.broadcast(json.dumps({"type": "NEW_REMARK", "log": broadcast_data}))
    except Exception as e:
        print(f"WS error: {e}")
        
    return log_data

async def discharge_patient(patient_id: str, ward_id: str):
    db = get_database()
    from fastapi import HTTPException
    
    # Update admission status
    admission = await db["admissions"].find_one({"patientId": patient_id, "status": "Admitted"})
    if admission:
        await db["admissions"].update_one(
            {"_id": admission["_id"]},
            {"$set": {"status": "Discharged", "bedId": None, "wardId": None, "discharged_at": datetime.utcnow()}}
        )

    # Free bed in ward_room
    ward = await db["ward_rooms"].find_one({"wardId": ward_id})
    if ward:
        beds = ward.get("beds", [])
        for i, bed in enumerate(beds):
            if bed.get("patientId") == patient_id:
                beds[i]["status"] = "Empty"
                beds[i]["patientId"] = None
        await db["ward_rooms"].update_one(
            {"_id": ward["_id"]},
            {"$set": {"beds": beds}}
        )
        
    # Update patient user profile
    await db["users"].update_one(
        {"medicalId": patient_id},
        {"$set": {"isAdmitted": False, "currentWardId": None}}
    )

    # Broadcast discharge
    from realtime.socket import manager
    try:
        await manager.broadcast(json.dumps({"type": "PATIENT_DISCHARGED", "patientId": patient_id, "wardId": ward_id}))
    except:
        pass
        
    return {"message": "Patient discharged successfully"}

async def get_patient_logs(patient_id: str):
    db = get_database()
    logs = await db["patient_logs"].find({"patient_id": patient_id}).sort("timestamp", -1).to_list(100)
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
    return logs
