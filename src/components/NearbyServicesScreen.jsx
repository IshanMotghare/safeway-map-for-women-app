import { useState, useEffect } from 'react';
import { SERVICE_META, EMERGENCY_SERVICES } from '../data/seedData';
import { fetchNearbyServices } from '../services/overpassService';

const TABS = [
  { key: 'all',      label: 'All',      icon: '🗺' },
  { key: 'police',   label: 'Police',   icon: '🚔' },
  { key: 'hospital', label: 'Hospital', icon: '🏥' },
  { key: 'ambulance',label: 'Ambulance',icon: '🚑' },
  { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { key: 'fire',     label: 'Fire',     icon: '🚒' },
  { key: 'petrol',   label: 'Petrol',   icon: '⛽' },
];

function haversineM([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function NearbyServicesScreen({ onClose, userLocation }) {
  const [activeTab, setActiveTab]   = useState('all');
  const [services, setServices]     = useState(EMERGENCY_SERVICES);
  const [loading, setLoading]       = useState(false);
  const [source, setSource]         = useState('seeded');

  // Try Overpass API on mount
  useEffect(() => {
    const center = userLocation || [21.1458, 79.0882]; // Nagpur fallback
    setLoading(true);
    fetchNearbyServices(center, 5000)
      .then((results) => {
        if (results && results.length > 0) {
          setServices(results);
          setSource('live');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Enrich seeded services with distances if we have user location
  const enriched = services.map((svc) => {
    if (userLocation && svc.location) {
      const dm = haversineM(userLocation, svc.location);
      return { ...svc, distanceM: dm, distance: fmtDist(dm) };
    }
    return svc;
  }).sort((a, b) => (a.distanceM || 0) - (b.distanceM || 0));

  const filtered = activeTab === 'all'
    ? enriched
    : enriched.filter((s) => s.type === activeTab);

  return (
    <div className="screen-full">

      {/* Header */}
      <div className="screen-header" style={{ background: '#1a73e8', color: 'white' }}>
        <button
          className="icon-btn"
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
        >
          ←
        </button>
        <div>
          <h2 className="screen-title" style={{ color: 'white' }}>Nearby Services</h2>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {loading ? '⟳ Fetching live data…' : source === 'live' ? '✓ Live data from OpenStreetMap' : '📋 Seeded demo data'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.8 }}>
          {filtered.length} found
        </div>
      </div>

      {/* Tabs */}
      <div className="svc-tabs">
        {TABS.map((tab) => {
          const count = tab.key === 'all'
            ? enriched.length
            : enriched.filter((s) => s.type === tab.key).length;
          return (
            <button
              key={tab.key}
              className={`svc-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && <span className="svc-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Service cards */}
      <div className="svc-list">
        {filtered.length === 0 && !loading && (
          <div className="svc-empty">
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No {activeTab === 'all' ? 'services' : activeTab + ' services'} found nearby.</p>
          </div>
        )}

        {loading && (
          <div className="svc-empty">
            <div className="svc-spinner" />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading live data…</p>
          </div>
        )}

        {!loading && filtered.map((svc) => {
          const meta = SERVICE_META[svc.type] || { icon: '📍', color: '#64748b', label: svc.type };
          return (
            <div key={svc.id} className="svc-card">
              <div className="svc-card-icon" style={{ background: meta.color + '18', borderColor: meta.color + '55' }}>
                <span>{meta.icon}</span>
              </div>
              <div className="svc-card-body">
                <div className="svc-card-name">{svc.name}</div>
                <div className="svc-card-meta">
                  <span className="svc-type-badge" style={{ background: meta.color + '18', color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="svc-dist">📍 {svc.distance || '—'}</span>
                </div>
              </div>
              <div className="svc-card-actions">
                {svc.phone && (
                  <a href={`tel:${svc.phone}`} className="svc-call-btn">
                    📞 {svc.phone}
                  </a>
                )}
                {!svc.contactable && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Display only
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* OpenStreetMap attribution */}
        {!loading && (
          <div style={{ textAlign: 'center', padding: '12px 16px', fontSize: 10, color: 'var(--text-muted)' }}>
            POI data © OpenStreetMap contributors · Overpass API
          </div>
        )}
      </div>
    </div>
  );
}
