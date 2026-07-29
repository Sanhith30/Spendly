import React from 'react';
import { Trash2, Edit3, Plus, Wallet } from 'lucide-react';
import { CATEGORY_ICONS } from './ExpenseFormModal';

export default function TodayView({ expenses, currency, getCategoryMeta, onEdit, onDelete, onOpenAdd }) {
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  const todays = expenses
    .filter((e) => e.date === todayStr)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // latest first

  const total = todays.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5 fade-in">
      {/* Today Total Card */}
      <div className="cred-card flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Today's Spend</p>
          <h2 className="text-4xl font-bold font-mono text-[var(--text-primary)] mt-1 tracking-tight">
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
        <div className="text-center py-16 cred-card border-dashed">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No transactions recorded today</p>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">Tap the "+" button to add your first expense.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todays.map((e) => {
            const meta = getCategoryMeta(e.category);
            const Icon = CATEGORY_ICONS[e.category] || Wallet;
            return (
              <div 
                key={e.id} 
                className="cred-card p-4 flex items-center justify-between hover:border-[var(--text-muted)] transition-all duration-200"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div 
                    className="rounded-xl p-2.5 flex-shrink-0" 
                    style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                  >
                    <Icon size={20} style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{e.category}</p>
                    {e.note ? (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{e.note}</p>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono italic">no note</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      {currency}{e.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
                      {new Date(e.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-3">
                    <button
                      onClick={() => onEdit(e)}
                      aria-label="Edit entry"
                      className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(e.id)}
                      aria-label="Delete entry"
                      className="text-[var(--text-secondary)] hover:text-[var(--danger)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
