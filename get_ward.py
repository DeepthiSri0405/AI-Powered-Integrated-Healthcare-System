import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from config.db import get_database

async def get_ward_staff():
    db = get_database()
    # Find anyone whose role contains "ward" (case-insensitive) or "WardStaff" or "Ward"
    ward_staff = await db["users"].find({"role": {"$regex": "ward", "$options": "i"}}).to_list(100)
    print("\n--- Ward Staff in DB ---")
    if not ward_staff:
        print("No Ward Staff found.")
    for w in ward_staff:
        print(f"Name: {w.get('name')}")
        print(f"Role: {w.get('role')}")
        print(f"Employee ID / Medical ID: {w.get('employeeId', w.get('medicalId'))}")
        print("----------------------")

asyncio.run(get_ward_staff())
