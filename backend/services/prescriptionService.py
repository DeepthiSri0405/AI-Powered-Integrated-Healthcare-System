from config.db import get_database
from datetime import datetime
from bson import ObjectId

async def create_prescription(prescription_data: dict):
    db = get_database()
    result = await db["prescriptions"].insert_one(prescription_data)
    prescription_id = str(result.inserted_id)
    prescription_data["_id"] = prescription_id
    
    # Update Appointment Status to COMPLETED if appointmentId is provided
    if "appointmentId" in prescription_data:
        appt_id = prescription_data["appointmentId"]
        try:
            # Handle both string and raw ObjectId formats
            target_id = ObjectId(appt_id) if isinstance(appt_id, str) else appt_id
            await db["appointments"].update_one(
                {"_id": target_id},
                {"$set": {"status": "completed"}}
            )
            print(f"Appointment {appt_id} marked as completed.")
        except Exception as e:
            print(f"Failed to update appointment status: {e}")
    
    # Auto-decrement Medicine Stock & Generate Admin Alerts
    hospital_id = prescription_data.get("hospitalId")
    if hospital_id:
        for med in prescription_data.get("medicines", []):
            quantity = med.get("quantity", 1)
            med_name = med.get("name")
            if med_name:
                # 1. Update Stock
                stock_item = await db["medicine_stocks"].find_one({"hospitalId": hospital_id, "name": med_name})
                if stock_item:
                    new_count = stock_item["currentCount"] - quantity
                    await db["medicine_stocks"].update_one(
                        {"_id": stock_item["_id"]},
                        {"$set": {"currentCount": new_count, "last_updated": datetime.utcnow()}}
                    )
                    
                    # 2. Check for Reorder Alert
                    if new_count <= stock_item.get("reorderLevel", 10):
                        await db["alerts"].insert_one({
                            "patientId": "ADMIN", # Tagged for Admin dashboard
                            "alertType": "InventoryLow",
                            "message": f"CRITICAL: {med_name} stock is low at {hospital_id}. Current: {new_count}",
                            "isRead": False,
                            "created_at": datetime.utcnow()
                        })
                        
    # 3. Create Lab Request entries if tests are prescribed
    lab_tests = prescription_data.get("labTests", [])
    if lab_tests:
        await db["lab_requests"].insert_one({
            "patientId": prescription_data["patientId"],
            "prescriptionId": prescription_id,
            "testsRequested": lab_tests,
            "status": "Pending",
            "hospitalId": "TBD", # Citizen will pick a lab later
            "created_at": datetime.utcnow()
        })
        
    # 4. Generate Medication Reminders & Fire Email
    medicines = prescription_data.get("medicines", [])
    if medicines:
        html_reminder = f"""
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Your Smart Health Prescription</h2>
            <p>Dr. {prescription_data.get('doctorId', 'Your Doctor')} has prescribed the following medications. Please follow the schedule below strictly:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background-color: #f3f4f6; text-align: left;">
                    <th style="padding: 12px; border: 1px solid #ddd;">Medicine</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Dosage</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Timing</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Duration</th>
                    <th style="padding: 12px; border: 1px solid #ddd;">Instructions</th>
                </tr>
        """
        for med in medicines:
            html_reminder += f"""
                <tr>
                    <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">{med.get('name')}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">{med.get('dosage')}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">{med.get('timing')}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">{med.get('duration')}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">{med.get('shortBrief', 'N/A')}</td>
                </tr>
            """
            
            timings = [t.strip() for t in med.get("timing", "").split(",") if t.strip()]
            for t in timings:
                time_str = "08:00 AM"
                if t == "Morning": time_str = "08:00 AM"
                elif t == "Afternoon": time_str = "13:00 PM"
                elif t == "Night": time_str = "20:00 PM"
                
                await db["citizen_reminders"].insert_one({
                    "patientId": prescription_data["patientId"],
                    "medicineName": med.get("name"),
                    "dosage": med.get("dosage"),
                    "timing": t,
                    "timeStr": time_str,
                    "instruction": med.get("shortBrief", ""),
                    "duration": med.get("duration", ""),
                    "status": "active",
                    "created_at": datetime.utcnow()
                })
        
        html_reminder += """
            </table>
            <p style="margin-top: 24px; font-size: 0.9em; color: #666;">
                Automated Medical Dispatch<br/>
                <b>Smart Health Secure Ecosystem</b>
            </p>
        </div>
        """
        
        # Fire the email using the hardcoded relay
        import asyncio
        from utils.email_utils import send_email_notification
        
        asyncio.create_task(asyncio.to_thread(
            send_email_notification,
            to_email="patient@example.com", # Overridden by email_utils logic
            subject=f"URGENT: Your Official Prescription & Medication Schedule",
            html_message=html_reminder
        ))

    return prescription_data

async def get_patient_prescriptions(patient_id: str):
    db = get_database()
    records = await db["prescriptions"].find({"patientId": patient_id}).sort("created_at", -1).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records

async def get_doctor_history(doctor_id: str):
    db = get_database()
    # Fetch all prescriptions written by this doctor
    records = await db["prescriptions"].find({"doctorId": doctor_id}).sort("created_at", -1).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
        del r["_id"]
    return records

async def update_prescription(prescription_id: str, prescription_data: dict, doctor_id: str):
    db = get_database()
    try:
        p_id = ObjectId(prescription_id)
    except:
        p_id = prescription_id
        
    existing = await db["prescriptions"].find_one({"_id": p_id, "doctorId": doctor_id})
    if not existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Prescription not found or unauthorized")
        
    update_fields = {
        "diagnosis": prescription_data.get("diagnosis", existing.get("diagnosis")),
        "medicines": prescription_data.get("medicines", existing.get("medicines")),
        "labTests": prescription_data.get("labTests", existing.get("labTests")),
        "notes": prescription_data.get("notes", existing.get("notes")),
        "followUpDays": prescription_data.get("followUpDays", existing.get("followUpDays")),
        "updated_at": datetime.utcnow()
    }
    
    await db["prescriptions"].update_one({"_id": p_id}, {"$set": update_fields})
    return {"status": "success", "message": "Prescription updated"}
