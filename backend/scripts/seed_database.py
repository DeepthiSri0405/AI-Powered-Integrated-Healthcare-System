import sys
import os
import asyncio
from datetime import datetime, timedelta
import pymongo

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config.db import get_database, client
from utils.generateHealthId import generate_medical_id, generate_employee_id
from utils.validators import get_password_hash

async def seed():
    db = get_database()
    print("WARNING: Wiping existing Hackathon collections...")
    for col in ["users", "hospitals", "doctor_schedules", "dependents", "appointments"]:
        await db[col].drop()
        
    print("---- Injecting Hospitals ----")
    hospitals = [
        {
            "name": "Apollo Health City",
            "address": "Jubilee Hills, Hyderabad",
            "contactInfo": "1800-456-7890",
            "location": {"type": "Point", "coordinates": [78.4023, 17.4326]},
            "specialties": ["Cardiologist", "Neurologist", "Orthopedist"]
        },
        {
            "name": "Care Emergency Hospital",
            "address": "Banjara Hills",
            "contactInfo": "1800-999-0000",
            "location": {"type": "Point", "coordinates": [78.4483, 17.4156]},
            "specialties": ["Cardiologist", "Dentist", "Gastroenterologist"]
        },
        {
            "name": "Sunshine Super Specialty",
            "address": "Secunderabad",
            "contactInfo": "1800-111-2222",
            "location": {"type": "Point", "coordinates": [78.5081, 17.4399]},
            "specialties": ["General Physician", "Pediatrician"]
        }
    ]
    res_h = await db["hospitals"].insert_many(hospitals)
    apollo_id = str(res_h.inserted_ids[0])
    care_id = str(res_h.inserted_ids[1])
    sunshine_id = str(res_h.inserted_ids[2])
    
    # Establish geospatial index right now
    await db["hospitals"].create_index([("location", pymongo.GEOSPHERE)])
    
    print("---- Injecting Staff & Citizens ----")
    # All users have password 'password123' to make Hackathon demos very easy
    password = get_password_hash("password123")
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    demomed_id = generate_medical_id()
    
    users = [
        # Citizen / Guardian
        {"name": "Demo Guardian", "dob": "1985-06-15", "role": "Citizen", "aadhaarId": "111122223333", "medicalId": demomed_id, "created_at": datetime.utcnow(), "password": password},
        # Doctors (employeeId format explicitly returned to login page)
        {"name": "Dr. Arjun (Cardio)", "role": "Doctor", "employeeId": "DOC-1000", "created_at": datetime.utcnow(), "password": password, "specialty": "Cardiologist"},
        {"name": "Dr. Priya (Peds)", "role": "Doctor", "employeeId": "DOC-2000", "created_at": datetime.utcnow(), "password": password, "specialty": "Pediatrician"},
        # Operational Staff
        {"name": "Admin Boss", "role": "Admin", "employeeId": "ADM-9999", "created_at": datetime.utcnow(), "password": password},
        {"name": "Lab Tech V", "role": "LabOperator", "employeeId": "LAB-4444", "created_at": datetime.utcnow(), "password": password},
        {"name": "Ward Nurse A", "role": "WardStaff", "employeeId": "WRD-7777", "created_at": datetime.utcnow(), "password": password}
    ]
    res_u = await db["users"].insert_many(users)
    guardian_id = str(res_u.inserted_ids[0])
    doc_cardio_id = str(res_u.inserted_ids[1])
    doc_peds_id = str(res_u.inserted_ids[2])
    
    print("---- Injecting Schedules ----")
    schedules = [
        {
            "doctorId": doc_cardio_id, "hospitalId": apollo_id,
            "availableDates": [today_str, tomorrow_str], 
            "timeSlots": ["09:00 AM", "10:00 AM", "11:00 AM"], "active": True
        },
        {
            "doctorId": doc_peds_id, "hospitalId": sunshine_id,
            "availableDates": [today_str, tomorrow_str], 
            "timeSlots": ["02:00 PM", "03:00 PM", "04:00 PM"], "active": True
        }
    ]
    await db["doctor_schedules"].insert_many(schedules)
    
    print("---- Injecting Dependents & Appointments ----")
    child_med_id = generate_medical_id()
    dependents = [
        {
            "guardianId": guardian_id, "dependentType": "Child", "verificationStatus": "Verified",
            "patientName": "Demo Child", "dob": "2015-05-12", "relationship": "Son",
            "medicalId": child_med_id, "consentStatus": "Not Required", "trustScore": 100, "created_at": datetime.utcnow()
        }
    ]
    await db["dependents"].insert_many(dependents)
    
    # Mirror the child correctly into the core users table mapped to the guardian
    child_user = {
        "name": "Demo Child", "dob": "2015-05-12", "role": "Citizen", "medicalId": child_med_id, "guardianIds": [guardian_id], "created_at": datetime.utcnow()
    }
    await db["users"].insert_one(child_user)
    
    appointments = [
        # Virtual Meeting for the Guardian directly assessing with Cardio
        {
            "patientId": demomed_id, "doctorId": doc_cardio_id, "hospitalId": apollo_id,
            "type": "Virtual", "status": "Approved", "date": today_str, "timeSlot": "09:00 AM",
            "meetingLink": "https://meet.google.com/demo-hack-123", "created_at": datetime.utcnow()
        },
        # Physical Hospital Visit for the Child exactly at Sunshine with Peds!
        {
            "patientId": child_med_id, "doctorId": doc_peds_id, "hospitalId": sunshine_id,
            "type": "In-Person", "status": "Approved", "date": today_str, "timeSlot": "02:00 PM",
            "tokenNumber": "A100", "created_at": datetime.utcnow()
        }
    ]
    await db["appointments"].insert_many(appointments)
    
    print("\n\n🔥 >> THE UNIVERSAL ROOT HACKATHON SEED IS COMPLETE << 🔥")
    print("\nLOGIN CREDENTIALS SUMMARY (Password for everyone is 'password123'):")
    print(f"Citizen/Guardian Login: {demomed_id} OR 111122223333")
    print(f"Cardio Doctor Login: DOC-1000")
    print(f"Pediatrician Doctor Login: DOC-2000")
    print(f"Admin Login: ADM-9999")
    print(f"Lab Tech Login: LAB-4444")
    print(f"Ward Staff Login: WRD-7777")
    
if __name__ == "__main__":
    asyncio.run(seed())
