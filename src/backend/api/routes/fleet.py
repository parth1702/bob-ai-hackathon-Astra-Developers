from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.fleet import FleetAsset, RebalanceRecommendation
from services.fleet_service import fleet_service

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])

class RedeployRequest(BaseModel):
    destination_hub: str

@router.get("", response_model=List[FleetAsset])
def get_all_assets():
    return fleet_service.get_all_assets()

@router.get("/idle", response_model=List[FleetAsset])
def get_idle_assets():
    return fleet_service.get_idle_assets()

@router.get("/rebalance", response_model=List[RebalanceRecommendation])
def get_rebalance_plans():
    return fleet_service.generate_rebalance_recommendations()

@router.post("/{asset_id}/redeploy")
def redeploy_asset(asset_id: str, req: RedeployRequest):
    result = fleet_service.execute_redeployment(asset_id, req.destination_hub)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
