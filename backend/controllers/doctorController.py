from fastapi import APIRouter, Depends
from middleware.authMiddleware import get_current_user
from middleware.roleMiddleware import role_required
from models.Prescription import PrescriptionModel
from services.prescriptionService import create_prescription, get_patient_prescriptions
from services.doctorService import search_doctors, get_doctor_slots

router = APIRouter()

@router.get("/search")
async def get_search_doctors(hospitalId: str = None, specialty: str = None, current_user: dict = Depends(get_current_user)):
    doctors = await search_doctors(hospitalId, specialty)
    return {"doctors": doctors}

@router.get("/demo-facility")
async def get_demo_facility(current_user: dict = Depends(get_current_user)):
    from services.doctorService import get_demo_hospital
    hospital = await get_demo_hospital()
    return {"hospital": hospital}

@router.get("/{doctor_id}/slots")
async def view_slots(doctor_id: str, date: str, current_user: dict = Depends(get_current_user)):
    slots = await get_doctor_slots(doctor_id, date)
    return {"doctorId": doctor_id, "date": date, "availableSlots": slots}

@router.get("/{doctor_id}/feedbacks")
async def view_feedbacks(doctor_id: str, current_user: dict = Depends(get_current_user)):
    from services.doctorService import get_doctor_feedbacks
    feedbacks = await get_doctor_feedbacks(doctor_id)
    return {"feedbacks": feedbacks}

@router.post("/appointment/{appointment_id}/initiate")
async def doctor_initiate_appointment(appointment_id: str, current_user: dict = Depends(role_required(["Doctor"]))):
    from services.appointmentService import initiate_appointment
    return await initiate_appointment(appointment_id)

@router.get("/dashboard/today")
async def doctor_today(date: str, current_user: dict = Depends(role_required(["Doctor"]))):
    from services.appointmentService import get_doctor_dashboard
    return await get_doctor_dashboard(current_user["employeeId"], date)

@router.get("/patients")
async def doctor_patients(current_user: dict = Depends(role_required(["Doctor"]))):
    from services.appointmentService import get_doctor_patients
    patients = await get_doctor_patients(current_user["employeeId"])
    return {"patients": patients}

@router.get("/{doctor_id}/queue/active")
async def active_doctor_queue(doctor_id: str, date: str, current_user: dict = Depends(get_current_user)):
    from services.appointmentService import get_active_token
    # Any logged in user can view the currently active token for a doctor!
    return await get_active_token(doctor_id, date)

@router.post("/prescription")
async def add_prescription(presc: PrescriptionModel, current_user: dict = Depends(role_required(["Doctor"]))):
    data = presc.model_dump()
    data["doctorId"] = current_user["employeeId"]
    result = await create_prescription(data)
    return {"message": "Prescription created successfully", "prescription": result}

@router.put("/prescription/{prescription_id}")
async def edit_prescription(prescription_id: str, presc: dict, current_user: dict = Depends(role_required(["Doctor"]))):
    from services.prescriptionService import update_prescription
    result = await update_prescription(prescription_id, presc, current_user["employeeId"])
    return result

@router.get("/patients/{patient_id}/prescriptions")
async def view_prescriptions(patient_id: str, current_user: dict = Depends(get_current_user)):
    # Privacy Guard
    if current_user.get("role") == "Doctor":
        from config.db import get_database
        db = get_database()
        # Doctor must have an active or completed appointment with this patient
        has_access = await db["appointments"].find_one({
            "doctorId": current_user["employeeId"],
            "patientId": patient_id,
            "status": {"$in": ["active", "completed"]}
        })
        if not has_access:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Access Denied: Patient history is restricted until consultation is initiated.")
            
    prescriptions = await get_patient_prescriptions(patient_id)
    return {"prescriptions": prescriptions}

@router.get("/appointments/counts")
async def doctor_appointment_counts(month_year: str, current_user: dict = Depends(role_required(["Doctor"]))):
    from services.appointmentService import get_appointment_counts
    counts = await get_appointment_counts(current_user["employeeId"], month_year)
    return {"counts": counts}

@router.get("/history")
async def doctor_history(current_user: dict = Depends(role_required(["Doctor"]))):
    from services.prescriptionService import get_doctor_history
    history = await get_doctor_history(current_user["employeeId"])
    return {"history": history}
