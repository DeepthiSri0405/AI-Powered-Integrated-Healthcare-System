import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.doctorService import get_doctor_slots
from config.db import get_database

async def test():
    db = get_database()
    # Find any doctor
    doc = await db["users"].find_one({"role": "Doctor"})
    if not doc:
        print("No doctor found")
        return
    
    doc_id = doc["employeeId"]
    date = "2026-03-30" # Tomorrow
    slots = await get_doctor_slots(doc_id, date)
    print(f"Doctor: {doc['name']} ({doc_id})")
    print(f"Date: {date}")
    print(f"Slots: {slots}")

if __name__ == "__main__":
    asyncio.run(test())
