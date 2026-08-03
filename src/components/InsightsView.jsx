import React, { useState, useMemo } from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trophy,
  Briefcase,
  Palmtree,
  Target,
  X,
  Wallet,
} from 'lucide-react';
import StatCard from './StatCard';
import { toKey, startOfWeek, addDays } from './WeekView';
import { pad } from './MonthView';
import { CATEGORY_ICONS } from './ExpenseFormModal';

function fmtShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateString(dStr) {
  if (!dStr || typeof dStr !== 'string') return String(dStr || '');
  try {
    const parts = dStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch (e) {}
  return String(dStr);
}

export default function InsightsView({
  expenses = [],
  currency = '₹',
  getCategoryMeta,
  period = 'week',
  setPeriod,
  monthlyBudgets = {},
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);

  const now = new Date();

  const rangeInfo = useMemo(() => {
    if (period === 'week') {
      const baseStart = startOfWeek(now);
      const weekStart = addDays(baseStart, weekOffset * 7);
      const weekEnd = addDays(weekStart, 6);
      const startKey = toKey(weekStart);
      const endKey = toKey(weekEnd);
      const label = `${fmtShort(weekStart)} – ${fmtShort(weekEnd)}, ${weekEnd.getFullYear()}`;
      return { startKey, endKey, label, type: 'week' };
    }

    if (period === 'month') {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth() + 1;
      const prefix = `${y}-${pad(m)}`;
      const label = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { prefix, label, type: 'month' };
    }

    if (period === 'year') {
      const y = now.getFullYear() + yearOffset;
      const prefix = `${y}`;
      const label = `Year ${y}`;
      return { prefix, label, type: 'year' };
    }

    return { label: 'All Time Records', type: 'all' };
  }, [period, weekOffset, monthOffset, yearOffset]);

  const filtered = useMemo(() => {
    const safeExpenses = expenses || [];
    if (rangeInfo.type === 'week') {
      return safeExpenses.filter((e) => e.date >= rangeInfo.startKey && e.date <= rangeInfo.endKey);
    }
    if (rangeInfo.type === 'month') {
      return safeExpenses.filter((e) => e.date.startsWith(rangeInfo.prefix));
    }
    if (rangeInfo.type === 'year') {
      return safeExpenses.filter((e) => e.date.startsWith(rangeInfo.prefix));
    }
    return safeExpenses;
  }, [expenses, rangeInfo]);

  const prevPeriodFiltered = useMemo(() => {
    const safeExpenses = expenses || [];
    if (period === 'week') {
      const baseStart = startOfWeek(now);
      const weekStart = addDays(baseStart, (weekOffset - 1) * 7);
      const weekEnd = addDays(weekStart, 6);
      const startKey = toKey(weekStart);
      const endKey = toKey(weekEnd);
      return safeExpenses.filter((e) => e.date >= startKey && e.date <= endKey);
    }
    if (period === 'month') {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + (monthOffset - 1), 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth() + 1;
      const prefix = `${y}-${pad(m)}`;
      return safeExpenses.filter((e) => e.date.startsWith(prefix));
    }
    if (period === 'year') {
      const y = now.getFullYear() + (yearOffset - 1);
      const prefix = `${y}`;
      return safeExpenses.filter((e) => e.date.startsWith(prefix));
    }
    return [];
  }, [expenses, period, weekOffset, monthOffset, yearOffset]);

  const prevByCategory = useMemo(() => {
    const map = {};
    prevPeriodFiltered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [prevPeriodFiltered]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [filtered]);

  const categoryData = useMemo(() => {
    return Object.entries(byCategory)
      .map(([name, amount]) => {
        const prevAmount = prevByCategory[name] || 0;
        let trendPct = null;
        if (prevAmount > 0) {
          trendPct = Math.round(((amount - prevAmount) / prevAmount) * 100);
        } else if (amount > 0 && prevPeriodFiltered.length > 0) {
          trendPct = 100;
        }

        const meta = getCategoryMeta ? getCategoryMeta(name) : {};
        return {
          name,
          amount,
          prevAmount,
          trendPct,
          color: meta.color || '#C9F31D',
          ...meta,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [byCategory, prevByCategory, prevPeriodFiltered, getCategoryMeta]);

  const top3Purchases = useMemo(() => {
    return [...filtered].sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [filtered]);

  const weekdayVsWeekend = useMemo(() => {
    let weekdayTotal = 0;
    let weekendTotal = 0;

    filtered.forEach((e) => {
      try {
        if (typeof e.date === 'string') {
          const parts = e.date.split('-').map(Number);
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          const day = d.getDay();
          if (day === 0 || day === 6) {
            weekendTotal += e.amount;
          } else {
            weekdayTotal += e.amount;
          }
        } else {
          weekdayTotal += e.amount;
        }
      } catch (err) {
        weekdayTotal += e.amount;
      }
    });

    const sum = weekdayTotal + weekendTotal;
    const weekdayPct = sum ? Math.round((weekdayTotal / sum) * 100) : 0;
    const weekendPct = sum ? Math.round((weekendTotal / sum) * 100) : 0;

    return { weekdayTotal, weekendTotal, weekdayPct, weekendPct };
  }, [filtered]);

  const budgetHealth = useMemo(() => {
    const currentMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const budget = monthlyBudgets[currentMonthStr] || 0;
    if (budget <= 0) return null;

    const remaining = budget - total;
    const pctUsed = Math.min(Math.round((total / budget) * 100), 100);

    let status = 'Healthy';
    let statusClass = 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30';
    if (pctUsed >= 90) {
      status = 'Critical';
      statusClass = 'text-[var(--danger)] bg-[var(--danger)]/15 border-[var(--danger)]/40 animate-pulse';
    } else if (pctUsed >= 75) {
      status = 'Warning';
      statusClass = 'text-[var(--warning)] bg-[var(--warning)]/15 border-[var(--warning)]/30';
    }

    return { budget, remaining, pctUsed, status, statusClass };
  }, [monthlyBudgets, total]);

  const filteredCategoryExpenses = useMemo(() => {
    if (!selectedCategoryFilter) return [];
    return filtered.filter((e) => e.category === selectedCategoryFilter);
  }, [filtered, selectedCategoryFilter]);

  const uniqueDays = new Set(filtered.map((e) => e.date)).size;
  const avgPerDay = uniqueDays ? total / uniqueDays : 0;

  const dailyTotals = {};
  filtered.forEach((e) => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });
  const highestDayEntry = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];

  const aiInsights = useMemo(() => {
    const insights = [];
    const currentMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

    const currentBudget = monthlyBudgets[currentMonthStr] || 0;
    const currentMonthExpenses = (expenses || []).filter((e) => e.date && e.date.startsWith(currentMonthStr));
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (currentBudget > 0) {
      const budgetPct = (currentMonthTotal / currentBudget) * 100;
      if (budgetPct >= 90) {
        insights.push({
          type: 'danger',
          icon: AlertTriangle,
          title: 'Critical Budget Alert',
          text: `You have consumed ${budgetPct.toFixed(0)}% of your monthly budget (${currency}${currentMonthTotal.toLocaleString()} of ${currency}${currentBudget.toLocaleString()}).`,
        });
      }
    }

    if (categoryData.length > 0 && total > 0) {
      const topCat = categoryData[0];
      const pct = (topCat.amount / total) * 100;
      if (pct >= 35) {
        const savings = topCat.amount * 0.2;
        insights.push({
          type: 'info',
          icon: Lightbulb,
          title: `Heavy concentration in ${topCat.name}`,
          text: `${topCat.name} accounts for ${pct.toFixed(0)}% of spending in ${rangeInfo.label}. Reducing by 20% saves ${currency}${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        icon: Sparkles,
        title: 'Insights Active',
        text: `Analyzing financial performance for ${rangeInfo.label}.`,
      });
    }

    return insights;
  }, [expenses, categoryData, total, currency, monthlyBudgets, rangeInfo]);

  return (
    <div className="space-y-4 fade-in pb-8">
      <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 gap-1">
        {[
          ['week', 'Week'],
          ['month', 'Month'],
          ['year', 'Year'],
          ['all', 'All Time'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setPeriod(id);
              setSelectedCategoryFilter(null);
            }}
            className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all duration-200 ${
              period === id
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {period !== 'all' && (
        <div className="flex items-center justify-between cred-card py-2.5 px-4">
          <button
            onClick={() => {
              if (period === 'week') setWeekOffset((w) => w - 1);
              if (period === 'month') setMonthOffset((m) => m - 1);
              if (period === 'year') setYearOffset((y) => y - 1);
              setSelectedCategoryFilter(null);
            }}
            aria-label="Previous period"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5 text-center">
            <CalendarIcon size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-bold font-mono tracking-tight text-[var(--text-primary)]">
              {rangeInfo.label}
            </span>
          </div>

          <button
            onClick={() => {
              if (period === 'week') setWeekOffset((w) => w + 1);
              if (period === 'month') setMonthOffset((m) => m + 1);
              if (period === 'year') setYearOffset((y) => y + 1);
              setSelectedCategoryFilter(null);
            }}
            disabled={
              (period === 'week' && weekOffset >= 0) ||
              (period === 'month' && monthOffset >= 0) ||
              (period === 'year' && yearOffset >= 0)
            }
            aria-label="Next period"
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition disabled:opacity-20"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {budgetHealth && (
        <div className="cred-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target size={16} className="text-[var(--accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Budget Health Gauge
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${budgetHealth.statusClass}`}>
              {budgetHealth.status} ({budgetHealth.pctUsed}% used)
            </span>
          </div>

          <div className="h-2 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${budgetHealth.pctUsed}%`,
                backgroundColor: budgetHealth.pctUsed >= 90 ? '#ef4444' : budgetHealth.pctUsed >= 75 ? '#f59e0b' : '#C9F31D',
                boxShadow: `0 0 10px ${budgetHealth.pctUsed >= 90 ? '#ef4444' : '#C9F31D'}60`,
              }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-mono pt-1">
            <span>Spent: {currency}{total.toLocaleString()}</span>
            <span className="font-bold text-[var(--text-primary)]">
              {budgetHealth.remaining >= 0
                ? `${currency}${budgetHealth.remaining.toLocaleString()} left`
                : `Over by ${currency}${Math.abs(budgetHealth.remaining).toLocaleString()}`}
            </span>
          </div>
        </div>
      )}

      <div className="cred-card py-5 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1">
          Total Spent ({rangeInfo.label})
        </p>
        <h2 className="text-4xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
          {currency}{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>
      </div>

      {categoryData.length === 0 ? (
        <div className="text-center py-16 cred-card border-dashed">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No records for {rangeInfo.label}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">Use the arrows above to view other dates or log new expenses.</p>
        </div>
      ) : (
        <>
          <div className="cred-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Spending Breakdown
              </p>
              <span className="text-[10px] text-[var(--accent)] font-mono font-semibold">
                💡 Tap slice to filter
              </span>
            </div>

            <div className="relative h-[220px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                    onClick={(entry) => {
                      if (entry && entry.name) {
                        setSelectedCategoryFilter(entry.name === selectedCategoryFilter ? null : entry.name);
                      }
                    }}
                  >
                    {categoryData.map((c, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={c.color || '#C9F31D'}
                        stroke={selectedCategoryFilter === c.name ? '#ffffff' : 'transparent'}
                        strokeWidth={selectedCategoryFilter === c.name ? 3 : 0}
                        opacity={selectedCategoryFilter && selectedCategoryFilter !== c.name ? 0.35 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(v) => [`${currency}${parseFloat(v).toLocaleString()}`, 'Spent']}
                  />
                </RePieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  {selectedCategoryFilter ? selectedCategoryFilter : 'Total'}
                </p>
                <p className="text-lg font-black font-mono text-[var(--text-primary)] tracking-tight">
                  {currency}
                  {(selectedCategoryFilter ? byCategory[selectedCategoryFilter] || 0 : total).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )}
                </p>
              </div>
            </div>

            {selectedCategoryFilter && (
              <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-xs text-[var(--accent)]">
                <span className="font-bold">
                  Filtering: {selectedCategoryFilter} ({filteredCategoryExpenses.length} items)
                </span>
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="p-1 rounded-lg hover:bg-[var(--accent)]/20 text-[var(--accent)]"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {selectedCategoryFilter && filteredCategoryExpenses.length > 0 && (
            <div className="cred-card p-4 space-y-2.5 slide-up">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
                Logs for {selectedCategoryFilter}
              </h3>
              {filteredCategoryExpenses.map((e) => {
                const IconCmp = (CATEGORY_ICONS && CATEGORY_ICONS[e.category]) || Wallet;
                const meta = getCategoryMeta ? getCategoryMeta(e.category) : {};
                const catColor = meta?.color || '#C9F31D';

                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${catColor}20` }}>
                        <IconCmp size={15} style={{ color: catColor }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text-primary)] truncate">{e.note || e.category}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{e.date}</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-[var(--text-primary)]">
                      {currency}{e.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="cred-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Category Distribution & Trends
              </h3>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                vs Prev Period
              </span>
            </div>

            {categoryData.map((c, idx) => {
              const pct = total ? Math.round((c.amount / total) * 100) : 0;
              const isSelected = selectedCategoryFilter === c.name;

              return (
                <div
                  key={c.name}
                  onClick={() => setSelectedCategoryFilter(isSelected ? null : c.name)}
                  className={`space-y-1.5 cursor-pointer p-1.5 rounded-xl transition ${
                    isSelected ? 'bg-white/5 ring-1 ring-[var(--accent)]' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>

                      {c.trendPct !== null && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${
                            c.trendPct > 0
                              ? 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20'
                              : 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20'
                          }`}
                        >
                          {c.trendPct > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          {c.trendPct > 0 ? `+${c.trendPct}%` : `${c.trendPct}%`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold font-mono text-[var(--text-primary)]">
                        {currency}{c.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-right">{pct}%</span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: c.color,
                        boxShadow: `0 0 8px ${c.color}60`,
                        animation: `slideInItem 0.7s cubic-bezier(0.16,1,0.3,1) ${idx * 80}ms both`,
                        transformOrigin: 'left center',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {top3Purchases.length > 0 && (
            <div className="cred-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Top 3 Biggest Purchases
                </h3>
              </div>

              <div className="space-y-2">
                {top3Purchases.map((e, index) => {
                  const IconCmp = (CATEGORY_ICONS && CATEGORY_ICONS[e.category]) || Wallet;
                  const meta = getCategoryMeta ? getCategoryMeta(e.category) : {};
                  const catColor = meta?.color || '#C9F31D';
                  const medals = ['🥇', '🥈', '🥉'];

                  return (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg">{medals[index]}</span>
                        <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${catColor}20` }}>
                          <IconCmp size={16} style={{ color: catColor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {e.note || e.category}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{formatDateString(e.date)}</p>
                        </div>
                      </div>

                      <span className="text-xs font-bold font-mono text-[var(--text-primary)] shrink-0">
                        {currency}{e.amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="cred-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Weekday vs Weekend Ratio
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <Palmtree size={15} className="text-emerald-400" />
              </div>
            </div>

            <div className="h-3 w-full bg-[var(--bg-input)] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${weekdayVsWeekend.weekdayPct}%` }}
                title={`Weekday: ${weekdayVsWeekend.weekdayPct}%`}
              />
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${weekdayVsWeekend.weekendPct}%` }}
                title={`Weekend: ${weekdayVsWeekend.weekendPct}%`}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-mono">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>
                  Weekday: {weekdayVsWeekend.weekdayPct}% ({currency}
                  {weekdayVsWeekend.weekdayTotal.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  Weekend: {weekdayVsWeekend.weekendPct}% ({currency}
                  {weekdayVsWeekend.weekendTotal.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <div className="cred-card p-5 border-[var(--border-color)] relative overflow-hidden bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[rgba(var(--accent-rgb),0.02)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 blur-2xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[var(--accent)] animate-pulse" />
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                AI Spending Insights
              </h3>
            </div>

            <div className="space-y-4">
              {aiInsights.map((insight, idx) => {
                const Icon = insight.icon;
                let themeClasses = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
                if (insight.type === 'danger') {
                  themeClasses = 'text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/20';
                } else if (insight.type === 'warning') {
                  themeClasses = 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
                } else if (insight.type === 'success') {
                  themeClasses = 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
                } else if (insight.type === 'info') {
                  themeClasses = 'text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20';
                }

                return (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${themeClasses}`}>
                    <Icon size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">{insight.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Daily average"
              value={`${currency}${avgPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            />
            <StatCard label="Entries Logged" value={filtered.length} />
            <StatCard
              label="Top Category"
              value={categoryData[0]?.name || '—'}
              sub={categoryData[0] ? `${currency}${categoryData[0].amount.toLocaleString()}` : ''}
            />
            <StatCard
              label="Highest Day"
              value={
                highestDayEntry
                  ? `${currency}${parseFloat(highestDayEntry[1]).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : '—'
              }
              sub={highestDayEntry ? formatDateString(highestDayEntry[0]) : ''}
            />
          </div>
        </>
      )}
    </div>
  );
}
