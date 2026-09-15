from typing import List
from fastapi import APIRouter, HTTPException
from models.disruption import DisruptionEvent
from services.disruption_service import disruption_service

router = APIRouter(prefix="/api/disruptions", tags=["Disruptions"])

@router.get("", response_model=List[DisruptionEvent])
def get_all_disruptions():
    disruption_service.recompute_impacts()
    return disruption_service.get_all_disruptions()

@router.get("/{disruption_id}", response_model=DisruptionEvent)
def get_disruption(disruption_id: str):
    d = disruption_service.get_disruption_by_id(disruption_id)
    if not d:
        raise HTTPException(status_code=404, detail="Disruption event not found")
    return d
