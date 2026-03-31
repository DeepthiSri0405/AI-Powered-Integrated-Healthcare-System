import asyncio
import sys
import os
sys.path.append(os.getcwd())
from config.db import get_database

async def run():
    db = get_database()
    await db["insurance_claims"].delete_many({})
    print("Purged insurance claims")

asyncio.run(run())
