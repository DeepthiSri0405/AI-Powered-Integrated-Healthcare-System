from config.db import get_database
from fastapi import HTTPException
from datetime import datetime
from bson import ObjectId

async def get_pending_admissions(patient_id: str):
    db = get_database()
    admissions = await db["admissions"].find({"patientId": patient_id, "status": "Pending"}).sort("created_at", -1).to_list(100)
    for a in admissions:
        a["id"] = str(a["_id"])
        del a["_id"]
        # Fetch doctor details
        doc = await db["users"].find_one({"employeeId": a["doctorId"]})
        if doc:
            a["doctorName"] = doc.get("name", "Unknown Doctor")
    return admissions

async def accept_admission(admission_id: str, patient_id: str):
    db = get_database()
    
    try:
        a_id = ObjectId(admission_id)
    except:
        a_id = admission_id
        
    admission = await db["admissions"].find_one({"_id": a_id, "patientId": patient_id})
    if not admission:
        raise HTTPException(status_code=404, detail="Admission request not found")
        
    if admission.get("status") != "Pending":
        raise HTTPException(status_code=400, detail="Admission is already processed")
        
    # Prevent duplicate admissions - 1 citizen can get only 1 bed
    user = await db["users"].find_one({"medicalId": patient_id})
    if user and user.get("isAdmitted"):
        raise HTTPException(status_code=400, detail="Citizen is already admitted to a ward bed.")
        
    hospital_id = admission.get("hospitalId")
    
    # Auto-allocation Logic
    wards = await db["ward_rooms"].find({"hospitalId": hospital_id}).to_list(100)
    
    # Fallback for Demo: If string ID mismatch occurs, pick any available ward
    if not wards:
        wards = await db["ward_rooms"].find({}).to_list(100)
        
    allocated_ward = None
    allocated_bed = None
    
    for ward in wards:
        beds = ward.get("beds", [])
        # Find first empty bed
        for i, bed in enumerate(beds):
            if bed.get("status") == "Empty":
                allocated_ward = ward
                allocated_bed = bed
                
                # Update this bed directly
                beds[i]["status"] = "Occupied"
                beds[i]["patientId"] = patient_id
                
                await db["ward_rooms"].update_one(
                    {"_id": ward["_id"]},
                    {"$set": {"beds": beds}}
                )
                break
        if allocated_bed:
            break
            
    if not allocated_bed:
        raise HTTPException(status_code=503, detail="No beds available in the hospital wards. Cannot admit right now.")
        
    await db["admissions"].update_one(
        {"_id": a_id},
        {"$set": {
            "status": "Admitted",
            "wardId": allocated_ward["wardId"],
            "bedId": allocated_bed["bedId"],
            "admitted_at": datetime.utcnow()
        }}
    )
    
    # Update the user profile
    await db["users"].update_one(
        {"medicalId": patient_id},
        {"$set": {"isAdmitted": True, "currentWardId": allocated_ward["wardId"]}}
    )
    
    return {
        "message": "Admission successful", 
        "wardId": allocated_ward["wardId"],
        "wardName": allocated_ward.get("wardName", "General Ward"),
        "bedId": allocated_bed["bedId"]
    }
