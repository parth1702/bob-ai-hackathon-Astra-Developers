from enum import Enum
from typing import Optional
from pydantic import BaseModel

class AssetType(str, Enum):
    REEFER_CONTAINER = "Reefer Smart Container"
    DRY_CONTAINER = "Standard 40ft Dry Container"
    ELECTRIC_TRUCK = "Electric Heavy Hauler"
    DIESEL_HAULER = "Class 8 Long-Haul Truck"
    FEEDER_VESSEL = "Feeder Vessel (Coastal)"
    CARGO_AIRCRAFT = "Air Cargo Freighter"

class AssetStatus(str, Enum):
    IDLE_AVAILABLE = "Idle & Available"
    IN_TRANSIT = "In Transit"
    LOADING = "Loading / Yard Operations"
    MAINTENANCE = "Maintenance / Inspection"

class FleetAsset(BaseModel):
    id: str
    asset_code: str
    asset_type: AssetType
    status: AssetStatus
    current_hub_name: str
    current_lat: float
    current_lng: float
    capacity_tons: float
    has_cold_chain_capability: bool = False
    battery_or_fuel_pct: float
    hours_idle: float = 0.0
    operational_cost_per_km: float
    assigned_shipment_id: Optional[str] = None

class RebalanceRecommendation(BaseModel):
    id: str
    asset_id: str
    asset_code: str
    asset_type: AssetType
    from_hub: str
    to_hub: str
    target_shipment_id: Optional[str] = None
    target_cargo_name: Optional[str] = None
    distance_km: float
    est_transit_hours: float
    estimated_reposition_cost_usd: float
    potential_prevented_loss_usd: float
    roi_ratio: float
    reason: str
    priority: str = "HIGH"
