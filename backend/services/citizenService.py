from config.db import get_database
from bson import ObjectId

async def get_citizen_profile(medical_id: str):
    db = get_database()
    user = await db["users"].find_one({"medicalId": medical_id}, {"password": 0})
    if user:
        user["id"] = str(user["_id"])
        del user["_id"]
    return user

async def get_citizen_records(patient_id: str):
    db = get_database()
    records = await db["health_records"].find({"patientId": patient_id}).sort("created_at", -1).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records

async def get_citizen_medications(medical_id: str):
    db = get_database()
    # Fetch all active prescriptions from Atlas
    prescriptions = await db["prescriptions"].find({"patientId": medical_id}).sort("created_at", -1).to_list(10)
    
    schedule = {"Morning": [], "Afternoon": [], "Night": []}
    for p in prescriptions:
        for med in p.get("medicines", []):
            timing = med.get("timing", "").lower()
            if "morning" in timing: schedule["Morning"].append(med["name"])
            if "afternoon" in timing or "noon" in timing: schedule["Afternoon"].append(med["name"])
            if "night" in timing or "evening" in timing: schedule["Night"].append(med["name"])
            
    return schedule

async def get_citizen_reminders(user_id: str):
    db = get_database()
    reminders = await db["reminders"].find({"userId": user_id}).to_list(100)
    for r in reminders:
        r["id"] = str(r["_id"])
        del r["_id"]
    return reminders
