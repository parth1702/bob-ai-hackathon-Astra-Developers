from datetime import datetime, timezone
from typing import Dict, Any, List
from models.copilot import CopilotQuery, CopilotResponse, ActionRecommendation
from services.disruption_service import disruption_service
from services.fleet_service import fleet_service
from services.cold_chain_service import cold_chain_service

class BobCopilotService:
    def answer_query(self, query: CopilotQuery) -> CopilotResponse:
        prompt_lower = query.prompt.lower()
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        disruptions = disruption_service.get_all_disruptions()
        impacted_shipments = disruption_service.get_impacted_shipments()
        idle_assets = fleet_service.get_idle_assets()
        fleet_recomms = fleet_service.generate_rebalance_recommendations()

        # Intent detection
        if any(w in prompt_lower for w in ["red sea", "suez", "bab-el-mandeb", "shp-101", "vaccine"]):
            exc_report = cold_chain_service.evaluate_regulatory_severity("SHP-101")
            return CopilotResponse(
                answer=(
                    f"⚠️ **Incident Intelligence: Red Sea Maritime Crisis**\n\n"
                    f"The Bab-el-Mandeb conflict is currently blocking vessel transit for **SHP-101** carrying "
                    f"*{exc_report.cargo_name}* (Value: ${exc_report.cargo_value_at_risk_usd:,.0f}).\n\n"
                    f"• **Thermal Telemetry:** Current Reefer Temp is **{exc_report.current_temp_c}°C** (Target: 2°C - 8°C). "
                    f"MKT is **{exc_report.mean_kinetic_temp_c}°C**. Status: **{exc_report.regulatory_status.value}**.\n"
                    f"• **Time to Spoilage:** ~{exc_report.time_to_irreversible_spoilage_mins} minutes remaining before irreversible loss.\n\n"
                    f"**Autonomous Agent Recommendation:** Switch transport mode immediately from ocean freight to "
                    f"**Emirates SkyCargo Cold-Chain Air Bridge**. Reduces ETA from 168h to 26h and avoids the entire conflict zone."
                ),
                intent_detected="DISRUPTION_MITIGATION_COLD_CHAIN",
                recommendations=[
                    ActionRecommendation(
                        action_type="APPLY_REROUTE",
                        title="Reroute SHP-101 via Emirates SkyCargo",
                        description="Bypass Bab-el-Mandeb with temperature-controlled air freight corridor (Brussels -> Dubai).",
                        payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"}
                    )
                ],
                relevant_shipment_ids=["SHP-101"],
                relevant_disruption_ids=["DIS-01"],
                generated_at=now_str
            )

        elif any(w in prompt_lower for w in ["rotterdam", "strike", "shp-103", "battery"]):
            return CopilotResponse(
                answer=(
                    f"🚨 **Labor Strike Bottleneck: Port of Rotterdam**\n\n"
                    f"Terminal operations at Maasvlakte are paralyzed. **SHP-103** (EV Battery Packs, $430K value) is facing a 48h delay.\n\n"
                    f"• **Fleet Rebalance Opportunity:** Detected idle electric hauler **EV-TRK-301** in Antwerp (98 km away) and "
                    f"deep-water container berths in Wilhelmshaven.\n\n"
                    f"**Autonomous Agent Recommendation:** Divert vessel to Port of Wilhelmshaven and deploy JadeWeserRail + "
                    f"idle Antwerp haulers to unblock German automotive supply line."
                ),
                intent_detected="PORT_STRIKE_FLEET_REDEPLOYMENT",
                recommendations=[
                    ActionRecommendation(
                        action_type="APPLY_REROUTE",
                        title="Divert SHP-103 to Port of Wilhelmshaven",
                        description="Avoid Rotterdam strike by utilizing northern German multi-modal corridor.",
                        payload={"shipment_id": "SHP-103", "alternative_route_id": "RO-103-ALT1"}
                    ),
                    ActionRecommendation(
                        action_type="EXECUTE_FLEET_REDEPLOYMENT",
                        title="Deploy Antwerp Idle Hauler TRK-301",
                        description="Dispatch Class 8 EV truck to evacuate backlogged containers.",
                        payload={"asset_id": "TRK-301", "destination": "Port of Rotterdam Maasvlakte"}
                    )
                ],
                relevant_shipment_ids=["SHP-103"],
                relevant_disruption_ids=["DIS-02"],
                generated_at=now_str
            )

        elif any(w in prompt_lower for w in ["fleet", "idle", "rebalance", "truck", "container"]):
            rebal_count = len(fleet_recomms)
            total_saved = sum(r.potential_prevented_loss_usd for r in fleet_recomms)
            return CopilotResponse(
                answer=(
                    f"🚛 **Fleet Asset Utilization Optimization Report**\n\n"
                    f"Identified **{len(idle_assets)} idle fleet assets** across Antwerp, Indianapolis, Wilhelmshaven, and Panama.\n\n"
                    f"• Generated **{rebal_count} high-ROI redeployment plans**.\n"
                    f"• Potential Prevented Supply Chain Loss: **${total_saved:,.0f} USD**.\n"
                    f"• Primary priority: Dispatch **DH-US-302** from Indianapolis to rescue frozen Chicago biologics cargo."
                ),
                intent_detected="FLEET_OPTIMIZATION",
                recommendations=[
                    ActionRecommendation(
                        action_type="EXECUTE_FLEET_REDEPLOYMENT",
                        title=f"Deploy {r.asset_code} -> {r.to_hub}",
                        description=f"{r.reason} (Est ROI: {r.roi_ratio}x)",
                        payload={"asset_id": r.asset_id, "destination": r.to_hub}
                    ) for r in fleet_recomms[:3]
                ],
                relevant_shipment_ids=[r.target_shipment_id for r in fleet_recomms if r.target_shipment_id],
                relevant_disruption_ids=["DIS-02", "DIS-03"],
                generated_at=now_str
            )

        elif any(w in prompt_lower for w in ["cold chain", "temperature", "excursion", "fda", "who"]):
            report_101 = cold_chain_service.evaluate_regulatory_severity("SHP-101")
            report_102 = cold_chain_service.evaluate_regulatory_severity("SHP-102")
            return CopilotResponse(
                answer=(
                    f"❄️ **Cold Chain IoT & Regulatory Excursion Status**\n\n"
                    f"Active surveillance across all temperature-controlled reefers:\n\n"
                    f"1. **SHP-101 (mRNA Vaccines)**: {report_101.current_temp_c}°C (Threshold: 2-8°C). "
                    f"Status: **{report_101.regulatory_status.value}**. {report_101.containment_action_required}\n"
                    f"2. **SHP-102 (Oncology Biologics)**: {report_102.current_temp_c}°C (Threshold: 2-8°C). "
                    f"Status: **{report_102.regulatory_status.value}** due to Chicago sub-zero exposure.\n\n"
                    f"Compliance Framework: *{report_101.regulatory_standard}*."
                ),
                intent_detected="COLD_CHAIN_AUDIT",
                recommendations=[
                    ActionRecommendation(
                        action_type="APPLY_REROUTE",
                        title="Emergency Transfer SHP-101 to Air Cold-Box",
                        description="Prevent spoilage of $680,000 vaccine shipment.",
                        payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"}
                    )
                ],
                relevant_shipment_ids=["SHP-101", "SHP-102"],
                relevant_disruption_ids=["DIS-01", "DIS-03"],
                generated_at=now_str
            )

        # Default overview
        total_at_risk = sum(s.value_usd for s in impacted_shipments)
        return CopilotResponse(
            answer=(
                f"🌐 **Bob Logistics Control Tower Status**\n\n"
                f"• **Active Disruptions:** {len(disruptions)} global events (Red Sea, Rotterdam strike, Chicago freeze, Panama drought).\n"
                f"• **At-Risk Shipments:** {len(impacted_shipments)} consignments valued at **${total_at_risk:,.0f} USD**.\n"
                f"• **Fleet Optimization:** {len(idle_assets)} idle assets ready for automated redeployment.\n"
                f"• **Cold-Chain Alerts:** 1 critical thermal breach requiring immediate intervention (SHP-101).\n\n"
                f"Ask me about any specific disruption, shipment, or click an action below to execute automated mitigation."
            ),
            intent_detected="GENERAL_OVERVIEW",
            recommendations=[
                ActionRecommendation(
                    action_type="APPLY_REROUTE",
                    title="Mitigate SHP-101 Red Sea Disruption",
                    description="Reroute $680K vaccine shipment via Emirates SkyCargo air bridge.",
                    payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"}
                ),
                ActionRecommendation(
                    action_type="EXECUTE_FLEET_REDEPLOYMENT",
                    title="Redeploy Idle Trucks to Rotterdam",
                    description="Dispatch idle haulers to alleviate dock strike backlog.",
                    payload={"asset_id": "TRK-301", "destination": "Port of Rotterdam Maasvlakte"}
                )
            ],
            relevant_shipment_ids=[s.id for s in impacted_shipments],
            relevant_disruption_ids=[d.id for d in disruptions],
            generated_at=now_str
        )

bob_copilot_service = BobCopilotService()
