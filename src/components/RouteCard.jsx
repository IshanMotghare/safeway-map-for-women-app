import { useState } from 'react';
import { computeSafetyScore, getRiskLevel, getScoreColor, FACTOR_META, STANDARD_WEIGHTS, ENHANCED_WEIGHTS } from '../engine/safetyScorer';

function ScoreCircle({ score, size = 56 }) {
  const color = getScoreColor(score);
  const r = (size / 2) - 5;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="score-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8eaed" strokeWidth="4" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="score-circle-text">
        <span className="score-number" style={{ color }}>{score}</span>
        <span className="score-label">SCORE</span>
      </div>
    </div>
  );
}

function FactorBar({ factorKey, value, weight, enhanced }) {
  const meta = FACTOR_META[factorKey];
  if (!meta) return null;
  const displayValue = meta.higherIsBetter ? value : 100 - value;
  const color = displayValue >= 70 ? '#22c55e' : displayValue >= 40 ? '#f59e0b' : '#ef4444';
  const weights = enhanced ? ENHANCED_WEIGHTS : STANDARD_WEIGHTS;
  const w = Math.round(weights[factorKey] * 100);

  return (
    <div className="factor-row">
      <div className="factor-label">
        <span>{meta.icon}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.label}
        </span>
      </div>
      <div className="factor-bar-track">
        <div
          className="factor-bar-fill"
          style={{ width: `${displayValue}%`, background: color }}
        />
      </div>
      <div className="factor-value" style={{ color }}>{displayValue}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', width: 22, textAlign: 'right' }}>{w}%</div>
    </div>
  );
}

export default function RouteCard({ route, isSelected, isRecommended, enhancedMode, onClick }) {
  const [expanded, setExpanded] = useState(false);
  const result = computeSafetyScore(route.characteristics, enhancedMode);
  const riskLevel = getRiskLevel(result.overallScore);
  const color = getScoreColor(result.overallScore);

  // Store primary score on route for parity check
  route._primaryScore = result.overallScore;

  const borderColor =
    route.safetyLevel === 'safe' ? '#22c55e' :
    route.safetyLevel === 'caution' ? '#f59e0b' : '#ef4444';

  return (
    <div
      className={`route-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
      style={{ color: borderColor, borderColor: isSelected ? 'var(--brand-primary)' : borderColor }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="route-card-header">
        <span className="route-label" style={{ color }}>{route.label}</span>
        {isRecommended && (
          <span className="route-badge recommended">⭐ Safest Route</span>
        )}
        {route.safetyLevel === 'caution' && !isRecommended && (
          <span className="route-badge caution">⚠ Caution</span>
        )}
        {route.safetyLevel === 'danger' && (
          <span className="route-badge danger">🚫 Risky</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {route.description}
        </span>
      </div>

      {/* Meta */}
      <div className="route-meta">
        <span>📍 {route.distance}</span>
        <span>⏱ {route.eta}</span>
      </div>

      {/* Score gauge + risk */}
      <div className="score-gauge-row">
        <ScoreCircle score={result.overallScore} />
        <div className="score-info">
          <div
            className="risk-level-badge"
            style={{ color: riskLevel.color, backgroundColor: riskLevel.bg, borderColor: riskLevel.border }}
          >
            {riskLevel.level}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
            {result.explanation}
          </p>
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--brand-primary)', fontWeight: 600,
          padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {expanded ? '▲ Hide breakdown' : '▼ Show factor breakdown'}
      </button>

      {/* Factor breakdown */}
      {expanded && (
        <div className="factor-breakdown" style={{ marginTop: 8 }}>
          {Object.entries(route.characteristics).map(([key, val]) => (
            <FactorBar
              key={key}
              factorKey={key}
              value={val}
              enhanced={enhancedMode}
            />
          ))}
        </div>
      )}

      {/* Warnings */}
      {route.warnings && route.warnings.length > 0 && (
        <div className="warning-list">
          {route.warnings.map((w, i) => (
            <span key={i} className="tag tag-warning">⚠ {w}</span>
          ))}
        </div>
      )}

      {/* Highlights */}
      {route.highlights && route.highlights.length > 0 && (
        <div className="highlight-list">
          {route.highlights.map((h, i) => (
            <span key={i} className="tag tag-highlight">✓ {h}</span>
          ))}
        </div>
      )}
    </div>
  );
}
