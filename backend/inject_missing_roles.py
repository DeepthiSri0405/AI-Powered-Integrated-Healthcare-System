import asyncio
import datetime
from config.db import get_database
from utils.validators import get_password_hash
from bson import ObjectId

async def inject_missing_roles():
    db = get_database()
    
    password = get_password_hash("password123")
    
    # Check and insert Lab Tech
    lab_tech = await db["users"].find_one({"employeeId": "LAB-4444"})
    if not lab_tech:
        await db["users"].insert_one({
            "name": "Lab Tech V",
            "role": "LabOperator",
            "employeeId": "LAB-4444",
            "password": password,
            "created_at": datetime.datetime.utcnow()
        })
        print("✅ Injected Lab Tech: LAB-4444 with password123")
    
    # Check and insert Ward Staff
    ward_staff = await db["users"].find_one({"employeeId": "WRD-7777"})
    if not ward_staff:
        await db["users"].insert_one({
            "name": "Ward Nurse A",
            "role": "WardStaff",
            "employeeId": "WRD-7777",
            "password": password,
            "created_at": datetime.datetime.utcnow()
        })
        print("✅ Injected Ward Staff: WRD-7777 with password123")
        
    # Check and insert Ward Room (Terminal)
    # The ward room identifier must start with WARD-
    ward_room = await db["ward_rooms"].find_one({"wardId": "WARD-1"})
    # Find a hospital to attach to
    demo_hospital = await db["hospitals"].find_one({"isDemo": True})
    hospital_id = str(demo_hospital["_id"]) if demo_hospital else str(ObjectId())

    if not ward_room:
        await db["ward_rooms"].insert_one({
            "wardId": "WARD-1",
            "wardName": "Intensive Care Unit (ICU)",
            "hospitalId": hospital_id,
            "password": password,
            "capacity": 3,
            "beds": [
                {"bedId": "W1-B1", "status": "Empty", "patientId": None},
                {"bedId": "W1-B2", "status": "Empty", "patientId": None},
                {"bedId": "W1-B3", "status": "Empty", "patientId": None}
            ],
            "shiftNotes": "System initialized.",
            "created_at": datetime.datetime.utcnow()
        })
        print("✅ Injected Ward Room: WARD-1 with password123")

if __name__ == "__main__":
    asyncio.run(inject_missing_roles())
