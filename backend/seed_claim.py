import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import json
import urllib.request
import os

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.smart_health_system

async def seed_claim():
    # Find John Doe 
    citizen = await db.users.find_one({"name": "John Doe"})
    if not citizen:
        print("CIT555 not found!")
        return
        
    print(f"Found citizen: {citizen['name']}")
    
    patient_id = citizen.get("medicalId") or citizen.get("identifier") or citizen.get("employeeId") or "CIT555"
    
    # Create an approved claim
    claim = {
        "patient_id": patient_id,
        "hospital_id": "SYS-HOSP-1",
        "policy_number": "POL-99887766",
        "insurance_provider": "Global Health Assurance",
        "documents_url": ["System Digital Record"],
        "claim_amount": 12500.0,
        "approved_amount": 12500.0,
        "extracted_data": {
            "patient_name": citizen["name"],
            "policy_number": "POL-99887766",
            "treatment": "Emergency Cardiac Evaluation",
            "bill_amount": 12500.0,
            "date": datetime.utcnow().strftime("%Y-%m-%d")
        },
        "fraud_score": 2.5,
        "status": "approved",
        "verified_by": "SYS-ADMIN-01",
        "remarks": "Claim perfectly matches native hospital prescription. Full disbursement authorized.",
        "created_at": datetime.utcnow()
    }
    
    res = await db.insurance_claims.insert_one(claim)
    claim_id = str(res.inserted_id)
    print(f"Inserted claim {claim_id}")
    
    # Create the alert for it
    alert_data = {
        "patientId": patient_id,
        "alertType": "InsuranceApproved",
        "message": f"Your Insurance Claim ({claim_id}) for $12500.00 was successfully APPROVED!",
        "severity": "Normal",
        "isRead": False,
        "created_at": datetime.utcnow()
    }
    
    await db.alerts.insert_one(alert_data)
    
    # Try WebSocket push
    try:
        req = urllib.request.Request(
            f"http://localhost:8000/api/realtime/test-push/{patient_id}", 
            data=json.dumps({"type": "NEW_ALERT", "alert": {**alert_data, "_id": str(alert_data["_id"]), "created_at": alert_data["created_at"].isoformat()}}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception as e:
        print(f"WS push error: {e}")
        
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_claim())
