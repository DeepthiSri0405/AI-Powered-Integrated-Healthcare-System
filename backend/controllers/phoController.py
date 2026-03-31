from fastapi import APIRouter, Depends
from middleware.roleMiddleware import role_required
import random

router = APIRouter()

@router.get("/hospitals/metrics")
async def get_hospital_metrics(current_user: dict = Depends(role_required(["HealthOfficer", "Admin"]))):
    # Generating realistic looking mock analytics for hospitals in the area
    hospitals = [
        {"id": "H001", "name": "SmartHealth Hub (Demo)", "location": "Hi-Tech City", "avgTreatmentTime": "45 mins", "inflow": 420, "recoveryRate": 96.5, "mortalityRate": 1.1, "staffEfficiency": 92.4},
        {"id": "H002", "name": "Apollo General", "location": "Jubilee Hills", "avgTreatmentTime": "52 mins", "inflow": 380, "recoveryRate": 94.2, "mortalityRate": 1.8, "staffEfficiency": 88.6},
        {"id": "H003", "name": "Care Institute", "location": "Banjara Hills", "avgTreatmentTime": "38 mins", "inflow": 550, "recoveryRate": 97.1, "mortalityRate": 0.9, "staffEfficiency": 95.8},
        {"id": "H004", "name": "City Core Care", "location": "Secunderabad", "avgTreatmentTime": "85 mins", "inflow": 612, "recoveryRate": 88.5, "mortalityRate": 3.4, "staffEfficiency": 76.5},
        {"id": "H005", "name": "MediLife Center", "location": "Kukatpally", "avgTreatmentTime": "60 mins", "inflow": 290, "recoveryRate": 91.0, "mortalityRate": 2.2, "staffEfficiency": 84.1}
    ]
    
    # Sort by a composite efficiency score (rough heuristic for demonstration)
    for h in hospitals:
        h["score"] = h["recoveryRate"] * 0.5 + h["staffEfficiency"] * 0.3 - h["mortalityRate"] * 5
    
    hospitals.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "ranked_hospitals": hospitals,
        "global_averages": {
            "treatment_time": "56 mins",
            "inflow_total": sum(h["inflow"] for h in hospitals),
            "recovery_rate": round(sum(h["recoveryRate"] for h in hospitals) / len(hospitals), 1),
            "mortality_rate": round(sum(h["mortalityRate"] for h in hospitals) / len(hospitals), 1)
        }
    }

horizontal_spread_data = [
    {"area": "Hi-Tech City", "cases": 124, "trend": "rising", "alert": "Dengue"},
    {"area": "Secunderabad", "cases": 312, "trend": "critical", "alert": "COVID-19 Variant"},
    {"area": "Jubilee Hills", "cases": 45, "trend": "stable", "alert": "Seasonal Flu"},
    {"area": "Kukatpally", "cases": 18, "trend": "falling", "alert": "None"},
    {"area": "Banjara Hills", "cases": 67, "trend": "rising", "alert": "Typhoid"}
]

@router.get("/surveillance/heatmap")
async def get_disease_surveillance(current_user: dict = Depends(role_required(["HealthOfficer", "Admin"]))):
    # Mock geographical data points for the heatmap visualization
    points = []
    # Generates a cloud of points heavily clustered around Secunderabad and Hi-Tech city
    for _ in range(80):
        points.append({
            "lat": 17.4399 + random.uniform(-0.05, 0.05), # Secunderabad roughly
            "lng": 78.4983 + random.uniform(-0.05, 0.05),
            "weight": random.uniform(0.5, 1.0)
        })
    for _ in range(40):
         points.append({
            "lat": 17.4435 + random.uniform(-0.03, 0.03), # Hi-Tech City roughly
            "lng": 78.3772 + random.uniform(-0.03, 0.03),
            "weight": random.uniform(0.3, 0.8)
        })
    
    return {
        "hotspots": horizontal_spread_data,
        "heatmap_points": points,
        "active_outbreaks": [d for d in horizontal_spread_data if d["trend"] in ["rising", "critical"]]
    }

@router.get("/insurance")
async def get_insurance_oversight(current_user: dict = Depends(role_required(["HealthOfficer", "Admin"]))):
    from config.db import get_database
    db = get_database()
    
    total = await db["insurance_claims"].count_documents({})
    approved = await db["insurance_claims"].count_documents({"status": "approved"})
    rejected = await db["insurance_claims"].count_documents({"status": "rejected"})
    pending = await db["insurance_claims"].count_documents({"status": {"$in": ["pending", "under_review"]}})
    
    # Calculate total value disbursed (approved amount)
    pipeline = [{"$match": {"status": "approved"}}, {"$group": {"_id": None, "total": {"$sum": "$approved_amount"}}}]
    res = await db["insurance_claims"].aggregate(pipeline).to_list(1)
    total_val = res[0]["total"] if res else 0.0
    
    return {
        "metrics": {
            "total_claims": total,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "total_value": f"${total_val:,.2f}"
        },
        "suspicious_hospitals": [
            {
                "id": "H004",
                "name": "City Core Care",
                "flag_reason": "High rejection rate and unusual spike in identical billing codes.",
                "claim_volume": 12,
                "risk_level": "High"
            }
        ],
        "recent_audits": [
            {"id": "AUD-992", "date": "2026-03-30", "target": "Apollo General", "status": "Passed"}
        ]
    }
