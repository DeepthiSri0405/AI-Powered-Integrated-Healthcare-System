from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from middleware.authMiddleware import get_current_user

router = APIRouter()

@router.get("/details")
async def get_family_details(current_user: dict = Depends(get_current_user)):
    from services.familyService import get_user_family_details
    # Use medicalId for Citizens
    identifier = current_user.get("medicalId") or current_user.get("employeeId")
    details = await get_user_family_details(identifier)
    return {"family": details}

@router.post("/autonomy/leave")
async def leave_family(current_user: dict = Depends(get_current_user)):
    from services.familyService import process_leave_family
    identifier = current_user.get("medicalId") or current_user.get("employeeId")
    
    # Check age restriction from JWT payload or DB
    from config.db import get_database
    db = get_database()
    user_doc = await db["users"].find_one({"medicalId": identifier})
    
    if not user_doc or not user_doc.get("is_adult"):
        raise HTTPException(status_code=403, detail="System Blocked: Must be 18 or older to independently detach from Guardian access.")
    
    result = await process_leave_family(identifier)
    return result

@router.post("/autonomy/restrict")
async def restrict_family_access(current_user: dict = Depends(get_current_user)):
    from services.familyService import process_restrict_access
    identifier = current_user.get("medicalId") or current_user.get("employeeId")
    
    from config.db import get_database
    db = get_database()
    user_doc = await db["users"].find_one({"medicalId": identifier})
    
    if not user_doc or not user_doc.get("is_adult"):
        raise HTTPException(status_code=403, detail="System Blocked: Must be 18 or older to restrict Guardian access.")
    
    result = await process_restrict_access(identifier)
    return result

@router.post("/add-dependent")
async def add_dependent_endpoint(
    name: str = Form(...),
    dob: str = Form(...),
    relationship: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    from utils.cv_utils import detect_image_morphing
    from services.familyService import add_new_dependent
    
    contents = await file.read()
    analysis = detect_image_morphing(contents)
    
    if analysis.get("status") != "Verified":
        raise HTTPException(status_code=400, detail=f"AI Rejection: Document morphed or unreadable. Trust Score: {analysis.get('trustScore', 0)}%")
        
    extracted_text = analysis.get("extracted_text", "")
    import re
    
    # Strip all whitespace and special chars for ultra-resilient matching
    text_clean = re.sub(r'[\s\W_]+', '', extracted_text.upper())
    
    # Secure Hierarchy Validation ONLY
    current_user_name = current_user.get("name", "").upper()
    current_name_clean = re.sub(r'[\s\W_]+', '', current_user_name)
    
    if relationship == "Child":
        # Ensure the Parent's name (the uploader) is natively embedded in the child's Aadhaar text!
        if current_name_clean and current_name_clean not in text_clean:
            raise HTTPException(status_code=403, detail=f"Hierarchy Violation: Parent '{current_user_name}' not found on child Aadhaar. Extracted: '{extracted_text.strip()}'")
            
    identifier = current_user.get("medicalId") or current_user.get("employeeId")
    result = await add_new_dependent(identifier, name, dob, relationship)
    result["analysis"] = analysis 
    return result
