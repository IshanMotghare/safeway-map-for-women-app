import { useState } from 'react';
import { CATEGORY_META, STATUS_LABELS } from '../data/seedData';

const REPORT_CATEGORIES = [
  'ACCIDENT', 'MEDICAL', 'HAZARD', 'FIRE', 'BLOCKAGE', 'SUSPICIOUS', 'TRAFFIC', 'OTHER'
];

const SEVERITY_LABELS = ['', 'Minor', 'Low', 'Moderate', 'High', 'Critical'];

export default function IncidentReportScreen({ onClose, onSubmit }) {
  const [intent, setIntent] = useState(null);     // 'NEED_HELP' | 'STAY_AWAY'
  const [category, setCategory] = useState('ACCIDENT');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [needsAmbulance, setNeedsAmbulance] = useState(false);
  const [isInjured, setIsInjured] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-set severity for NEED_HELP
  const handleIntentSelect = (newIntent) => {
    setIntent(newIntent);
    if (newIntent === 'NEED_HELP') setSeverity(5);
    else setSeverity(3);
  };

  const handleSubmit = () => {
    const report = {
      id: `inc-${Date.now()}`,
      intent,
      category,
      severity,
      status: 'UNVERIFIED',
      description,
      location: [28.630, 77.217],  // Demo: user's current location
      time: 'Just now',
      reporterCount: 1,
      assistanceType: intent === 'NEED_HELP'
        ? (needsAmbulance ? 'AMBULANCE_REQ' : 'FIRST_AID')
        : 'NONE',
      victimsCount: isInjured ? 1 : 0,
      exclusionRadius: intent === 'NEED_HELP' ? 100 : 200,
    };
    onSubmit && onSubmit(report);
    setSubmitted(true);
    setTimeout(() => onClose(), 2500);
  };

  if (submitted) {
    const isNeedHelp = intent === 'NEED_HELP';
    return (
      <div className="report-screen">
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16,
          background: isNeedHelp
            ? 'linear-gradient(160deg, #7f1d1d, #d93025)'
            : 'linear-gradient(160deg, #78350f, #d97706)',
          color: 'white',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 64 }}>{isNeedHelp ? '🆘' : '⚠️'}</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 700 }}>
            {isNeedHelp ? 'Help is on the way!' : 'Warning Broadcast Sent!'}
          </h2>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
            {isNeedHelp
              ? 'Your location has been shared with nearby users and emergency contacts. Stay visible.'
              : 'Nearby navigators have been alerted and routes are being recalculated to bypass the area.'}
          </p>
          {isNeedHelp && (
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 20px',
              display: 'flex', flexDirection: 'column', gap: 8, width: '100%',
            }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Emergency contacts notified:</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>📱 Mom · Best Friend</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Location beacon is ACTIVE</div>
            </div>
          )}
          <div style={{ fontSize: 12, opacity: 0.7 }}>Returning to map…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-screen">
      {/* Header */}
      <div className="screen-header">
        <button className="icon-btn" onClick={onClose}>←</button>
        <h2 className="screen-title">Report Incident</h2>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 Current location</span>
      </div>

      <div className="screen-body">
        {/* Step 1: Intent selection */}
        <div className="form-section">
          <div className="form-label">What is your situation?</div>
          <div className="intent-split">
            {/* NEED HELP */}
            <div
              className={`intent-card need-help ${intent === 'NEED_HELP' ? 'selected' : ''}`}
              onClick={() => handleIntentSelect('NEED_HELP')}
            >
              <div className="intent-icon">🆘</div>
              <div className="intent-title intent-need">NEED HELP</div>
              <div className="intent-desc">I/We require immediate assistance</div>
              <div className="intent-priority priority-critical">P0 • CRITICAL</div>
              <div style={{ fontSize: 9, color: '#d93025', textAlign: 'center', lineHeight: 1.3 }}>
                SOS • Emergency contacts • Live beacon
              </div>
            </div>

            {/* STAY AWAY */}
            <div
              className={`intent-card stay-away ${intent === 'STAY_AWAY' ? 'selected' : ''}`}
              onClick={() => handleIntentSelect('STAY_AWAY')}
            >
              <div className="intent-icon">⚠️</div>
              <div className="intent-title intent-away">STAY AWAY</div>
              <div className="intent-desc">Hazard/Blockage ahead, bypass area</div>
              <div className="intent-priority priority-caution">P1 • CAUTION</div>
              <div style={{ fontSize: 9, color: '#b45309', textAlign: 'center', lineHeight: 1.3 }}>
                Geofence warning • Route rerouting
              </div>
            </div>
          </div>
        </div>

        {/* NEED HELP extra fields */}
        {intent === 'NEED_HELP' && (
          <div className="form-section" style={{
            background: '#fef2f2', borderRadius: 14, padding: 14,
            border: '1.5px solid #fca5a5', marginBottom: 16,
          }}>
            <div className="form-label" style={{ color: '#dc2626' }}>Emergency details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isInjured}
                  onChange={(e) => setIsInjured(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#dc2626' }}
                />
                <span>Are you or someone injured?</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={needsAmbulance}
                  onChange={(e) => setNeedsAmbulance(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#dc2626' }}
                />
                <span>Need ambulance?</span>
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href="tel:112"
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, background: '#dc2626',
                    color: 'white', textAlign: 'center', fontWeight: 700, fontSize: 13,
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  📞 Call 112 (Emergency)
                </a>
                <a
                  href="tel:102"
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, background: '#f59e0b',
                    color: 'white', textAlign: 'center', fontWeight: 700, fontSize: 13,
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  🚑 Call 102 (Ambulance)
                </a>
              </div>
              <div style={{ fontSize: 10, color: '#dc2626', fontStyle: 'italic', textAlign: 'center' }}>
                ⚠ Emergency calls are real. Demo: calls are simulated in browser.
              </div>
            </div>
          </div>
        )}

        {/* Category */}
        {intent && (
          <div className="form-section">
            <div className="form-label">Incident Type</div>
            <div className="category-grid">
              {REPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <span className="cat-icon">{CATEGORY_META[cat]?.icon}</span>
                  <span style={{ fontSize: 9 }}>{CATEGORY_META[cat]?.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Severity */}
        {intent && (
          <div className="form-section">
            <div className="form-label">
              Severity
              {intent === 'NEED_HELP' && (
                <span style={{ fontSize: 10, color: '#dc2626', marginLeft: 8, fontWeight: 400 }}>
                  Auto-set to Critical for Need Help
                </span>
              )}
            </div>
            <div className="severity-row">
              {[1,2,3,4,5].map((s) => (
                <button
                  key={s}
                  className={`severity-btn s${s} ${severity === s ? `selected-s${s}` : ''}`}
                  onClick={() => setSeverity(s)}
                  disabled={intent === 'NEED_HELP' && s < 4}
                  style={{ opacity: intent === 'NEED_HELP' && s < 4 ? 0.4 : 1 }}
                >
                  <div style={{ fontSize: 14 }}>{'●'.repeat(s)}</div>
                  <div style={{ fontSize: 9, marginTop: 2 }}>{SEVERITY_LABELS[s]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {intent && (
          <div className="form-section">
            <div className="form-label">Description (optional)</div>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={
                intent === 'NEED_HELP'
                  ? 'Describe your situation so responders can help…'
                  : 'Describe the hazard or blockage…'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {/* Location confirm */}
        {intent && (
          <div className="form-section">
            <div className="form-label">Location</div>
            <div className="location-confirm">
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  Current GPS Location
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>28.6315°N, 77.2167°E · Auto-filled</div>
              </div>
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, marginLeft: 'auto' }}>✓ Confirmed</span>
            </div>
          </div>
        )}

        {/* Submit */}
        {intent && (
          <button
            className={`submit-btn ${intent === 'NEED_HELP' ? 'submit-need-help' : 'submit-stay-away'}`}
            onClick={handleSubmit}
          >
            {intent === 'NEED_HELP'
              ? '🆘 Send Emergency Alert & Share Location'
              : '⚠️ Report Hazard — Warn Nearby Users'
            }
          </button>
        )}

        {/* How it works info */}
        {intent && (
          <div style={{
            marginTop: 12, padding: '10px 12px', background: 'var(--surface-sheet)',
            borderRadius: 10, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6,
          }}>
            {intent === 'NEED_HELP' ? (
              <>
                <strong>🔴 Need Help workflow:</strong> Your report is flagged P0 Critical →
                AWS Lambda priority queue → Emergency contact beacon dispatched →
                Nearby users (within 500m) alerted → Emergency services info shown.
              </>
            ) : (
              <>
                <strong>🟡 Stay Away workflow:</strong> Your report is sent to AWS Lambda →
                PostGIS applies radius penalty to road network → Verification &amp; dedup check →
                WebSocket broadcasts detour alert to active navigators nearby.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
