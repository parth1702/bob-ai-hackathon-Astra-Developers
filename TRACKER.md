# 📋 Team Astra: Supply Chain Disruption & Fleet Optimizer Tracker

> **Hackathon Track:** L2 Supply Chain Disruption Assistant & Fleet Utilisation Optimizer  
> **Team:** Astra Developers (4 Team Members)  
> **Branch:** `feature/supply-chain-optimizer`  
> **Target:** Full working end-to-end prototype + Documentation + Submission

---

## 👥 Roles & Ownership Allocation

| Member | Role / Focus | Primary Area | Primary Deliverables |
|---|---|---|---|
| **Member 1** | **Backend & Core Optimization Engine** | `src/backend/services/disruption_service.py`, `fleet_service.py` | Disruption hazard matching, dynamic detour generator, idle asset rebalancing solver |
| **Member 2** | **Cold Chain IoT & Regulatory Classifier** | `src/backend/services/cold_chain_service.py`, `models/iot.py` | Sensor telemetry streaming, MKT calculation, FDA/WHO GDP excursion severity classification |
| **Member 3** | **Frontend Control Tower UI** | `src/frontend/` | Operations Dashboard, Global map visualization, Re-route modal, live telemetry charts |
| **Member 4** | **IBM Bob Copilot, Docs & Submission** | `submission.yaml`, `docs/`, `demo/`, `bob_copilot_service.py` | Bob Agentic integration, complete docs, presentation slides, video recording & CI check |

---

## 📊 Feature & Task Board

### 🟢 1. Core Backend & Routing Engine (Member 1)
- [x] **T1.1** Project structure and dependency definitions (`requirements.txt`)
- [x] **T1.2** Core data models (`Shipment`, `Route`, `DisruptionEvent`, `FleetAsset`)
- [x] **T1.3** Realistic seed database (20+ global shipments, weather/port/geopolitical hazards)
- [x] **T1.4** Disruption impact detection algorithm (calculates route intersection & delay)
- [x] **T1.5** Dynamic re-routing & alternative carrier recommender with cost/ETA deltas
- [x] **T1.6** Idle fleet asset redeployment solver (matches idle trucks/containers to overloaded corridors)
- [x] **T1.7** REST endpoints for Shipments, Disruptions, and Fleet

---

### 🟢 2. Cold Chain IoT & Regulatory Watchdog (Member 2)
- [x] **T2.1** IoT sensor telemetry models (temperature, humidity, ambient, shock, battery)
- [x] **T2.2** Live telemetry stream & historical sensor log generator
- [x] **T2.3** Mean Kinetic Temperature (MKT) mathematical calculation engine
- [x] **T2.4** FDA 21 CFR / WHO GDP regulatory breach severity classifier:
  - *Normal* (Safe operating range: e.g., 2°C to 8°C for biologics/vaccines)
  - *Warning* (Brief transient excursion, reversible)
  - *Critical Excursion* (Sustained thermal breach exceeding MKT threshold)
  - *Immediate Quarantine* (Irreversible cargo loss, reject before delivery)
- [x] **T2.5** Real-time excursion alert REST & WebSocket simulation endpoints

---

### 🟢 3. Frontend Operations Control Tower (Member 3)
- [x] **T3.1** Modern executive dashboard shell (dark theme, glassmorphism, responsive)
- [x] **T3.2** KPI Summary Bar (Active Disruptions, At-Risk Cargo Value, Idle Fleet, Cold Chain Breaches)
- [x] **T3.3** Interactive Global Logistics Route & Hazard Map
- [x] **T3.4** Disruption Drilldown & Alternative Re-routing Drawer (with side-by-side cost/ETA comparison)
- [x] **T3.5** Fleet Asset Utilization Matrix & One-Click Rebalancing UI
- [x] **T3.6** Cold Chain Live Telemetry Monitor (real-time temp sparklines & regulatory compliance badges)
- [x] **T3.7** Frontend API client integrating with FastAPI backend

---

### 🟡 4. IBM Bob Integration, Documentation & Submission (Member 4)
- [x] **T4.1** IBM Bob Agentic Copilot endpoint (`/api/copilot/chat`) with autonomous scenario simulations
- [ ] **T4.2** Update `submission.yaml` with team member details, problem statement, and key features
- [ ] **T4.3** Update `docs/problem-statement.md` with deep domain context
- [ ] **T4.4** Update `docs/solution-overview.md` with Bob-integrated workflow
- [ ] **T4.5** Update `docs/architecture.md` with Mermaid architecture diagram
- [ ] **T4.6** Update `docs/setup-guide.md` with copy-paste runnable instructions
- [ ] **T4.7** Capture UI screenshots for `demo/screenshots/` (01-dashboard.png, 02-reroute.png, 03-coldchain.png)
- [ ] **T4.8** Add slide deck to `presentation/slides.pdf` and link in `demo/demo-video-link.txt`
- [ ] **T4.9** Verify GitHub Actions validation workflow passes (`.github/workflows/validate.yml`)

---

## 📈 Milestone Schedule

| Phase | Target Date | Milestone | Status |
|---|---|---|---|
| **Phase 1** | Day 1 | Complete codebase scaffold (FastAPI backend + React frontend + Mock engine) | ✅ Completed |
| **Phase 2** | Day 2 | Integration testing between frontend & backend, real-time sensor streams | ✅ Completed |
| **Phase 3** | Day 3 | Finalize documentation, `submission.yaml`, screenshots & demo recording | 🔄 Next Step |
| **Phase 4** | Day 4 | Final QA on clean machine, GitHub Action green tick, Final Submission | ⏳ Upcoming |
