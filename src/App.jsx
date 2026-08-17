import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer } from 'react-leaflet';
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
import { fetchOSRMRoutes } from './services/routingService';
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
  // ── Screen state
  const [screen, setScreen] = useState(SCREEN.HOME);

  // ── Safety mode
  const [enhancedMode, setEnhancedMode] = useState(false);

  // ── Route state
  const [destination, setDestination]   = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState('route-b');
  const [activeRoute, setActiveRoute]   = useState(null);
  const [routes, setRoutes]             = useState(DEMO_ROUTES);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [fitTrigger, setFitTrigger]     = useState(0);
  const [parityDone, setParityDone]     = useState(false);

  // ── Incidents
  const [incidents, setIncidents]       = useState(DEMO_INCIDENTS);

  // ── Live location
  const [userLocation, setUserLocation] = useState(null);
  const watchIdRef = useRef(null);

  // ── Navigation
  const [liveAlert, setLiveAlert]       = useState(null);
  const [navEta, setNavEta]             = useState('12 min');

  // ── Layout
  const [layoutKey, setLayoutKey]       = useState(0);

  // ── Search
  const [searchQuery, setSearchQuery]   = useState('');

  // ── Toast
  const [toast, setToast]               = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ── Start live GPS watch ─────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;

    const options = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.warn('[GPS]', err.message);
        // Fallback: use Nagpur center so the demo always works
        setUserLocation(DEMO_CENTER);
      },
      options
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Invalidate map layout whenever screen changes
  useEffect(() => {
    setLayoutKey((k) => k + 1);
  }, [screen]);

  // ── Fetch OSRM routes when destination is selected ──────────
  const loadOSRMRoutes = useCallback(async (dest) => {
    if (!dest) return;
    setLoadingRoutes(true);
    const origin = userLocation || DEMO_CENTER;

    try {
      const osrmResults = await fetchOSRMRoutes(origin, dest.coords);

      if (osrmResults && osrmResults.length >= 1) {
        // Graft OSRM geometry onto our seeded safety characteristics
        const updated = DEMO_ROUTES.map((seedRoute, i) => {
          const osrm = osrmResults[Math.min(i, osrmResults.length - 1)];
          return {
            ...seedRoute,
            coords: osrm.coords,
            distance: osrm.distanceLabel || seedRoute.distance,
            eta: osrm.etaLabel || seedRoute.eta,
          };
        });
        setRoutes(updated);
        showToast('✓ Real road routes loaded from OSRM', 'success');
      } else {
        setRoutes(DEMO_ROUTES);
      }
    } catch {
      setRoutes(DEMO_ROUTES);
    }

    setLoadingRoutes(false);
    setFitTrigger((n) => n + 1);
  }, [userLocation]);

  // ── Live incident simulation during navigation ───────────────
  useEffect(() => {
    if (screen !== SCREEN.NAVIGATION) return;
    const t = setTimeout(() => {
      const newInc = {
        id: `inc-live-${Date.now()}`,
        intent: 'STAY_AWAY',
        category: 'ACCIDENT',
        severity: 3,
        status: 'CORROBORATED',
        location: [21.1510, 79.0820],
        description: 'Live: Accident reported ahead on your route.',
        time: 'Just now',
        reporterCount: 2,
        assistanceType: 'NONE',
        victimsCount: 0,
        exclusionRadius: 200,
      };
      setIncidents((prev) => [...prev, newInc]);
      setLiveAlert({ type: 'caution', message: '⚠ Accident ahead — Safer detour recommended (+2 min)' });
      setTimeout(() => setLiveAlert(null), 8000);
    }, 8000);
    return () => clearTimeout(t);
  }, [screen]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleDestinationSelect = async (dest) => {
    setDestination(dest);
    setParityDone(false);
    setSelectedRouteId('route-b');
    setScreen(SCREEN.ROUTE_SELECT);
    setSearchQuery('');
    await loadOSRMRoutes(dest);
  };

  const handleStartNavigation = () => {
    const sel = routes.find((r) => r.id === selectedRouteId) || routes[1];
    setActiveRoute(sel);
    setScreen(SCREEN.NAVIGATION);
    showToast(`✓ Navigation started on ${sel.label}`, 'success');
  };

  const handleIncidentSubmit = (report) => {
    setIncidents((prev) => [...prev, report]);
  };

  const goBack = () => {
    if (screen === SCREEN.NAVIGATION) { setActiveRoute(null); setScreen(SCREEN.HOME); }
    else if (screen === SCREEN.ROUTE_SELECT) setScreen(SCREEN.HOME);
    else if (screen === SCREEN.SEARCH) setScreen(SCREEN.HOME);
    else if (screen === SCREEN.REPORT) setScreen(activeRoute ? SCREEN.NAVIGATION : SCREEN.HOME);
    else if (screen === SCREEN.EMERGENCY) setScreen(activeRoute ? SCREEN.NAVIGATION : SCREEN.HOME);
    else if (screen === SCREEN.SERVICES) setScreen(activeRoute ? SCREEN.NAVIGATION : SCREEN.HOME);
    else setScreen(SCREEN.HOME);
  };

  // ── Derived ──────────────────────────────────────────────────
  const routesWithScores = routes.map((r) => ({
    ...r,
    _primaryScore: computeSafetyScore(r.characteristics, enhancedMode).overallScore,
  }));
  const recommendedRoute = routesWithScores.find((r) => r.id === 'route-b') || routesWithScores[0];
  const selectedRoute    = routesWithScores.find((r) => r.id === selectedRouteId);

  const filteredDests = DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Whether map + its overlays should render
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
          {/* Top bar */}
          <div className="top-bar">
            {/* Logo row */}
            <div className="app-logo-row">
              <div className="app-logo">
                <div className="app-logo-icon">🛡️</div>
                <div className="app-logo-text">
                  <div className="app-name">SafeWay Map for Women</div>
                  <div className="app-tagline">Navigate Safer. Not Just Faster.</div>
                </div>
                {/* Live location indicator */}
                {userLocation && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22c55e', flexShrink: 0,
                    boxShadow: '0 0 0 3px rgba(34,197,94,0.3)',
                  }} title="Live location active" />
                )}
              </div>
            </div>

            {/* Safety mode toggle */}
            <div
              className={`safety-mode-chip ${enhancedMode ? 'enhanced' : ''}`}
              onClick={() => {
                setEnhancedMode(!enhancedMode);
                showToast(enhancedMode ? 'Standard mode activated' : "🛡 Women's Safety Mode ON", 'warning');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="dot" />
              {enhancedMode ? "🛡 Women's Safety Mode" : 'Standard Mode'}
            </div>

            {/* Search bar */}
            <div className="search-bar" onClick={() => setScreen(SCREEN.SEARCH)} role="button" tabIndex={0}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <span className="search-bar-text">Where do you want to go?</span>
              <span style={{ fontSize: 14 }}>→</span>
            </div>
          </div>

          {/* FABs */}
          <div className="fab-group">
            <button className="fab fab-white" title="Nearby Services" onClick={() => setScreen(SCREEN.SERVICES)}>🗺</button>
            <button className="fab fab-report" title="Report Incident" onClick={() => setScreen(SCREEN.REPORT)}>⚠</button>
            <button className="fab fab-sos" onClick={() => setScreen(SCREEN.EMERGENCY)}>SOS</button>
          </div>

          {/* Map legend */}
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
              <span>Stay Away (Caution)</span>
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
                role="button"
                tabIndex={0}
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
          {/* Compact top bar */}
          <div className="top-bar">
            <div className="app-logo-row">
              <button className="icon-btn" onClick={goBack}>←</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
                  📍 Sitabuldi → {destination?.name || 'Destination'}
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

          {/* Bottom sheet */}
          <div className="bottom-sheet bottom-sheet--open">
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15 }}>
                  {loadingRoutes ? '⟳ Loading real road routes…' : 'Choose Your Route'}
                </div>
                <span className="tag tag-info" style={{ fontSize: 10 }}>
                  {enhancedMode ? '🛡 Enhanced weights' : 'Standard scoring'}
                </span>
              </div>

              {/* Parity check */}
              {!parityDone && recommendedRoute && (
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
                  <span>Safety verification complete — Route B recommended as safest.</span>
                </div>
              )}

              {/* Route cards sorted by safety score */}
              {routesWithScores
                .slice()
                .sort((a, b) => b._primaryScore - a._primaryScore)
                .map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={selectedRouteId === route.id}
                    isRecommended={route.id === 'route-b'}
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
              >
                🗺 Start Navigation on {selectedRoute?.label || 'Route B'}
              </button>

              {selectedRouteId !== 'route-b' && (
                <p style={{ fontSize: 11, color: 'var(--brand-danger)', textAlign: 'center', marginTop: 6 }}>
                  ⚠ Route B is safer — are you sure about {selectedRoute?.label}?
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ╔══ NAVIGATION ══════════════════════════════════════╗ */}
      {screen === SCREEN.NAVIGATION && (
        <>
          {/* Alert banner */}
          {liveAlert && (
            <div className={`nav-alert-banner ${liveAlert.type === 'critical' ? 'critical' : ''}`}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 450 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ flex: 1 }}>{liveAlert.message}</span>
              <button onClick={() => setLiveAlert(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}>
                ✕
              </button>
            </div>
          )}

          {/* Navigation HUD */}
          <div className="nav-hud">
            <div className="nav-top-card" style={{ marginTop: liveAlert ? 52 : 0 }}>
              <div className="nav-instruction-icon">↗</div>
              <div className="nav-instruction-text">
                <div className="nav-instruction-main">Continue on Amravati Road</div>
                <div className="nav-instruction-sub">In 600 m, turn left toward Deekshabhoomi</div>
              </div>
              <div className="nav-eta-chip">
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18 }}>{navEta}</div>
                <div style={{ fontSize: 9 }}>remaining</div>
              </div>
            </div>
          </div>

          {/* FABs */}
          <div className="fab-group" style={{ bottom: 210 }}>
            <button className="fab fab-white" onClick={goBack} title="Exit navigation">✕</button>
            <button className="fab fab-white" title="Nearby Services" onClick={() => setScreen(SCREEN.SERVICES)}>🗺</button>
            <button className="fab fab-report" onClick={() => setScreen(SCREEN.REPORT)}>⚠</button>
            <button className="fab fab-sos" onClick={() => setScreen(SCREEN.EMERGENCY)}>SOS</button>
          </div>

          {/* Bottom bar */}
          <div className="bottom-sheet" style={{ transform: 'translateY(calc(100% - 110px))' }}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-content" style={{ paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Navigating via</div>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: '#22c55e' }}>
                    {activeRoute?.label} — {activeRoute?.description}
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
                  <span>⚠️ {incidents.filter((i) => i.intent === 'STAY_AWAY').length} Hazards</span>
                </div>
                <div className="nav-stat-chip" style={{ background: '#fce8e6', color: '#d93025' }}>
                  <span>🆘 {incidents.filter((i) => i.intent === 'NEED_HELP').length} Need Help</span>
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
        <EmergencyScreen
          onClose={goBack}
          onOpenServices={() => setScreen(SCREEN.SERVICES)}
        />
      )}

      {/* ╔══ NEARBY SERVICES ═════════════════════════════════╗ */}
      {screen === SCREEN.SERVICES && (
        <NearbyServicesScreen
          onClose={goBack}
          userLocation={userLocation}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
