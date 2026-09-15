import React from 'react';
import { AlertCircle, Navigation, Anchor, Snowflake, Shield } from 'lucide-react';

export default function MapViewer({ disruptions, shipments, selectedShipment, onSelectShipment, onSelectDisruption }) {
  // Simple Equirectangular projection: lat (-90 to 90) -> y (450 to 50), lng (-180 to 180) -> x (50 to 850)
  const project = (lat, lng) => {
    const x = ((lng + 180) / 360) * 800 + 50;
    const y = ((90 - lat) / 180) * 400 + 40;
    return { x, y };
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} color="#3b82f6" /> Global Logistics Corridor & Hazard Map
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-time multi-modal satellite tracking • Click pins to inspect shipments & hazards
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fb7185' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }}></span> Hazard Zone
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Active Route
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Re-routed Bypass
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '420px', background: '#070b12', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <svg viewBox="0 0 900 480" style={{ width: '100%', height: '100%' }}>
          <defs>
            <radialGradient id="hazardGlowRed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(244, 63, 94, 0.6)" />
              <stop offset="70%" stopColor="rgba(244, 63, 94, 0.15)" />
              <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
            </radialGradient>
            <radialGradient id="hazardGlowAmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
              <stop offset="70%" stopColor="rgba(245, 158, 11, 0.15)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
            </radialGradient>
          </defs>

          {/* Stylized Grid Lines */}
          <line x1="50" y1="240" x2="850" y2="240" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <line x1="450" y1="40" x2="450" y2="440" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

          {/* Simplified Continents Contours / Outlines */}
          <path
            d="M 120 120 Q 220 100 240 180 Q 200 240 160 210 Z M 210 240 Q 260 270 240 370 Q 200 350 190 280 Z M 440 110 Q 520 100 500 170 Q 430 180 430 130 Z M 450 190 Q 530 200 510 320 Q 460 340 440 250 Z M 540 100 Q 750 90 730 230 Q 600 220 540 170 Z M 670 290 Q 750 300 730 380 Q 660 370 660 320 Z"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />

          {/* Active Disruption Hazard Zones */}
          {disruptions.map((d) => {
            const pos = project(d.lat, d.lng);
            const isCritical = d.severity === 'Critical';
            return (
              <g key={d.id} onClick={() => onSelectDisruption(d)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCritical ? 36 : 24}
                  fill={isCritical ? "url(#hazardGlowRed)" : "url(#hazardGlowAmber)"}
                  className="pulse-hazard"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={6}
                  fill={isCritical ? "#f43f5e" : "#f59e0b"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={pos.x + 10}
                  y={pos.y - 8}
                  fill={isCritical ? "#fb7185" : "#fbbf24"}
                  fontSize="10"
                  fontWeight="600"
                >
                  {d.title.split(' ')[0]} {d.title.split(' ')[1]}
                </text>
              </g>
            );
          })}

          {/* Shipment Transit Corridors */}
          {shipments.map((s) => {
            const isRerouted = s.status === 'Rerouted';
            const isSelected = selectedShipment && selectedShipment.id === s.id;
            const pts = s.active_route.waypoints.map(wp => project(wp.lat, wp.lng));
            if (pts.length < 2) return null;

            // Generate SVG path string
            const pathData = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

            const currPos = project(s.current_lat, s.current_lng);

            return (
              <g key={s.id} onClick={() => onSelectShipment(s)} style={{ cursor: 'pointer' }}>
                {/* Route Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isRerouted ? '#10b981' : isSelected ? '#ffffff' : (s.active_disruption_id ? '#f43f5e' : '#3b82f6')}
                  strokeWidth={isSelected ? 3 : 1.8}
                  strokeDasharray={isRerouted ? 'none' : '4 3'}
                  opacity={isSelected ? 1 : 0.75}
                />

                {/* Waypoints */}
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill="#9ca3af"
                    opacity={0.6}
                  />
                ))}

                {/* Current Moving Cargo Pin */}
                <g transform={`translate(${currPos.x}, ${currPos.y})`}>
                  <circle
                    r={isSelected ? 9 : 6}
                    fill={isRerouted ? '#10b981' : (s.active_disruption_id ? '#f43f5e' : '#3b82f6')}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {s.requires_cold_chain && (
                    <circle r={isSelected ? 13 : 9} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" />
                  )}
                  <text
                    x={10}
                    y={4}
                    fill={isSelected ? '#ffffff' : '#9ca3af'}
                    fontSize="9"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {s.tracking_number}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Map Legend */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(17, 24, 39, 0.85)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          gap: '16px'
        }}>
          <div><strong>Suez / Red Sea:</strong> Critical Chokepoint</div>
          <div><strong>Rotterdam:</strong> Terminal Strike</div>
          <div><strong>Chicago:</strong> Arctic Freeze</div>
          <div><strong>Panama:</strong> Draft Surcharge</div>
        </div>
      </div>
    </div>
  );
}
