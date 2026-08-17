// overpassService.js — Free Overpass API for real Nagpur POI data
// No API key required. Data sourced from OpenStreetMap contributors.

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const AMENITY_TYPE_MAP = {
  police:       'police',
  hospital:     'hospital',
  clinic:       'hospital',
  doctors:      'hospital',
  pharmacy:     'pharmacy',
  fire_station: 'fire',
  fuel:         'petrol',
};

/**
 * Fetch nearby emergency services / POIs via Overpass API.
 *
 * @param {[number,number]} center     [lat, lng]
 * @param {number}          radiusM    Search radius in metres (default 5000)
 * @returns {Promise<Array>}           Array of service objects
 */
export async function fetchNearbyServices(center, radiusM = 5000) {
  const [lat, lng] = center;

  const query = `
    [out:json][timeout:20];
    (
      node[amenity=police](around:${radiusM},${lat},${lng});
      node[amenity=hospital](around:${radiusM},${lat},${lng});
      node[amenity=clinic](around:${radiusM},${lat},${lng});
      node[amenity=pharmacy](around:${radiusM},${lat},${lng});
      node[amenity=fire_station](around:${radiusM},${lat},${lng});
      node[amenity=fuel](around:${radiusM},${lat},${lng});
    );
    out body;
  `.trim();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = await res.json();

    return data.elements
      .filter((el) => el.lat && el.lon)
      .map((el) => {
        const amenity = el.tags?.amenity || el.tags?.shop || '';
        const type = AMENITY_TYPE_MAP[amenity] || 'other';
        const distM = haversineM([lat, lng], [el.lat, el.lon]);
        return {
          id: `osm-${el.id}`,
          type,
          name: el.tags?.name || labelFor(amenity),
          location: [el.lat, el.lon],
          phone: el.tags?.phone || el.tags?.['contact:phone'] || emergencyNumber(type),
          contactable: ['police', 'hospital', 'ambulance', 'fire'].includes(type),
          distanceM: distM,
          distance: distM < 1000 ? `${Math.round(distM)} m` : `${(distM / 1000).toFixed(1)} km`,
          source: 'overpass',
        };
      })
      .sort((a, b) => a.distanceM - b.distanceM);
  } catch (err) {
    console.warn('[Overpass] POI fetch failed, using seeded fallback:', err.message);
    return null;
  }
}

function labelFor(amenity) {
  const labels = {
    police: 'Police Station', hospital: 'Hospital', clinic: 'Clinic',
    pharmacy: 'Pharmacy', fire_station: 'Fire Station', fuel: 'Petrol Pump',
  };
  return labels[amenity] || 'Service';
}

function emergencyNumber(type) {
  const nums = { police: '100', hospital: '108', ambulance: '108', fire: '101' };
  return nums[type] || null;
}

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
