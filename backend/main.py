from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.authRoutes import auth_router
from routes.citizenRoutes import citizen_router
from routes.doctorRoutes import doctor_router
from routes.labRoutes import lab_router
from routes.guardianRoutes import guardian_router
from routes.wardRoutes import ward_router
from routes.adminRoutes import admin_router
from routes.hospitalRoutes import hospital_router
from routes.aiRoutes import ai_router
from routes.appointmentRoutes import appointment_router
from controllers.iotController import router as iot_router
from controllers.familyController import router as family_router
from controllers.admissionController import router as admission_router
from controllers.phoController import router as pho_router
from realtime.socket import router as websocket_router
from routes.medicineRoutes import medicine_router
from routes.insuranceRoutes import insurance_router
from routes.announcementRoutes import announcement_router

app = FastAPI(title="Unified Smart Public Health Management System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(citizen_router, prefix="/api/citizen", tags=["Citizen Dashboard"])
app.include_router(doctor_router, prefix="/api/doctor", tags=["Doctor Workspace"])
app.include_router(lab_router, prefix="/api/lab", tags=["Lab Processing"])
app.include_router(guardian_router, prefix="/api/guardian", tags=["Guardian/Family"])
app.include_router(hospital_router, prefix="/api/hospital", tags=["Hospital Locator"])
app.include_router(ward_router, prefix="/api/ward", tags=["Ward Operations"])
app.include_router(appointment_router, prefix="/api/appointment", tags=["Appointments"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Intelligence"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin & Dashboard"])
app.include_router(iot_router, prefix="/api/iot", tags=["Wearable Telemetry"])
app.include_router(family_router, prefix="/api/family", tags=["Family Hub"])
app.include_router(admission_router, prefix="/api/admission", tags=["Admissions"])
app.include_router(websocket_router, prefix="/api/realtime", tags=["WebSockets"])
app.include_router(medicine_router, prefix="/api/medicine", tags=["Medicine Stock"])
app.include_router(insurance_router, prefix="/api/insurance", tags=["Insurance Claims"])
app.include_router(announcement_router, prefix="/api/announcement", tags=["Announcements"])
app.include_router(pho_router, prefix="/api/pho", tags=["Public Health Officer"])

@app.on_event("startup")
async def startup_db_client():
    from config.db import get_database
    db = get_database()
    # Unique patient per bed validation (partial index ensures only occupied beds are strictly unique)
    try:
        await db["admissions"].create_index("bedId", unique=True, partialFilterExpression={"status": "Admitted"})
    except Exception as e:
        print(f"Warning: Could not create unique index on bed_id: {e}")

    # Kick off background reminder cron loop
    import asyncio
    from datetime import datetime
    from services.reminderService import process_reminders

    async def reminder_cron_loop():
        # Keep track of last triggered hour to avoid multiple triggers in the same hour
        last_triggered_hour = -1
        while True:
            now = datetime.now()
            # Check minute condition (roughly start of hour for general check)
            # Since the background task might skip the exact 0th minute depending on sleep timing, 
            # we just check if it's the target hour and we haven't triggered it yet.
            if now.hour in [9, 13, 20] and now.hour != last_triggered_hour:
                await process_reminders(now.hour)
                last_triggered_hour = now.hour
                
            # Rest the last triggered when hour is no longer target
            if now.hour not in [9, 13, 20]:
                last_triggered_hour = -1

            await asyncio.sleep(60)

    asyncio.create_task(reminder_cron_loop())

@app.get("/")
async def root():
    return {"message": "Welcome to SHS API Core Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
