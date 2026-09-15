from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class CargoCategory(str, Enum):
    PHARMA_VACCINE = "Pharma & Vaccines"
    PERISHABLE_FOOD = "Perishable Food"
    HIGH_VALUE_TECH = "High-Value Electronics"
    INDUSTRIAL_PARTS = "Industrial Machinery"
    GENERAL_FREIGHT = "General Freight"

class TransportMode(str, Enum):
    MARITIME = "Maritime Ocean"
    AIR = "Air Freight"
    ROAD = "Road Trucking"
    RAIL = "Intermodal Rail"
    MULTIMODAL = "Multimodal"

class ShipmentStatus(str, Enum):
    ON_SCHEDULE = "On Schedule"
    AT_RISK = "At Risk"
    DISRUPTED = "Disrupted"
    REROUTED = "Rerouted"
    DELIVERED = "Delivered"

class RouteWaypoint(BaseModel):
    name: str
    lat: float
    lng: float
    sequence: int

class RouteOption(BaseModel):
    id: str
    name: str
    mode: TransportMode
    carrier: str
    waypoints: List[RouteWaypoint]
    eta_hours: float
    cost_usd: float
    co2_kg: float
    reliability_score: float = Field(..., ge=0.0, le=1.0)
    transit_corridor: str
    is_recommended: bool = False
    bottlenecks_avoided: List[str] = []

class Shipment(BaseModel):
    id: str
    tracking_number: str
    origin_city: str
    origin_country: str
    dest_city: str
    dest_country: str
    cargo_name: str
    category: CargoCategory
    value_usd: float
    requires_cold_chain: bool = False
    target_temp_min_c: Optional[float] = None
    target_temp_max_c: Optional[float] = None
    current_lat: float
    current_lng: float
    carrier: str
    transport_mode: TransportMode
    eta_timestamp: str
    status: ShipmentStatus = ShipmentStatus.ON_SCHEDULE
    active_disruption_id: Optional[str] = None
    delay_hours: float = 0.0
    active_route: RouteOption
    alternative_routes: List[RouteOption] = []
    assigned_fleet_asset_id: Optional[str] = None
