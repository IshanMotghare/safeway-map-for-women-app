// parityCheck.js — Independent second-pass safety verification (PRD Section 7)

import { computeSafetyScore } from './safetyScorer';

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Independent parity check — re-runs scoring as a separate function call,
 * checks critical conditions, compares alternatives, flags deltas.
 */
export function runParityCheck(primaryResult, route, allRoutes, activeIncidents, enhancedMode = false) {
  const steps = [];

  // Step 1: Independent re-calculation
  const independentResult = computeSafetyScore(route.characteristics, enhancedMode);
  const delta = Math.abs(primaryResult.overallScore - independentResult.overallScore);
  const DELTA_THRESHOLD = 8;

  steps.push({
    id: 'recompute',
    label: 'Independent Score Recalculation',
    description: 'Re-running scoring engine as a separate computation pass',
    pass1Score: primaryResult.overallScore,
    pass2Score: independentResult.overallScore,
    delta,
    status: delta <= DELTA_THRESHOLD ? 'PASS' : 'FLAG',
    detail: delta <= DELTA_THRESHOLD
      ? `Scores agree within tolerance (Δ = ${delta} pts)`
      : `Score divergence detected (Δ = ${delta} pts) — flagged for review`,
  });

  // Step 2: Critical incident proximity check
  const UNSAFE_DISTANCE_KM = 0.3;
  const verifiedHighSeverity = (activeIncidents || []).filter(
    (inc) => inc.status === 'VERIFIED' && inc.severity >= 4
  );
  const dangerousIncident = verifiedHighSeverity.find((inc) =>
    route.coords.some((coord) => haversineKm(coord, inc.location) < UNSAFE_DISTANCE_KM)
  );

  steps.push({
    id: 'incident_proximity',
    label: 'Critical Incident Proximity Check',
    description: `Checking for Verified critical incidents within ${UNSAFE_DISTANCE_KM * 1000}m of route`,
    status: dangerousIncident ? 'FAIL' : 'PASS',
    detail: dangerousIncident
      ? `Route passes within 300m of a Verified critical incident (${dangerousIncident.category})`
      : 'No critical verified incidents found along route corridor',
  });

  // Step 3: Route dominance analysis
  const dominated = allRoutes.some((other) => {
    if (other.id === route.id) return false;
    const otherScore = other._primaryScore || 0;
    const thisScore = primaryResult.overallScore;
    const thisEta = parseInt(route.eta);
    const otherEta = parseInt(other.eta);
    return otherScore > thisScore + 10 && otherEta <= thisEta + 5;
  });

  steps.push({
    id: 'dominance',
    label: 'Route Dominance Analysis',
    description: 'Confirming recommended route is not dominated by any candidate',
    status: dominated ? 'FLAG' : 'PASS',
    detail: dominated
      ? 'Another route scores significantly better with comparable travel time'
      : 'Route is not dominated — best safety-to-time trade-off confirmed',
  });

  // Step 4: Minimum safety threshold
  const MIN_SAFE_SCORE = 30;
  const belowThreshold = independentResult.overallScore < MIN_SAFE_SCORE;

  steps.push({
    id: 'threshold',
    label: 'Minimum Safety Threshold',
    description: `Verifying route meets minimum safety floor (score ≥ ${MIN_SAFE_SCORE})`,
    status: belowThreshold ? 'FAIL' : 'PASS',
    detail: belowThreshold
      ? `Score (${independentResult.overallScore}) is below the safety floor — auto-reject`
      : `Score (${independentResult.overallScore}) clears the minimum threshold ✓`,
  });

  const hasFail = steps.some((s) => s.status === 'FAIL');
  const hasFlag = steps.some((s) => s.status === 'FLAG');
  const verdict = hasFail ? 'REJECT' : hasFlag ? 'CAUTION' : 'APPROVED';
  const finalScore = Math.round((primaryResult.overallScore + independentResult.overallScore) / 2);

  const messages = {
    APPROVED: `✓ Both passes agree (Δ=${delta}). Route approved with safety score ${finalScore}/100.`,
    CAUTION:  `⚠ Route approved with caution. Minor divergence or competing alternative exists. Score: ${finalScore}/100.`,
    REJECT:   `✕ Route rejected — failed critical safety check. Falling back to next-best route.`,
  };

  return {
    pass1Score: primaryResult.overallScore,
    pass2Score: independentResult.overallScore,
    finalScore,
    delta,
    steps,
    verdict,
    message: messages[verdict],
  };
}
