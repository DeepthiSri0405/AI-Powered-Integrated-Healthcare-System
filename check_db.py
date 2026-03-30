import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from config.db import get_database

async def check():
    db = get_database()
    print("Doctor Schedules Collection:")
    cursor = db["doctor_schedules"].find({})
    async for s in cursor:
        print(f"Doc: {s.get('doctorId')}, Date: {s.get('date')}, Slots: {len(s.get('availableSlots', []))}")
        print(f"First few slots: {s.get('availableSlots', [])[:3]}")

if __name__ == "__main__":
    asyncio.run(check())
