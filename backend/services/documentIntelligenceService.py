import cv2
import numpy as np
import pytesseract
from config.db import get_database

async def validate_birth_certificate(image_bytes: bytes, expected_name: str, expected_dob: str, guardian_id: str) -> dict:
    trust_score = 0
    details = {
        "ocr_match_name": False,
        "ocr_match_dob": False,
        "image_clear": False,
        "edge_consistency": True, # Assume true unless basic ELA fails
        "duplicate_found": False,
        "guardian_match": True, 
    }
    
    try:
        # 1. Image Decode
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"trustScore": 0, "status": "Suspicious", "details": {"error": "Invalid Image Format (Unreadable OpenCV stream)"}}
            
        # 2. OpenCV Analysis (+30 points)
        # a) Blur Detection (Laplacian Variance)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur_variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # We assign +15 for clarity. If blur_variance < 50, it's very blurry.
        if blur_variance > 50:
            trust_score += 15
            details["image_clear"] = True
            
        # b) Edge / ELA Proxy (Detect high frequency artifacts caused by copy-pasting text)
        canny = cv2.Canny(gray, 100, 200)
        edge_density = np.sum(canny) / canny.size
        # Usually natural documents have consistent edge densities. Massive outliers imply heavy overlays.
        if edge_density < 100:
            trust_score += 15
        else:
            details["edge_consistency"] = False
            
        # 3. OCR Text Extraction (+30 points)
        # Extract all raw text using Tesseract compiled binary
        text = pytesseract.image_to_string(gray).lower()
        
        # Simple sub-string lookup
        target_name = expected_name.lower().split()[0] # Try matching at least first name if full name fails
        name_found = target_name in text
        dob_found = expected_dob in text
        
        if name_found:
            trust_score += 15
            details["ocr_match_name"] = True
        
        if dob_found:
            trust_score += 15
            details["ocr_match_dob"] = True

        # 4. Database Duplicate Check (+20 points)
        db = get_database()
        existing_dep = await db["dependents"].find_one({
            "patientName": expected_name,
            "dob": expected_dob,
            "dependentType": "Child"
        })
        
        if existing_dep:
            details["duplicate_found"] = True
        else:
            trust_score += 20
            
        # 5. Guardian Context Match (+20 points)
        # We fetch the parent's explicit Name from the MongoDB Users collection to verify THEY are on the physical document
        from bson import ObjectId
        guardian_user = await db["users"].find_one({"_id": ObjectId(guardian_id)})
        
        details["guardian_match"] = False
        if guardian_user and "name" in guardian_user:
            parent_firstName = guardian_user["name"].lower().split()[0]
            if parent_firstName in text:
                trust_score += 20
                details["guardian_match"] = True
        
        # Final Ruleset Output Matrix
        status = "Suspicious"
        if trust_score >= 80:
            status = "Verified"
        elif trust_score >= 50:
            status = "Needs Review"
            
        return {
            "trustScore": trust_score,
            "status": status,
            "details": details
        }
    except Exception as e:
        print(f"CV Engine Error: {e}")
        return {
            "trustScore": 0,
            "status": "Suspicious",
            "details": {"error": f"Internal Validation Engine failed to process physical file bytes: {str(e)}"}
        }
