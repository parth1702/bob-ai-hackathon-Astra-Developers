import React, { useState } from 'react';
import { X, CheckCircle, Clock, DollarSign, Leaf, ShieldAlert, ArrowRight } from 'lucide-react';

export default function RerouteModal({ shipment, onClose, onApplyReroute }) {
  const [selectedAltId, setSelectedAltId] = useState(
    shipment.alternative_routes.length > 0 ? shipment.alternative_routes[0].id : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!shipment) return null;

  const currentRoute = shipment.active_route;
  const chosenAlt = shipment.alternative_routes.find(r => r.id === selectedAltId);

  const handleConfirm = async () => {
    if (!chosenAlt) return;
    setIsSubmitting(true);
    await onApplyReroute(shipment.id, chosenAlt.id);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#0d131f' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span className="badge-warning" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
              DECISION PLAYBOOK
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
              Dynamic Re-Routing: {shipment.tracking_number}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {shipment.cargo_name} • Value: ${shipment.value_usd.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current vs Alternative Route Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Current (Disrupted) */}
          <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Current Route (Disrupted)
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>
              {currentRoute.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Carrier: <strong>{currentRoute.carrier}</strong> ({currentRoute.mode})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>ETA:</span>
                <span style={{ color: '#fb7185', fontWeight: 600 }}>{currentRoute.eta_hours} hrs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Transit Cost:</span>
                <span>${currentRoute.cost_usd.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Reliability Score:</span>
                <span style={{ color: '#fb7185' }}>{(currentRoute.reliability_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Alternative Selected */}
          {chosenAlt ? (
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Recommended Bypass (AI Evaluated)
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>
                {chosenAlt.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Carrier: <strong>{chosenAlt.carrier}</strong> ({chosenAlt.mode})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>ETA:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {chosenAlt.eta_hours} hrs ({chosenAlt.eta_hours < currentRoute.eta_hours ? `-${(currentRoute.eta_hours - chosenAlt.eta_hours).toFixed(0)}h faster` : `+${(chosenAlt.eta_hours - currentRoute.eta_hours).toFixed(0)}h`})
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Transit Cost:</span>
                  <span>${chosenAlt.cost_usd.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Reliability Score:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{(chosenAlt.reliability_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {chosenAlt.bottlenecks_avoided.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.72rem', color: '#6ee7b7' }}>
                  ✓ Bypasses: {chosenAlt.bottlenecks_avoided.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'var(--text-dim)' }}>
              No alternative routes available.
            </div>
          )}
        </div>

        {/* Alternative Route Radio Selector if multiple */}
        {shipment.alternative_routes.length > 1 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Select Alternative Carrier / Mode:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {shipment.alternative_routes.map((alt) => (
                <label
                  key={alt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: selectedAltId === alt.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: selectedAltId === alt.id ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="altRoute"
                      checked={selectedAltId === alt.id}
                      onChange={() => setSelectedAltId(alt.id)}
                    />
                    <span>{alt.name} ({alt.carrier})</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    ETA: {alt.eta_hours}h • ${alt.cost_usd.toLocaleString()}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!chosenAlt || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle size={16} />
            {isSubmitting ? 'Authorizing...' : 'Authorize Re-Route Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
