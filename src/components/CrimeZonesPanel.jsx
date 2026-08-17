/**
 * CrimeZonesPanel.jsx
 * Draggable, collapsible legend panel for AegisNav crime zones.
 * Sticks to screen (position:fixed). Toggle shows/hides zones on map.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const SEVERITY_CONFIG = [
  { level: 'critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '🔴 Critical',  desc: 'Very high crime rate' },
  { level: 'high',     color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: '🟠 High',      desc: 'High crime rate' },
  { level: 'medium',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: '🟡 Medium',    desc: 'Moderate crime rate' },
  { level: 'low',      color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', label: '🔵 Low',       desc: 'Lower risk area' },
];

export default function CrimeZonesPanel({
  cautionZones,
  zonesVisible,
  onToggleZones,
  zonesAvoided = 0,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: 16, y: 80 }); // initial position (left, top)
  const panelRef = useRef(null);
  const dragging = useRef(false);
  const startPos = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // ── Zone counts per severity
  const counts = SEVERITY_CONFIG.reduce((acc, { level }) => {
    acc[level] = cautionZones.filter(z => z.metadata?.severity_level === level).length;
    return acc;
  }, {});
  const total = cautionZones.length;

  // ── Drag logic (pointer events so it works on touch too)
  const onPointerDown = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('.czp-toggle-row')) return;
    dragging.current = true;
    startPos.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    panelRef.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [pos]);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPos.current.mx;
    const dy = e.clientY - startPos.current.my;
    const panel = panelRef.current;
    if (!panel) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    setPos({
      x: Math.max(0, Math.min(vw - pw, startPos.current.px + dx)),
      y: Math.max(0, Math.min(vh - ph, startPos.current.py + dy)),
    });
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  return (
    <div
      ref={panelRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed',
        left: pos.x,
        top:  pos.y,
        zIndex: 900,
        width: collapsed ? 44 : 210,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.07) inset',
        border: '1px solid rgba(255,255,255,0.10)',
        userSelect: 'none',
        cursor: dragging.current ? 'grabbing' : 'grab',
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* ── Header / drag handle ────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: collapsed ? '10px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Shield icon always visible */}
        <span style={{ fontSize: 15, flexShrink: 0 }}>🚔</span>

        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 11, color: '#f1f5f9', letterSpacing: 0.4 }}>
              CRIME ZONES
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              Nagpur Police Data · {total} zones
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.7)',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 5px',
            flexShrink: 0,
            lineHeight: 1,
          }}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* ── Body (hidden when collapsed) ───────────────────────── */}
      {!collapsed && (
        <div style={{ padding: '10px 12px' }}>

          {/* Show / Hide zones toggle */}
          <div
            className="czp-toggle-row"
            onClick={onToggleZones}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8, padding: '6px 8px', marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>
              {zonesVisible ? '👁 Zones Visible' : '🙈 Zones Hidden'}
            </span>
            {/* Toggle pill */}
            <div style={{
              width: 32, height: 18, borderRadius: 9,
              background: zonesVisible ? '#34a853' : 'rgba(255,255,255,0.15)',
              position: 'relative',
              transition: 'background 200ms',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: 2,
                left: zonesVisible ? 16 : 2,
                width: 14, height: 14,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                transition: 'left 200ms',
              }} />
            </div>
          </div>

          {/* Re-routing status */}
          {zonesAvoided > 0 && (
            <div style={{
              background: 'rgba(52,168,83,0.18)',
              border: '1px solid rgba(52,168,83,0.4)',
              borderRadius: 8, padding: '5px 8px',
              fontSize: 9, color: '#86efac',
              marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>✓</span>
              <span>Safe route avoids <strong>{zonesAvoided}</strong> hazard zone{zonesAvoided > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Severity legend rows */}
          {SEVERITY_CONFIG.map(({ level, color, bg, label, desc }) => (
            <div key={level} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 6px', borderRadius: 7,
              background: counts[level] > 0 ? bg : 'transparent',
              marginBottom: 3,
              opacity: counts[level] > 0 ? 1 : 0.35,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3,
                background: color, flexShrink: 0,
                border: `1.5px solid ${color}`,
                boxShadow: counts[level] > 0 ? `0 0 5px ${color}60` : 'none',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#f1f5f9', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{desc}</div>
              </div>
              {counts[level] > 0 && (
                <span style={{
                  fontSize: 9, color, fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 4px',
                }}>
                  {counts[level]}
                </span>
              )}
            </div>
          ))}

          {/* Incident marker legend */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 5, fontWeight: 600, letterSpacing: 0.3 }}>
              LIVE INCIDENTS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef444480', flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: '#f1f5f9' }}>Need Help (Emergency)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: '#f1f5f9' }}>Stay Away (Caution)</span>
            </div>
          </div>

          {/* Drag hint */}
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
            ⠿ drag to move
          </div>
        </div>
      )}
    </div>
  );
}
