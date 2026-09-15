# Astra Supply Chain Disruption & Fleet Optimizer Source Code

This directory contains the full implementation of the **Supply Chain Disruption Assistant & Fleet Utilisation Optimizer** for the IBM Bob AI Hackathon.

---

## 📁 Architecture Overview

```
src/
├── backend/
│   ├── api/routes/          # REST & Copilot Endpoints
│   │   ├── shipments.py     # Corridor & shipment lifecycle endpoints
│   │   ├── disruptions.py   # Hazard surveillance & geofenced matching
│   │   ├── fleet.py         # Asset inventory & idle redeployment solver
│   │   ├── cold_chain.py    # IoT telemetry & WHO/FDA excursion audits
│   │   └── copilot.py       # IBM Bob autonomous agent conversational API
│   ├── data/
│   │   └── seed_data.py     # Global shipments, disruptions & fleet assets
│   ├── models/              # Pydantic data schemas & enums
│   ├── services/            # Core business engines
│   │   ├── disruption_service.py # Haversine distance, hazard intersection & re-routing
│   │   ├── fleet_service.py      # Idle capacity finder & ROI redeployment solver
│   │   ├── cold_chain_service.py # Mean Kinetic Temperature (MKT) & regulatory engine
│   │   └── bob_copilot_service.py# Autonomous agent reasoning & playbook executor
│   ├── main.py              # FastAPI application server entrypoint
│   └── requirements.txt     # Python dependencies
│
└── frontend/                # Operations Command Center UI (React + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx              # Navigation & real-time KPI status bar
    │   │   ├── MapViewer.jsx           # Interactive SVG global corridor & hazard map
    │   │   ├── DisruptionsPanel.jsx    # Active incident list & mitigation triggers
    │   │   ├── RerouteModal.jsx        # Side-by-side detour comparison & approval
    │   │   ├── FleetRebalancePanel.jsx # Idle asset inventory & redeployment matrix
    │   │   ├── ColdChainMonitor.jsx    # Live IoT sensor telemetry & FDA/WHO badges
    │   │   └── BobCopilot.jsx          # IBM Bob interactive conversational agent
    │   ├── services/
    │   │   └── api.js                  # Frontend API integration client
    │   ├── App.jsx                     # Master state controller & tab router
    │   ├── index.css                   # Dark mode glassmorphic styling
    │   └── main.jsx                    # React entrypoint
    └── package.json
```

---

## ⚡ How to Run Locally

### 1. Start the Backend API
```bash
# From workspace root:
pip install -r src/backend/requirements.txt
python -m uvicorn main:app --app-dir src/backend --port 8000 --reload
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Start the Frontend Command Center
```bash
# In a second terminal:
cd src/frontend
npm install
npm run dev
```
- Open browser at `http://localhost:5173`
