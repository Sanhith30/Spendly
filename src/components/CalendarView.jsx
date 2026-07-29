import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Trash2, Edit3, Wallet } from 'lucide-react';
import { CATEGORY_ICONS } from './ExpenseFormModal';

const pad = (n) => String(n).padStart(2, '0');

export default function CalendarView({ expenses, currency, getCategoryMeta, onEdit, onDelete }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  const monthLabel = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calendar dates math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  // Shift so Monday is index 0: (day + 6) % 7
  const shiftedStartDayIndex = (startDayIndex + 6) % 7;

  // List of days to render
  const calendarCells = useMemo(() => {
    const cells = [];
    
    // Empty cells for alignment offset
    for (let i = 0; i < shiftedStartDayIndex; i++) {
      cells.push({ isPadding: true, key: `pad-${i}` });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
      const dayExpenses = expenses.filter(e => e.date === dateKey);
      const totalSpend = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

      cells.push({
        isPadding: false,
        day,
        dateKey,
        totalSpend,
        expenses: dayExpenses,
        key: dateKey
      });
    }

    return cells;
  }, [expenses, year, month, daysInMonth, shiftedStartDayIndex]);

  // Determine heatmap levels based on monthly daily average
  const heatmapStats = useMemo(() => {
    const daysWithSpend = calendarCells.filter(c => !c.isPadding && c.totalSpend > 0);
    const totalSpent = daysWithSpend.reduce((sum, c) => sum + c.totalSpend, 0);
    const avg = daysWithSpend.length ? totalSpent / daysWithSpend.length : 0;
    return { avg };
  }, [calendarCells]);

  function getHeatmapClass(spend) {
    if (spend === 0) return 'heatmap-0';
    const avg = heatmapStats.avg;
    if (spend <= avg * 0.4) return 'heatmap-1';
    if (spend <= avg * 0.8) return 'heatmap-2';
    if (spend <= avg * 1.3) return 'heatmap-3';
    if (spend <= avg * 2.0) return 'heatmap-4';
    return 'heatmap-5';
  }

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return expenses.filter(e => e.date === selectedDate);
  }, [expenses, selectedDate]);

  return (
    <div className="space-y-4 fade-in">
      {/* Month Selector */}
      <div className="flex items-center justify-between cred-card py-3 px-4">
        <button
          onClick={() => {
            setMonthOffset(monthOffset - 1);
            setSelectedDate(null);
          }}
          aria-label="Previous month"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          {monthLabel}
        </p>
        <button
          onClick={() => {
            setMonthOffset(monthOffset + 1);
            setSelectedDate(null);
          }}
          disabled={monthOffset >= 0}
          aria-label="Next month"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition disabled:opacity-20"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar Grid Wrapper */}
      <div className="cred-card p-4">
        {/* Days of the week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell) => {
            if (cell.isPadding) {
              return <div key={cell.key} className="aspect-ratio opacity-0" />;
            }

            const heatmapClass = getHeatmapClass(cell.totalSpend);
            const isSelected = selectedDate === cell.dateKey;

            return (
              <button
                key={cell.key}
                onClick={() => setSelectedDate(cell.dateKey)}
                className={`calendar-heatmap-cell ${heatmapClass} ${
                  isSelected ? 'ring-2 ring-[var(--text-primary)] scale-105 z-5' : ''
                }`}
              >
                <span className="text-[10px] opacity-70 self-start">{cell.day}</span>
                {cell.totalSpend > 0 && (
                  <span className="text-[9px] font-bold self-end mt-2 tracking-tighter truncate w-full text-center">
                    {Math.round(cell.totalSpend)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Transactions Modal Overlay */}
      {selectedDate && (
        <div className="cred-card p-4 fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-3">
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              Logs for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg p-1 hover:bg-[var(--bg-secondary)]"
            >
              <X size={16} />
            </button>
          </div>

          {selectedDayData.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-4 italic">
              No transactions logged on this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayData.map(e => {
                const meta = getCategoryMeta(e.category);
                const Icon = CATEGORY_ICONS[e.category] || Wallet;
                return (
                  <div 
                    key={e.id} 
                    className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="rounded-lg p-1.5 shrink-0" 
                        style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                      >
                        <Icon size={16} style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{e.category}</p>
                        {e.note && <p className="text-[10px] text-[var(--text-secondary)] truncate">{e.note}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold font-mono text-[var(--text-primary)]">
                        {currency}{e.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      
                      <div className="flex items-center gap-0.5 border-l border-[var(--border-color)] pl-2">
                        <button
                          onClick={() => onEdit(e)}
                          className="text-[var(--text-secondary)] hover:text-[var(--accent)] p-1 hover:bg-[var(--bg-primary)] rounded-lg"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(e.id)}
                          className="text-[var(--text-secondary)] hover:text-[var(--danger)] p-1 hover:bg-[var(--bg-primary)] rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export { pad };
