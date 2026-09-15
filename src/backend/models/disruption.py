from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class DisruptionType(str, Enum):
    WEATHER_STORM = "Severe Weather & Storm"
    PORT_STRIKE = "Port & Terminal Labor Strike"
    GEOPOLITICAL_CONFLICT = "Geopolitical Conflict & Chokepoint Blockade"
    CANAL_BLOCKAGE = "Canal / Strait Navigational Hazard"
    COLD_WAVE = "Extreme Freeze / Thermal Hazard"
    CUSTOMS_BOTTLENECK = "Customs & Border Regulatory Hold"

class DisruptionSeverity(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class DisruptionEvent(BaseModel):
    id: str
    code: str
    title: str
    type: DisruptionType
    severity: DisruptionSeverity
    description: str
    epicenter_name: str
    lat: float
    lng: float
    radius_km: float
    corridor_impacted: str
    active_since: str
    estimated_clearing_hours: float
    impacted_shipment_count: int = 0
    impacted_cargo_value_usd: float = 0.0
    suggested_mitigation: str
    is_active: bool = True
