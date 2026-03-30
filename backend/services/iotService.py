from config.db import get_database

async def save_telemetry_reading(reading_data: dict):
    db = get_database()
    result = await db["iot_streams"].insert_one(reading_data)
    reading_data["_id"] = str(result.inserted_id)
    return reading_data

async def get_patient_telemetry(patient_id: str, limit: int = 15):
    db = get_database()
    # Fetch the most recent hardware pulses to construct the frontend live graph
    records = await db["iot_streams"].find({"patientId": patient_id}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Reverse to chronological order for React charting
    records.reverse()
    
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
        
    return records
