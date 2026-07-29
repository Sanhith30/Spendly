import React, { useRef, useState, useMemo } from 'react';
import { Trash2, Edit3, Plus, Wallet } from 'lucide-react';
import { CATEGORY_ICONS } from './ExpenseFormModal';

// Swipeable row — touch swipe left reveals delete button
function SwipeRow({ children, onDelete, onEdit }) {
  const rowRef = useRef(null);
  const startXRef = useRef(null);
  const [swiped, setSwiped] = useState(false);

  function onTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (startXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - startXRef.current;
    if (dx < -40) setSwiped(true);
    if (dx > 20) setSwiped(false);
    startXRef.current = null;
  }

  return (
    <div
      ref={rowRef}
      className={`swipe-row ${swiped ? 'swiped' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Delete reveal background */}
      <div className="swipe-delete-bg" onClick={() => { setSwiped(false); onDelete(); }}>
        <Trash2 size={20} className="text-white" />
      </div>
      {/* Card content */}
      <div className="swipe-row-inner">
        {children}
      </div>
    </div>
  );
}

// Illustrated empty state SVG
function EmptyState({ onOpenAdd }) {
  return (
    <div className="text-center py-12 cred-card border border-dashed border-[var(--border-color)] fade-in">
      <div className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(201,243,29,0.07)', border: '1.5px solid rgba(201,243,29,0.15)' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="5" y="10" width="30" height="24" rx="4" stroke="#C9F31D" strokeWidth="1.5" fill="rgba(201,243,29,0.05)" />
          <path d="M5 16h30" stroke="#C9F31D" strokeWidth="1.2" />
          <circle cx="20" cy="26" r="4" stroke="#C9F31D" strokeWidth="1.5" fill="none" />
          <path d="M20 24v2l1.5 1" stroke="#C9F31D" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M13 8v4M20 6v4M27 8v4" stroke="rgba(201,243,29,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">Nothing tracked yet</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">Tap below to log your first expense today</p>
      <button
        onClick={onOpenAdd}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-black text-xs font-bold rounded-full hover:opacity-90 transition"
      >
        <Plus size={14} /> Add Expense
      </button>
    </div>
  );
}

export default function TodayView({ expenses, currency, getCategoryMeta, onEdit, onDelete, onOpenAdd }) {
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  const todays = expenses
    .filter((e) => e.date === todayStr)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = todays.reduce((s, e) => s + e.amount, 0);

  // Category breakdown for mini-bars
  const categoryTotals = useMemo(() => {
    const map = {};
    todays.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [todays]);

  return (
    <div className="space-y-5 fade-in">
      {/* Today Total Card */}
      <div className="cred-card flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Today's Spend</p>
          <h2
            className="text-4xl font-bold font-mono text-[var(--text-primary)] mt-1 tracking-tight"
            key={total}
            style={{ animation: 'countUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {currency}{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 font-medium">
            {todays.length} {todays.length === 1 ? 'transaction' : 'transactions'} logged today
          </p>
        </div>
        <button
          onClick={onOpenAdd}
          className="cred-btn-primary p-3 rounded-full flex items-center justify-center shrink-0"
          aria-label="Add transaction"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Transaction list */}
      {todays.length === 0 ? (
        <EmptyState onOpenAdd={onOpenAdd} />
      ) : (
        <div className="space-y-2.5">
          {todays.map((e, idx) => {
            const meta = getCategoryMeta(e.category);
            const Icon = CATEGORY_ICONS[e.category] || Wallet;
            const catPct = total > 0 ? (categoryTotals[e.category] / total) * 100 : 0;

            return (
              <SwipeRow key={e.id} onDelete={() => onDelete(e.id)} onEdit={() => onEdit(e)}>
                <div
                  className="cred-card p-4 flex items-center justify-between hover:border-[var(--text-muted)] transition-all duration-200"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Category icon */}
                    <div
                      className="rounded-xl p-2.5 flex-shrink-0"
                      style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                    >
                      <Icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{e.category}</p>
                      {e.note ? (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{e.note}</p>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono italic">no note</p>
                      )}
                      {/* Category mini spending bar */}
                      <div className="mt-1.5 h-1 w-full max-w-[80px] bg-[var(--border-color)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${catPct}%`,
                            backgroundColor: meta.color,
                            boxShadow: `0 0 4px ${meta.color}80`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-[var(--text-primary)]">
                        {currency}{e.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
                        {new Date(e.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Actions — hidden on mobile (use swipe), shown on desktop */}
                    <div className="hidden sm:flex items-center gap-1 border-l border-[var(--border-color)] pl-2.5">
                      <button
                        onClick={() => onEdit(e)}
                        aria-label="Edit entry"
                        className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        aria-label="Delete entry"
                        className="text-[var(--text-secondary)] hover:text-[var(--danger)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </SwipeRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
