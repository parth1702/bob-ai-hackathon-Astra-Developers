"""
LLM Service — Groq (primary) + Google Gemini (fallback)
Replaces hardcoded keyword matching with real AI reasoning.
Uses free tier API keys configured via .env
"""
import os
import json
from typing import Optional

# ── Groq ──────────────────────────────────────────────────────────────────────
try:
    from groq import Groq
    _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", "")) if os.getenv("GROQ_API_KEY") else None
except ImportError:
    _groq_client = None

# ── Google Gemini (fallback) ──────────────────────────────────────────────────
try:
    import google.generativeai as genai
    _gemini_key = os.getenv("GEMINI_API_KEY", "")
    if _gemini_key:
        genai.configure(api_key=_gemini_key)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
    else:
        _gemini_model = None
except ImportError:
    _gemini_model = None

SYSTEM_PROMPT = """You are Bob, an autonomous AI supply chain operations copilot built by IBM.
You are monitoring a global logistics control tower in real-time.

Your capabilities:
- Disruption impact analysis (geopolitical conflicts, port strikes, weather events)
- Route & carrier optimization (cost, ETA, reliability, cold-chain compliance)
- Fleet asset rebalancing (idle trucks, containers, vessels)
- Cold-chain IoT monitoring (WHO/FDA regulatory classification, thermal excursion alerts)

Response rules:
1. Always start with a bold emoji headline (e.g. "⚠️ **Incident Alert:**")
2. Reference specific shipment IDs (SHP-XXX), asset codes, and disruption IDs from context
3. Give concrete numbers (INR/₹, hours, km) not vague estimates
4. End with 1–3 specific recommended ACTIONS the operator can take
5. Keep response under 300 words — be precise, not verbose
6. Use markdown bullet points for clarity"""


def _build_context(disruptions=None, shipments=None, fleet=None, cold_chain=None) -> str:
    """Serialize live operational data into the prompt context."""
    parts = []

    if disruptions:
        parts.append("ACTIVE DISRUPTIONS:")
        for d in disruptions[:4]:  # Limit tokens
            parts.append(
                f"  [{d.id}] {d.title} | Severity: {d.severity} | "
                f"Affected: {d.impacted_shipment_count} shipments, "
                f"₹{(d.impacted_cargo_value_usd * 85):,.0f} at risk"
            )

    if shipments:
        at_risk = [s for s in shipments if s.status.value in ("At Risk", "Disrupted")]
        if at_risk:
            parts.append("\nAT-RISK SHIPMENTS:")
            for s in at_risk[:5]:
                parts.append(
                    f"  [{s.id}] {s.tracking_number}: {s.cargo_name} | "
                    f"₹{(s.value_usd * 85):,.0f} | Status: {s.status.value} | "
                    f"Delay: +{s.delay_hours}h | "
                    f"{'❄️ COLD CHAIN REQUIRED' if s.requires_cold_chain else 'Ambient'}"
                )

    if fleet:
        idle = [a for a in fleet if a.status.value == "Idle & Available"]
        if idle:
            parts.append("\nIDLE FLEET ASSETS (Available for Redeployment):")
            for a in idle[:4]:
                parts.append(
                    f"  [{a.id}] {a.asset_code}: {a.asset_type.value} at {a.current_hub_name} | "
                    f"Idle {a.hours_idle}h | Fuel/Battery: {a.battery_or_fuel_pct}% | "
                    f"{'❄️ Cold-Chain' if a.has_cold_chain_capability else 'Dry'}"
                )

    if cold_chain:
        critical_cc = [c for c in cold_chain if "Critical" in c.regulatory_status.value or "Quarantine" in c.regulatory_status.value]
        if critical_cc:
            parts.append("\nCOLD CHAIN ALERTS:")
            for c in critical_cc:
                parts.append(
                    f"  [{c.shipment_id}] {c.cargo_name}: {c.current_temp_c}°C "
                    f"(Target {c.target_min_c}–{c.target_max_c}°C) | "
                    f"Status: {c.regulatory_status.value} | "
                    f"Value at Risk: ₹{(c.cargo_value_at_risk_usd * 85):,.0f}"
                )

    return "\n".join(parts) if parts else "No active operational data available."


def query_llm(
    prompt: str,
    disruptions=None,
    shipments=None,
    fleet=None,
    cold_chain=None,
) -> str:
    """
    Send prompt + live context to Groq (primary) or Gemini (fallback).
    Returns the LLM's text response, or falls back to a descriptive error.
    """
    context = _build_context(disruptions, shipments, fleet, cold_chain)
    full_system = f"{SYSTEM_PROMPT}\n\nCURRENT OPERATIONAL DATA:\n{context}"
    full_user = prompt.strip()

    # ── Try Groq first ─────────────────────────────────────────────────────────
    if _groq_client:
        try:
            response = _groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": full_system},
                    {"role": "user", "content": full_user},
                ],
                temperature=0.4,
                max_tokens=800,
            )
            return response.choices[0].message.content
        except Exception as groq_err:
            pass  # Fall through to Gemini

    # ── Fallback: Google Gemini ────────────────────────────────────────────────
    if _gemini_model:
        try:
            combined = f"{full_system}\n\nUser: {full_user}\n\nAssistant:"
            response = _gemini_model.generate_content(combined)
            return response.text
        except Exception as gemini_err:
            pass

    # ── Last resort: return None to allow rule-based fallback ────────────────
    return None


def is_llm_available() -> bool:
    """Returns True if at least one LLM provider is configured and has a non-empty key."""
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    # Check that key is not empty or dummy template
    has_groq = bool(groq_key and not groq_key.startswith("gsk_your") and not groq_key.startswith("gsk_xxxx"))
    has_gemini = bool(gemini_key and not gemini_key.startswith("your_"))
    return has_groq or has_gemini
