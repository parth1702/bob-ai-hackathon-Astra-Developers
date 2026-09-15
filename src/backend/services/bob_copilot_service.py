"""
Bob Copilot Service — powered by Groq LLM (primary) / Gemini (fallback).
Falls back gracefully to rule-based responses if no API key is present.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from models.copilot import CopilotQuery, CopilotResponse, ActionRecommendation
from services.disruption_service import disruption_service
from services.fleet_service import fleet_service
from services.cold_chain_service import cold_chain_service
from services.llm_service import query_llm, is_llm_available


class BobCopilotService:

    def answer_query(self, query: CopilotQuery) -> CopilotResponse:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        # Gather live operational context
        disruptions   = disruption_service.get_all_disruptions()
        impacted      = disruption_service.get_impacted_shipments()
        all_shipments = disruption_service.shipments
        idle_assets   = fleet_service.get_idle_assets()
        fleet_recomms = fleet_service.generate_rebalance_recommendations()

        # Build cold-chain reports for context
        cold_chain_reports = []
        for s in all_shipments:
            if s.requires_cold_chain:
                cold_chain_reports.append(
                    cold_chain_service.evaluate_regulatory_severity(s.id)
                )

        # ── LLM path (Groq / Gemini) ──────────────────────────────────────────
        if is_llm_available():
            llm_answer = query_llm(
                prompt=query.prompt,
                disruptions=disruptions,
                shipments=all_shipments,
                fleet=fleet_service.get_all_assets(),
                cold_chain=cold_chain_reports,
            )
            # Smart recommendation inference from context keywords in prompt + LLM answer
            recommendations = self._infer_recommendations(query.prompt, llm_answer, fleet_recomms)
            return CopilotResponse(
                answer=llm_answer,
                intent_detected="LLM_REASONING",
                recommendations=recommendations,
                relevant_shipment_ids=[s.id for s in impacted],
                relevant_disruption_ids=[d.id for d in disruptions if d.is_active],
                generated_at=now_str,
            )

        # ── Rule-based fallback (no API key) ─────────────────────────────────
        return self._rule_based_response(
            query, disruptions, impacted, idle_assets, fleet_recomms,
            cold_chain_reports, now_str
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _infer_recommendations(
        self, prompt: str, llm_answer: str, fleet_recomms
    ) -> List[ActionRecommendation]:
        """
        Extract actionable recommendations by reading the prompt/answer for
        shipment and asset references, then building structured action objects.
        """
        recs: List[ActionRecommendation] = []
        combined = (prompt + " " + llm_answer).lower()

        if any(k in combined for k in ["shp-101", "vaccine", "msc", "red sea", "emirates"]):
            recs.append(ActionRecommendation(
                action_type="APPLY_REROUTE",
                title="Reroute SHP-101 via Emirates SkyCargo Air Bridge",
                description="Emergency air-freight bypass: Brussels → Dubai → Mumbai. ETA 26h vs 312h.",
                payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"},
            ))

        if any(k in combined for k in ["shp-102", "chicago", "biologics", "polar vortex", "oncology"]):
            recs.append(ActionRecommendation(
                action_type="APPLY_REROUTE",
                title="Reroute SHP-102 via Indianapolis Heated Bypass",
                description="FedEx Custom Critical heated reefer route avoiding I-94 closure.",
                payload={"shipment_id": "SHP-102", "alternative_route_id": "RO-102-ALT1"},
            ))

        if any(k in combined for k in ["shp-103", "rotterdam", "battery", "hapag", "wilhelmshaven"]):
            recs.append(ActionRecommendation(
                action_type="APPLY_REROUTE",
                title="Divert SHP-103 to Wilhelmshaven + JadeWeserRail",
                description="Bypass Rotterdam strike via northern German multimodal corridor.",
                payload={"shipment_id": "SHP-103", "alternative_route_id": "RO-103-ALT1"},
            ))

        if any(k in combined for k in ["shp-104", "semiconductor", "panama", "tsmc"]):
            recs.append(ActionRecommendation(
                action_type="APPLY_REROUTE",
                title="Divert SHP-104 via US West Coast Landbridge",
                description="Port of LA → Union Pacific transcontinental rail to Newark.",
                payload={"shipment_id": "SHP-104", "alternative_route_id": "RO-104-ALT1"},
            ))

        if any(k in combined for k in ["fleet", "idle", "redeploy", "truck", "antwerp", "trk-301"]):
            recs.append(ActionRecommendation(
                action_type="EXECUTE_FLEET_REDEPLOYMENT",
                title="Deploy EV-TRK-301 to Port of Rotterdam",
                description="Antwerp EV hauler (31.5h idle, 98km away) to evacuate strike backlog.",
                payload={"asset_id": "FA-001", "destination": "Port of Rotterdam Maasvlakte"},
            ))

        if any(k in combined for k in ["indianapolis", "dh-us", "302", "biologics", "heated"]):
            recs.append(ActionRecommendation(
                action_type="EXECUTE_FLEET_REDEPLOYMENT",
                title="Deploy DH-US-302 to Chicago (Heated Reefer)",
                description="Indianapolis heated diesel hauler to rescue frozen oncology biologics.",
                payload={"asset_id": "FA-002", "destination": "Chicago O'Hare Air Cargo (Heated)"},
            ))

        # Add top fleet recommendations if user asked about fleet broadly
        if not recs and fleet_recomms:
            for r in fleet_recomms[:2]:
                recs.append(ActionRecommendation(
                    action_type="EXECUTE_FLEET_REDEPLOYMENT",
                    title=f"Deploy {r.asset_code} → {r.to_hub}",
                    description=f"{r.reason} (ROI: {r.roi_ratio}x)",
                    payload={"asset_id": r.asset_id, "destination": r.to_hub},
                ))

        return recs[:3]  # Cap at 3 actions per response

    # ─────────────────────────────────────────────────────────────────────────
    # Rule-based fallback (original keyword matching, kept as safety net)
    # ─────────────────────────────────────────────────────────────────────────

    def _rule_based_response(
        self, query, disruptions, impacted, idle_assets, fleet_recomms,
        cold_chain_reports, now_str
    ) -> CopilotResponse:
        prompt_lower = query.prompt.lower()

        if any(w in prompt_lower for w in ["red sea", "suez", "bab", "shp-101", "vaccine"]):
            exc = cold_chain_service.evaluate_regulatory_severity("SHP-101")
            return CopilotResponse(
                answer=(
                    f"⚠️ **Red Sea Maritime Crisis — SHP-101**\n\n"
                    f"The Bab-el-Mandeb conflict is blocking *{exc.cargo_name}* "
                    f"(${exc.cargo_value_at_risk_usd:,.0f} at risk).\n\n"
                    f"• Reefer temp: **{exc.current_temp_c}°C** (limit: 2–8°C). "
                    f"Status: **{exc.regulatory_status.value}**\n"
                    f"• Recommend: Emirates SkyCargo air bridge (ETA 26h vs 312h)"
                ),
                intent_detected="DISRUPTION_MITIGATION_COLD_CHAIN",
                recommendations=[
                    ActionRecommendation(
                        action_type="APPLY_REROUTE",
                        title="Reroute SHP-101 via Emirates SkyCargo",
                        description="Brussels → Dubai → Mumbai. Avoids Red Sea, preserves cold chain.",
                        payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"},
                    )
                ],
                relevant_shipment_ids=["SHP-101"],
                relevant_disruption_ids=["DIS-01"],
                generated_at=now_str,
            )

        if any(w in prompt_lower for w in ["rotterdam", "strike", "shp-103", "battery"]):
            return CopilotResponse(
                answer=(
                    f"🚨 **Rotterdam Terminal Strike — SHP-103**\n\n"
                    f"EV Battery Packs ($430K) face 48h delay. Idle EV-TRK-301 in Antwerp (98 km).\n\n"
                    f"• Recommend: Divert vessel to Wilhelmshaven + JadeWeserRail corridor"
                ),
                intent_detected="PORT_STRIKE_FLEET_REDEPLOYMENT",
                recommendations=[
                    ActionRecommendation(
                        action_type="APPLY_REROUTE",
                        title="Divert SHP-103 to Wilhelmshaven",
                        description="Northern German multimodal bypass avoids Rotterdam strike.",
                        payload={"shipment_id": "SHP-103", "alternative_route_id": "RO-103-ALT1"},
                    ),
                    ActionRecommendation(
                        action_type="EXECUTE_FLEET_REDEPLOYMENT",
                        title="Deploy EV-TRK-301 to Rotterdam",
                        description="Evacuate backlogged containers from Maasvlakte terminal.",
                        payload={"asset_id": "FA-001", "destination": "Port of Rotterdam Maasvlakte"},
                    ),
                ],
                relevant_shipment_ids=["SHP-103"],
                relevant_disruption_ids=["DIS-02"],
                generated_at=now_str,
            )

        if any(w in prompt_lower for w in ["fleet", "idle", "rebalance", "truck"]):
            total_saved = sum(r.potential_prevented_loss_usd for r in fleet_recomms)
            return CopilotResponse(
                answer=(
                    f"🚛 **Fleet Optimization Report**\n\n"
                    f"{len(idle_assets)} idle assets detected. "
                    f"{len(fleet_recomms)} redeployment plans generated.\n"
                    f"Potential prevented loss: **${total_saved:,.0f} USD**"
                ),
                intent_detected="FLEET_OPTIMIZATION",
                recommendations=[
                    ActionRecommendation(
                        action_type="EXECUTE_FLEET_REDEPLOYMENT",
                        title=f"Deploy {r.asset_code} → {r.to_hub}",
                        description=f"{r.reason} (ROI: {r.roi_ratio}x)",
                        payload={"asset_id": r.asset_id, "destination": r.to_hub},
                    ) for r in fleet_recomms[:3]
                ],
                relevant_shipment_ids=[r.target_shipment_id for r in fleet_recomms if r.target_shipment_id],
                relevant_disruption_ids=["DIS-02", "DIS-03"],
                generated_at=now_str,
            )

        if any(w in prompt_lower for w in ["cold chain", "temperature", "excursion", "fda", "who"]):
            r101 = cold_chain_service.evaluate_regulatory_severity("SHP-101")
            r102 = cold_chain_service.evaluate_regulatory_severity("SHP-102")
            return CopilotResponse(
                answer=(
                    f"❄️ **Cold Chain Audit**\n\n"
                    f"• **SHP-101 (mRNA Vaccines):** {r101.current_temp_c}°C — {r101.regulatory_status.value}\n"
                    f"• **SHP-102 (Oncology):** {r102.current_temp_c}°C — {r102.regulatory_status.value}\n"
                    f"• Standard: {r101.regulatory_standard}"
                ),
                intent_detected="COLD_CHAIN_AUDIT",
                recommendations=[
                    ActionRecommendation(
                        action_type="APPLY_REROUTE",
                        title="Emergency Air Transfer SHP-101",
                        description="Prevent spoilage of $680K vaccine shipment via SkyCargo.",
                        payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"},
                    )
                ],
                relevant_shipment_ids=["SHP-101", "SHP-102"],
                relevant_disruption_ids=["DIS-01", "DIS-03"],
                generated_at=now_str,
            )

        # General overview
        total_at_risk = sum(s.value_usd for s in impacted)
        return CopilotResponse(
            answer=(
                f"🌐 **Bob Logistics Control Tower**\n\n"
                f"• **Active Disruptions:** {len(disruptions)}\n"
                f"• **At-Risk Cargo:** {len(impacted)} shipments — ${total_at_risk:,.0f}\n"
                f"• **Idle Assets:** {len(idle_assets)} ready for redeployment\n"
                f"• **Cold-Chain Alerts:** 2 active excursions (SHP-101, SHP-102)\n\n"
                f"Ask me about a specific disruption, shipment, or cold-chain issue."
            ),
            intent_detected="GENERAL_OVERVIEW",
            recommendations=[
                ActionRecommendation(
                    action_type="APPLY_REROUTE",
                    title="Mitigate SHP-101 Red Sea Disruption",
                    description="Reroute $680K vaccines via Emirates SkyCargo air bridge.",
                    payload={"shipment_id": "SHP-101", "alternative_route_id": "RO-101-ALT1"},
                ),
                ActionRecommendation(
                    action_type="EXECUTE_FLEET_REDEPLOYMENT",
                    title="Redeploy Idle Trucks to Rotterdam",
                    description="Dispatch EV-TRK-301 to alleviate dock strike backlog.",
                    payload={"asset_id": "FA-001", "destination": "Port of Rotterdam Maasvlakte"},
                ),
            ],
            relevant_shipment_ids=[s.id for s in impacted],
            relevant_disruption_ids=[d.id for d in disruptions],
            generated_at=now_str,
        )


bob_copilot_service = BobCopilotService()
