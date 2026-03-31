import asyncio
from config.db import get_database

async def check_db():
    db = get_database()
    users = await db["users"].find({}).to_list(100)
    for u in users:
        print("Role:", u.get("role"), "ID:", u.get("employeeId") or u.get("medicalId"), "pass:", bool(u.get("password")))
    cit = await db["users"].find_one({"medicalId": "CIT555"})
    doc = await db["users"].find_one({"employeeId": "DOC777"})
    print("CIT555 exists:", bool(cit))
    print("DOC777 exists:", bool(doc))

asyncio.run(check_db())
