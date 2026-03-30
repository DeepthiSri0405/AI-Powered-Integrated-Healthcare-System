from config.db import get_database
from utils.validators import get_password_hash, verify_password
from config.jwt import create_access_token
from utils.generateHealthId import generate_medical_id, generate_employee_id
from fastapi import HTTPException, status
import datetime

async def citizen_onboard_service(payload_dict: dict):
    db = get_database()
    aadhaarId = payload_dict.get("aadhaarId")
    
    # Check if citizen exists with this Aadhaar
    existing = await db["users"].find_one({"aadhaarId": aadhaarId, "role": "Citizen"})
    
    if existing:
        if not existing.get("medicalId"):
            medicalId = generate_medical_id()
            await db["users"].update_one(
                {"_id": existing["_id"]},
                {"$set": {"medicalId": medicalId}}
            )
            return {"medicalId": medicalId, "message": "Health ID generated for existing citizen."}
        return {"medicalId": existing["medicalId"], "message": "Health ID retrieved."}
    
    # Create a new citizen without password
    medicalId = generate_medical_id()
    new_citizen = {
        "name": payload_dict.get("name"),
        "dob": payload_dict.get("dob"),
        "aadhaarId": aadhaarId,
        "medicalId": medicalId,
        "role": "Citizen",
        "created_at": datetime.datetime.utcnow()
    }
    await db["users"].insert_one(new_citizen)
    return {"medicalId": medicalId, "message": "Citizen onboarded and Health ID generated."}

async def citizen_set_password_service(medicalId: str, aadhaarId: str, password: str):
    db = get_database()
    
    user = await db["users"].find_one({"medicalId": medicalId, "aadhaarId": aadhaarId, "role": "Citizen"})
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found or detail mismatch")
        
    hashed_pass = get_password_hash(password)
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_pass}}
    )
    return {"status": "success"}

async def worker_create_service(worker_data: dict):
    db = get_database()
    
    # Generate employee ID
    employeeId = generate_employee_id()
    while await db["users"].find_one({"employeeId": employeeId}):
        employeeId = generate_employee_id()
        
    hashed_pass = get_password_hash(worker_data["password"])
    
    new_worker = {
        "name": worker_data.get("name"),
        "role": worker_data.get("role"),
        "employeeId": employeeId,
        "password": hashed_pass,
        "created_at": datetime.datetime.utcnow()
    }
    
    await db["users"].insert_one(new_worker)
    return {"employeeId": employeeId, "role": worker_data.get("role")}

async def login_user(login_data: dict):
    db = get_database()
    identifier = login_data.get("identifier") 
    password = login_data.get("password")
    
    # Check for Shared Ward Room Terminal
    if identifier and identifier.startswith("WARD-"):
        ward = await db["ward_rooms"].find_one({"wardId": identifier})
        if not ward or not verify_password(password, ward["password"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Ward credentials")
            
        token = create_access_token(data={"sub": str(ward["_id"])})
        return {"access_token": token, "token_type": "bearer", "role": "WardRoom", "identifier": identifier, "name": f"Terminal: {identifier}"}
    
    # Standard Employee / Citizen Login Lookup
    user = await db["users"].find_one({"$or": [{"employeeId": identifier}, {"medicalId": identifier}]})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    if not user.get("password") or not verify_password(password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    # Create JWT token for active worker/citizen
    token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user.get("role"), 
        "identifier": identifier, 
        "name": user.get("name"),
        "isAdmitted": user.get("isAdmitted", False)
    }
