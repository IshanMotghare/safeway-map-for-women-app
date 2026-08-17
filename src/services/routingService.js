// routingService.js — AegisNav Routing (OSRM via AegisNav backend)

const AEGIS_API_BASE = 'http://localhost:8000/api/v1';

/**
 * Fetch routes from AegisNav backend.
 * Returns { routes: [...], zones_avoided: N } or null on failure.
 */
export async function fetchAegisRoutes(origin, destination) {
  try {
    const res = await fetch(`${AEGIS_API_BASE}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`AegisNav API HTTP ${res.status}`);
    const data = await res.json();

    const routes = [];

    if (data.fastest_route?.points) {
      routes.push(formatRoute(data.fastest_route, 'route-fastest', 'Fastest Route'));
    }
    if (data.safe_route?.points) {
      const safe = formatRoute(data.safe_route, 'route-safe', 'Recommended Safe Route');
      const fastest = routes.find(r => r.id === 'route-fastest');
      
      if (fastest) {
        const distDiff = Math.abs(safe.distanceM - fastest.distanceM) / fastest.distanceM;
        // If the detour is practically the same route (< 2% diff), deduplicate
        if (distDiff > 0.02) {
          routes.push(safe);
        }
      } else {
        routes.push(safe);
      }
    }

    if (routes.length === 0) throw new Error('No routes returned by backend');

    return {
      routes,
      zones_avoided: data.zones_avoided ?? 0,
    };
  } catch (err) {
    console.warn('[AegisNav] Routing failed:', err.message);
    return null;
  }
}

/**
 * Post an incident to the AegisNav backend.
 */
export async function postIncident(incident) {
  try {
    await fetch(`${AEGIS_API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
  } catch (err) {
    console.error('[AegisNav] Failed to post incident:', err);
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function formatRoute(ghRoute, id, label) {
  // Backend returns GeoJSON coordinates: [lon, lat]
  // Leaflet wants [lat, lon]
  const coords = ghRoute.points.coordinates.map(([lon, lat]) => [lat, lon]);
  return {
    id,
    label,
    coords,
    distanceM:     ghRoute.distance,
    durationS:     ghRoute.time / 1000,
    distanceLabel: formatDistance(ghRoute.distance),
    etaLabel:      formatDuration(ghRoute.time / 1000),
  };
}

function formatDistance(metres) {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`;
}

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
