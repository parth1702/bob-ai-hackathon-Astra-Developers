import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, CheckCircle, ArrowRight, User } from 'lucide-react';
import { askBob, fetchQuickScenarios } from '../services/api';

export default function BobCopilot({ onApplyReroute, onRedeployAsset }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bob',
      text: "👋 Hello! I am your **IBM Bob Supply Chain Autonomous Copilot**. I am continuously monitoring global disruption hazards, idle fleet capacity, and cold-chain IoT temperature feeds.\n\nHow can I assist your logistics command center right now?",
      recommendations: []
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuickScenarios().then(setScenarios).catch(console.error);
  }, []);

  const handleSend = async (textToSend) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim()) return;

    const userMsg = { sender: 'user', text: prompt, recommendations: [] };
    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const resp = await askBob(prompt);
      const bobMsg = {
        sender: 'bob',
        text: resp.answer,
        recommendations: resp.recommendations || []
      };
      setMessages(prev => [...prev, bobMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'bob',
        text: "⚠️ Unable to query Bob Agent endpoint. Please verify backend service on port 8000.",
        recommendations: []
      }]);
    }
    setLoading(false);
  };

  const handleActionClick = async (action) => {
    if (action.action_type === 'APPLY_REROUTE') {
      await onApplyReroute(action.payload.shipment_id, action.payload.alternative_route_id);
    } else if (action.action_type === 'EXECUTE_FLEET_REDEPLOYMENT') {
      await onRedeployAsset(action.payload.asset_id, action.payload.destination);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
      {/* Chat Container */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>IBM Bob Autonomous Logistics Agent</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Multi-agent reasoning engine with zero-shot mitigation execution</p>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '6px' }}>
          {messages.map((msg, i) => {
            const isBob = msg.sender === 'bob';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isBob ? 'flex-start' : 'flex-end',
                  maxWidth: '85%'
                }}
              >
                {isBob && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Bot size={16} color="#ffffff" />
                  </div>
                )}

                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isBob ? 'rgba(255, 255, 255, 0.04)' : '#3b82f6',
                  border: isBob ? '1px solid var(--border-color)' : 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  lineHeight: '1.5'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {/* Render Action Buttons if any */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase' }}>
                        ⚡ Suggested Autonomous Actions:
                      </div>
                      {msg.recommendations.map((rec, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleActionClick(rec)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#34d399',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div>
                            <div>{rec.title}</div>
                            <div style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 'normal' }}>{rec.description}</div>
                          </div>
                          <ArrowRight size={14} style={{ flexShrink: 0, marginLeft: '8px' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!isBob && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <User size={16} color="#ffffff" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <Sparkles size={16} color="#3b82f6" className="pulse-hazard" />
              Bob is evaluating disruption impact and cold chain constraints...
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask Bob: 'What happens if Rotterdam strike lasts 3 days?' or 'Audit cold chain'..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 16px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Suggested Quick Scenarios Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#f59e0b" /> Demo Scenarios
        </h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Click any scenario to test IBM Bob's multi-agent disruption reasoning:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSend(sc.prompt)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: '#e5e7eb',
                fontSize: '0.75rem',
                cursor: 'pointer',
                lineHeight: '1.4',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '2px' }}>
                {sc.label}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                "{sc.prompt}"
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
