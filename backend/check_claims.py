import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.smart_health_system
    docs = await db.insurance_claims.find().to_list(100)
    for doc in docs:
        print(f"[{doc.get('status')}] Patient: {doc.get('patient_id')} Amount: {doc.get('claim_amount')}")

asyncio.run(main())
