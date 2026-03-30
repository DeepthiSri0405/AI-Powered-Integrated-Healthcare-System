import asyncio
import datetime
from config.db import get_database
from utils.validators import get_password_hash

async def clear_database():
    db = get_database()
    
    print("🧹 Wiping completely clean...")
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
    
    print("🏥 Bootstrapping Admin Foundation...")
    admin = {
        "name": "System Admin",
        "role": "Admin",
        "employeeId": "ADM001",
        "password": get_password_hash("Pass@123"),
        "created_at": datetime.datetime.utcnow()
    }
    await db["users"].insert_one(admin)
    
    # Needs at least one default facility to map doctors to
    hospital = {
        "name": "Apex Central Hospital",
        "address": "Downtown Tech District",
        "contactInfo": "+91 99999-00000",
        "location": {"type": "Point", "coordinates": [78.39, 17.54]},
        "isDemo": True # Required for the frontend to flag this as the default searchable UI
    }
    await db["hospitals"].insert_one(hospital)
    
    print("\n🚀 DATABASE PURGED SUCCESSFULLY.")
    print("✅ System securely reset to a blank slate.")
    print("➡️ Super Admin: ADM001 / Pass@123")
    print("ℹ️ You can now register Citizens naturally through the UI.")

if __name__ == "__main__":
    asyncio.run(clear_database())
