from typing import List, Optional, Dict, Any
from models.fleet import FleetAsset, AssetStatus, RebalanceRecommendation
from data.seed_data import SEED_FLEET_ASSETS
from services.disruption_service import haversine_distance_km

class FleetService:
    def __init__(self):
        self.assets: List[FleetAsset] = list(SEED_FLEET_ASSETS)

    def get_all_assets(self) -> List[FleetAsset]:
        return self.assets

    def get_idle_assets(self) -> List[FleetAsset]:
        return [a for a in self.assets if a.status == AssetStatus.IDLE_AVAILABLE]

    def generate_rebalance_recommendations(self) -> List[RebalanceRecommendation]:
        """Identifies idle fleet capacity and pairs them with disrupted bottlenecks."""
        recommendations: List[RebalanceRecommendation] = []
        idle_assets = self.get_idle_assets()

        for asset in idle_assets:
            if "Antwerp" in asset.current_hub_name:
                # Can redeploy to assist Rotterdam dock strike backlog
                dist = 98.0
                cost = dist * asset.operational_cost_per_km
                recommendations.append(RebalanceRecommendation(
                    id=f"REBAL-{asset.id}-ROTTERDAM",
                    asset_id=asset.id,
                    asset_code=asset.asset_code,
                    asset_type=asset.asset_type,
                    from_hub=asset.current_hub_name,
                    to_hub="Port of Rotterdam Maasvlakte",
                    target_shipment_id="SHP-103",
                    target_cargo_name="Automotive EV Lithium Battery Packs",
                    distance_km=dist,
                    est_transit_hours=1.8,
                    estimated_reposition_cost_usd=round(cost, 2),
                    potential_prevented_loss_usd=430000.0,
                    roi_ratio=round(430000.0 / (cost + 1), 1),
                    reason="Relieve Port of Rotterdam terminal strike backlog by trucking freight directly to inland dry ports.",
                    priority="CRITICAL"
                ))

            elif "Indianapolis" in asset.current_hub_name:
                # Can redeploy to assist Chicago cold wave stuck biologics
                dist = 295.0
                cost = dist * asset.operational_cost_per_km
                recommendations.append(RebalanceRecommendation(
                    id=f"REBAL-{asset.id}-CHICAGO",
                    asset_id=asset.id,
                    asset_code=asset.asset_code,
                    asset_type=asset.asset_type,
                    from_hub=asset.current_hub_name,
                    to_hub="Chicago Distribution Hub",
                    target_shipment_id="SHP-102",
                    target_cargo_name="Temperature-Sensitive Oncology Biologics",
                    distance_km=dist,
                    est_transit_hours=4.5,
                    estimated_reposition_cost_usd=round(cost, 2),
                    potential_prevented_loss_usd=820000.0,
                    roi_ratio=round(820000.0 / (cost + 1), 1),
                    reason="Deploy heavy heated hauler to rescue stuck reefer container threatened by Midwest sub-zero polar vortex.",
                    priority="CRITICAL"
                ))

            elif "Wilhelmshaven" in asset.current_hub_name:
                recommendations.append(RebalanceRecommendation(
                    id=f"REBAL-{asset.id}-HAMBURG",
                    asset_id=asset.id,
                    asset_code=asset.asset_code,
                    asset_type=asset.asset_type,
                    from_hub=asset.current_hub_name,
                    to_hub="Hamburg Logistics Railhead",
                    target_shipment_id=None,
                    target_cargo_name="General European Export Freight",
                    distance_km=180.0,
                    est_transit_hours=2.5,
                    estimated_reposition_cost_usd=250.0,
                    potential_prevented_loss_usd=120000.0,
                    roi_ratio=480.0,
                    reason="Reposition idle 40ft dry box to capture diverted rail freight from congested Dutch corridors.",
                    priority="MEDIUM"
                ))

        return recommendations

    def execute_redeployment(self, asset_id: str, destination_hub: str) -> Dict[str, Any]:
        for asset in self.assets:
            if asset.id == asset_id:
                asset.status = AssetStatus.IN_TRANSIT
                asset.hours_idle = 0.0
                return {
                    "success": True,
                    "asset_id": asset.id,
                    "asset_code": asset.asset_code,
                    "new_status": asset.status,
                    "destination": destination_hub,
                    "message": f"Asset {asset.asset_code} dispatched to {destination_hub}."
                }
        return {"success": False, "message": "Asset not found."}

fleet_service = FleetService()
