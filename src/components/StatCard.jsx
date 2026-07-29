import React from 'react';

export default function StatCard({ label, value, sub, trend, trendType }) {
  // trendType can be 'up' (danger for expenses, success for income), 'down', or neutral
  const isUp = trendType === 'up';
  const isDown = trendType === 'down';
  const isSuccess = trendType === 'success';

  let trendColor = 'text-[var(--text-secondary)]';
  if (isUp) trendColor = 'text-[var(--danger)]';
  if (isDown) trendColor = 'text-[var(--success)]';
  if (isSuccess) trendColor = 'text-[var(--success)]';

  return (
    <div className="cred-card flex flex-col justify-between min-h-[100px] hover:shadow-lg transition-all duration-300">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)] font-mono tracking-tight mt-1.5 truncate">
          {value}
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
    </div>
  );
}
