// routingService.js — Free OSRM routing for real Nagpur road geometry
// Uses router.project-osrm.org (open-source, free, no API key needed)

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch up to 3 alternative routes between two points using OSRM.
 * Returns Leaflet-compatible [lat, lng] coordinate arrays.
 *
 * @param {[number,number]} origin      [lat, lng]
 * @param {[number,number]} destination [lat, lng]
 * @returns {Promise<Array<{coords:[],distance:number,duration:number}>>}
 */
export async function fetchOSRMRoutes(origin, destination) {
  // OSRM expects lng,lat order
  const [oLat, oLng] = origin;
  const [dLat, dLng] = destination;
  const url =
    `${OSRM_BASE}/${oLng},${oLat};${dLng},${dLat}` +
    `?alternatives=3&geometries=geojson&overview=full&steps=false`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No routes returned');

    return data.routes.map((route) => ({
      // OSRM returns [lng, lat], Leaflet needs [lat, lng]
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceM: route.distance,
      durationS: route.duration,
      distanceLabel: formatDistance(route.distance),
      etaLabel: formatDuration(route.duration),
    }));
  } catch (err) {
    console.warn('[OSRM] Routing failed, using seeded fallback:', err.message);
    return null; // caller falls back to seeded coords
  }
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
