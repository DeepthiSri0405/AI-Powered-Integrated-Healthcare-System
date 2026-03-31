import asyncio
import sys
import os
sys.path.append(os.getcwd())
from config.db import get_database

async def run():
    db = get_database()
    claims = await db["insurance_claims"].find({}, {"documents_url": 0, "extracted_data": 0}).to_list(100)
    for c in claims:
        print(c)

asyncio.run(run())
