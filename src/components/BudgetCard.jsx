import React, { useEffect, useRef } from 'react';

function RingMeter({ percent, color, glow }) {
  const radius = 40;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const normalizedPercent = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (normalizedPercent / 100) * circumference;

  const circleRef = useRef(null);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.style.strokeDashoffset = circumference;
    // Animate to final offset
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)';
          circleRef.current.style.strokeDashoffset = offset;
        }
      });
    });
  }, [offset, circumference]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black font-mono text-[var(--text-primary)]">{normalizedPercent}%</span>
        <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wide">used</span>
      </div>
    </div>
  );
}

export default function BudgetCard({ budget, spent, currency, onSetBudget }) {
  const isConfigured = budget > 0;
  const remaining = budget - spent;
  const percent = isConfigured ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

  // Color thresholds
  let ringColor = '#10b981';
  let ringGlow = 'rgba(16,185,129,0.5)';
  if (percent >= 90) {
    ringColor = '#ef4444';
    ringGlow = 'rgba(239,68,68,0.5)';
  } else if (percent >= 70) {
    ringColor = '#f59e0b';
    ringGlow = 'rgba(245,158,11,0.5)';
  }

  return (
    <div className="cred-card col-span-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Monthly Budget</h3>
        <button
          onClick={onSetBudget}
          className="text-xs text-[var(--accent)] hover:underline font-semibold"
        >
          {isConfigured ? 'Edit' : 'Configure'}
        </button>
      </div>

      {isConfigured ? (
        <div className="flex items-center gap-5">
          {/* Animated SVG ring */}
          <RingMeter percent={percent} color={ringColor} glow={ringGlow} />

          {/* Labels */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-2xl font-black font-mono text-[var(--text-primary)] tracking-tight">
                {currency}{spent.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                of <span className="font-semibold">{currency}{budget.toLocaleString()}</span> budget
              </p>
            </div>
            <div
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg inline-flex"
              style={{
                backgroundColor: remaining >= 0 ? `${ringColor}18` : 'rgba(239,68,68,0.12)',
                color: remaining >= 0 ? ringColor : '#ef4444',
                border: `1px solid ${remaining >= 0 ? ringColor : '#ef4444'}30`
              }}
            >
              {remaining >= 0
                ? `${currency}${remaining.toLocaleString()} remaining`
                : `Overspent ${currency}${Math.abs(remaining).toLocaleString()}`
              }
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onSetBudget}
          className="w-full mt-2 text-center text-xs py-2.5 bg-[var(--bg-input)] rounded-xl hover:bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all duration-200"
        >
          Set up a budget to track progress →
        </button>
      )}
    </div>
  );
}
