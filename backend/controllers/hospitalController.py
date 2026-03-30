from fastapi import APIRouter, Depends
from services.hospitalService import get_nearby_hospitals, add_hospital
from models.Hospital import HospitalModel
from middleware.roleMiddleware import role_required
from middleware.authMiddleware import get_current_user

router = APIRouter()

@router.get("/nearby")
async def nearby_hospitals(lng: float, lat: float, max_radius_meters: int = 50000):
    results = await get_nearby_hospitals(lng, lat, max_radius_meters)
    return {
        "count": len(results),
        "hospitals": results
    }

@router.post("/add")
async def create_hospital(req: HospitalModel, current_user: dict = Depends(role_required(["Admin"]))):
    result = await add_hospital(req.model_dump())
    return {"message": "Hospital added. Geo-Spatial indexes updated.", "hospital": result}
