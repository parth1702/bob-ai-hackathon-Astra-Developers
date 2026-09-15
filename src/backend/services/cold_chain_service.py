import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from models.iot import (
    TelemetryPoint,
    ColdChainExcursionReport,
    RegulatoryStatus
)
from data.seed_data import SEED_SHIPMENTS

DELTA_H_OVER_R = 10000.0  # Activation energy / Gas constant in Kelvin for pharma stability

def calculate_mean_kinetic_temperature(temperatures_c: List[float]) -> float:
    """
    Calculates the Mean Kinetic Temperature (MKT) in Celsius according to USP <1150> / WHO standards:
    MKT = (dH/R) / [ -ln( (1/n) * sum(e^(-dH/(R*Tk))) ) ] - 273.15
    """
    if not temperatures_c:
        return 4.0
    n = len(temperatures_c)
    exp_sum = 0.0
    for t_c in temperatures_c:
        t_kelvin = t_c + 273.15
        exp_sum += math.exp(-DELTA_H_OVER_R / t_kelvin)
    
    avg_exp = exp_sum / n
    if avg_exp <= 0:
        return sum(temperatures_c) / n
    mkt_kelvin = DELTA_H_OVER_R / (-math.log(avg_exp))
    return round(mkt_kelvin - 273.15, 2)

class ColdChainService:
    def __init__(self):
        self.telemetry_cache: Dict[str, List[TelemetryPoint]] = {}
        self._init_simulated_telemetry()

    def _init_simulated_telemetry(self):
        """Generates realistic 24-hour time series IoT sensor data for cold chain shipments."""
        now = datetime.now(timezone.utc)
        
        # 1. SHP-101 (Vaccines): Overheating excursion in the Red Sea
        points_101: List[TelemetryPoint] = []
        base_temp = 4.5
        for i in range(24):
            dt = (now - timedelta(minutes=(24 - i) * 30)).strftime("%H:%M")
            if i > 17:
                # Temperature surge past 8.0°C limit
                temp = round(8.0 + (i - 17) * 0.45, 2)
                is_exc = True
            else:
                temp = round(base_temp + (i % 3) * 0.2, 2)
                is_exc = False
            points_101.append(TelemetryPoint(
                timestamp=dt,
                temperature_c=temp,
                humidity_pct=round(48.0 + (i % 5) * 1.5, 1),
                ambient_temp_c=38.5,
                battery_pct=round(75.0 - i * 0.6, 1),
                shock_g=0.08,
                lat=13.8,
                lng=42.9,
                is_excursion=is_exc
            ))
        self.telemetry_cache["SHP-101"] = points_101

        # 2. SHP-102 (Oncology Biologics): Approaching lower freeze threshold in Chicago
        points_102: List[TelemetryPoint] = []
        for i in range(24):
            dt = (now - timedelta(minutes=(24 - i) * 30)).strftime("%H:%M")
            if i > 19:
                # Dipping close to 2.0°C freeze boundary
                temp = round(2.3 - (i - 19) * 0.2, 2)
                is_exc = (temp < 2.0)
            else:
                temp = round(4.8 - i * 0.1, 2)
                is_exc = False
            points_102.append(TelemetryPoint(
                timestamp=dt,
                temperature_c=temp,
                humidity_pct=round(44.0 + (i % 4), 1),
                ambient_temp_c=-24.0,
                battery_pct=round(62.0 - i * 0.4, 1),
                shock_g=0.12,
                lat=41.9,
                lng=-87.7,
                is_excursion=is_exc
            ))
        self.telemetry_cache["SHP-102"] = points_102

        # 3. SHP-105 (Salmon): Optimal steady temperature
        points_105: List[TelemetryPoint] = []
        for i in range(24):
            dt = (now - timedelta(minutes=(24 - i) * 30)).strftime("%H:%M")
            temp = round(1.8 + (i % 4) * 0.2, 2)
            points_105.append(TelemetryPoint(
                timestamp=dt,
                temperature_c=temp,
                humidity_pct=85.0,
                ambient_temp_c=28.0,
                battery_pct=88.0,
                shock_g=0.05,
                lat=8.85,
                lng=-79.55,
                is_excursion=False
            ))
        self.telemetry_cache["SHP-105"] = points_105

    def get_shipment_telemetry(self, shipment_id: str) -> List[TelemetryPoint]:
        return self.telemetry_cache.get(shipment_id, [])

    def evaluate_regulatory_severity(self, shipment_id: str) -> ColdChainExcursionReport:
        # Find shipment
        shipment = next((s for s in SEED_SHIPMENTS if s.id == shipment_id), None)
        if not shipment or not shipment.requires_cold_chain:
            return ColdChainExcursionReport(
                shipment_id=shipment_id,
                tracking_number="N/A",
                cargo_name="Non-Cold Chain Goods",
                target_min_c=0.0,
                target_max_c=30.0,
                current_temp_c=20.0,
                mean_kinetic_temp_c=20.0,
                highest_temp_c=20.0,
                lowest_temp_c=20.0,
                total_excursion_minutes=0,
                regulatory_status=RegulatoryStatus.FULLY_COMPLIANT,
                containment_action_required="No action needed. Standard ambient transit.",
                cargo_value_at_risk_usd=0.0
            )

        telemetry = self.get_shipment_telemetry(shipment_id)
        temps = [p.temperature_c for p in telemetry]
        curr_temp = temps[-1] if temps else 4.0
        mkt = calculate_mean_kinetic_temperature(temps)
        min_temp = min(temps) if temps else curr_temp
        max_temp = max(temps) if temps else curr_temp
        
        target_min = shipment.target_temp_min_c if shipment.target_temp_min_c is not None else 2.0
        target_max = shipment.target_temp_max_c if shipment.target_temp_max_c is not None else 8.0

        excursion_points = [p for p in telemetry if p.temperature_c < target_min or p.temperature_c > target_max]
        total_excursion_mins = len(excursion_points) * 30

        # Classification based on WHO/FDA GDP criteria
        if total_excursion_mins == 0:
            status = RegulatoryStatus.FULLY_COMPLIANT
            action = "Nominal thermal integrity maintained. No intervention required."
            time_left = None
            at_risk_val = 0.0
        elif total_excursion_mins <= 45 and (curr_temp - target_max) < 1.0:
            status = RegulatoryStatus.WARNING_TRANSIENT_EXCURSION
            action = "Inspect reefer compressor airflow and battery cycle. Transient breach within reversible stability buffer."
            time_left = 180
            at_risk_val = shipment.value_usd * 0.25
        elif total_excursion_mins > 180 or curr_temp >= (target_max + 7.0):
            status = RegulatoryStatus.IRREVERSIBLE_SPOILAGE_QUARANTINE
            action = "Product stability compromised beyond safe biological threshold. Flag for FDA/WHO quarantine upon dock arrival. Trigger insurance claim."
            time_left = 0
            at_risk_val = shipment.value_usd
        else:
            status = RegulatoryStatus.CRITICAL_THERMAL_EXCURSION
            action = "URGENT: Initiate re-icing or transfer cargo to secondary powered reefer immediately. Delivery risk imminent."
            time_left = 75
            at_risk_val = shipment.value_usd

        return ColdChainExcursionReport(
            shipment_id=shipment.id,
            tracking_number=shipment.tracking_number,
            cargo_name=shipment.cargo_name,
            target_min_c=target_min,
            target_max_c=target_max,
            current_temp_c=curr_temp,
            mean_kinetic_temp_c=mkt,
            highest_temp_c=max_temp,
            lowest_temp_c=min_temp,
            total_excursion_minutes=total_excursion_mins,
            regulatory_status=status,
            time_to_irreversible_spoilage_mins=time_left,
            containment_action_required=action,
            cargo_value_at_risk_usd=at_risk_val,
            recent_telemetry=telemetry
        )

cold_chain_service = ColdChainService()
