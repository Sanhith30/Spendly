import React, { useEffect, useRef, useState } from 'react';

function useAnimatedNumber(target) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (from === to) return;

    const duration = 600;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return display;
}

export default function StatCard({ label, value = '', sub, trend, trendType, rawAmount }) {
  const isUp = trendType === 'up';
  const isDown = trendType === 'down';
  const isSuccess = trendType === 'success';

  let trendColor = 'text-[var(--text-secondary)]';
  if (isUp) trendColor = 'text-[var(--danger)]';
  if (isDown) trendColor = 'text-[var(--success)]';
  if (isSuccess) trendColor = 'text-[var(--success)]';

  const animatedNum = useAnimatedNumber(rawAmount ?? 0);
  
  // Safe string conversion for value to prevent TypeError on .match()
  const valStr = String(value ?? '');
  let displayValue = valStr;

  if (rawAmount !== undefined && rawAmount !== null) {
    const isNegative = animatedNum < 0;
    const absFormatted = Math.abs(animatedNum).toLocaleString();
    // Safely match currency symbol from string (non-digit, non-minus, non-comma)
    const currencyMatch = valStr.match(/^[^\d\-]+/);
    const currSymbol = currencyMatch ? currencyMatch[0] : '';
    displayValue = isNegative ? `-${currSymbol}${absFormatted}` : `${currSymbol}${absFormatted}`;
  }

  return (
    <div className="cred-card flex flex-col justify-between min-h-[100px] hover:shadow-lg transition-all duration-300 group">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</p>
        <p
          key={displayValue}
          className="text-xl font-bold text-[var(--text-primary)] font-mono tracking-tight mt-1.5 truncate"
          style={{ animation: 'countUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          {displayValue}
        </p>
      </div>
      {sub || trend ? (
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[var(--border-color)]/20">
          {sub && <span className="text-[11px] text-[var(--text-secondary)] truncate">{sub}</span>}
          {trend && (
            <span className={`text-[10px] font-mono font-bold ${trendColor}`}>
              {trend}
            </span>
          )}
        </div>
      ) : null}
      {/* Subtle glow accent line at bottom */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
