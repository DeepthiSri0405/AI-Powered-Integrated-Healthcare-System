from config.db import get_database

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
    # 1. Fetch Terminal details
    ward = await db["ward_rooms"].find_one({"wardId": ward_identifier})
    if not ward:
        return None
        
    ward["id"] = str(ward["_id"])
    del ward["_id"]
    del ward["password"] # Security
    
    # 2. Fetch specific active prescriptions for the patients currently mapped to this room
    patients_data = []
    for pid in ward.get("assignedPatients", []):
         patient = await db["users"].find_one({"medicalId": pid})
         if not patient:
             continue
             
         presc = await db["prescriptions"].find_one({"patientId": str(patient["_id"])}, sort=[("created_at", -1)])
         if presc:
             presc["id"] = str(presc["_id"])
             del presc["_id"]
             
         patients_data.append({
             "medicalId": patient["medicalId"],
             "name": patient["name"],
             "activePrescription": presc
         })
         
    ward["patientAgendas"] = patients_data
    
    # 3. Harvest Active IoT hardware alerts targeted specifically for this ward
    iot_alerts = await db["iot_alerts"].find({"wardId": ward_identifier, "status": "Active"}).to_list(50)
    for alert in iot_alerts:
        alert["id"] = str(alert["_id"])
        del alert["_id"]
        
    ward["activeIotAlerts"] = iot_alerts
    return ward

async def update_ward_handover(ward_identifier: str, new_notes: str):
    db = get_database()
    result = await db["ward_rooms"].update_one(
        {"wardId": ward_identifier},
        {"$set": {"shiftNotes": new_notes}}
    )
    return result.modified_count > 0

async def trigger_iot_alert(alert_data: dict):
    db = get_database()
    result = await db["iot_alerts"].insert_one(alert_data)
    alert_data["_id"] = str(result.inserted_id)
    return alert_data
