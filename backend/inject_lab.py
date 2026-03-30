import asyncio
import os
import sys
sys.path.append(os.path.dirname(__file__))

from config.db import get_database
from utils.validators import get_password_hash
from datetime import datetime

async def inject():
    db = get_database()
    pw = get_password_hash("password123")
    op = {"name": "Lab Tech V", "role": "LabOperator", "employeeId": "LAB-4444", "created_at": datetime.utcnow(), "password": pw}
    await db["users"].update_one({"employeeId": "LAB-4444"}, {"$set": op}, upsert=True)
    print("SUCCESS: Injected LAB-4444")

asyncio.run(inject())
