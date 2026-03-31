import asyncio
from config.db import get_database
from utils.validators import get_password_hash
import datetime

async def seed_production():
    db = get_database()
    
    # 🧹 Purge all demo/mock data
    print("🧹 Purging existing collections...")
    await db["users"].delete_many({})
    await db["ward_rooms"].delete_many({})
    await db["hospitals"].delete_many({})
    await db["families"].delete_many({})
    await db["family_members"].delete_many({})
    await db["access_controls"].delete_many({})
    await db["appointments"].delete_many({})
    await db["reports"].delete_many({})
    await db["doctor_schedules"].delete_many({})
    await db["prescriptions"].delete_many({})
    await db["reminders"].delete_many({})
    
    # 🏥 Seed Primary Demo Hospital
    hospital = {
        "name": "🏥 SmartHealth Hub (Demo)",
        "address": "Hi-Tech City, Hyderabad",
        "contactInfo": "+91 99999-00000",
        "location": {"type": "Point", "coordinates": [78.39, 17.54]},
        "isDemo": True
    }
    h_result = await db["hospitals"].insert_one(hospital)
    hospital_id = str(h_result.inserted_id)
    print(f"✅ Seeded Hospital: {hospital['name']}")

    # 🔑 Default Password for Demo
    hashed_pass = get_password_hash("Pass@123")
    
    # 👥 Seed Specific Personas
    users = [
        {
            "name": "Dr. Richard Webber",
            "role": "HealthOfficer",
            "employeeId": "PHO001",
            "password": hashed_pass,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "System Admin",
            "role": "Admin",
            "employeeId": "ADM001",
            "password": hashed_pass,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Dr. Sarah Mitchell",
            "role": "Doctor",
            "employeeId": "DOC777",
            "password": hashed_pass,
            "specialty": "Cardiology",
            "experience": "12 Years",
            "bio": "Expert in cardiovascular intervention and high blood pressure management.",
            "hospitalId": hospital_id,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Dr. James Wilson",
            "role": "Doctor",
            "employeeId": "DOC888",
            "password": hashed_pass,
            "specialty": "Pediatrics",
            "experience": "8 Years",
            "bio": "Specializes in neonatal care and childhood infectious diseases.",
            "hospitalId": hospital_id,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Dr. Elena Gilbert",
            "role": "Doctor",
            "employeeId": "DOC999",
            "password": hashed_pass,
            "specialty": "General Medicine",
            "experience": "10 Years",
            "bio": "Compassionate physician focusing on chronic disease prevention and family wellness.",
            "hospitalId": hospital_id,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "John Doe",
            "role": "Citizen",
            "medicalId": "CIT555",
            "aadhaarId": "123456789012",
            "dob": "2004-05-15",
            "age": 20,
            "is_adult": True,
            "autonomy_enabled": False,
            "password": hashed_pass,
            "isAdmitted": False,
            "created_at": datetime.datetime.utcnow()
        },
        {
            "name": "Sarah Doe",
            "role": "Citizen",
            "medicalId": "CIT444",
            "aadhaarId": "123456789013",
            "dob": "1975-08-20",
            "age": 49,
            "is_adult": True,
            "autonomy_enabled": True,
            "password": hashed_pass,
            "isAdmitted": False,
            "created_at": datetime.datetime.utcnow()
        }
    ]
    await db["users"].insert_many(users)
    print("✅ Seeded Admin, Doctors, and Citizens (CIT555, CIT444).")

    # 👨‍👩‍👦 Seed Hybrid Family System
    family = {
        "name": "The Doe Family",
        "created_at": datetime.datetime.utcnow()
    }
    fam_res = await db["families"].insert_one(family)
    fam_id = str(fam_res.inserted_id)

    await db["family_members"].insert_many([
        {
            "family_id": fam_id,
            "user_id": "CIT444",
            "role": "Admin",
            "relationship": "Mother",
            "status": "active",
            "joined_at": datetime.datetime.utcnow()
        },
        {
            "family_id": fam_id,
            "user_id": "CIT555",
            "role": "Dependent",
            "relationship": "Son",
            "status": "active",
            "joined_at": datetime.datetime.utcnow()
        }
    ])
    
    await db["access_controls"].insert_one({
        "owner_user_id": "CIT555",
        "access_user_id": "CIT444",
        "permission_type": "edit",
        "is_revoked": False,
        "created_at": datetime.datetime.utcnow()
    })
    print("✅ Seeded Hybrid Family Hub structure.")

    # 📅 Seed Doctor Schedules for Today & Tomorrow
    today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    tomorrow = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Standard slots based on USER rule: 8-7 (Offline: 8-3, Virtual: 4-7) with 1-hour intervals
    standard_slots = [
        "08:00 - 09:00", 
        "10:00 - 11:00", "11:00 - 12:00", 
        "13:00 - 14:00", "14:00 - 15:00",
        "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00"
    ]
    
    schedules = []
    for doc_id in ["DOC777", "DOC888", "DOC999"]:
        for d in [today, tomorrow]:
            schedules.append({
                "doctorId": doc_id,
                "date": d,
                "availableSlots": standard_slots.copy(),
                "hospitalId": hospital_id
            })
    
    await db["doctor_schedules"].insert_many(schedules)
    print(f"✅ Seeded {len(schedules)} Doctor Schedules with dynamic slots.")

    # 💊 Seed Initial Prescription for Demo
    prescriptions = [
        {
            "patientId": "CIT555",
            "doctorId": "DOC777",
            "date": datetime.datetime.utcnow().strftime('%Y-%m-%d'),
            "medications": ["Atorvastatin 20mg", "Aspirin 75mg"],
            "status": "Active"
        }
    ]
    await db["prescriptions"].insert_many(prescriptions)
    print("✅ Seeded Active Medication for John Doe.")

    # ⏰ Seed Initial Reminders
    reminders = [
        {
            "userId": "CIT555",
            "title": "Stay Hydrated",
            "time": "Every 2 Hours",
            "type": "Health"
        }
    ]
    await db["reminders"].insert_many(reminders)
    print("✅ Seeded Live Reminders.")

    print("\n🚀 FINAL DEMO CREDENTIALS (Password: Pass@123):")
    print(" - Public Health Officer: PHO001")
    print(" - Admin: ADM001")
    print(" - Doctors: DOC777, DOC888, DOC999")
    print(" - Citizen: CIT555")

if __name__ == "__main__":
    asyncio.run(seed_production())
