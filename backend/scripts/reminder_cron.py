import asyncio
import os
import sys
from datetime import datetime, timedelta

# Append the parent backend root path to sys.path so we can import app modules directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.db import get_database
from utils.email_utils import send_email_notification
from dotenv import load_dotenv

# Load env immediately
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

async def run_cron():
    print(f"[{datetime.now()}] Starting Healthcare Reminder Worker...")
    db = get_database()
    today_dt = datetime.utcnow()
    
    prescriptions = await db["prescriptions"].find({}).to_list(None)
    
    for presc in prescriptions:
        patient_id = presc.get("patientId")
        patient = await db["users"].find_one({"_id": patient_id}) # Fallback logic, but assume _id maps correctly or user collection exists
        
        # In this system, user emails can be mocked if not present
        to_email = patient.get("email", "mockpatient@example.com") if patient else "mockpatient@example.com"
        
        # 1. Daily Medicine Reminders
        medicines = presc.get("medicines", [])
        if medicines:
            med_list_html = "<ul>"
            for m in medicines:
                med_list_html += f"<li><b>{m['name']}</b>: {m['dosage']} (Timing: {m['timing']})</li>"
            med_list_html += "</ul>"
            
            email_msg = f"""
            <h3>Daily Medicine Reminder</h3>
            <p>Good day! Please remember to take your prescribed tablets:</p>
            {med_list_html}
            <br/>
            <p>Stay healthy!</p>
            """
            send_email_notification(to_email, "Your Daily Medication Reminder", email_msg)

        # 2. Automated Follow-up Days Verification
        follow_up_days = presc.get("followUpDays")
        created_at = presc.get("created_at")
        
        if follow_up_days and created_at:
            followup_date = created_at + timedelta(days=follow_up_days)
            # If the followup date is today or approaching within 2 days
            if 0 <= (followup_date - today_dt).days <= 2:
                # We send an automatic follow-up request
                followup_msg = f"""
                <h3>Follow-up Meet Required</h3>
                <p>Hello! Your doctor suggested a follow-up appointment approximately {follow_up_days} days after your last visit.</p>
                <p>You can now book an <b>Offline</b> or <b>Virtual</b> meeting through your Citizen Dashboard immediately.</p>
                <br/>
                <a href='http://localhost:5173/citizen/appointments'>Book Follow-up Now</a>
                """
                send_email_notification(to_email, "Doctor Follow-up Needed", followup_msg)

    print(f"[{datetime.now()}] Completed Healthcare Reminder Worker pass.")

if __name__ == "__main__":
    # Typically this script would be scheduled via apscheduler or crontab
    # For demonstration, we simply execute it once asynchronously.
    asyncio.run(run_cron())
