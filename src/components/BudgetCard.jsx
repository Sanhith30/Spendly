import React from 'react';

export default function BudgetCard({ budget, spent, currency, onSetBudget }) {
  const isConfigured = budget > 0;
  const remaining = budget - spent;
  const percent = isConfigured ? Math.min(Math.round((spent / budget) * 100), 150) : 0;

  // Determine progress color
  let progressColor = 'bg-[var(--success)]';
  let progressGlow = 'rgba(16, 185, 129, 0.3)';
  if (percent >= 90) {
    progressColor = 'bg-[var(--danger)]';
    progressGlow = 'rgba(239, 68, 68, 0.3)';
  } else if (percent >= 70) {
    progressColor = 'bg-[var(--warning)]';
    progressGlow = 'rgba(245, 158, 11, 0.3)';
  }

  return (
    <div className="cred-card col-span-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Monthly Budget</h3>
          {isConfigured ? (
            <p className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {currency}{spent.toLocaleString()} <span className="text-xs font-normal text-[var(--text-secondary)]">of {currency}{budget.toLocaleString()}</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">No monthly budget set yet.</p>
          )}
        </div>
        <button
          onClick={onSetBudget}
          className="text-xs text-[var(--accent)] hover:underline font-semibold"
        >
          {isConfigured ? 'Edit' : 'Configure'}
        </button>
      </div>

      {isConfigured ? (
        <div className="space-y-2">
          {/* Progress bar container */}
          <div className="h-2 w-full bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
              style={{
                width: `${Math.min(percent, 100)}%`,
                boxShadow: `0 0 10px ${progressGlow}`
              }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[var(--text-secondary)]">
              {percent}% spent
            </span>
            <span className={remaining >= 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--danger)] font-bold'}>
              {remaining >= 0 
                ? `${currency}${remaining.toLocaleString()} remaining` 
                : `Overspent by ${currency}${Math.abs(remaining).toLocaleString()}`
              }
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={onSetBudget}
          className="w-full mt-2 text-center text-xs py-2 bg-[var(--bg-input)] rounded-lg hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]"
        >
          Set up a budget to track progress
        </button>
      )}
    </div>
  );
}
