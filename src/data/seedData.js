// seedData.js — Nagpur-centered data for Viksit Nagpur Initiative

// ── Nagpur Geography ───────────────────────────────────────────
export const NAGPUR_CENTER   = [21.1458, 79.0882];   // Sitabuldi, Nagpur
export const NAGPUR_RADIUS_M = 100_000;               // 100 km operational radius

// ── Demo: Sitabuldi → Deekshabhoomi (~3.8 km) ─────────────────
export const DEMO_CENTER = NAGPUR_CENTER;

export const DEMO_DESTINATION = {
  name: 'Deekshabhoomi',
  desc: 'Nagpur, Maharashtra',
  icon: '🏛️',
  coords: [21.1239, 79.0644],
};

// Three candidate routes (Nagpur road geometry approximation)
// OSRM will replace these with real road geometries at runtime
export const DEMO_ROUTES = [
  {
    id: 'route-a',
    label: 'Route A',
    description: 'Shortest — via Itwari lanes',
    color: '#ef4444',
    distance: '3.2 km',
    eta: '9 min',
    coords: [
      [21.1458, 79.0882],
      [21.1430, 79.0870],
      [21.1400, 79.0840],
      [21.1365, 79.0800],
      [21.1330, 79.0760],
      [21.1290, 79.0720],
      [21.1260, 79.0685],
      [21.1239, 79.0644],
    ],
    characteristics: {
      publicActivity: 28, incidentRisk: 62, emergencyAccessibility: 32,
      isolationRisk: 68, infrastructureVisibility: 22, timeOfDayRisk: 58, currentConditionsRisk: 42,
    },
    warnings: ['Narrow Itwari lanes', 'Poor night visibility', '1 active incident nearby'],
    highlights: [],
    safetyLevel: 'danger',
  },
  {
    id: 'route-b',
    label: 'Route B',
    description: 'Recommended — via Amravati Road',
    color: '#22c55e',
    distance: '4.4 km',
    eta: '12 min',
    coords: [
      [21.1458, 79.0882],
      [21.1490, 79.0840],
      [21.1520, 79.0800],
      [21.1510, 79.0760],
      [21.1475, 79.0730],
      [21.1430, 79.0710],
      [21.1390, 79.0690],
      [21.1350, 79.0665],
      [21.1310, 79.0648],
      [21.1270, 79.0644],
      [21.1239, 79.0644],
    ],
    characteristics: {
      publicActivity: 82, incidentRisk: 10, emergencyAccessibility: 88,
      isolationRisk: 14, infrastructureVisibility: 78, timeOfDayRisk: 18, currentConditionsRisk: 12,
    },
    warnings: [],
    highlights: ['Broad Amravati Road', 'Police station 0.4 km', 'Hospital 0.6 km', 'Well-lit & busy'],
    safetyLevel: 'safe',
  },
  {
    id: 'route-c',
    label: 'Route C',
    description: 'Moderate — via Seminary Hills',
    color: '#f59e0b',
    distance: '3.8 km',
    eta: '14 min',
    coords: [
      [21.1458, 79.0882],
      [21.1440, 79.0895],
      [21.1415, 79.0900],
      [21.1390, 79.0880],
      [21.1360, 79.0850],
      [21.1330, 79.0810],
      [21.1305, 79.0780],
      [21.1275, 79.0740],
      [21.1250, 79.0700],
      [21.1239, 79.0644],
    ],
    characteristics: {
      publicActivity: 54, incidentRisk: 44, emergencyAccessibility: 52,
      isolationRisk: 42, infrastructureVisibility: 48, timeOfDayRisk: 38, currentConditionsRisk: 55,
    },
    warnings: ['Road construction near Seminary Hills', 'Moderate congestion'],
    highlights: ['Scenic route'],
    safetyLevel: 'caution',
  },
];

// Active incidents (Nagpur-area coords)
export const DEMO_INCIDENTS = [
  {
    id: 'inc-001',
    intent: 'STAY_AWAY',
    category: 'ACCIDENT',
    severity: 3,
    status: 'VERIFIED',
    location: [21.1355, 79.0770],
    description: 'Vehicle collision near Itwari junction. One lane blocked.',
    time: '14 min ago',
    reporterCount: 3,
    assistanceType: 'TOW_REQ',
    victimsCount: 0,
    exclusionRadius: 250,
  },
  {
    id: 'inc-002',
    intent: 'NEED_HELP',
    category: 'MEDICAL',
    severity: 5,
    status: 'REPORTED',
    location: [21.1415, 79.0810],
    description: 'Person requires immediate medical assistance near Mahal area.',
    time: '3 min ago',
    reporterCount: 1,
    assistanceType: 'AMBULANCE_REQ',
    victimsCount: 1,
    exclusionRadius: 120,
  },
  {
    id: 'inc-003',
    intent: 'STAY_AWAY',
    category: 'HAZARD',
    severity: 2,
    status: 'CORROBORATED',
    location: [21.1295, 79.0700],
    description: 'Pothole and waterlogging on Seminary Hills road.',
    time: '31 min ago',
    reporterCount: 2,
    assistanceType: 'NONE',
    victimsCount: 0,
    exclusionRadius: 180,
  },
];

// Nagpur emergency services (real locations)
export const EMERGENCY_SERVICES = [
  {
    id: 'svc-001', type: 'police',
    name: 'Sitabuldi Police Station', distance: '0.3 km',
    phone: '0712-2562626',
    location: [21.1480, 79.0868], contactable: true,
  },
  {
    id: 'svc-002', type: 'hospital',
    name: 'Government Medical College & Hospital', distance: '0.8 km',
    phone: '0712-2700437',
    location: [21.1530, 79.0840], contactable: true,
  },
  {
    id: 'svc-003', type: 'ambulance',
    name: 'NMC Ambulance Service (108)', distance: '0.5 km',
    phone: '108',
    location: [21.1502, 79.0900], contactable: true,
  },
  {
    id: 'svc-004', type: 'hospital',
    name: 'Orange City Hospital', distance: '1.2 km',
    phone: '0712-2568888',
    location: [21.1472, 79.0803], contactable: true,
  },
  {
    id: 'svc-005', type: 'pharmacy',
    name: 'Apollo Pharmacy — Sitabuldi', distance: '0.4 km',
    phone: '1860-500-0101',
    location: [21.1448, 79.0890], contactable: false,
  },
  {
    id: 'svc-006', type: 'fire',
    name: 'NMC Fire Station — Mahal', distance: '1.0 km',
    phone: '101',
    location: [21.1530, 79.0930], contactable: true,
  },
  {
    id: 'svc-007', type: 'police',
    name: 'Mahal Police Station', distance: '0.9 km',
    phone: '0712-2765432',
    location: [21.1510, 79.0950], contactable: true,
  },
  {
    id: 'svc-008', type: 'petrol',
    name: 'HPCL Petrol Pump — Amravati Road', distance: '0.7 km',
    phone: null,
    location: [21.1495, 79.0820], contactable: false,
  },
];

// Nagpur destinations for search
export const DESTINATIONS = [
  { name: 'Deekshabhoomi',          desc: 'Nagpur, Maharashtra',    icon: '🏛️', coords: [21.1239, 79.0644] },
  { name: 'Nagpur Railway Station', desc: 'Nagpur Junction',        icon: '🚂', coords: [21.1474, 79.0890] },
  { name: 'Nagpur Airport',         desc: 'Dr. Babasaheb Ambedkar', icon: '✈️', coords: [21.0924, 79.0472] },
  { name: 'Futala Lake',            desc: 'Civil Lines, Nagpur',    icon: '🌊', coords: [21.1607, 79.0388] },
  { name: 'VNIT Nagpur',            desc: 'South Ambazari Road',    icon: '🎓', coords: [21.1352, 79.0508] },
  { name: 'Wardha Road',            desc: 'Dharampeth, Nagpur',     icon: '🛣️', coords: [21.1186, 79.1048] },
  { name: 'Nagpur Zoo',             desc: 'Gorewada, Nagpur',       icon: '🦁', coords: [21.1547, 79.0893] },
  { name: 'Sadar Market',           desc: 'Civil Lines, Nagpur',    icon: '🏪', coords: [21.1556, 79.0875] },
];

export const TRUSTED_CONTACTS = [
  { name: 'Mom', phone: '+91-98765-43210', relation: 'Family' },
  { name: 'Best Friend', phone: '+91-91234-56789', relation: 'Friend' },
];

export const STATUS_LABELS = {
  UNVERIFIED:   { label: 'Unverified',   color: '#94a3b8', bg: '#f8fafc' },
  REPORTED:     { label: 'Reported',     color: '#3b82f6', bg: '#eff6ff' },
  CORROBORATED: { label: 'Corroborated', color: '#f59e0b', bg: '#fffbeb' },
  VERIFIED:     { label: 'Verified',     color: '#ef4444', bg: '#fef2f2' },
  RESOLVED:     { label: 'Resolved',     color: '#22c55e', bg: '#f0fdf4' },
};

export const CATEGORY_META = {
  ACCIDENT:   { icon: '🚗', label: 'Road Accident' },
  MEDICAL:    { icon: '🚑', label: 'Medical Emergency' },
  HAZARD:     { icon: '⚠️', label: 'Road Hazard' },
  FIRE:       { icon: '🔥', label: 'Fire' },
  BLOCKAGE:   { icon: '🚧', label: 'Road Blockage' },
  SUSPICIOUS: { icon: '👁️', label: 'Suspicious Activity' },
  TRAFFIC:    { icon: '🚦', label: 'Traffic Hazard' },
  OTHER:      { icon: '📢', label: 'Other' },
};

export const SERVICE_META = {
  police:   { icon: '🚔', color: '#3b82f6', label: 'Police' },
  hospital: { icon: '🏥', color: '#ef4444', label: 'Hospital' },
  ambulance:{ icon: '🚑', color: '#f59e0b', label: 'Ambulance' },
  pharmacy: { icon: '💊', color: '#8b5cf6', label: 'Pharmacy' },
  petrol:   { icon: '⛽', color: '#64748b', label: 'Petrol Pump' },
  fire:     { icon: '🚒', color: '#f97316', label: 'Fire Station' },
};
