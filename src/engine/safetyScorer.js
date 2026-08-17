// safetyScorer.js — Rule-based weighted safety scoring engine (PRD Section 6)

export const STANDARD_WEIGHTS = {
  publicActivity:            0.15,
  incidentRisk:              0.25,
  emergencyAccessibility:    0.15,
  isolationRisk:             0.15,
  infrastructureVisibility:  0.10,
  timeOfDayRisk:             0.10,
  currentConditionsRisk:     0.10,
};

export const ENHANCED_WEIGHTS = {
  publicActivity:            0.20,
  incidentRisk:              0.20,
  emergencyAccessibility:    0.15,
  isolationRisk:             0.20,
  infrastructureVisibility:  0.15,
  timeOfDayRisk:             0.05,
  currentConditionsRisk:     0.05,
};

export const FACTOR_META = {
  publicActivity:           { label: 'Public Activity',       icon: '👥', higherIsBetter: true },
  incidentRisk:             { label: 'Incident Risk',         icon: '⚠️', higherIsBetter: false },
  emergencyAccessibility:   { label: 'Emergency Access',      icon: '🚑', higherIsBetter: true },
  isolationRisk:            { label: 'Road Isolation',        icon: '🛣️', higherIsBetter: false },
  infrastructureVisibility: { label: 'Lighting/Visibility',   icon: '💡', higherIsBetter: true },
  timeOfDayRisk:            { label: 'Time-of-Day Risk',      icon: '🕐', higherIsBetter: false },
  currentConditionsRisk:    { label: 'Current Conditions',    icon: '🌦️', higherIsBetter: false },
};

/**
 * Compute safety score for a route.
 * Score = w1·PublicActivity + w2·(100−IncidentRisk) + w3·EmergencyAccessibility
 *       + w4·(100−IsolationRisk) + w5·InfrastructureVisibility
 *       + w6·(100−TimeOfDayRisk) + w7·(100−CurrentConditionsRisk)
 */
export function computeSafetyScore(characteristics, enhancedMode = false) {
  const weights = enhancedMode ? ENHANCED_WEIGHTS : STANDARD_WEIGHTS;
  const c = characteristics;

  const contributions = {
    publicActivity:           weights.publicActivity           * c.publicActivity,
    incidentRisk:             weights.incidentRisk             * (100 - c.incidentRisk),
    emergencyAccessibility:   weights.emergencyAccessibility   * c.emergencyAccessibility,
    isolationRisk:            weights.isolationRisk            * (100 - c.isolationRisk),
    infrastructureVisibility: weights.infrastructureVisibility * c.infrastructureVisibility,
    timeOfDayRisk:            weights.timeOfDayRisk            * (100 - c.timeOfDayRisk),
    currentConditionsRisk:    weights.currentConditionsRisk    * (100 - c.currentConditionsRisk),
  };

  const overallScore = Math.round(
    Object.values(contributions).reduce((sum, v) => sum + v, 0)
  );

  // Build explanation
  const positives = [], negatives = [];
  if (c.publicActivity >= 70) positives.push('high public activity');
  else if (c.publicActivity <= 30) negatives.push('low public activity');
  if (c.incidentRisk >= 50) negatives.push('active incidents nearby');
  else if (c.incidentRisk <= 10) positives.push('no active incidents');
  if (c.emergencyAccessibility >= 70) positives.push('emergency services nearby');
  else if (c.emergencyAccessibility <= 30) negatives.push('limited emergency access');
  if (c.isolationRisk >= 60) negatives.push('isolated road segment');
  else if (c.isolationRisk <= 20) positives.push('well-traveled corridor');
  if (c.infrastructureVisibility >= 60) positives.push('good lighting');
  else if (c.infrastructureVisibility <= 30) negatives.push('poor visibility/lighting');

  let explanation = '';
  if (overallScore >= 75) explanation = 'This route scores well ';
  else if (overallScore >= 50) explanation = 'This route has moderate safety ';
  else explanation = 'This route has safety concerns ';
  const parts = [];
  if (positives.length) parts.push(`due to ${positives.join(', ')}`);
  if (negatives.length) parts.push(`but loses points for ${negatives.join(', ')}`);
  explanation += parts.join(', ') + '.';

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    factorBreakdown: { ...c },
    contributions,
    weights,
    explanation,
    mode: enhancedMode ? 'enhanced' : 'standard',
  };
}

export function getRiskLevel(score) {
  if (score >= 75) return { level: 'LOW RISK',  color: '#22c55e', bg: '#f0fdf4', border: '#86efac' };
  if (score >= 50) return { level: 'MODERATE',  color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' };
  if (score >= 30) return { level: 'HIGH RISK', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' };
  return              { level: 'CRITICAL',       color: '#7f1d1d', bg: '#fef2f2', border: '#ef4444' };
}

export function getScoreColor(score) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#ef4444';
  return '#7f1d1d';
}
