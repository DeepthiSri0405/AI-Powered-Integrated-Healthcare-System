from config.db import get_database
from models.Dependent import DependentModel
from utils.generateHealthId import generate_medical_id
from datetime import datetime

from services.documentIntelligenceService import validate_birth_certificate

async def link_child_service(guardian_id: str, payload_dict: dict, proof_url: str, file_bytes: bytes = None):
    db = get_database()
    
    # 💥 Launch the Advanced OpenCV & Tesseract Birth Certificate Verification Pipeline
    verification_data = {
        "trustScore": 0, 
        "status": "Pending Verification", 
        "details": {"error": "No file uploaded for CV processing"}
    }
    
    if file_bytes:
        verification_data = await validate_birth_certificate(
            image_bytes=file_bytes, 
            expected_name=payload_dict["patientName"], 
            expected_dob=payload_dict["dob"], 
            guardian_id=guardian_id
        )
        
    # 1. Generate a new medical ID for the child since they don't have Aadhaar
    new_medical_id = generate_medical_id()
    
    # 2. Add Child to Users table as "Guardian-Controlled Minor" (Citizen role implicitly)
    child_user = {
        "name": payload_dict["patientName"],
        "role": "Citizen",
        "medicalId": new_medical_id,
        "guardianIds": [guardian_id],
        "created_at": datetime.utcnow()
    }
    await db["users"].insert_one(child_user)
    
    # 3. Create the Formal Dependent Link
    dependent = DependentModel(
        guardianId=guardian_id,
        dependentType="Child",
        verificationStatus=verification_data["status"], 
        patientName=payload_dict["patientName"],
        dob=payload_dict["dob"],
        relationship=payload_dict["relationship"],
        medicalId=new_medical_id,
        proofUrl=proof_url,
        consentStatus="Not Required",
        trustScore=verification_data["trustScore"],
        verificationMetadata=verification_data["details"]
    )
    
    result = await db["dependents"].insert_one(dependent.model_dump())
    return {"message": "Child successfully linked and Medical ID generated", "medicalId": new_medical_id}


async def link_elderly_mobile_service(guardian_id: str, payload_dict: dict):
    db = get_database()
    # We assume the elderly person already has a Medical ID in the system for this flow
    medical_id = payload_dict.get("medicalId")
    
    dependent = DependentModel(
        guardianId=guardian_id,
        dependentType="Elderly",
        verificationStatus="Pending Verification", # Mobile means pending OTP consent
        patientName=payload_dict["patientName"],
        dob=payload_dict["dob"],
        relationship=payload_dict["relationship"],
        medicalId=medical_id,
        consentStatus="Pending"
    )
    
    result = await db["dependents"].insert_one(dependent.model_dump())
    
    # MOCK OTP LOGIC - In real life we trigger an SMS API here
    print(f"--> Mock OTP sent to mobile {payload_dict.get('mobileNumber')} for consent.")
    return {"message": "OTP sent to elderly citizen. Link pending consent."}


async def link_elderly_assisted_service(guardian_id: str, payload_dict: dict, proof_url: str):
    db = get_database()
    # E.g. manual verification by an admin checking the ID proof 
    
    dependent = DependentModel(
        guardianId=guardian_id,
        dependentType="Elderly",
        verificationStatus="Pending Verification", # Admin must manually approve this
        patientName=payload_dict["patientName"],
        dob=payload_dict["dob"],
        relationship=payload_dict["relationship"],
        medicalId=payload_dict.get("medicalId"),
        proofUrl=proof_url,
        consentStatus="Not Required" # Handled by ID check
    )
    
    result = await db["dependents"].insert_one(dependent.model_dump())
    return {"message": "Elderly assisted link created. Awaiting admin verification of ID."}

async def get_linked_dependents(guardian_id: str):
    db = get_database()
    deps = await db["dependents"].find({"guardianId": guardian_id}).to_list(100)
    for d in deps:
        d["id"] = str(d["_id"])
        del d["_id"]
    return deps

