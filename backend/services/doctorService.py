from config.db import get_database

async def search_doctors(hospital_id: str = None, specialty: str = None):
    db = get_database()
    query = {"role": "Doctor"}
    if hospital_id:
        query["hospitalId"] = hospital_id
    if specialty:
        # Case insensitive regex match for specialty
        query["specialty"] = {"$regex": specialty, "$options": "i"}
        
    doctors = await db["users"].find(query, {"password": 0}).to_list(100)
    for d in doctors:
        d["id"] = str(d["_id"])
        del d["_id"]
        
        feedbacks = await db["feedbacks"].find({"doctorId": d.get("employeeId")}).to_list(None)
        if feedbacks:
            total_rating = sum(f.get("rating", 5) for f in feedbacks)
            d["averageRating"] = round(total_rating / len(feedbacks), 1)
            d["totalReviews"] = len(feedbacks)
        else:
            d["averageRating"] = 5.0
            d["totalReviews"] = 0
            
    return doctors

async def get_doctor_slots(doctor_id: str, date: str):
    db = get_database()

    # 24/7 slots per user request (Midnights included)
    ALL_SLOTS = [f"{str(h).zfill(2)}:00 - {str((h+1)%25).zfill(2)}:00" for h in range(24)]
    # Correcting standard 24 hour wrap around if h+1 == 24
    ALL_SLOTS[-1] = "23:00 - 00:00"

    # For each slot, count ACTIVE bookings (not Completed)
    available = []
    for slot in ALL_SLOTS:
        count = await db["appointments"].count_documents({
            "doctorId": doctor_id,
            "date": date,
            "timeSlot": slot,
            "status": {"$ne": "Completed"}
        })
        if count < 3:
            available.append(slot)

    return available

async def set_doctor_slots(schedule_data: dict):
    db = get_database()
    result = await db["doctor_schedules"].insert_one(schedule_data)
    schedule_data["_id"] = str(result.inserted_id)
    return schedule_data

async def get_demo_hospital():
    db = get_database()
    hospital = await db["hospitals"].find_one({"isDemo": True})
    if hospital:
        hospital["id"] = str(hospital["_id"])
        del hospital["_id"]
    return hospital

async def get_doctor_feedbacks(doctor_id: str):
    db = get_database()
    feedbacks = await db["feedbacks"].find({"doctorId": doctor_id}).sort("created_at", -1).to_list(100)
    for f in feedbacks:
        f["id"] = str(f["_id"])
        del f["_id"]
        # Try to get patient name if it's available
        patient = await db["users"].find_one({"medicalId": f.get("patientId")})
        f["patientName"] = patient.get("name") if patient and patient.get("name") else f.get("patientId")
    return feedbacks
