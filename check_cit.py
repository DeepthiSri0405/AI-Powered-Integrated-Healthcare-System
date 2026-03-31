import asyncio
import os
import sys

# Add backend directory to sys.path so config.db can be found
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from config.db import get_database

async def check_cit555():
    db = get_database()
    c = await db["users"].find_one({"medicalId": "CIT555"})
    if c:
        print("CIT555 found in DB!")
    else:
        print("CIT555 NOT found in DB. It was likely wiped out by another seeding script.")
        
asyncio.run(check_cit555())
