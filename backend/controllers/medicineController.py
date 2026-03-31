from fastapi import APIRouter, Depends, HTTPException
from middleware.roleMiddleware import role_required
from config.db import get_database

router = APIRouter()

@router.get("/stock")
async def get_medicine_stock(hospital_id: str = None, current_user: dict = Depends(role_required(["Admin", "Doctor", "WardStaff", "WardRoom", "Pharmacy"]))):
    db = get_database()
    query = {}
    if hospital_id:
        query["hospitalId"] = hospital_id
    elif current_user.get("role") != "Admin":
         # Or any other logic isolating hospital scope
         pass
         
    stocks = await db["medicine_stocks"].find(query).to_list(1000)
    for s in stocks:
        s["id"] = str(s["_id"])
        del s["_id"]
        
    return {"status": "success", "stock": stocks}
