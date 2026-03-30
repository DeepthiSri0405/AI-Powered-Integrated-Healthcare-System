from fastapi import APIRouter, BackgroundTasks
from models.IotTelemetry import IotTelemetryPayload
from services.iotService import save_telemetry_reading, get_patient_telemetry
from utils.email_utils import send_email_notification

router = APIRouter()

@router.post("/vitals")
async def ingest_vitals(payload: IotTelemetryPayload, background_tasks: BackgroundTasks):
    data = payload.model_dump()
    result = await save_telemetry_reading(data)
    
    # SHS CORE LOGIC: THE ANOMALY DECISION ENGINE 🔥
    if data["heartRate"] > 120 or data["spo2"] < 92 or data["temperature"] > 38.0:
        
        # Trigger background email escalations without blocking the data stream!
        html_msg = f"""
        <div style='border-left: 5px solid #ef4444; padding: 20px; font-family: sans-serif;'>
            <h2 style='color: #ef4444;'>CRITICAL VITALS DETECTED</h2>
            <p><strong>Patient ID:</strong> {data["patientId"]}</p>
            <table style='width: 300px; text-align: left; border-collapse: collapse;'>
                <tr><th style='border-bottom: 1px solid #ccc; padding: 8px;'>Metric</th><th style='border-bottom: 1px solid #ccc; padding: 8px;'>Reading</th></tr>
                <tr><td style='padding: 8px;'>Heart Rate</td><td style='padding: 8px; color: {"#ef4444" if data["heartRate"] > 120 else "#000"};'><b>{round(data['heartRate'], 1)} bpm</b></td></tr>
                <tr><td style='padding: 8px;'>SpO2</td><td style='padding: 8px; color: {"#ef4444" if data["spo2"] < 92 else "#000"};'><b>{round(data['spo2'], 1)}%</b></td></tr>
                <tr><td style='padding: 8px;'>Temperature</td><td style='padding: 8px; color: {"#ef4444" if data["temperature"] > 38.0 else "#000"};'><b>{round(data['temperature'], 2)} °C</b></td></tr>
            </table>
            <p style='margin-top: 20px;'><i>Immediate intervention requested. Hardware threshold triggers engaged.</i></p>
        </div>
        """
        
        # Dispatch to mock doctor/guardian based on ENV config (we dynamically fire to the testing email right now)
        import os
        testing_email = os.getenv("EMAIL_USER", "doctor@example.com")
        
        background_tasks.add_task(
            send_email_notification,
            testing_email,
            f"URGENT: IoT Wearable Alarm Triggered for Patient {data['patientId']}",
            html_msg
        )
        
        return {"message": "Vitals ingested. EMERGENCY THRESHOLD BREACH DETECTED.", "alertTriggered": True}
    
    return {"message": "Vitals ingested successfully. All systems nominal.", "alertTriggered": False}

@router.get("/vitals/{patient_id}")
async def fetch_vitals_history(patient_id: str):
    history = await get_patient_telemetry(patient_id)
    return {"history": history}
