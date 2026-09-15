import React, { useState } from 'react';
import { Truck, ArrowRight, CheckCircle2, BatteryCharging, Clock, DollarSign, MapPin } from 'lucide-react';

export default function FleetRebalancePanel({ fleetAssets, rebalancePlans, onRedeploy }) {
  const [deployingId, setDeployingId] = useState(null);

  const handleDeploy = async (plan) => {
    setDeployingId(plan.id);
    await onRedeploy(plan.asset_id, plan.to_hub);
    setDeployingId(null);
  };

  const idleAssets = fleetAssets.filter(a => a.status === 'Idle & Available');
  const inTransitAssets = fleetAssets.filter(a => a.status === 'In Transit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* High-ROI Optimization Solver Recommendations */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="#3b82f6" /> Automated Idle Asset Redeployment Solver
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Identifies idle trucks, containers, and reefers situated near bottlenecked hubs and redeploys them to unblock routes.
            </p>
          </div>
          <span className="badge-info" style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
            {rebalancePlans.length} Optimization Plans Available
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {rebalancePlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge-critical" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {plan.priority} PRIORITY
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                    ROI: {plan.roi_ratio}x Return
                  </span>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  {plan.asset_code} ({plan.asset_type})
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <MapPin size={12} color="#3b82f6" /> {plan.from_hub} <ArrowRight size={12} /> <strong style={{ color: '#ffffff' }}>{plan.to_hub}</strong>
                </div>

                <p style={{ fontSize: '0.78rem', color: '#d1d5db', lineHeight: '1.4', marginBottom: '12px' }}>
                  {plan.reason}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.25)', fontSize: '0.75rem', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Transit:</span> <strong>{plan.est_transit_hours} hrs</strong> ({plan.distance_km} km)
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Reposition Cost:</span> <strong>${plan.estimated_reposition_cost_usd}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', color: '#34d399' }}>
                    <span>Prevented Loss:</span> <strong>${plan.potential_prevented_loss_usd.toLocaleString()} USD</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeploy(plan)}
                disabled={deployingId === plan.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={16} />
                {deployingId === plan.id ? 'Dispatching...' : 'Dispatch & Redeploy Asset'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Inventory Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>
          Global Fleet Asset Inventory Status
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Asset ID</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Current Location</th>
                <th style={{ padding: '10px 12px' }}>Idle Hours</th>
                <th style={{ padding: '10px 12px' }}>Fuel / Battery</th>
                <th style={{ padding: '10px 12px' }}>Cold Chain Ready</th>
              </tr>
            </thead>
            <tbody>
              {fleetAssets.map((asset) => {
                const isIdle = asset.status === 'Idle & Available';
                return (
                  <tr key={asset.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#ffffff' }}>{asset.asset_code}</td>
                    <td style={{ padding: '10px 12px', color: '#d1d5db' }}>{asset.asset_type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={isIdle ? "badge-info" : "badge-success"} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{asset.current_hub_name}</td>
                    <td style={{ padding: '10px 12px', color: isIdle && asset.hours_idle > 24 ? '#fbbf24' : 'var(--text-dim)' }}>
                      {asset.hours_idle > 0 ? `${asset.hours_idle}h` : 'Active'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BatteryCharging size={14} color="#34d399" />
                        <span>{asset.battery_or_fuel_pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {asset.has_cold_chain_capability ? (
                        <span style={{ color: '#22d3ee', fontWeight: 600 }}>✓ Refrig.</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Dry</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
