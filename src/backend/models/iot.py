from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

class RegulatoryStatus(str, Enum):
    FULLY_COMPLIANT = "FDA/WHO GDP Compliant"
    WARNING_TRANSIENT_EXCURSION = "Transient Excursion Warning"
    CRITICAL_THERMAL_EXCURSION = "Critical Thermal Excursion (Action Required)"
    IRREVERSIBLE_SPOILAGE_QUARANTINE = "Regulatory Quarantine (Product Spoiled)"

class TelemetryPoint(BaseModel):
    timestamp: str
    temperature_c: float
    humidity_pct: float
    ambient_temp_c: float
    battery_pct: float
    shock_g: float
    lat: float
    lng: float
    is_excursion: bool = False

class ColdChainExcursionReport(BaseModel):
    shipment_id: str
    tracking_number: str
    cargo_name: str
    target_min_c: float
    target_max_c: float
    current_temp_c: float
    mean_kinetic_temp_c: float
    highest_temp_c: float
    lowest_temp_c: float
    total_excursion_minutes: int
    regulatory_status: RegulatoryStatus
    regulatory_standard: str = "FDA 21 CFR 211.142 & WHO Good Distribution Practice"
    time_to_irreversible_spoilage_mins: Optional[int] = None
    containment_action_required: str
    cargo_value_at_risk_usd: float
    recent_telemetry: List[TelemetryPoint] = []
