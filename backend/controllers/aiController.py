from fastapi import APIRouter
from pydantic import BaseModel
from services.aiService import suggest_specialist_by_symptoms

router = APIRouter()

class TriageRequest(BaseModel):
    symptoms: str

@router.post("/triage")
async def ai_triage(req: TriageRequest):
    # Public endpoint allowing users to type symptoms and receive an AI doctor suggestion
    result = await suggest_specialist_by_symptoms(req.symptoms)
    return result
