import React, { useState, useEffect } from 'react';
import { ThermometerSnowflake, AlertTriangle, ShieldCheck, Clock, Activity, FileCheck2, RefreshCw } from 'lucide-react';
import { fetchColdChainOverview, fetchColdChainReport } from '../services/api';

export default function ColdChainMonitor() {
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState('SHP-101');
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const allReports = await fetchColdChainOverview();
      setReports(allReports);
      const rep = await fetchColdChainReport(selectedId);
      setActiveReport(rep);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedId]);

  if (loading && !activeReport) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading IoT Telemetry...</div>;
  }

  const telemetry = activeReport?.recent_telemetry || [];
  const temps = telemetry.map(t => t.temperature_c);
  const minT = temps.length ? Math.min(...temps, activeReport.target_min_c - 2) : 0;
  const maxT = temps.length ? Math.max(...temps, activeReport.target_max_c + 2) : 12;

  // Map temperatures to SVG coordinates (width 600, height 180)
  const mapY = (t) => 170 - ((t - minT) / (maxT - minT || 1)) * 140;
  const mapX = (index) => (index / (telemetry.length - 1 || 1)) * 560 + 20;

  const pointsString = telemetry.map((p, i) => `${mapX(i)},${mapY(p.temperature_c)}`).join(' ');

  const targetMaxY = mapY(activeReport?.target_max_c || 8);
  const targetMinY = mapY(activeReport?.target_min_c || 2);

  const isCritical = activeReport?.regulatory_status.includes('Critical');
  const isWarning = activeReport?.regulatory_status.includes('Warning');
  const isCompliant = activeReport?.regulatory_status.includes('Compliant');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Shipments Selector Strip */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
        {reports.map((rep) => {
          const isSelected = selectedId === rep.shipment_id;
          const statusCritical = rep.regulatory_status.includes('Critical');
          return (
            <div
              key={rep.shipment_id}
              onClick={() => setSelectedId(rep.shipment_id)}
              className="glass-panel"
              style={{
                padding: '12px 18px',
                minWidth: '240px',
                cursor: 'pointer',
                borderColor: isSelected ? '#06b6d4' : 'var(--border-color)',
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>{rep.tracking_number}</span>
                <span className={statusCritical ? "badge-critical" : "badge-success"} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>
                  {rep.current_temp_c}°C
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e5e7eb', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {rep.cargo_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Standard: {rep.target_min_c}°C to {rep.target_max_c}°C
              </div>
            </div>
          );
        })}
      </div>

      {activeReport && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Real-Time Sensor Telemetry Time-Series Chart */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge-info" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                  LIVE IOT SENSOR STREAM
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
                  {activeReport.cargo_name} ({activeReport.tracking_number})
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Continuous Reefer IoT Telemetry • Sensor ID: RF-SENS-{activeReport.shipment_id}
                </p>
              </div>

              <button
                onClick={loadData}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                <RefreshCw size={14} /> Refresh Feed
              </button>
            </div>

            {/* SVG Telemetry Chart */}
            <div style={{ width: '100%', height: '220px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%' }}>
                {/* Safe Temperature Zone Fill */}
                <rect
                  x="20"
                  y={targetMaxY}
                  width="560"
                  height={Math.max(0, targetMinY - targetMaxY)}
                  fill="rgba(16, 185, 129, 0.08)"
                />

                {/* Target Max Threshold Line */}
                <line x1="20" y1={targetMaxY} x2="580" y2={targetMaxY} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.2" />
                <text x="24" y={targetMaxY - 4} fill="#fb7185" fontSize="10" fontWeight="600">
                  Target Upper Limit: {activeReport.target_max_c}°C
                </text>

                {/* Target Min Threshold Line */}
                <line x1="20" y1={targetMinY} x2="580" y2={targetMinY} stroke="#06b6d4" strokeDasharray="4 4" strokeWidth="1.2" />
                <text x="24" y={targetMinY + 12} fill="#22d3ee" fontSize="10" fontWeight="600">
                  Target Lower Limit: {activeReport.target_min_c}°C
                </text>

                {/* Temperature Polyline */}
                {telemetry.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
                    strokeWidth="2.5"
                    points={pointsString}
                  />
                )}

                {/* Individual Data Points */}
                {telemetry.map((p, i) => (
                  <circle
                    key={i}
                    cx={mapX(i)}
                    cy={mapY(p.temperature_c)}
                    r={p.is_excursion ? 4 : 2}
                    fill={p.is_excursion ? "#f43f5e" : "#10b981"}
                    stroke="#ffffff"
                    strokeWidth={p.is_excursion ? "1.5" : "0.5"}
                  />
                ))}
              </svg>
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT TEMP</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isCritical ? '#fb7185' : '#34d399' }}>
                  {activeReport.current_temp_c}°C
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MEAN KINETIC TEMP (MKT)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>
                  {activeReport.mean_kinetic_temp_c}°C
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EXCURSION TIME</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: activeReport.total_excursion_minutes > 0 ? '#fbbf24' : 'var(--text-dim)' }}>
                  {activeReport.total_excursion_minutes} mins
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CARGO VALUE AT RISK</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: activeReport.cargo_value_at_risk_usd > 0 ? '#fb7185' : '#34d399' }}>
                  ${(activeReport.cargo_value_at_risk_usd / 1000).toFixed(0)}K
                </div>
              </div>
            </div>
          </div>

          {/* Regulatory Severity & Action Panel */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileCheck2 size={20} color="#3b82f6" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
                  Regulatory Severity Classification
                </h4>
              </div>

              {/* Status Badge Banner */}
              <div
                className={isCritical ? "badge-critical" : isWarning ? "badge-warning" : "badge-success"}
                style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.8 }}>CLASSIFICATION RESULT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
                  {activeReport.regulatory_status}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                <strong>Governing Standard:</strong> {activeReport.regulatory_standard}
              </div>

              {/* Countdown to Spoilage */}
              {activeReport.time_to_irreversible_spoilage_mins !== null && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Clock size={16} /> TIME-TO-SPOILAGE COUNTDOWN
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    ~{activeReport.time_to_irreversible_spoilage_mins} Minutes Left
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '2px' }}>
                    Action required before delivery to avert complete lot rejection.
                  </div>
                </div>
              )}

              {/* Containment Advice */}
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Mandated Containment Action:
                </div>
                <div style={{ fontSize: '0.82rem', color: '#e5e7eb', marginTop: '6px', lineHeight: '1.4' }}>
                  {activeReport.containment_action_required}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              ✓ Audit trail logged for regulatory inspection (21 CFR Part 11)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
