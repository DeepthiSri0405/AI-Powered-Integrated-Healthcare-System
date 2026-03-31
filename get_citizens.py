import asyncio
import os
import sys

# Add backend directory to sys.path so config.db can be found
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from config.db import get_database

async def get_citizens():
    db = get_database()
    citizens = await db["users"].find({"role": "Citizen"}, {"name": 1, "medicalId": 1, "aadhaarId": 1, "autonomy_enabled": 1}).to_list(100)
    print("\n--- Citizens in DB ---")
    for c in citizens:
        print(f"Name: {c.get('name')}")
        print(f"Medical ID: {c.get('medicalId')}")
        print(f"Aadhaar ID: {c.get('aadhaarId')}")
        print(f"Autonomy Enabled: {c.get('autonomy_enabled')}")
        print("----------------------")

asyncio.run(get_citizens())
