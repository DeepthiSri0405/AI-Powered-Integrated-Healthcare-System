import asyncio
from datetime import datetime
from config.db import get_database
from utils.email_utils import send_email_notification

async def process_reminders(current_hour: int):
    # Determine the timing string for the hour
    target_timing = None
    if current_hour == 9:
        target_timing = "Morning"
    elif current_hour == 13:
        target_timing = "Afternoon"
    elif current_hour == 20: # 8 PM
        target_timing = "Night"
        
    if not target_timing:
        return
        
    db = get_database()
    
    # Fetch all active prescriptions
    prescriptions = await db["prescriptions"].find({"status": "Active"}).to_list(None)
    
    for p in prescriptions:
        patient_id = p.get("patientId")
        medicines = p.get("medicines", [])
        
        # Filter medicines prescribed for this timing
        matching_meds = []
        for m in medicines:
            timings = [t.strip() for t in m.get("timing", "").split(",") if t.strip()]
            if target_timing in timings:
                matching_meds.append(m)
                
        if not matching_meds:
            continue
            
        # We have matching medicines, fetch patient email
        patient = await db["users"].find_one({"$or": [{"medicalId": patient_id}, {"employeeId": patient_id}, {"aadhaarId": patient_id}]})
        to_email = patient.get("email", "patient@example.com") if patient else "patient@example.com"
        patient_name = patient.get("name", patient_id) if patient else patient_id
        
        # Generate email context
        html_msg = f"""
        <div style="font-family: Arial, sans-serif;">
            <h2>Hello {patient_name},</h2>
            <p>This is your automated <b>{target_timing}</b> Medical Reminder.</p>
            <p>Please ensure you take the following prescribed medicines now:</p>
            <ul>
        """
        for m in matching_meds:
            html_msg += f"<li><b>{m.get('name')}</b> - {m.get('dosage')} (Instructions: {m.get('shortBrief', 'None')})</li>"
            
        html_msg += """
            </ul>
            <p>Stay Healthy!</p>
            <p><small>Smart Health System Automated Dispatch</small></p>
        </div>
        """
        
        # Send Email
        asyncio.create_task(asyncio.to_thread(
            send_email_notification,
            to_email=to_email,
            subject=f"🔔 {target_timing} Medication Reminder",
            html_message=html_msg
        ))
        
        # Create a System Alert for the UI
        try:
            from realtime.socket import manager
            import json
            
            alert_data = {
                "patientId": patient_id,
                "alertType": "MedicineReminder",
                "message": f"Time to take your {target_timing} medicines! ({len(matching_meds)} items)",
                "severity": "Normal",
                "isRead": False,
                "created_at": datetime.utcnow()
            }
            res_alert = await db["alerts"].insert_one(alert_data)
            alert_data["_id"] = str(res_alert.inserted_id)
            alert_data["created_at"] = alert_data["created_at"].isoformat()
            
            asyncio.create_task(manager.send_personal_message(
                json.dumps({"type": "NEW_ALERT", "alert": alert_data}),
                patient_id
            ))
        except Exception as e:
            pass
