from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from models.LabRequest import LabRequestModel
from services.labService import extract_text_from_file, analyze_abnormalities, save_lab_report, create_lab_request, get_pending_requests, accept_lab_request, complete_lab_request, get_prescription_lab_tests
from utils.email_utils import send_email_notification
from datetime import datetime

router = APIRouter()

class CitizenLabRequest(BaseModel):
    hospitalId: str
    prescriptionId: str

class StructuredReport(BaseModel):
    requestId: str
    patientId: str
    prescriptionId: str
    operatorId: str
    results: list
    notes: str

@router.post("/request")
async def add_lab_request(req: CitizenLabRequest, current_user: dict = Depends(get_current_user)):
    # Citizen explicitly requests a lab test based on a prescription
    tests = await get_prescription_lab_tests(req.prescriptionId)
    if not tests:
        raise HTTPException(status_code=400, detail="No lab tests found on this prescription to request.")
    
    # We construct the master LabRequest dynamically on the backend
    full_req = LabRequestModel(
        patientId=current_user["id"],
        hospitalId=req.hospitalId,
        prescriptionId=req.prescriptionId,
        testsRequested=tests
    )
    result = await create_lab_request(full_req.model_dump())
    return {"message": "Lab Request submitted securely to the selected hospital", "request": result}

@router.get("/pending")
async def view_pending(hospitalId: str = None, current_user: dict = Depends(role_required(["LabOperator"]))):
    from services.labService import get_pending_requests
    requests = await get_pending_requests(hospitalId)
    return {"requests": requests}

@router.get("/citizen/pending")
async def citizen_pending(current_user: dict = Depends(get_current_user)):
    from services.labService import get_citizen_lab_requests
    # Use medical_id for reliably syncing across clinical services
    medical_id = current_user.get("medicalId")
    if not medical_id:
         raise HTTPException(status_code=400, detail="Health Profile not found for this user.")
         
    requests = await get_citizen_lab_requests(medical_id)
    return {"requests": requests}

@router.post("/citizen/update-lab")
async def citizen_update_lab(req: CitizenLabRequest, current_user: dict = Depends(get_current_user)):
    from services.labService import update_lab_hospital
    success = await update_lab_hospital(req.prescriptionId, req.hospitalId)
    if not success:
        raise HTTPException(status_code=400, detail="Request not found or failed to update")
    return {"message": "Laboratory updated successfully"}

@router.get("/nearby")
async def nearby_labs(lng: float, lat: float, max_radius_meters: int = 50000, current_user: dict = Depends(get_current_user)):
    from services.labService import get_nearby_labs
    results = await get_nearby_labs(lng, lat, max_radius_meters)
    return {
        "count": len(results),
        "laboratories": results
    }

@router.put("/accept/{request_id}")
async def accept_request(request_id: str, current_user: dict = Depends(role_required(["LabOperator"]))):
    success = await accept_lab_request(request_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Request not found or already processed")
    return {"message": "Task Accepted"}

@router.post("/upload")
async def upload_report(
    background_tasks: BackgroundTasks,
    patientId: str = Form(...),
    reportTitle: str = Form(...),
    file: UploadFile = File(...),
    requestId: str = Form(None),
    current_user: dict = Depends(role_required(["LabOperator"]))
):
    contents = await file.read()
    
    # Process OCR / Parsing based on file extension
    extracted_text = await extract_text_from_file(contents, file.filename)
    
    # Detect Abnormalities
    abnormal = await analyze_abnormalities(extracted_text)
    
    # Save Report
    report_data = {
        "patientId": patientId,
        "labOperatorId": current_user["id"],
        "reportTitle": reportTitle,
        "extractedText": extracted_text,
        "abnormalValues": abnormal,
        "created_at": datetime.utcnow()
    }
    saved_report = await save_lab_report(report_data)
    
    # Complete Request Workflow & Fire Email
    if requestId:
        validated_patient_id = await complete_lab_request(requestId, saved_report["_id"])
        
        # Fire Email to Citizen
        email_body = f"<h3>Your Lab Results are Ready!</h3>"
        email_body += f"<p>The {reportTitle} test has been processed by the Lab Operator.</p>"
        
        if abnormal:
            email_body += "<h4 style='color:red;'>Notices Found:</h4><ul>"
            for k, v in abnormal.items():
                email_body += f"<li><b>{k}</b>: {v}</li>"
            email_body += "</ul><p>Please consult your doctor immediately.</p>"
        else:
            email_body += "<p>All readings appear normal based on automated analysis.</p>"
            
        background_tasks.add_task(
            send_email_notification,
            current_user.get("email", "mockpatient@example.com"), # We use the currently logged in testing email or assume DB lookup
            "Medical Lab Results Uploaded",
            email_body
        )
    
    return {"message": "Report uploaded and analyzed", "report": saved_report}

@router.post("/submit-structured-report")
async def submit_structured_report(
    req: StructuredReport,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(role_required(["LabOperator"]))
):
    from services.labService import save_structured_report
    
    # Save Report
    report_data = {
        "patientId": req.patientId,
        "prescriptionId": req.prescriptionId,
        "labOperatorId": req.operatorId,
        "reportTitle": "Quantitative Lab Results",
        "structuredResults": req.results,
        "operatorNotes": req.notes,
    }
    saved_report = await save_structured_report(report_data)
    
    # Complete Request Workflow
    validated_patient_id = await complete_lab_request(req.requestId, saved_report["_id"])
    
    # Fire Email to Citizen & Doctor (Hardcoded to demo email)
    has_anomalies = any(r.get("status") in ["High", "Low"] for r in req.results)
    anomaly_alert = f'<h3 style="color:red;">⚠️ ANOMALIES DETECTED for Patient {req.patientId}</h3>' if has_anomalies else ''

    email_body = f"""
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Official Lab Results Available</h2>
        <p><strong>ATTN DOCTOR / PATIENT:</strong> Quantitative lab analysis has been finalized for Medical ID: <b>{req.patientId}</b>.</p>
        {anomaly_alert}
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f3f4f6; text-align: left;">
                <th style="padding: 12px; border: 1px solid #ddd;">Test Name</th>
                <th style="padding: 12px; border: 1px solid #ddd;">Reference Range</th>
                <th style="padding: 12px; border: 1px solid #ddd;">Observed Value</th>
                <th style="padding: 12px; border: 1px solid #ddd;">Flags</th>
            </tr>
    """
    
    for r in req.results:
        flag_color = "#10b981" if r.get("status") == "Normal" else ("#ef4444" if r.get("status") == "High" else "#f59e0b")
        email_body += f"""
            <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">{r.get('name')}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">{r.get('generalValue')}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">{r.get('observedValue')}</td>
                <td style="padding: 12px; border: 1px solid #ddd; color: {flag_color}; font-weight: bold;">{r.get('status')}</td>
            </tr>
        """
        
    email_body += f"""
        </table>
        <p style="margin-top: 24px;"><b>Operator Notes:</b> {req.notes}</p>
        <p style="margin-top: 24px; font-size: 0.9em; color: #666;">
            Automated Medical Dispatch<br/>
            <b>Smart Health Secure Ecosystem</b>
        </p>
    </div>
    """
    
    background_tasks.add_task(
        send_email_notification,
        "patient@example.com", # Overridden by email_utils for demo purposes
        f"Lab Report {'[ANOMALY]' if has_anomalies else ''} for {req.patientId}",
        email_body
    )
    
    return {"message": "Structured Report Distributed", "report": saved_report}

@router.get("/reports/{patient_id}")
async def get_patient_reports(patient_id: str, current_user: dict = Depends(get_current_user)):
    from services.labService import get_lab_reports
    reports = await get_lab_reports(patient_id)
    return {"reports": reports}
