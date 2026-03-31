from fastapi import APIRouter, Depends
from middleware.roleMiddleware import role_required
from config.db import get_database
from models.Announcement import AnnouncementModel
from datetime import datetime
import json

router = APIRouter()

@router.post("")
async def create_announcement(ann: AnnouncementModel, current_user: dict = Depends(role_required(["Admin", "HospitalAdmin", "HealthOfficer"]))):
    db = get_database()
    doc = ann.model_dump()
    res = await db["announcements"].insert_one(doc)
    doc["id"] = str(res.inserted_id)
    del doc["_id"]
    
    doc["created_at"] = doc["created_at"].isoformat()
    doc["valid_till"] = doc["valid_till"].isoformat()
    
    # Broadcast to specific roles or everyone
    from realtime.socket import manager
    try:
        await manager.broadcast(json.dumps({
            "type": "NEW_ANNOUNCEMENT",
            "announcement": doc
        }))
    except Exception as e:
        print("Announcement broadcast failed", e)
        
    return {"message": "Announcement posted", "data": doc}

@router.get("")
async def list_announcements(hospital_id: str = "SYSTEM", target_role: str = None):
    db = get_database()
    now_utc = datetime.utcnow()
    query = {"valid_till": {"$gte": now_utc}}
    if hospital_id:
        query["hospital_id"] = {"$in": [hospital_id, "SYSTEM"]}
    if target_role:
        query["target_role"] = {"$in": [target_role, "ALL"]}
        
    cursor = db["announcements"].find(query).sort("created_at", -1)
    results = await cursor.to_list(100)
    for r in results:
        r["id"] = str(r["_id"])
        del r["_id"]
        
    return results
