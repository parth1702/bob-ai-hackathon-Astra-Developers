# 🚀 IBM Bob Supply Chain Assistant — Autonomous Risk Mitigation & Cold Chain Control Tower

> Autonomous supply chain control tower built for the IBM Bob AI Hackathon by Team **Astra-Developers**.

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Astra-Developers |
| **Track** | AI / Open |
| **Team Lead** | Parth Prajapati — parthprajapati0018@gmail.com |
| **Members** | Arman Shaikh, Parin Patel, Bhavya Patel |

---

## 🎯 Problem Statement

Supply chains face sudden severe disruptions including geopolitical conflicts, port strikes, road closures, and extreme weather. These events jeopardize hundreds of shipments while idle fleet assets remain unutilized and overloaded routes cause cascading delays. 

Furthermore, cold-chain temperature breaches (mRNA vaccines, biologics, perishable food) are often discovered only after delivery, causing catastrophic financial and regulatory cargo losses.

---

## 💡 Solution

We built **IBM Bob Supply Chain Assistant**, an autonomous AI-powered control tower that continuously monitors global supply chain telemetry, detects disruption events, and executes proactive mitigation strategies:

1. 🔴 **Disruption Impact Radar**: Instantly maps affected shipments and calculates total cargo value at risk in Indian Rupees (₹ INR).
2. 🗺️ **Dynamic Re-Routing Engine**: Recommends alternate routes and multi-modal carriers based on cost, ETA, reliability, and bottleneck bypasses.
3. 🚛 **Fleet Asset Rebalancing**: Identifies idle trucks/reefers and generates ROI-optimized repositioning plans.
4. 🌡️ **Cold-Chain Excursion Safeguard**: Monitors IoT thermal sensors, computes Mean Kinetic Temperature (MKT), and classifies WHO/FDA GDP compliance severity.
5. 🤖 **IBM Bob Autonomous Copilot**: AI operations copilot powered by Groq Llama 3.3 70B with one-click mitigation execution buttons directly in chat.

---

## ✨ Key Features

- **Disruption Impact Analysis:** Real-time hazard monitoring (Red Sea Conflict, Rotterdam Port Strike, Panama Canal restrictions, Airfreight Strike).
- **Multi-Modal Route Optimization:** Instant evaluation of alternate air, rail, and maritime corridors with cost (₹ INR) vs. speed trade-offs.
- **Autonomous Fleet Redeployment:** Asset capacity matching to divert idle trucks/reefers to congested ports and hubs.
- **IoT Cold-Chain Thermal Telemetry:** Time-series graph analysis, USP <1150>/WHO MKT calculations, and FDA quarantine warnings.
- **Conversational Bob Copilot:** Multi-agent LLM reasoning engine with real-time payload action execution (`APPLY_REROUTE`, `EXECUTE_FLEET_REDEPLOYMENT`).

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python 3.13, JavaScript (ES6+ React) |
| **Backend Framework** | FastAPI, Uvicorn, Pydantic, Python-Dotenv |
| **Frontend Framework** | React 19, Vite, Lucide-React Icons |
| **AI & LLM Services** | IBM Bob Copilot Agent Architecture, Groq API (`llama-3.3-70b-versatile`), Google Gemini 2.0 Flash |
| **Data & Telemetry** | Simulated 24-hour IoT thermal sensor streams, In-memory Pydantic mock database |
| **Localization & Currency** | Formatted for Indian Rupees (₹ / INR - Lakhs & Crores) |

---

## 📁 Repository Structure

```
├── src/
│   ├── backend/          # FastAPI REST API & AI Copilot Services
│   │   ├── data/         # Seed data & in-memory database
│   │   ├── models/       # Pydantic schemas (Shipment, Disruption, Fleet, IoT)
│   │   ├── services/     # Cold chain, LLM, Fleet, & Copilot engines
│   │   ├── main.py       # FastAPI application entry point
│   │   └── requirements.txt
│   └── frontend/         # Vite + React Control Tower Dashboard
│       ├── src/
│       │   ├── components/  # Map, Disruptions, Cold Chain, Fleet, & Bob Copilot
│       │   └── services/    # API client
│       └── package.json
├── docs/                 # Solution documentation & architecture
├── demo/                 # Screenshots & demo video links
├── presentation/         # Project slide deck
└── submission.yaml       # Hackathon submission metadata
```

---

## ⚡ How to Run

### 1. Backend Setup
```bash
# Navigate to backend directory
cd src/backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --port 8000 --reload
```
*Backend runs on `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).*

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd src/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Configure AI Key (Optional)
To use live **Llama 3.3 70B** AI for Bob Copilot, create `src/backend/.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```
*(If no API key is set, Bob Copilot operates using smart rule-based logic).*

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

- **Simulated IoT Stream**: Telemetry data is generated from 24-hour realistic sensor streams for demonstration stability.
- **Authentication**: User authentication is open for quick hackathon evaluation.
- **Offline Fallback**: Operates smoothly via smart fallback logic even when external LLM API rate limits are reached.

---

## 🏅 What We're Most Proud Of

- **End-to-End Autonomous Workflow**: Bob Copilot doesn't just answer questions — it presents actionable mitigation buttons that immediately update active shipment routes and fleet statuses across the dashboard.
- **WHO/FDA Cold-Chain Compliance Calculation**: Real-time USP <1150> Mean Kinetic Temperature calculation and automated regulatory severity classification.
- **Clean Indian Rupee (₹) Integration**: Complete financial impact modeling localized for Indian logistics context in Lakhs and Crores.
