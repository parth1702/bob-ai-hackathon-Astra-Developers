from typing import List
from fastapi import APIRouter
from models.iot import ColdChainExcursionReport, TelemetryPoint
from services.cold_chain_service import cold_chain_service
from services.disruption_service import disruption_service

router = APIRouter(prefix="/api/cold-chain", tags=["Cold Chain"])

@router.get("/{shipment_id}/report", response_model=ColdChainExcursionReport)
def get_excursion_report(shipment_id: str):
    return cold_chain_service.evaluate_regulatory_severity(shipment_id)

@router.get("/{shipment_id}/telemetry", response_model=List[TelemetryPoint])
def get_telemetry(shipment_id: str):
    return cold_chain_service.get_shipment_telemetry(shipment_id)

@router.get("/overview", response_model=List[ColdChainExcursionReport])
def get_all_cold_chain_reports():
    reports = []
    for s in disruption_service.shipments:
        if s.requires_cold_chain:
            reports.append(cold_chain_service.evaluate_regulatory_severity(s.id))
    return reports
