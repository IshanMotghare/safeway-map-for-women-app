import { useEffect, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, Polyline, Marker,
  useMap, Circle, Tooltip, ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import {
  NAGPUR_CENTER, NAGPUR_RADIUS_M,
  SERVICE_META, STATUS_LABELS, CATEGORY_META,
} from '../data/seedData';

// ── Nagpur 100 km MaxBounds ──────────────────────────────────────
// 100 km ≈ 0.9° lat, ≈ 0.97° lng at 21°N
const MAX_BOUNDS = [
  [NAGPUR_CENTER[0] - 0.92, NAGPUR_CENTER[1] - 0.97],
  [NAGPUR_CENTER[0] + 0.92, NAGPUR_CENTER[1] + 0.97],
];

// Fix Leaflet default icons (avoids broken image in Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Icon factories ───────────────────────────────────────────────

/** 🔴 Red pulsing dot — NEED HELP (emergency) */
function makeNeedHelpIcon() {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div class="idot idot--emergency" aria-label="Emergency — Need Help">
        <div class="idot__ring"></div>
        <div class="idot__ring idot__ring--delay"></div>
        <div class="idot__core"></div>
      </div>`,
  });
}

/** 🟠 Orange glow dot — STAY AWAY (caution) */
function makeStayAwayIcon() {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div class="idot idot--caution" aria-label="Caution — Stay Away">
        <div class="idot__core"></div>
      </div>`,
  });
}

/** 💙 Blue live-location dot */
function makeUserIcon() {
  return L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `
      <div class="user-dot">
        <div class="user-dot__ring"></div>
        <div class="user-dot__core"></div>
      </div>`,
  });
}

/** Service map marker */
function makeServiceIcon(type) {
  const meta = SERVICE_META[type] || { icon: '📍', color: '#64748b' };
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <div style="
        background:white;
        border:2.5px solid ${meta.color};
        width:30px;height:30px;border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        font-size:15px;
        box-shadow:0 2px 8px rgba(0,0,0,.22);
      ">${meta.icon}</div>`,
  });
}

/** Destination pin */
function makeDestIcon() {
  return L.divIcon({
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    html: `<div style="font-size:32px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.45))">📍</div>`,
  });
}

// ── Haversine distance (metres) ──────────────────────────────────
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

// ── Sub-component: invalidates map size on layout change ─────────
function MapInvalidator({ deps }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize({ animate: false }), 350);
    return () => clearTimeout(t);
  }, deps); // eslint-disable-line
  return null;
}

// ── Sub-component: auto-pan to user on first fix ─────────────────
function LocationPanner({ userLocation, hasPanned }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation && !hasPanned.current) {
      map.setView(userLocation, 14, { animate: true });
      hasPanned.current = true;
    }
  }, [userLocation]);
  return null;
}

// ── Sub-component: fit all routes in view ────────────────────────
function RouteFitter({ routes, destination, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!trigger || !routes?.length) return;
    const allCoords = routes.flatMap((r) => r.coords);
    if (destination) allCoords.push(destination.coords);
    if (allCoords.length) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [70, 50], maxZoom: 15 });
    }
  }, [trigger]);
  return null;
}

// ── Main MapView ─────────────────────────────────────────────────
export default function MapView({
  routes,
  incidents,
  destination,
  selectedRouteId,
  activeRoute,
  userLocation,
  showServices,
  services,
  enhancedMode,
  layoutKey,
  fitRouteTrigger,
}) {
  const hasPanned = useRef(false);

  const displayRoutes  = routes    || [];
  const displayIncidents = incidents || [];
  const displayServices  = services  || [];

  return (
    <MapContainer
      center={NAGPUR_CENTER}
      zoom={13}
      minZoom={10}
      maxZoom={18}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={0.85}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      {/* ── Map tiles (OpenStreetMap) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {/* ── Zoom control — bottom-right */}
      <ZoomControl position="bottomright" />

      {/* ── Sub-components */}
      <MapInvalidator deps={[layoutKey, showServices]} />
      <LocationPanner userLocation={userLocation} hasPanned={hasPanned} />
      <RouteFitter routes={displayRoutes} destination={destination} trigger={fitRouteTrigger} />

      {/* ── 100 km boundary ring (Viksit Nagpur) */}
      <Circle
        center={NAGPUR_CENTER}
        radius={NAGPUR_RADIUS_M}
        pathOptions={{
          color: '#7c3aed',
          weight: 1.8,
          dashArray: '10 6',
          fillOpacity: 0,
          opacity: 0.45,
        }}
      >
        <Tooltip sticky={false} permanent={false} direction="top">
          <span style={{ fontSize: 11, fontWeight: 600 }}>
            🏙 Viksit Nagpur — 100 km operational zone
          </span>
        </Tooltip>
      </Circle>

      {/* ── Nagpur city centre marker */}
      <Circle
        center={NAGPUR_CENTER}
        radius={300}
        pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.08, weight: 1 }}
      />


      {/* ── Route polylines */}
      {displayRoutes.map((route) => {
        const isActive   = activeRoute?.id === route.id;
        const isSelected = selectedRouteId === route.id;
        const opacity    = isActive || isSelected ? 1 : 0.42;
        const weight     = isActive ? 8 : isSelected ? 6 : 4;
        return (
          <Polyline
            key={route.id}
            positions={route.coords}
            pathOptions={{
              color: route.color,
              weight,
              opacity,
              dashArray: isActive || isSelected ? null : '7 5',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        );
      })}

      {/* ── Destination pin */}
      {destination && (
        <Marker position={destination.coords} icon={makeDestIcon()}>
          <Tooltip direction="top" offset={[0, -10]} permanent={false}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {destination.icon} {destination.name}
            </span>
          </Tooltip>
        </Marker>
      )}

      {/* ── Incident dot markers ─────────────────────────────────
          🔴 Red pulse = NEED HELP (emergency)
          🟠 Orange glow = STAY AWAY (caution)
      */}
      {displayIncidents.map((inc) => {
        const isEmergency = inc.intent === 'NEED_HELP';
        const icon        = isEmergency ? makeNeedHelpIcon() : makeStayAwayIcon();
        const statusInfo  = STATUS_LABELS[inc.status] || STATUS_LABELS.REPORTED;
        const catMeta     = CATEGORY_META[inc.category] || { icon: '⚠️', label: 'Incident' };
        const distFromUser = userLocation
          ? haversineM(userLocation, inc.location)
          : null;

        return (
          <div key={inc.id}>
            <Marker position={inc.location} icon={icon}>
              <Tooltip
                sticky
                direction="top"
                offset={[0, -10]}
                className="incident-tooltip-wrapper"
                opacity={1}
              >
                <div className="incident-tooltip">
                  {/* Header */}
                  <div className="itip-header">
                    <span className="itip-icon">{catMeta.icon}</span>
                    <div className="itip-title-block">
                      <span className="itip-title">{catMeta.label}</span>
                      <span
                        className="itip-intent"
                        style={{ color: isEmergency ? '#d93025' : '#b45309' }}
                      >
                        {isEmergency ? '🔴 Need Help' : '🟠 Stay Away'}
                      </span>
                    </div>
                    <span
                      className="itip-status"
                      style={{ background: statusInfo.bg, color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="itip-desc">{inc.description}</div>

                  {/* Stats row */}
                  <div className="itip-stats">
                    <span>🕐 {inc.time}</span>
                    <span>⚡ Sev {inc.severity}/5</span>
                    <span>👥 {inc.reporterCount} report{inc.reporterCount > 1 ? 's' : ''}</span>
                    {distFromUser !== null && (
                      <span>📍 {fmtDist(distFromUser)} away</span>
                    )}
                  </div>
                </div>
              </Tooltip>
            </Marker>

            {/* Exclusion / proximity radius */}
            <Circle
              center={inc.location}
              radius={inc.exclusionRadius || 200}
              pathOptions={
                isEmergency
                  ? { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.10, weight: 1.5, dashArray: '4 3' }
                  : { color: '#f97316', fillColor: '#f97316', fillOpacity: 0.08, weight: 1.5, dashArray: '5 3' }
              }
            />
          </div>
        );
      })}

      {/* ── Live user location dot */}
      {userLocation && (
        <Marker position={userLocation} icon={makeUserIcon()} zIndexOffset={1000}>
          <Tooltip direction="top" offset={[0, -8]} permanent={false}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>📍 You are here</span>
          </Tooltip>
        </Marker>
      )}

      {/* ── Emergency services / nearby POIs */}
      {showServices &&
        displayServices.map((svc) => (
          <Marker key={svc.id} position={svc.location} icon={makeServiceIcon(svc.type)}>
            <Tooltip direction="top" offset={[0, -6]} sticky={false}>
              <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}>
                  {SERVICE_META[svc.type]?.icon} {svc.name}
                </div>
                <div style={{ color: '#5f6368' }}>
                  📍 {svc.distance}
                  {svc.phone && <span>&nbsp;· 📞 {svc.phone}</span>}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
    </MapContainer>
  );
}
