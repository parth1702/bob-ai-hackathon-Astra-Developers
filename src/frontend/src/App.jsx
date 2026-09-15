import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapViewer from './components/MapViewer';
import DisruptionsPanel from './components/DisruptionsPanel';
import RerouteModal from './components/RerouteModal';
import FleetRebalancePanel from './components/FleetRebalancePanel';
import ColdChainMonitor from './components/ColdChainMonitor';
import BobCopilot from './components/BobCopilot';
import {
  fetchDisruptions,
  fetchShipments,
  rerouteShipment,
  fetchFleetAssets,
  fetchFleetRebalance,
  redeployAsset,
  fetchColdChainOverview
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('operations');
  const [disruptions, setDisruptions] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [fleetAssets, setFleetAssets] = useState([]);
  const [rebalancePlans, setRebalancePlans] = useState([]);
  const [coldChainReports, setColdChainReports] = useState([]);
  
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedDisruption, setSelectedDisruption] = useState(null);
  const [rerouteModalShipment, setRerouteModalShipment] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [dList, sList, fAssets, fPlans, ccList] = await Promise.all([
        fetchDisruptions(),
        fetchShipments(),
        fetchFleetAssets(),
        fetchFleetRebalance(),
        fetchColdChainOverview()
      ]);
      setDisruptions(dList);
      setShipments(sList);
      setFleetAssets(fAssets);
      setRebalancePlans(fPlans);
      setColdChainReports(ccList);
    } catch (e) {
      console.error("API error, check backend server on port 8000:", e);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 15000); // 15s polling for live simulation
    return () => clearInterval(interval);
  }, []);

  const handleApplyReroute = async (shipmentId, altRouteId) => {
    try {
      const res = await rerouteShipment(shipmentId, altRouteId);
      if (res.success) {
        showToast(`✓ ${res.message}`);
        await loadAllData();
      }
    } catch (e) {
      showToast(`⚠️ Re-route failed: ${e.message}`);
    }
  };

  const handleRedeployAsset = async (assetId, destinationHub) => {
    try {
      const res = await redeployAsset(assetId, destinationHub);
      if (res.success) {
        showToast(`✓ ${res.message}`);
        await loadAllData();
      }
    } catch (e) {
      showToast(`⚠️ Redeploy failed: ${e.message}`);
    }
  };

  // KPIs
  const activeDisruptions = disruptions.filter(d => d.is_active).length;
  const atRiskValueUsd = shipments
    .filter(s => s.active_disruption_id && s.status !== 'Delivered')
    .reduce((sum, s) => sum + s.value_usd, 0);
  const idleAssets = fleetAssets.filter(a => a.status === 'Idle & Available').length;
  const coldChainBreaches = coldChainReports.filter(c => c.total_excursion_minutes > 0).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kpis={{ activeDisruptions, atRiskValueUsd, idleAssets, coldChainBreaches }}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.85rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 1000
        }}>
          {toastMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'operations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <MapViewer
              disruptions={disruptions}
              shipments={shipments}
              selectedShipment={selectedShipment}
              onSelectShipment={setSelectedShipment}
              onSelectDisruption={setSelectedDisruption}
            />

            <DisruptionsPanel
              disruptions={disruptions}
              shipments={shipments}
              selectedDisruption={selectedDisruption}
              setSelectedDisruption={setSelectedDisruption}
              onOpenRerouteModal={setRerouteModalShipment}
            />
          </div>
        )}

        {activeTab === 'cold-chain' && (
          <ColdChainMonitor />
        )}

        {activeTab === 'fleet' && (
          <FleetRebalancePanel
            fleetAssets={fleetAssets}
            rebalancePlans={rebalancePlans}
            onRedeploy={handleRedeployAsset}
          />
        )}

        {activeTab === 'copilot' && (
          <BobCopilot
            onApplyReroute={handleApplyReroute}
            onRedeployAsset={handleRedeployAsset}
          />
        )}
      </main>

      {/* Re-Route Decision Modal */}
      {rerouteModalShipment && (
        <RerouteModal
          shipment={rerouteModalShipment}
          onClose={() => setRerouteModalShipment(null)}
          onApplyReroute={handleApplyReroute}
        />
      )}
    </div>
  );
}
