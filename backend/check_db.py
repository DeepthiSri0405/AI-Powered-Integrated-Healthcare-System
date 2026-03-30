import asyncio
from config.db import get_database

async def check():
    db = get_database()
    hospitals = await db["hospitals"].find().to_list(100)
    print(f"Total hospitals in DB: {len(hospitals)}")
    for h in hospitals:
        print(f"ID: {h.get('_id')} | Name: {h.get('name')} | isDemo: {h.get('isDemo')}")

if __name__ == "__main__":
    asyncio.run(check())
