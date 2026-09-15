from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class CopilotQuery(BaseModel):
    prompt: str
    selected_shipment_id: Optional[str] = None
    selected_disruption_id: Optional[str] = None

class ActionRecommendation(BaseModel):
    action_type: str
    title: str
    description: str
    payload: Dict[str, Any]

class CopilotResponse(BaseModel):
    answer: str
    intent_detected: str
    recommendations: List[ActionRecommendation] = []
    relevant_shipment_ids: List[str] = []
    relevant_disruption_ids: List[str] = []
    generated_at: str

class CopilotMessage(BaseModel):
    sender: str
    message: str
    timestamp: str
