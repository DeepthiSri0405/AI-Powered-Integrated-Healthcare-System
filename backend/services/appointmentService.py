from config.db import get_database
from bson.objectid import ObjectId

async def create_appointment(appointment_data: dict):
    db = get_database()
    
    # 1. Enforce constraint to prevent more than 3 bookings per slot
    current_bookings = await db["appointments"].count_documents({
        "doctorId": appointment_data["doctorId"],
        "date": appointment_data["date"],
        "timeSlot": appointment_data["timeSlot"]
    })
    
    if current_bookings >= 3:
        return {"error": "This time slot is fully booked (max 3 people)."}
        
    if appointment_data.get("appointmentType") == "Virtual":
        # Generate Jitsi Room - Unique per slot/doctor
        raw_room = f"SHS-{appointment_data['doctorId']}-{appointment_data['date']}-{appointment_data['timeSlot']}"
        jitsi_room = raw_room.replace(" ", "-").replace(":", "-")
        appointment_data["meetingLink"] = f"https://meet.jit.si/{jitsi_room}"
    else:
        # Offline tokens are now based on daily sequence (A101, A102...)
        offline_count = await db["appointments"].count_documents({
            "doctorId": appointment_data["doctorId"],
            "date": appointment_data["date"],
            "appointmentType": "In-Person"
        })
        token_num = 101 + offline_count
        appointment_data["tokenNumber"] = f"A{token_num}"
        
    # 2. Add Appointment Document
    appointment_data["status"] = "pending"
    result = await db["appointments"].insert_one(appointment_data)

    appointment_data["_id"] = str(result.inserted_id)
    
    # 3. Send Booking Notification (Virtual)
    if appointment_data.get("appointmentType") == "Virtual":
        from utils.email_utils import send_email_notification
        import asyncio
        html_msg = f"""
        <h2>Virtual Appointment Confirmed</h2>
        <p>Your telemedicine session with Doctor {appointment_data['doctorId']} is booked for {appointment_data['date']} at {appointment_data['timeSlot']}.</p>
        <p><strong>Secure Meeting Link:</strong> <a href='{appointment_data.get("meetingLink")}'>Join Room Here</a></p>
        <p style="color: #10b981; font-weight: bold;">Note: No mail authentication or account login is required to join this link.</p>
        <p>You can join the room as soon as the doctor initiates the session.</p>
        """
        # Run synchronous email blocking task in an executor
        asyncio.create_task(asyncio.to_thread(
            send_email_notification,
            to_email="patient@example.com", # Overridden by email_utils
            subject=f"SmartHealth: Virtual Consult Scheduled ({appointment_data['date']})",
            html_message=html_msg
        ))
        
    return appointment_data

async def get_patient_appointments(patient_id: str):
    db = get_database()
    appointments = await db["appointments"].find({"patientId": patient_id}).sort("date", -1).to_list(100)
    for a in appointments:
        a["id"] = str(a["_id"])
        del a["_id"]
        # Link Prescription for History - Try by appointmentId first, then by composite key
        presc = await db["prescriptions"].find_one({
            "$or": [
                {"appointmentId": a["id"]},
                {"patientId": patient_id, "date": a["date"], "doctorId": a["doctorId"]}
            ]
        })
        if presc:
            presc["id"] = str(presc["_id"])
            del presc["_id"]
        a["prescription"] = presc
        
        # Add Doctor Name for History
        doc = await db["users"].find_one({"employeeId": a["doctorId"]}, {"name": 1})
        a["doctorName"] = doc["name"] if doc else "Specialist"
        
        # Check for existing feedback
        feedback = await db["feedbacks"].find_one({"appointmentId": a["id"]})
        a["hasFeedback"] = bool(feedback)
    return appointments

async def get_doctor_dashboard(doctor_id: str, date: str):
    db = get_database()
    
    # Dashboard: pending requests
    pending = await db["appointments"].find({
        "doctorId": doctor_id, 
        "date": date, 
        "status": "pending"
    }).sort("tokenNumber", 1).to_list(100)
    
    # Patient List: active consults
    active = await db["appointments"].find({
        "doctorId": doctor_id,
        "date": date,
        "status": "active"
    }).to_list(100)
    
    # History: completed consults
    completed = await db["appointments"].find({
        "doctorId": doctor_id,
        "date": date,
        "status": "completed"
    }).sort("tokenNumber", -1).to_list(100)
    
    for a in pending + active + completed:
        a["id"] = str(a["_id"])
        del a["_id"]
        
    return {"pending": pending, "active": active, "completed": completed}
async def get_active_token(doctor_id: str, date: str):
    db = get_database()
    # 1. First check if any patient is already "active"
    active = await db["appointments"].find_one(
        {"doctorId": doctor_id, "date": date, "appointmentType": "In-Person", "status": "active"}
    )
    if active:
        return {"activeToken": active.get("tokenNumber"), "patientId": active.get("patientId"), "status": "active"}
        
    # 2. Otherwise find the first "pending" patient for today
    next_patient = await db["appointments"].find_one(
        {"doctorId": doctor_id, "date": date, "appointmentType": "In-Person", "status": "pending"},
        sort=[("tokenNumber", 1)]
    )
    if not next_patient:
        return {"activeToken": "None", "message": "No pending offline patients"}
    return {"activeToken": next_patient.get("tokenNumber"), "patientId": next_patient.get("patientId"), "status": "pending"}

async def initiate_appointment(appointment_id: str):
    db = get_database()
    
    appt = await db["appointments"].find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        return {"status": "error", "message": "Appointment not found"}
        
    doctor_id = appt["doctorId"]
    
    # 🔒 Privacy/Workflow Guard: Enforce strict "finish one before starting another"
    existing_active = await db["appointments"].find_one({"doctorId": doctor_id, "status": "active"})
    if existing_active:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="You must complete your active consultation before initiating another.")
    
    # Set status to active
    await db["appointments"].update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "active"}}
    )
    
    # Send "Join Now" notification if virtual
    if appt.get("appointmentType") == "Virtual":
        from utils.email_utils import send_email_notification
        import asyncio
        html_msg = f"""
        <h2>Your Doctor is Ready!</h2>
        <p>Doctor {doctor_id} has initiated your virtual consultation.</p>
        <p>Please click the link below to enter the secure room immediately. <strong style="color: #10b981;">(No authentication required)</strong></p>
        <h2><a href='{appt.get("meetingLink")}'>Click Here to Join Call</a></h2>
        """
        asyncio.create_task(asyncio.to_thread(
            send_email_notification,
            to_email="patient@example.com",
            subject=f"URGENT: Join Your Virtual Consultation Now",
            html_message=html_msg
        ))
        
    return {"status": "success"}
async def get_queue_wait_time(doctor_id: str, my_token: str, date: str):
    db = get_database()
    active_res = await get_active_token(doctor_id, date)
    active_token = active_res.get("activeToken")
    
    # 1. Fetch user's appointment to get their slot
    my_appt = await db["appointments"].find_one({"doctorId": doctor_id, "date": date, "tokenNumber": my_token})
    if not my_appt:
        return {"activeToken": active_token or "Waiting", "estimatedWait": "N/A"}

    # 2. Logic: Slot Start Time + Current Time Offset
    try:
        from datetime import datetime
        now = datetime.now()
        slot_start_str = my_appt["timeSlot"].split(" - ")[0] # e.g. "10:00"
        slot_hour = int(slot_start_str.split(":")[0])
        slot_min = int(slot_start_str.split(":")[1])
        
        # Calculate minutes until slot starts
        slot_start_total_mins = (slot_hour * 60) + slot_min
        now_total_mins = (now.hour * 60) + now.minute
        
        time_until_slot = max(0, slot_start_total_mins - now_total_mins)
        
        # 3. Queue Position Buffer
        # If activeToken is None, assume no one before patient
        if not active_token or active_token == "None":
            return {"activeToken": "Waiting", "estimatedWait": time_until_slot}
            
        current_num = int(active_token.replace("A", ""))
        my_num = int(my_token.replace("A", ""))
        diff = my_num - current_num
        
        if diff < 0: return {"activeToken": active_token, "estimatedWait": 0}
        
        # Total = Time until slot + (patients ahead * 15 mins)
        total_wait = time_until_slot + (diff * 15)
        return {"activeToken": active_token, "estimatedWait": total_wait}
    except Exception as e:
        print(f"Wait Time Error: {e}")
        return {"activeToken": active_token or "Syncing", "estimatedWait": "Calc Error"}

async def get_doctor_patients(doctor_id: str):
    db = get_database()
    # Find all unique patients who have booked with this doctor
    patient_ids = await db["appointments"].distinct("patientId", {"doctorId": doctor_id})
    
    # Fetch full citizen profiles for these IDs
    patients = await db["users"].find({"medicalId": {"$in": patient_ids}}).to_list(100)
    
    result = []
    for p in patients:
        # Get last consult date from appointments
        last_appt = await db["appointments"].find_one(
            {"doctorId": doctor_id, "patientId": p["medicalId"]},
            sort=[("date", -1)]
        )
        result.append({
            "id": p["medicalId"],
            "name": p["name"],
            "age": 2026 - int(p["dob"].split("-")[0]) if "dob" in p else "N/A",
            "gender": p.get("gender", "N/A"),
            "lastVisit": last_appt["date"] if last_appt else "Never",
            "risk": "Low" # Default for demo
        })
    return result

async def get_appointment_counts(doctor_id: str, month_year: str):
    """
    month_year: "YYYY-MM"
    Returns: {"2026-03-01": 5, "2026-03-02": 2, ...}
    """
    db = get_database()
    # MongoDB regex match for the date field
    pipeline = [
        {"$match": {"doctorId": doctor_id, "date": {"$regex": f"^{month_year}"}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}}
    ]
    cursor = db["appointments"].aggregate(pipeline)
    counts = {}
    async for doc in cursor:
        counts[doc["_id"]] = doc["count"]
    return counts
