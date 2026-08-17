import { useState, useEffect, useRef, useCallback } from 'react';
import MapView from './components/MapView';
import RouteCard from './components/RouteCard';
import ParityCheckPanel from './components/ParityCheckPanel';
import IncidentReportScreen from './components/IncidentReportScreen';
import EmergencyScreen from './components/EmergencyScreen';
import NearbyServicesScreen from './components/NearbyServicesScreen';
import {
  DEMO_ROUTES, DEMO_INCIDENTS, DEMO_DESTINATION, DEMO_CENTER,
  DESTINATIONS, EMERGENCY_SERVICES, CATEGORY_META, STATUS_LABELS,
} from './data/seedData';
import { computeSafetyScore } from './engine/safetyScorer';
import { fetchAegisRoutes, postIncident } from './services/routingService';
import './index.css';

// ── Screen IDs ───────────────────────────────────────────────────
const SCREEN = {
  HOME:         'home',
  SEARCH:       'search',
  ROUTE_SELECT: 'route_select',
  NAVIGATION:   'navigation',
  REPORT:       'report',
  EMERGENCY:    'emergency',
  SERVICES:     'services',
};

// ── Toast ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3300); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(SCREEN.HOME);
  const [enhancedMode, setEnhancedMode] = useState(false);

  // Route state
  const [destination, setDestination]         = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('route-safe');
  const [activeRoute, setActiveRoute]         = useState(null);
  const [routes, setRoutes]                   = useState([]);
  const [loadingRoutes, setLoadingRoutes]     = useState(false);
  const [fitTrigger, setFitTrigger]           = useState(0);
  const [parityDone, setParityDone]           = useState(false);

  // Incidents
  const [incidents, setIncidents] = useState(DEMO_INCIDENTS);
  const [liveAlert, setLiveAlert] = useState(null);

  // Live location
  const [userLocation, setUserLocation] = useState(null);
  const watchIdRef = useRef(null);

  // Navigation
  const [navEta, setNavEta] = useState('12 min');

  // Layout / search / toast
  const [layoutKey, setLayoutKey]     = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast]             = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ── WebSocket — live incident layer ──────────────────────────
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket('ws://localhost:8000/ws/alerts');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'incident') {
            setIncidents((prev) => [...prev, data]);
            const msg = data.intent === 'STAY_AWAY'
              ? `⚠ Hazard reported nearby. Stay alert.`
              : `🆘 Someone needs help nearby!`;
            setLiveAlert({ type: data.intent === 'NEED_HELP' ? 'critical' : 'caution', message: msg });
            setTimeout(() => setLiveAlert(null), 8000);
          }
        } catch {}
      };
    } catch {}
    return () => ws?.close();
  }, []);

  // ── GPS watch ────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(DEMO_CENTER),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Re-invalidate map on screen change
  useEffect(() => { setLayoutKey((k) => k + 1); }, [screen]);

  // ── Load routes from AegisNav backend ────────────────────────
  const loadAegisRoutes = useCallback(async (dest, silent = false) => {
    if (!dest) return;
    if (!silent) setLoadingRoutes(true);
    const origin = userLocation || DEMO_CENTER;

    const result = await fetchAegisRoutes(origin, dest.coords);

    if (result && result.routes && result.routes.length > 0) {
      // Map backend routes → UI format, including seeded safety characteristics
      const seed = { safe: DEMO_ROUTES[1], fastest: DEMO_ROUTES[0] };
      const fullRoutes = result.routes.map((r) => {
        const isOnlyRoute = result.routes.length === 1;
        const isSafe = r.id === 'route-safe' || isOnlyRoute;
        return {
          ...r,
          // Normalise distance / eta field names so RouteCard can read them
          distance: r.distanceLabel || r.distance || '—',
          eta:      r.etaLabel      || r.eta      || '—',
          color:    isSafe ? '#34a853' : '#ef4444',
          description: isSafe ? 'Recommended best route' : 'Fastest route',
          safetyLevel: isSafe ? 'safe' : 'caution',
          characteristics: isSafe ? seed.safe.characteristics : seed.fastest.characteristics,
          warnings:   isSafe ? seed.safe.warnings   : seed.fastest.warnings,
          highlights: isSafe ? seed.safe.highlights : seed.fastest.highlights,
        };
      });
      setRoutes(fullRoutes);
      if (!silent) showToast('✓ Routes loaded — real Nagpur roads', 'success');
      if (activeRoute) {
        const refreshed = fullRoutes.find((r) => r.id === activeRoute.id) || fullRoutes[0];
        setActiveRoute(refreshed);
      }
    } else {
      // Fallback to seeded demo routes
      setRoutes(DEMO_ROUTES);
      if (!silent) showToast('Using demo routes (backend unavailable)', 'warning');
    }

    if (!silent) setLoadingRoutes(false);
    setFitTrigger((n) => n + 1);
  }, [userLocation, activeRoute]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleDestinationSelect = async (dest) => {
    setDestination(dest);
    setParityDone(false);
    setSelectedRouteId('route-safe');
    setScreen(SCREEN.ROUTE_SELECT);
    setSearchQuery('');
    await loadAegisRoutes(dest);
  };

  const handleStartNavigation = () => {
    const sel = routes.find((r) => r.id === selectedRouteId) || routes[0];
    setActiveRoute(sel);
    setScreen(SCREEN.NAVIGATION);
    showToast(`✓ Navigation started on ${sel.label}`, 'success');
  };

  const handleIncidentSubmit = async (report) => {
    await postIncident(report);
  };

  const goBack = () => {
    if (screen === SCREEN.NAVIGATION) { setActiveRoute(null); setScreen(SCREEN.HOME); }
    else if (screen === SCREEN.ROUTE_SELECT) setScreen(SCREEN.HOME);
    else if (screen === SCREEN.SEARCH) setScreen(SCREEN.HOME);
    else if ([SCREEN.REPORT, SCREEN.EMERGENCY, SCREEN.SERVICES].includes(screen))
      setScreen(activeRoute ? SCREEN.NAVIGATION : SCREEN.HOME);
    else setScreen(SCREEN.HOME);
  };

  // ── Derived ──────────────────────────────────────────────────
  const routesWithScores = routes.map((r) => ({
    ...r,
    _primaryScore: computeSafetyScore(r.characteristics, enhancedMode).overallScore,
  }));
  const recommendedRoute = routesWithScores.find((r) => r.id === 'route-safe') || routesWithScores[0];
  const selectedRoute    = routesWithScores.find((r) => r.id === selectedRouteId);

  const filteredDests = DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showMap = ![SCREEN.REPORT, SCREEN.EMERGENCY, SCREEN.SERVICES, SCREEN.SEARCH].includes(screen);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className={`app-shell ${enhancedMode ? 'enhanced-mode' : ''}`}>

      {/* ╔══ MAP ═════════════════════════════════════════════╗ */}
      {showMap && (
        <div className="map-container">
          <MapView
            routes={routesWithScores}
            incidents={incidents}
            destination={destination || DEMO_DESTINATION}
            selectedRouteId={selectedRouteId}
            activeRoute={activeRoute}
            userLocation={userLocation}
            showServices={screen === SCREEN.NAVIGATION}
            services={EMERGENCY_SERVICES}
            enhancedMode={enhancedMode}
            layoutKey={layoutKey}
            fitRouteTrigger={fitTrigger}
          />
        </div>
      )}

      {/* ╔══ HOME ════════════════════════════════════════════╗ */}
      {screen === SCREEN.HOME && (
        <>
          <div className="top-bar">
            <div className="app-logo-row">
              <div className="app-logo">
                <div className="app-logo-icon">🛡️</div>
                <div className="app-logo-text">
                  <div className="app-name">AegisNav</div>
                  <div className="app-tagline">Intelligent Safety-First Navigation</div>
                </div>
                {userLocation && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22c55e', flexShrink: 0,
                    boxShadow: '0 0 0 3px rgba(34,197,94,0.3)',
                  }} title="Live location active" />
                )}
              </div>
            </div>

            <div
              className={`safety-mode-chip ${enhancedMode ? 'enhanced' : ''}`}
              onClick={() => {
                setEnhancedMode(!enhancedMode);
                showToast(enhancedMode ? 'Standard mode activated' : "🛡 Women's Safety Mode ON", 'warning');
              }}
              role="button" tabIndex={0}
            >
              <div className="dot" />
              {enhancedMode ? "🛡 Women's Safety Mode" : 'Standard Mode'}
            </div>

            <div className="search-bar" onClick={() => setScreen(SCREEN.SEARCH)} role="button" tabIndex={0}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <span className="search-bar-text">Where do you want to go?</span>
              <span style={{ fontSize: 14 }}>→</span>
            </div>
          </div>

          <div className="fab-group">
            <button className="fab fab-white" title="Nearby Services" onClick={() => setScreen(SCREEN.SERVICES)}>🗺</button>
            <button className="fab fab-report" title="Report Incident" onClick={() => setScreen(SCREEN.REPORT)}>⚠</button>
            <button className="fab fab-sos" onClick={() => setScreen(SCREEN.EMERGENCY)}>SOS</button>
          </div>

          {/* Compact map legend */}
          <div className="map-legend">
            <div className="legend-title">Incident Legend</div>
            <div className="legend-row">
              <div className="idot idot--emergency idot--sm">
                <div className="idot__ring" />
                <div className="idot__core" />
              </div>
              <span>Need Help (Emergency)</span>
            </div>
            <div className="legend-row">
              <div className="idot idot--caution idot--sm">
                <div className="idot__core" />
              </div>
              <span>Stay Away (Hazard)</span>
            </div>
          </div>
        </>
      )}

      {/* ╔══ SEARCH ══════════════════════════════════════════╗ */}
      {screen === SCREEN.SEARCH && (
        <div className="dest-input-wrapper">
          <div className="dest-input-header">
            <button className="icon-btn" onClick={goBack}>←</button>
            <input
              className="dest-input"
              placeholder="Search Nagpur destinations…"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="dest-suggestions">
            {filteredDests.map((dest) => (
              <div
                key={dest.name}
                className="dest-suggestion-item"
                onClick={() => handleDestinationSelect(dest)}
                role="button" tabIndex={0}
              >
                <div className="dest-suggestion-icon">{dest.icon}</div>
                <div className="dest-suggestion-text">
                  <div className="dest-suggestion-name">{dest.name}</div>
                  <div className="dest-suggestion-desc">{dest.desc}</div>
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ╔══ ROUTE SELECTION ═════════════════════════════════╗ */}
      {screen === SCREEN.ROUTE_SELECT && (
        <>
          <div className="top-bar">
            <div className="app-logo-row">
              <button className="icon-btn" onClick={goBack}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
                  📍 Current Location → {destination?.name || 'Destination'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
                  {enhancedMode ? "🛡 Women's Safety Mode" : 'Standard Mode'} · {routes.length} routes analyzed
                  {loadingRoutes && ' · ⟳ Fetching routes…'}
                </div>
              </div>
              <div
                className={`safety-mode-chip ${enhancedMode ? 'enhanced' : ''}`}
                style={{ flexShrink: 0 }}
                onClick={() => setEnhancedMode(!enhancedMode)}
              >
                <div className="dot" />
                {enhancedMode ? '🛡' : 'Std'}
              </div>
            </div>
          </div>

          <div className="bottom-sheet bottom-sheet--open">
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15 }}>
                  {loadingRoutes ? '⟳ Fetching real routes…' : 'Choose Your Route'}
                </div>
                <span className="tag tag-info" style={{ fontSize: 10 }}>
                  {enhancedMode ? '🛡 Enhanced weights' : 'Standard scoring'}
                </span>
              </div>

              {/* Parity check */}
              {!parityDone && recommendedRoute && routes.length > 0 && (
                <ParityCheckPanel
                  primaryResult={computeSafetyScore(recommendedRoute.characteristics, enhancedMode)}
                  route={recommendedRoute}
                  allRoutes={routesWithScores}
                  enhancedMode={enhancedMode}
                  onComplete={() => setParityDone(true)}
                />
              )}

              {parityDone && (
                <div style={{
                  background: '#e6f4ea', borderRadius: 10, padding: '8px 12px',
                  marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center',
                  fontSize: 12, color: '#137333',
                }}>
                  <span>✓</span>
                  <span>Safety verification complete — Safe Route recommended.</span>
                </div>
              )}

              {/* Route cards */}
              {routesWithScores
                .slice()
                .sort((a, b) => b._primaryScore - a._primaryScore)
                .map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={selectedRouteId === route.id}
                    isRecommended={route.id === 'route-safe'}
                    enhancedMode={enhancedMode}
                    onClick={() => setSelectedRouteId(route.id)}
                  />
                ))}

              <button
                className="submit-btn"
                style={{
                  background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(26,115,232,0.40)',
                }}
                onClick={handleStartNavigation}
                disabled={routes.length === 0}
              >
                🗺 Start Navigation on {selectedRoute?.label || 'Safe Route'}
              </button>

              {selectedRouteId !== 'route-safe' && routes.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--brand-danger)', textAlign: 'center', marginTop: 6 }}>
                  ⚠ Safe Route is recommended — are you sure about {selectedRoute?.label}?
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ╔══ NAVIGATION ══════════════════════════════════════╗ */}
      {screen === SCREEN.NAVIGATION && (
        <>
          {liveAlert && (
            <div className={`nav-alert-banner ${liveAlert.type === 'critical' ? 'critical' : ''}`}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 450 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ flex: 1 }}>{liveAlert.message}</span>
              <button onClick={() => setLiveAlert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}>✕</button>
            </div>
          )}

          <div className="nav-hud">
            <div className="nav-top-card" style={{ marginTop: liveAlert ? 52 : 0 }}>
              <div className="nav-instruction-icon">↗</div>
              <div className="nav-instruction-text">
                <div className="nav-instruction-main">Continue on Safe Route</div>
                <div className="nav-instruction-sub">Following AegisNav recommended path</div>
              </div>
              <div className="nav-eta-chip">
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18 }}>
                  {activeRoute?.etaLabel || activeRoute?.eta || navEta}
                </div>
                <div style={{ fontSize: 9 }}>remaining</div>
              </div>
            </div>
          </div>

          <div className="fab-group" style={{ bottom: 210 }}>
            <button className="fab fab-white" onClick={goBack} title="Exit navigation">✕</button>
            <button className="fab fab-white" title="Nearby Services" onClick={() => setScreen(SCREEN.SERVICES)}>🗺</button>
            <button className="fab fab-report" onClick={() => setScreen(SCREEN.REPORT)}>⚠</button>
            <button className="fab fab-sos" onClick={() => setScreen(SCREEN.EMERGENCY)}>SOS</button>
          </div>

          <div className="bottom-sheet" style={{ transform: 'translateY(calc(100% - 110px))' }}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-content" style={{ paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Navigating via</div>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: '#22c55e' }}>
                    {activeRoute?.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Safety Score</div>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: '#22c55e' }}>
                    {activeRoute ? computeSafetyScore(activeRoute.characteristics, enhancedMode).overallScore : '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="nav-stat-chip" style={{ background: '#fef7e0', color: '#b45309' }}>
                  <span>📍 {activeRoute?.distanceLabel || activeRoute?.distance || '—'}</span>
                </div>
                <div className="nav-stat-chip" style={{ background: '#fce8e6', color: '#d93025' }}>
                  <span>🆘 {incidents.filter((i) => i.intent === 'NEED_HELP').length} Alerts</span>
                </div>
                <div className="nav-stat-chip" style={{ background: '#e6f4ea', color: '#137333' }}>
                  <span>🏥 Services on map</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ╔══ INCIDENT REPORT ═════════════════════════════════╗ */}
      {screen === SCREEN.REPORT && (
        <IncidentReportScreen
          onClose={goBack}
          onSubmit={(report) => {
            handleIncidentSubmit(report);
            showToast(
              report.intent === 'NEED_HELP'
                ? '🆘 Emergency alert sent! Stay visible.'
                : '⚠ Hazard reported — Nearby users alerted',
              report.intent === 'NEED_HELP' ? 'critical' : 'warning'
            );
            goBack();
          }}
        />
      )}

      {/* ╔══ EMERGENCY / SOS ═════════════════════════════════╗ */}
      {screen === SCREEN.EMERGENCY && (
        <EmergencyScreen onClose={goBack} onOpenServices={() => setScreen(SCREEN.SERVICES)} />
      )}

      {/* ╔══ NEARBY SERVICES ═════════════════════════════════╗ */}
      {screen === SCREEN.SERVICES && (
        <NearbyServicesScreen onClose={goBack} userLocation={userLocation} />
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
