import pandas as pd
from sklearn.linear_model import LogisticRegression

async def predict_disease_risk(patient_data: dict, lab_abnormalities: dict):
    # Mock scikit-learn logic placeholder for hackathon
    risk_score = 0.0
    if lab_abnormalities.get("glucose") == "High":
        risk_score += 0.4
    if lab_abnormalities.get("cholesterol") == "High":
        risk_score += 0.3
    
    return {
        "risk_score": risk_score,
        "prediction": "High Risk" if risk_score > 0.5 else "Low Risk",
        "warnings": ["Monitor diet", "Schedule follow-up"] if risk_score > 0.5 else []
    }

async def RAG_medicine_extraction(ocr_text: str):
    extracted = []
    if "paracetamol" in ocr_text.lower():
        extracted.append({"medicine": "Paracetamol", "dosage": "500mg"})
    return extracted

async def suggest_specialist_by_symptoms(symptoms: str):
    symptoms_lower = symptoms.lower()
    
    # Mock Dictionary intelligence for Hackathon AI Triage
    disease_map = {
        "heart": "Cardiologist",
        "chest": "Cardiologist",
        "skin": "Dermatologist",
        "rash": "Dermatologist",
        "headache": "Neurologist",
        "nerves": "Neurologist",
        "bone": "Orthopedist",
        "fracture": "Orthopedist",
        "tooth": "Dentist",
        "teeth": "Dentist",
        "stomach": "Gastroenterologist",
        "digestion": "Gastroenterologist",
        "fever": "General Physician"
    }
    
    suggested = "General Physician"
    # Basic keyword matching scanning
    for kw, specialist in disease_map.items():
        if kw in symptoms_lower:
            suggested = specialist
            break
            
    return {
        "analyzedSymptoms": symptoms,
        "suggestedSpecialist": suggested,
        "message": f"Based on '{symptoms}', our AI recommends consulting a {suggested}."
    }
