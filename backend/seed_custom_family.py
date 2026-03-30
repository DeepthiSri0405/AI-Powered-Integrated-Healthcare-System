import asyncio
import datetime
from config.db import get_database
from utils.validators import get_password_hash

async def seed_custom_family():
    db = get_database()
    
    print("🧹 Cleaning specifically for Custom Setup...")
    # Optional wipe depending on state, but we'll assume we want to clear previous ones first
    await db["users"].delete_many({"role": {"$ne": "Admin"}})
    await db["doctor_schedules"].delete_many({})
    
    print("👨‍⚕️ Restoring Doctors to Apex Central Hospital...")
    hospital = await db["hospitals"].find_one({"isDemo": True})
    hospital_id = str(hospital["_id"]) if hospital else "HOSP-001"
    
    doctors = [
        {"name": "Dr. Emily Chen", "role": "Doctor", "employeeId": "DOC777", "specialty": "Cardiology", "experience": "15 Years", "hospitalId": hospital_id, "password": get_password_hash("Pass@123"), "averageRating": 4.8, "totalReviews": 120, "created_at": datetime.datetime.utcnow()},
        {"name": "Dr. Marcus Thorne", "role": "Doctor", "employeeId": "DOC888", "specialty": "Pediatrics", "experience": "10 Years", "hospitalId": hospital_id, "password": get_password_hash("Pass@123"), "averageRating": 4.9, "totalReviews": 85, "created_at": datetime.datetime.utcnow()}
    ]
    await db["users"].insert_many(doctors)
    
    for doc in doctors:
        await db["doctor_schedules"].insert_one({
            "doctorId": doc["employeeId"],
            "hospitalId": hospital_id,
            "shiftType": "Morning",
            "timeRange": "09:00 AM - 01:00 PM"
        })

    print("👨‍👩‍👧 Creating Individual Citizens as requested...")
    citizens = [
        {
            "name": "Sadanandam",
            "medicalId": "CIT-SADAN",
            "aadhaarId": "111111111111",
            "role": "Citizen",
            "gender": "Male",
            "dob": "1979-05-16",
            "husband_father_name": "Krushnaiah",
            "password": get_password_hash("Pass@123"),
            "is_adult": True,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Deepthi",
            "medicalId": "CIT-DEEP",
            "aadhaarId": "222222222222",
            "role": "Citizen",
            "gender": "Female",
            "dob": "2005-05-04",
            "husband_father_name": "Sadanandam",
            "password": get_password_hash("Pass@123"),
            "is_adult": True, 
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Krushnaiah",
            "medicalId": "CIT-KRUSH",
            "aadhaarId": "333333333333",
            "role": "Citizen",
            "gender": "Male",
            "dob": "1949-05-16",
            "husband_father_name": "John",
            "password": get_password_hash("Pass@123"),
            "is_adult": True,
            "created_at": datetime.datetime.utcnow()
        }
    ]
    await db["users"].insert_many(citizens)
    
    print("\n✅ Custom Seed successfully injected!")
    print("➡️ Sadanandam, Deepthi, Krushnaiah are now independent individuals.")
    print("➡️ Appointments section fixed: DOC777 & DOC888 active.")

if __name__ == "__main__":
    asyncio.run(seed_custom_family())
