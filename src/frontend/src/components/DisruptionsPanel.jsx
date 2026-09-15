import React from 'react';
import { AlertTriangle, Clock, DollarSign, ArrowRight, ShieldCheck, Zap, ThermometerSnowflake } from 'lucide-react';

export default function DisruptionsPanel({
  disruptions,
  shipments,
  onOpenRerouteModal,
  selectedDisruption,
  setSelectedDisruption
}) {
  const impactedShipments = shipments.filter(s => s.active_disruption_id);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
      {/* Active Hazards */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#f43f5e" /> Active Disruption Incidents
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {disruptions.map((d) => {
            const isSelected = selectedDisruption && selectedDisruption.id === d.id;
            const isCritical = d.severity === 'Critical';
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDisruption(d)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span className={isCritical ? "badge-critical" : "badge-warning"} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {d.severity.toUpperCase()} • {d.type}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Est. Duration: {d.estimated_clearing_hours}h
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff', marginTop: '6px' }}>
                  {d.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                  {d.description}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Epicenter: <strong style={{ color: '#d1d5db' }}>{d.epicenter_name}</strong></span>
                  <span style={{ color: '#fb7185', fontWeight: 600 }}>
                    {d.impacted_shipment_count} Shipments At Risk (${(d.impacted_cargo_value_usd / 1000).toFixed(0)}K)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impacted Shipments Requiring Action */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#f59e0b" /> Impacted Shipments Requiring Mitigation
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {impactedShipments.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ShieldCheck size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
              All active shipments are running safely on optimized corridors.
            </div>
          ) : (
            impactedShipments.map((s) => {
              const isRerouted = s.status === 'Rerouted';
              return (
                <div
                  key={s.id}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: isRerouted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.05)',
                    border: isRerouted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>{s.tracking_number}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '8px' }}>{s.origin_city} → {s.dest_city}</span>
                    </div>
                    <span className={isRerouted ? "badge-success" : "badge-critical"} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {s.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: 500 }}>
                    {s.cargo_name}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Value: <strong style={{ color: '#34d399' }}>${s.value_usd.toLocaleString()}</strong></span>
                    <span>Carrier: <strong style={{ color: '#d1d5db' }}>{s.carrier}</strong></span>
                    <span>Delay: <strong style={{ color: '#fb7185' }}>+{s.delay_hours}h</strong></span>
                    {s.requires_cold_chain && (
                      <span style={{ color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ThermometerSnowflake size={12} /> {s.target_temp_min_c}°C to {s.target_temp_max_c}°C
                      </span>
                    )}
                  </div>

                  {/* Reroute Action */}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Active: {s.active_route.name}
                    </span>
                    {s.alternative_routes.length > 0 && !isRerouted && (
                      <button
                        onClick={() => onOpenRerouteModal(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Evaluate Re-Routing <ArrowRight size={14} />
                      </button>
                    )}
                    {isRerouted && (
                      <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                        ✓ Mitigation Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
