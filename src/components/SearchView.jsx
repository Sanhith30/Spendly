import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Calendar, Trash2, Edit3, Wallet } from 'lucide-react';
import { CATEGORY_ICONS } from './ExpenseFormModal';

function toKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function SearchView({ expenses, currency, getCategoryMeta, onEdit, onDelete }) {
  const [query, setQuery] = useState('');
  const [filterRange, setFilterRange] = useState('all'); // all, today, yesterday, 7days, thismonth, lastmonth

  const filteredExpenses = useMemo(() => {
    const today = new Date();
    
    return expenses.filter(e => {
      // 1. Text filter
      const matchesText = 
        e.category.toLowerCase().includes(query.toLowerCase()) || 
        (e.note && e.note.toLowerCase().includes(query.toLowerCase()));
      
      if (!matchesText) return false;

      // 2. Date range filter
      if (filterRange === 'all') return true;

      const dateObj = new Date(e.date);
      
      if (filterRange === 'today') {
        const todayStr = toKey(today);
        return e.date === todayStr;
      }
      
      if (filterRange === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = toKey(yesterday);
        return e.date === yesterdayStr;
      }
      
      if (filterRange === '7days') {
        const cutOff = new Date();
        cutOff.setDate(today.getDate() - 7);
        return dateObj >= cutOff;
      }
      
      if (filterRange === 'thismonth') {
        return dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
      }
      
      if (filterRange === 'lastmonth') {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return dateObj.getMonth() === lastMonth.getMonth() && dateObj.getFullYear() === lastMonth.getFullYear();
      }

      return true;
    });
  }, [expenses, query, filterRange]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-4 fade-in">
      {/* Search Input */}
      <div className="cred-card p-2 flex items-center gap-2">
        <SearchIcon size={18} className="text-[var(--text-secondary)] ml-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by category or note..."
          className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] w-full py-2 placeholder-[var(--text-muted)]"
        />
      </div>

      {/* Date Range Chips */}
      <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
        {[
          ['all', 'All'],
          ['today', 'Today'],
          ['yesterday', 'Yesterday'],
          ['7days', '7 Days'],
          ['thismonth', 'This Month'],
          ['lastmonth', 'Last Month'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilterRange(id)}
            className={`text-xs font-semibold py-2 px-4 rounded-lg shrink-0 transition-all duration-200 ${
              filterRange === id 
                ? 'bg-[var(--accent)] text-[var(--accent-text)]' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results summary header */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium px-1">
        <span>Found {filteredExpenses.length} matches</span>
        <span>Filtered spend: <strong className="font-mono text-[var(--text-primary)]">{currency}{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>
      </div>

      {/* Match results list */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16 cred-card border-dashed">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No records found</p>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">Try widening your search terms or date scope filter chips.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // latest first
            .map(e => {
              const meta = getCategoryMeta(e.category);
              const Icon = CATEGORY_ICONS[e.category] || Wallet;
              return (
                <div 
                  key={e.id} 
                  className="cred-card p-3 flex items-center justify-between hover:border-[var(--text-muted)] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="rounded-lg p-2 shrink-0" 
                      style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                    >
                      <Icon size={18} style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{e.category}</p>
                        <span className="text-[9px] font-mono text-[var(--text-muted)] border border-[var(--border-color)] px-1.5 py-0.2 bg-[var(--bg-secondary)] rounded-md flex items-center gap-1">
                          <Calendar size={10} />
                          {e.date}
                        </span>
                      </div>
                      {e.note ? (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{e.note}</p>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono italic">no note</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold font-mono text-[var(--text-primary)]">
                      {currency}{e.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    
                    <div className="flex items-center gap-0.5 border-l border-[var(--border-color)] pl-2">
                      <button
                        onClick={() => onEdit(e)}
                        aria-label="Edit result"
                        className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 hover:bg-[var(--bg-secondary)] rounded-lg"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        aria-label="Delete result"
                        className="text-[var(--text-secondary)] hover:text-[var(--danger)] p-1 hover:bg-[var(--bg-secondary)] rounded-lg"
                      >
                        <Trash2 size={14} />
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
