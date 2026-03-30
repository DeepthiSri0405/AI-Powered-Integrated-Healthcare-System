from config.db import get_database

async def create_alert(alert_data: dict):
    db = get_database()
    result = await db["alerts"].insert_one(alert_data)
    alert_data["_id"] = str(result.inserted_id)
    return alert_data

async def get_patient_alerts(patient_id: str):
    db = get_database()
    alerts = await db["alerts"].find({"patientId": patient_id}).sort("created_at", -1).to_list(100)
    for a in alerts:
        a["id"] = str(a["_id"])
        del a["_id"]
    return alerts
