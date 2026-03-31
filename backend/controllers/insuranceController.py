from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from middleware.roleMiddleware import role_required
from config.db import get_database
from models.InsuranceClaim import InsuranceClaimModel
import base64
import requests
import json
import re
from datetime import datetime
from bson import ObjectId

router = APIRouter()

class NativeClaimRequest(BaseModel):
    prescription_id: str

async def process_claim_async(claim_id: str, b64_docs: list, policy_number: str, claim_amount: float, patient_id: str):
    db = get_database()
    
    # Step 2: FETCH DOCUMENTS (Passed directly via b64_docs in this case to avoid re-reading gridFS if not used)
    full_text = ""
    
    # Step 3: OCR - EXTRACT TEXT
    import httpx
    async with httpx.AsyncClient(timeout=10.0) as client:
        for b64 in b64_docs:
            try:
                # Send to ocr.space
                payload = {
                    'base64Image': b64,
                    'apikey': 'K84944842988957',
                    'language': 'eng'
                }
                res = await client.post('https://api.ocr.space/parse/image', data=payload)
                result = res.json()
                if not result.get('IsErroredOnProcessing'):
                    for parsed in result.get('ParsedResults', []):
                        full_text += parsed.get('ParsedText', '') + "\n"
            except Exception as e:
                print("OCR Error/Timeout:", e)

    # Convert raw text -> structured JSON
    # Fetch actual patient details from database
    patient = await db["users"].find_one({"$or": [{"medicalId": patient_id}, {"employeeId": patient_id}, {"aadhaarId": patient_id}]})
    patient_name = patient.get("name") if patient and "name" in patient else patient_id

    # Fallbacks 
    final_policy = policy_number
    extracted_bill_amount = claim_amount
    final_name = patient_name
    
    # Try Regex extractions from OCR text
    match_pol = re.search(r'POL-\d+', full_text, re.IGNORECASE)
    if match_pol:
        final_policy = match_pol.group(0).upper()
        
    match_amt = re.search(r'(?:USD|\$|Rs\.?|INR|\₹)\s*([\d,]+\.?\d*)', full_text, re.IGNORECASE)
    if match_amt:
        try:
            extracted_bill_amount = float(match_amt.group(1).replace(',', ''))
        except ValueError:
            pass
            
    # Fallback OCR regex to catch unstructured or heavily typo-ed numbers
    if extracted_bill_amount == claim_amount or extracted_bill_amount == 0.0:
        match_fallback = re.search(r'(?:Amount|Total|Bill|Cost|Oimpout|Amout|ompuot|sum|OiOmpuot)[\s:"]*([\d,]{2,}\.?\d*)', full_text, re.IGNORECASE)
        if match_fallback:
            try:
                extracted_bill_amount = float(match_fallback.group(1).replace(',', ''))
            except ValueError:
                pass
            
    match_name = re.search(r'(?:Patient Name|Patient|Name|patient-name)[\s:"]+([A-Za-z\s]+)', full_text, re.IGNORECASE)
    if match_name:
        possible_name = match_name.group(1).strip().replace('"', '').replace(',', '')
        if len(possible_name) > 3 and len(possible_name) < 30:
            final_name = possible_name
            
    # Smarter extractions for Treatment and Date
    treatment_fallback = "Medical Treatment"
    match_treatment = re.search(r'(?:treatment|diagnosis|surgery)[\"\'\s:]*([A-Za-z\s]+)', full_text, re.IGNORECASE)
    if match_treatment:
        possible_treatment = match_treatment.group(1).split("\"")[0].split("\\")[0].strip()
        if len(possible_treatment) > 3 and len(possible_treatment) < 40:
            treatment_fallback = possible_treatment
            
    final_date = datetime.utcnow().strftime("%Y-%m-%d")
    match_date = re.search(r'(?:date|Date)[\"\'\s:]*([\d]{4}-[\d]{2}-[\d]{2})', full_text)
    if match_date:
        final_date = match_date.group(1)

    # Force API Reload Flag: 4
    extracted_data = {
        "raw_text": full_text,
        "patient_name": final_name,
        "policy_number": final_policy,
        "treatment": treatment_fallback,
        "bill_amount": extracted_bill_amount,
        "date": final_date
    }

    claim_status = "pending"
    remarks = "System processed."
    fraud_score = 0.0

    # Step 5: POLICY VALIDATION
    # 1. Policy exists? (Assuming true for demo, can query a mock central server)
    policy_exists = True
    if not policy_exists:
        claim_status = "rejected"
        remarks = "Invalid policy"
    else:
        # Step 6: COVERAGE VALIDATION
        # Step 7: AMOUNT VALIDATION
        approved_amount = claim_amount
        policy_limit = 500000.0 # 5 Lakh limit
        
        if claim_amount > extracted_bill_amount:
            remarks += " | Flag: Amount mismatch"
            fraud_score += 0.3
            
        if claim_amount > policy_limit:
            approved_amount = policy_limit
            
        # Step 8: FRAUD DETECTION
        # Duplicate Claim check
        duplicate = await db["insurance_claims"].find_one({"policy_number": policy_number, "_id": {"$ne": ObjectId(claim_id)}})
        if duplicate:
            fraud_score += 0.4
            
        if "fraud" in full_text.lower() or "forged" in full_text.lower():
            fraud_score += 0.3
            
        # Step 9: DECIDE SYSTEM STATUS
        if claim_status != "rejected":
            if fraud_score > 0.7:
                claim_status = "under_review"
                remarks += " | High fraud probability"
            else:
                claim_status = "under_review" # Still goes to admin
        
        # Step 11: FINAL UPDATE
        update_data = {
            "policy_number": final_policy,
            "claim_amount": extracted_bill_amount,
            "extracted_data": extracted_data,
            "fraud_score": fraud_score * 100, # Converting to percentage 0-100
            "status": claim_status,
            "approved_amount": approved_amount,
            "remarks": remarks
        }
        
        await db["insurance_claims"].update_one(
            {"_id": ObjectId(claim_id)},
            {"$set": update_data}
        )
        
        # Step 12: NOTIFICATION (mock send)
        print(f"Claim {claim_id} processed. Status -> {claim_status}")


@router.post("/claims")
async def submit_claim(
    background_tasks: BackgroundTasks,
    patient_id: str = Form(...),
    hospital_id: str = Form("SYSTEM"),
    policy_number: str = Form("AI-TBD"),
    insurance_provider: str = Form("AI-TBD"), 
    claim_amount: float = Form(0.0),
    prescription_id: str = Form(None),
    document: UploadFile = File(None),
    documents: list[UploadFile] = File(default=[]),
    current_user: dict = Depends(role_required(["Citizen", "Doctor", "WardRoom", "Admin"]))
):
    db = get_database()
    
    # Merge single legacy document into documents list if present
    all_docs = documents or []
    if document:
        all_docs.append(document)
        
    documents_url = []
    b64_docs = []
    
    for doc in all_docs:
        contents = await doc.read()
        encoded_doc = base64.b64encode(contents).decode('utf-8')
        data_url = f"data:{doc.content_type};base64,{encoded_doc}"
        documents_url.append(data_url)
        b64_docs.append(data_url)
        
    # Validate prescription if provided
    if prescription_id:
        existing_claim = await db["insurance_claims"].find_one({"prescription_id": prescription_id})
        if existing_claim:
            raise HTTPException(status_code=400, detail="A claim has already been filed for this prescription")
            
        prescription = await db["prescriptions"].find_one({"_id": ObjectId(prescription_id)})
        if prescription:
            claim_amount = float(prescription.get("total_bill", claim_amount))

    claim = {
        "patient_id": patient_id,
        "hospital_id": hospital_id,
        "policy_number": policy_number,
        "insurance_provider": insurance_provider,
        "documents_url": documents_url,
        "claim_amount": claim_amount,
        "approved_amount": 0.0,
        "extracted_data": {},
        "fraud_score": 0.0,
        "status": "pending",
        "verified_by": None,
        "remarks": None,
        "created_at": datetime.utcnow()
    }
    
    if prescription_id:
         claim["prescription_id"] = prescription_id
    
    res = await db["insurance_claims"].insert_one(claim)
    claim_id_str = str(res.inserted_id)
    claim["id"] = claim_id_str
    del claim["_id"]
    
    # TRIGGER ASYNC JOB (Step 1)
    background_tasks.add_task(process_claim_async, claim_id_str, b64_docs, policy_number, claim_amount, patient_id)
    
    # Send Confirmation Link tracking alert
    from realtime.socket import manager
    alert_data = {
        "patientId": patient_id,
        "alertType": "InsuranceClaim",
        "message": f"Insurance claim submitted successfully! Confirmation/Tracking Link: /citizen/insurance?track={claim_id_str}",
        "severity": "Normal",
        "isRead": False,
        "created_at": datetime.utcnow()
    }
    try:
        res_alert = await db["alerts"].insert_one(alert_data)
        alert_data["_id"] = str(res_alert.inserted_id)
        alert_data["created_at"] = alert_data["created_at"].isoformat()
        await manager.send_personal_message(json.dumps({"type": "NEW_ALERT", "alert": alert_data}), patient_id)
    except:
        pass
    
    return {
        "message": "Claim submitted successfully. Background processing started.", 
        "claim": claim,
        "confirmation_link": f"/citizen/insurance?track={claim_id_str}"
    }

@router.post("/claims/native")
async def submit_native_claim(
    req: NativeClaimRequest,
    current_user: dict = Depends(role_required(["Citizen", "Doctor", "WardRoom", "Admin"]))
):
    db = get_database()
    
    # 1. Fetch prescription
    prescription = await db["prescriptions"].find_one({"_id": ObjectId(req.prescription_id)})
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    patient_id = prescription.get("patientId")
    cu_id = current_user.get("medicalId", current_user.get("aadhaarId", current_user.get("employeeId")))
    if current_user.get("role") == "Citizen" and cu_id != patient_id:
        raise HTTPException(status_code=403, detail="Cannot claim for another patient's bill")
        
    hospital_id = prescription.get("hospitalId", "UNKNOWN")
    claim_amount = float(prescription.get("total_bill", 0.0))
    diagnosis = prescription.get("diagnosis", "System Diagnosis")
    
    # Check if a claim already exists for this prescription (idempotency)
    existing_claim = await db["insurance_claims"].find_one({"prescription_id": req.prescription_id})
    if existing_claim:
        raise HTTPException(status_code=400, detail="A claim has already been filed for this prescription bill")
        
    patient = await db["users"].find_one({"$or": [{"medicalId": patient_id}, {"employeeId": patient_id}, {"aadhaarId": patient_id}]})
    patient_name = patient.get("name") if patient and "name" in patient else patient_id
    
    # Pre-extract data perfectly (Zero fraud Native source)
    extracted_data = {
        "raw_text": f"Native Digital Prescription [{req.prescription_id}] via Dr. {prescription.get('doctorId')}",
        "patient_name": patient_name,
        "policy_number": "NATIVE-SHS-ACC",
        "treatment": diagnosis,
        "bill_amount": claim_amount,
        "date": datetime.utcnow().strftime("%Y-%m-%d")
    }
    
    claim = {
        "patient_id": patient_id,
        "hospital_id": hospital_id,
        "prescription_id": req.prescription_id,
        "policy_number": "NATIVE-SHS-ACC",
        "insurance_provider": "SHS Internal Auto-Claim",
        "documents_url": ["System Digital Record"],
        "claim_amount": claim_amount,
        "extracted_data": extracted_data,
        "fraud_score": 0.0,
        "status": "under_review", # Skips 'pending' OCR entirely
        "approved_amount": 0.0,
        "verified_by": None,
        "remarks": "100% Verified Native Digital Document",
        "created_at": datetime.utcnow()
    }
    
    res = await db["insurance_claims"].insert_one(claim)
    claim_id_str = str(res.inserted_id)
    claim["id"] = claim_id_str
    del claim["_id"]
    
    # Send Confirmation Link tracking alert
    from realtime.socket import manager
    alert_data = {
        "patientId": patient_id,
        "alertType": "InsuranceClaim",
        "message": f"Native Digital Insurance claim submitted! Confirmation/Tracking Link: /citizen/insurance?track={claim_id_str}",
        "severity": "Normal",
        "isRead": False,
        "created_at": datetime.utcnow()
    }
    try:
        res_alert = await db["alerts"].insert_one(alert_data)
        alert_data["_id"] = str(res_alert.inserted_id)
        alert_data["created_at"] = alert_data["created_at"].isoformat()
        await manager.send_personal_message(json.dumps({"type": "NEW_ALERT", "alert": alert_data}), patient_id)
    except:
        pass
    
    return {
        "message": "Native insurance claim submitted perfectly.", 
        "claim": claim,
        "confirmation_link": f"/citizen/insurance?track={claim_id_str}"
    }

@router.get("/claims")
async def list_claims(status: str = "all", current_user: dict = Depends(role_required(["Admin", "HealthOfficer", "Citizen", "Doctor", "WardRoom"]))):
    db = get_database()
    query = {}
    
    # If the user is a Citizen, restrict claims to ONLY their identifier
    if current_user.get("role") in ["Citizen", "Doctor", "WardRoom"]:
        query["patient_id"] = current_user.get("identifier")
        
    if status != "all":
        query["status"] = status
        
    claims = await db["insurance_claims"].find(query).sort("created_at", -1).to_list(100)
    for c in claims:
        c["id"] = str(c["_id"])
        del c["_id"]
        
        # Resolve patient name for true representation in Admin Dashboard
        patient_id = c.get("patient_id")
        if patient_id:
            patient = await db["users"].find_one({"$or": [{"medicalId": patient_id}, {"employeeId": patient_id}, {"aadhaarId": patient_id}]})
            if patient and "name" in patient:
                c["patient_name"] = patient["name"]
            else:
                c["patient_name"] = patient_id
        else:
            c["patient_name"] = "Unknown Citizen"
            
    return claims

@router.patch("/claims/{claim_id}")
async def review_claim(
    claim_id: str, 
    payload: dict, 
    current_user: dict = Depends(role_required(["Admin", "HealthOfficer"]))
):
    # Step 10: ADMIN REVIEW STAGE
    db = get_database()
    new_status = payload.get("status")
    if new_status not in ["approved", "rejected", "pending", "under_review"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
        
    admin_id = current_user.get("identifier", "ADMIN")
    
    claim = await db["insurance_claims"].find_one({"_id": ObjectId(claim_id)})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    update_data = {
        "status": new_status, 
        "verified_by": admin_id if new_status == "approved" else None
    }
    
    if "remarks" in payload:
        update_data["remarks"] = payload["remarks"]
        
    if "approved_amount" in payload:
        update_data["approved_amount"] = float(payload["approved_amount"])
        
    result = await db["insurance_claims"].update_one(
        {"_id": ObjectId(claim_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made to claim status.")
        
    # Send Real-Time Alert to Patient on Approval
    if new_status == "approved":
        patient_id = claim.get("patient_id")
        if patient_id:
            from realtime.socket import manager
            alert_msg = f"Your Insurance Claim ({claim_id}) was successfully APPROVED!"
            if "approved_amount" in payload:
                alert_msg += f" Disbursed Amount: ${float(payload['approved_amount']):.2f}."
                
            alert_data = {
                "patientId": patient_id,
                "alertType": "InsuranceApproved",
                "message": alert_msg,
                "severity": "Normal",
                "isRead": False,
                "created_at": datetime.utcnow()
            }
            try:
                res_alert = await db["alerts"].insert_one(alert_data)
                alert_data["_id"] = str(res_alert.inserted_id)
                alert_data["created_at"] = alert_data["created_at"].isoformat()
                await manager.send_personal_message(json.dumps({"type": "NEW_ALERT", "alert": alert_data}), patient_id)
            except:
                pass
        
    return {"message": f"Claim {new_status} successfully"}
