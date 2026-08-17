import { useState, useEffect } from 'react';
import { runParityCheck } from '../engine/parityCheck';
import { DEMO_INCIDENTS } from '../data/seedData';

const STATUS_ICONS = {
  pending: '○',
  running: '◌',
  PASS: '✓',
  FAIL: '✕',
  FLAG: '⚠',
};

export default function ParityCheckPanel({ primaryResult, route, allRoutes, enhancedMode, onComplete }) {
  const [stepStates, setStepStates] = useState(['pending', 'pending', 'pending', 'pending']);
  const [parityResult, setParityResult] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);

  useEffect(() => {
    if (!primaryResult || !route) return;

    const result = runParityCheck(primaryResult, route, allRoutes, DEMO_INCIDENTS, enhancedMode);
    setParityResult(result);

    // Animate each step sequentially
    const delays = [400, 900, 1400, 1900];
    delays.forEach((delay, i) => {
      setTimeout(() => {
        setStepStates((prev) => {
          const next = [...prev];
          next[i] = 'running';
          return next;
        });
        setTimeout(() => {
          setStepStates((prev) => {
            const next = [...prev];
            next[i] = result.steps[i].status;
            return next;
          });
          if (i === delays.length - 1) {
            setTimeout(() => {
              setShowVerdict(true);
              onComplete && onComplete(result);
            }, 400);
          }
        }, 450);
      }, delay);
    });
  }, [primaryResult, route]);

  if (!primaryResult || !route) return null;

  return (
    <div className="parity-panel">
      <div className="parity-title">
        <div className="parity-title-icon">🔍</div>
        Independent Safety Verification
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>
          PRD §7 Parity Check
        </span>
      </div>

      {parityResult?.steps.map((step, i) => (
        <div className="parity-step" key={step.id}>
          <div className={`parity-step-indicator ${
            stepStates[i] === 'pending' ? 'pending' :
            stepStates[i] === 'running' ? 'running' :
            stepStates[i] === 'PASS' ? 'pass' :
            stepStates[i] === 'FAIL' ? 'fail' : 'flag'
          }`}>
            {stepStates[i] === 'running' ? '↻' : STATUS_ICONS[stepStates[i]] || '○'}
          </div>
          <div className="parity-step-content">
            <div className="parity-step-label">{step.label}</div>
            {stepStates[i] !== 'pending' && stepStates[i] !== 'running' && (
              <div className="parity-step-detail">{step.detail}</div>
            )}
            {stepStates[i] === 'running' && (
              <div className="parity-step-detail" style={{ color: 'var(--brand-primary)' }}>
                Checking…
              </div>
            )}
          </div>
        </div>
      ))}

      {showVerdict && parityResult && (
        <>
          <div className="parity-scores-row" style={{ marginTop: 12 }}>
            <div className="parity-score-box">
              <div className="label">Pass 1 (Primary)</div>
              <div className="value" style={{ color: 'var(--brand-primary)' }}>
                {parityResult.pass1Score}
              </div>
            </div>
            <div className="parity-score-box">
              <div className="label">Pass 2 (Independent)</div>
              <div className="value" style={{ color: '#7c3aed' }}>
                {parityResult.pass2Score}
              </div>
            </div>
            <div className="parity-score-box">
              <div className="label">Δ Delta</div>
              <div className="value" style={{ color: parityResult.delta > 8 ? '#ef4444' : '#22c55e', fontSize: 18 }}>
                {parityResult.delta}
              </div>
            </div>
          </div>
          <div className={`parity-verdict ${
            parityResult.verdict === 'APPROVED' ? 'approved' :
            parityResult.verdict === 'CAUTION' ? 'caution' : 'reject'
          }`}>
            {parityResult.message}
          </div>
        </>
      )}
    </div>
  );
}
