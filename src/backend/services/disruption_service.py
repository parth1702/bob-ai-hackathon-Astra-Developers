import math
from typing import List, Optional, Dict, Any
from models.disruption import DisruptionEvent
from models.shipment import Shipment, ShipmentStatus, RouteOption
from data.seed_data import SEED_DISRUPTIONS, SEED_SHIPMENTS

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS points in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class DisruptionService:
    def __init__(self):
        self.disruptions: List[DisruptionEvent] = list(SEED_DISRUPTIONS)
        self.shipments: List[Shipment] = list(SEED_SHIPMENTS)
        self.recompute_impacts()

    def get_all_disruptions(self) -> List[DisruptionEvent]:
        return self.disruptions

    def get_disruption_by_id(self, disruption_id: str) -> Optional[DisruptionEvent]:
        for d in self.disruptions:
            if d.id == disruption_id:
                return d
        return None

    def recompute_impacts(self):
        """Cross-correlates shipments against disruption hazards and corridors."""
        for d in self.disruptions:
            impacted = []
            total_value = 0.0
            for s in self.shipments:
                dist = haversine_distance_km(s.current_lat, s.current_lng, d.lat, d.lng)
                # Check direct proximity or waypoint intersection
                corridor_match = (s.active_disruption_id == d.id)
                proximity_match = (dist <= d.radius_km)
                
                if (proximity_match or corridor_match) and s.status != ShipmentStatus.DELIVERED:
                    impacted.append(s.id)
                    total_value += s.value_usd
                    if s.status != ShipmentStatus.REROUTED:
                        s.status = ShipmentStatus.DISRUPTED if d.severity == "Critical" else ShipmentStatus.AT_RISK
                        s.active_disruption_id = d.id

            d.impacted_shipment_count = len(impacted)
            d.impacted_cargo_value_usd = total_value

    def get_impacted_shipments(self, disruption_id: Optional[str] = None) -> List[Shipment]:
        if disruption_id:
            return [s for s in self.shipments if s.active_disruption_id == disruption_id]
        return [s for s in self.shipments if s.status in [ShipmentStatus.AT_RISK, ShipmentStatus.DISRUPTED]]

    def apply_reroute(self, shipment_id: str, alternative_route_id: str) -> Dict[str, Any]:
        """Switches a shipment's active corridor to the selected alternative route."""
        for s in self.shipments:
            if s.id == shipment_id:
                for alt in s.alternative_routes:
                    if alt.id == alternative_route_id:
                        old_route = s.active_route
                        s.active_route = alt
                        s.status = ShipmentStatus.REROUTED
                        s.delay_hours = max(0.0, alt.eta_hours - old_route.eta_hours)
                        self.recompute_impacts()
                        return {
                            "success": True,
                            "shipment_id": s.id,
                            "new_route_name": alt.name,
                            "eta_hours": alt.eta_hours,
                            "carrier": alt.carrier,
                            "message": f"Shipment {s.id} successfully rerouted via {alt.name}."
                        }
        return {"success": False, "message": "Shipment or alternative route not found."}

disruption_service = DisruptionService()
