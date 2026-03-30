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
from realtime.socket import router as websocket_router

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
app.include_router(websocket_router, prefix="/api/realtime", tags=["WebSockets"])

@app.get("/")
async def root():
    return {"message": "Welcome to SHS API Core Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
