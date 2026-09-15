from typing import List
from fastapi import APIRouter
from models.copilot import CopilotQuery, CopilotResponse
from services.bob_copilot_service import bob_copilot_service

router = APIRouter(prefix="/api/copilot", tags=["IBM Bob Copilot"])

@router.post("/chat", response_model=CopilotResponse)
def ask_bob(query: CopilotQuery):
    return bob_copilot_service.answer_query(query)

@router.get("/quick-scenarios")
def get_quick_scenarios():
    return [
        {
            "id": "q1",
            "label": "Red Sea Crisis Impact",
            "prompt": "What shipments are currently trapped by the Bab-el-Mandeb Red Sea conflict, and what is the cold chain risk?"
        },
        {
            "id": "q2",
            "label": "Rotterdam Port Strike",
            "prompt": "Port of Rotterdam dock strike is halting operations. Can we redeploy idle trucks to evacuate containers?"
        },
        {
            "id": "q3",
            "label": "Fleet Idle Rebalancing",
            "prompt": "Analyze all idle fleet assets and recommend highest-ROI redeployments to congested hubs."
        },
        {
            "id": "q4",
            "label": "Cold Chain Regulatory Audit",
            "prompt": "Audit all cold-chain shipments against WHO and FDA 21 CFR temperature standards."
        }
    ]
