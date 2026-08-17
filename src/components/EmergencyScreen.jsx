import { TRUSTED_CONTACTS } from '../data/seedData';

const EMERGENCY_LINES = [
  { num: '112', label: 'Emergency', icon: '🚨', color: '#d93025' },
  { num: '100', label: 'Police',    icon: '👮', color: '#1a73e8' },
  { num: '102', label: 'Ambulance', icon: '🚑', color: '#f59e0b' },
  { num: '101', label: 'Fire',      icon: '🔥', color: '#f97316' },
];

export default function EmergencyScreen({ onClose, onOpenServices }) {
  const handleSOS = () => {
    alert(
      'DEMO: In production this would:\n' +
      '• Share your live GPS coordinates with trusted contacts\n' +
      '• Alert nearby SafeWay users within 500 m\n' +
      '• Auto-dial the nearest emergency service\n\n' +
      'Emergency contacts notified: Mom, Best Friend'
    );
  };

  return (
    <div className="sos-screen">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sos-header">
        <button className="sos-back-btn" onClick={onClose} aria-label="Close">
          ←
        </button>
        <div>
          <div className="sos-header-title">Emergency Mode</div>
          <div className="sos-header-sub">Stay calm. Help is available.</div>
        </div>
        <div className="sos-header-loc">
          <div style={{ fontSize: 10, opacity: 0.7 }}>📍 Live Location</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Nagpur, MH</div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="sos-body">

        {/* Section 1 — SOS Button */}
        <div className="sos-section">
          <div
            className="sos-big-btn"
            onClick={handleSOS}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSOS()}
            aria-label="Send SOS alert"
          >
            <span className="sos-big-icon">🆘</span>
            <span className="sos-big-label">SOS</span>
            <span className="sos-big-sub">Tap to send emergency alert</span>
          </div>

          <p className="sos-disclaimer">
            ⚠ <strong>DEMO BUILD</strong> — Emergency actions are simulated.
            Real deployment integrates with authorized emergency dispatch.
          </p>
        </div>

        {/* Section 2 — Quick Dial */}
        <div className="sos-section">
          <div className="sos-section-label">QUICK DIAL</div>
          <div className="sos-dial-grid">
            {EMERGENCY_LINES.map((e) => (
              <a
                key={e.num}
                href={`tel:${e.num}`}
                className="sos-dial-btn"
                style={{ '--dial-color': e.color }}
                aria-label={`Call ${e.label} — ${e.num}`}
              >
                <span className="sos-dial-icon">{e.icon}</span>
                <span className="sos-dial-num">{e.num}</span>
                <span className="sos-dial-label">{e.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Section 3 — Trusted Contacts */}
        <div className="sos-section">
          <div className="sos-section-label">TRUSTED CONTACTS</div>
          <div className="sos-contacts-list">
            {TRUSTED_CONTACTS.map((c) => (
              <div key={c.name} className="sos-contact-row">
                <div className="sos-contact-avatar">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="sos-contact-info">
                  <div className="sos-contact-name">{c.name}</div>
                  <div className="sos-contact-meta">{c.relation} · {c.phone}</div>
                </div>
                <a href={`tel:${c.phone}`} className="sos-contact-call">
                  📞 Call
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Nearby Services shortcut */}
        <div className="sos-section">
          <button className="sos-services-btn" onClick={onOpenServices}>
            <span>🗺</span>
            <span>View Nearby Services</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>→</span>
          </button>
        </div>

      </div>
    </div>
  );
}
