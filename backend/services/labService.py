from config.db import get_database
from config.env import TESSERACT_CMD
import pytesseract
from PIL import Image
import io
import fitz # PyMuPDF
import docx

if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

async def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    text = ""
    filename_lower = filename.lower()
    try:
        if filename_lower.endswith('.pdf'):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text()
        
        elif filename_lower.endswith('.docx'):
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
                
        elif filename_lower.endswith('.txt'):
            text = file_bytes.decode('utf-8')
            
        elif filename_lower.endswith(('.png', '.jpg', '.jpeg')):
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
        else:
            print(f"Unsupported file extension for {filename}. Attempting image OCR fallback.")
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            
        return text
    except Exception as e:
        print(f"Extraction Error: {e}")
        return ""

async def analyze_abnormalities(extracted_text: str) -> dict:
    abnormal = {}
    text_lower = extracted_text.lower()
    if "glucose" in text_lower and "high" in text_lower:
        abnormal["glucose"] = "High"
    if "cholesterol" in text_lower and "high" in text_lower:
        abnormal["cholesterol"] = "High"
    return abnormal

async def save_lab_report(report_data: dict):
    db = get_database()
    result = await db["lab_reports"].insert_one(report_data)
async def save_structured_report(report_data: dict):
    from datetime import datetime
    db = get_database()
    report_data["created_at"] = datetime.utcnow()
    result = await db["lab_reports"].insert_one(report_data)
    report_data["_id"] = str(result.inserted_id)
    return report_data

async def get_lab_reports(patient_id: str):
    db = get_database()
    records = await db["lab_reports"].find({"patientId": patient_id}).sort("created_at", -1).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records

async def create_lab_request(request_data: dict):
    db = get_database()
    result = await db["lab_requests"].insert_one(request_data)
    request_data["_id"] = str(result.inserted_id)
    return request_data

async def get_pending_requests(hospital_id: str = None):
    db = get_database()
    query = {"status": "Pending"}
    if hospital_id:
        query["hospitalId"] = hospital_id
    records = await db["lab_requests"].find(query).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records

async def get_citizen_lab_requests(medical_id: str):
    db = get_database()
    # Query by medicalId (patientId field) to ensure cross-service sync
    records = await db["lab_requests"].find({"patientId": medical_id, "status": "Pending"}).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records

async def detect_tests_from_text(text: str, patient_id: str):
    """
    Scans OCR text for known medical tests and automatically creates 
    Lab Requests if detected in a physical prescription upload.
    """
    db = get_database()
    text_lower = text.lower()
    
    # Simple dictionary of tests to look for
    TEST_KEYWORDS = {
        "blood test": "Complete Blood Count (CBC)",
        "glucose": "Blood Glucose Level",
        "sugar": "Blood Glucose Level",
        "cholesterol": "Lipid Profile",
        "thyroid": "TSH / Thyroid Profile",
        "urine": "Urinalysis",
        "ecg": "Electrocardiogram (ECG)",
        "x-ray": "Chest X-Ray",
        "malaria": "Malaria Parasite Test"
    }
    
    detected = []
    for key, value in TEST_KEYWORDS.items():
        if key in text_lower:
            detected.append(value)
            
    if detected:
        from datetime import datetime
        new_request = {
            "patientId": patient_id, # medicalId
            "testsRequested": detected,
            "status": "Pending",
            "hospitalId": "TBD",
            "notes": "System Auto-Detected via Physical OCR",
            "created_at": datetime.utcnow()
        }
        await db["lab_requests"].insert_one(new_request)
        return detected
    return []

async def update_lab_hospital(request_id: str, hospital_id: str):
    db = get_database()
    from bson import ObjectId
    result = await db["lab_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"hospitalId": hospital_id}}
    )
    return result.matched_count > 0

async def accept_lab_request(request_id: str, operator_id: str):
    db = get_database()
    from bson import ObjectId
    
    result = await db["lab_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "Accepted", "operatorId": operator_id}}
    )
    return result.modified_count > 0

async def complete_lab_request(request_id: str, report_id: str):
    db = get_database()
    from bson import ObjectId
    
    result = await db["lab_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {"status": "Completed", "reportId": report_id}}
    )
    
    request = await db["lab_requests"].find_one({"_id": ObjectId(request_id)})
    if request:
        return request.get("patientId")
    return None

async def get_prescription_lab_tests(prescription_id: str) -> list:
    db = get_database()
    from bson import ObjectId
    try:
        presc = await db["prescriptions"].find_one({"_id": ObjectId(prescription_id)}, {"labTests": 1})
        if presc and "labTests" in presc:
            return presc["labTests"]
    except Exception as e:
        print(f"Error fetching lab tests: {e}")
    return []

async def get_nearby_labs(lng: float, lat: float, max_distance_meters: int = 50000):
    import httpx
    # Using reliable overpass mirror
    overpass_url = "https://overpass.kumi.systems/api/interpreter"
    radius = min(max_distance_meters, 15000)
    
    query = f"""
    [out:json][timeout:25];
    (
      node["healthcare"="laboratory"](around:{radius},{lat},{lng});
      way["healthcare"="laboratory"](around:{radius},{lat},{lng});
      node["amenity"="clinic"]["speciality"="laboratory"](around:{radius},{lat},{lng});
    );
    out center;
    """
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(overpass_url, data={"data": query}, timeout=25.0)
            data = response.json()
            real_labs = []
            
            for element in data.get("elements", []):
                tags = element.get("tags", {})
                name = tags.get("name", "Local Diagnostic Laboratory")
                
                real_lat = element.get("lat") if "lat" in element else element.get("center", {}).get("lat")
                real_lon = element.get("lon") if "lon" in element else element.get("center", {}).get("lon")
                    
                if not real_lat or not real_lon:
                    continue
                
                real_labs.append({
                    "id": f"lab_{element.get('id')}", 
                    "name": name,
                    "address": tags.get("addr:street", tags.get("addr:city", "Nearby Healthcare Region")),
                    "contactInfo": tags.get("phone", "Booking via Smart Health App"),
                    "location": {"type": "Point", "coordinates": [real_lon, real_lat]},
                    "type": "Laboratory",
                    "source": "OpenStreetMap"
                })
            
            return real_labs
        except Exception as e:
            print(f"Overpass Lab API degraded: {e}")
            return []
