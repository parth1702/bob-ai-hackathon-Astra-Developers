from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.shipment import Shipment
from services.disruption_service import disruption_service

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])

class RerouteRequest(BaseModel):
    alternative_route_id: str

@router.get("", response_model=List[Shipment])
def get_all_shipments():
    return disruption_service.shipments

@router.get("/impacted", response_model=List[Shipment])
def get_impacted_shipments(disruption_id: Optional[str] = None):
    return disruption_service.get_impacted_shipments(disruption_id)

@router.get("/{shipment_id}", response_model=Shipment)
def get_shipment_by_id(shipment_id: str):
    for s in disruption_service.shipments:
        if s.id == shipment_id:
            return s
    raise HTTPException(status_code=404, detail="Shipment not found")

@router.post("/{shipment_id}/reroute")
def reroute_shipment(shipment_id: str, req: RerouteRequest):
    result = disruption_service.apply_reroute(shipment_id, req.alternative_route_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
