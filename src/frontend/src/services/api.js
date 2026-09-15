const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchDisruptions() {
  const res = await fetch(`${API_BASE}/api/disruptions`);
  return res.json();
}

export async function fetchShipments() {
  const res = await fetch(`${API_BASE}/api/shipments`);
  return res.json();
}

export async function fetchImpactedShipments() {
  const res = await fetch(`${API_BASE}/api/shipments/impacted`);
  return res.json();
}

export async function rerouteShipment(shipmentId, altRouteId) {
  const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/reroute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alternative_route_id: altRouteId })
  });
  return res.json();
}

export async function fetchFleetAssets() {
  const res = await fetch(`${API_BASE}/api/fleet`);
  return res.json();
}

export async function fetchFleetRebalance() {
  const res = await fetch(`${API_BASE}/api/fleet/rebalance`);
  return res.json();
}

export async function redeployAsset(assetId, destinationHub) {
  const res = await fetch(`${API_BASE}/api/fleet/${assetId}/redeploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination_hub: destinationHub })
  });
  return res.json();
}

export async function fetchColdChainReport(shipmentId) {
  const res = await fetch(`${API_BASE}/api/cold-chain/${shipmentId}/report`);
  return res.json();
}

export async function fetchColdChainOverview() {
  const res = await fetch(`${API_BASE}/api/cold-chain/overview`);
  return res.json();
}

export async function askBob(prompt, shipmentId = null, disruptionId = null) {
  const res = await fetch(`${API_BASE}/api/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      selected_shipment_id: shipmentId,
      selected_disruption_id: disruptionId
    })
  });
  return res.json();
}

export async function fetchQuickScenarios() {
  const res = await fetch(`${API_BASE}/api/copilot/quick-scenarios`);
  return res.json();
}
