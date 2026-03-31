import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from config.db import get_database

async def get_doctors():
    db = get_database()
    doctors = await db["users"].find({"role": "Doctor"}, {"name": 1, "employeeId": 1, "specialty": 1}).to_list(100)
    print("\n--- Doctors in DB ---")
    for d in doctors:
        print(f"Name: {d.get('name')}")
        print(f"Employee ID: {d.get('employeeId')}")
        print(f"Specialty: {d.get('specialty')}")
        print("----------------------")

asyncio.run(get_doctors())
