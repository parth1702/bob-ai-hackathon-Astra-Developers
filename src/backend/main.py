import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.shipments import router as shipments_router
from api.routes.disruptions import router as disruptions_router
from api.routes.fleet import router as fleet_router
from api.routes.cold_chain import router as cold_chain_router
from api.routes.copilot import router as copilot_router

app = FastAPI(
    title="Bob AI Supply Chain Disruption & Fleet Optimizer API",
    description="Autonomous logistics control tower with disruption re-routing, fleet rebalancing, and IoT cold-chain regulatory monitoring.",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server & production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(shipments_router)
app.include_router(disruptions_router)
app.include_router(fleet_router)
app.include_router(cold_chain_router)
app.include_router(copilot_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Supply Chain Disruption & Fleet Optimizer API",
        "version": "1.0.0",
        "features": [
            "Disruption Impact Detection",
            "Dynamic Re-routing & Alternative Carriers",
            "Fleet Asset Utilization & Rebalancing",
            "Cold Chain IoT Excursion & WHO/FDA Regulatory Watchdog",
            "IBM Bob Autonomous Agentic Copilot"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
