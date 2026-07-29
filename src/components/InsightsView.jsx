import React, { useMemo } from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import StatCard from './StatCard';
import { toKey, startOfWeek, addDays } from './WeekView';
import { pad } from './MonthView';

export default function InsightsView({ expenses, currency, getCategoryMeta, period, setPeriod, monthlyBudgets }) {
  const filtered = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      const start = startOfWeek(now);
      const startKey = toKey(start);
      const endKey = toKey(addDays(start, 6));
      return expenses.filter((e) => e.date >= startKey && e.date <= endKey);
    }
    if (period === 'month') {
      const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
      return expenses.filter((e) => e.date.startsWith(prefix));
    }
    return expenses;
  }, [expenses, period]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const byCategory = {};
  filtered.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const categoryData = Object.entries(byCategory)
    .map(([name, amount]) => ({
      name,
      amount,
      ...getCategoryMeta(name)
    }))
    .sort((a, b) => b.amount - a.amount);

  const uniqueDays = new Set(filtered.map((e) => e.date)).size;
  const avgPerDay = uniqueDays ? total / uniqueDays : 0;

  const dailyTotals = {};
  filtered.forEach((e) => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });
  const highestDayEntry = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];

  // Dynamic Rule-based AI Insights Engine (Portfolio Feature!)
  const aiInsights = useMemo(() => {
    const insights = [];
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    
    // 1. Budget Warn Alert
    const currentBudget = monthlyBudgets[currentMonthStr] || 0;
    const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    if (currentBudget > 0) {
      const budgetPct = (currentMonthTotal / currentBudget) * 100;
      if (budgetPct >= 90) {
        insights.push({
          type: 'danger',
          icon: AlertTriangle,
          title: 'Critical Budget Alert',
          text: `You have consumed ${budgetPct.toFixed(0)}% of your monthly budget (${currency}${currentMonthTotal.toLocaleString()} of ${currency}${currentBudget.toLocaleString()}). Hold off on non-essential purchases!`
        });
      } else if (budgetPct >= 75) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Budget warning limit reached',
          text: `You have consumed ${budgetPct.toFixed(0)}% of your monthly budget. Watch out for secondary expenses.`
        });
      }
    }

    // 2. High Category Concentration
    if (categoryData.length > 0 && total > 0) {
      const topCat = categoryData[0];
      const pct = (topCat.amount / total) * 100;
      if (pct >= 35) {
        const savings = topCat.amount * 0.2;
        insights.push({
          type: 'info',
          icon: Lightbulb,
          title: `Heavy concentration in ${topCat.name}`,
          text: `${topCat.name} accounts for ${pct.toFixed(0)}% of your spending this period. Reducing ${topCat.name.toLowerCase()} spending by 20% would save you ${currency}${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`
        });
      }
    }

    // 3. Small Freq Purchase Trackers (e.g. Tea / Coffee / Snacks)
    const transactionCounts = {};
    filtered.forEach(e => {
      transactionCounts[e.category] = (transactionCounts[e.category] || 0) + 1;
    });

    const freqCats = Object.entries(transactionCounts).sort((a, b) => b[1] - a[1]);
    if (freqCats.length > 0) {
      const [catName, count] = freqCats[0];
      const catTotal = byCategory[catName] || 0;
      if (count >= 4) {
        insights.push({
          type: 'info',
          icon: Lightbulb,
          title: `Frequent purchases: ${catName}`,
          text: `You logged ${catName} ${count} times, totaling ${currency}${catTotal.toLocaleString()} in the selected period. Tiny repeating costs like this add up quickly!`
        });
      }
    }

    // 4. Weekly comparative check (This week vs Last week)
    if (period === 'week') {
      const thisWeekStart = startOfWeek(now);
      const lastWeekStart = addDays(thisWeekStart, -7);

      const thisWeekKeyStart = toKey(thisWeekStart);
      const thisWeekKeyEnd = toKey(addDays(thisWeekStart, 6));

      const lastWeekKeyStart = toKey(lastWeekStart);
      const lastWeekKeyEnd = toKey(addDays(lastWeekStart, 6));

      const thisWeekTotal = expenses
        .filter(e => e.date >= thisWeekKeyStart && e.date <= thisWeekKeyEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      const lastWeekTotal = expenses
        .filter(e => e.date >= lastWeekKeyStart && e.date <= lastWeekKeyEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      if (lastWeekTotal > 0) {
        const diff = thisWeekTotal - lastWeekTotal;
        const pct = Math.abs((diff / lastWeekTotal) * 100);
        if (diff < 0) {
          insights.push({
            type: 'success',
            icon: TrendingDown,
            title: 'Spending performance up',
            text: `Your spending this week is ${pct.toFixed(0)}% lower than last week! Outstanding budget discipline. Keep it up!`
          });
        } else if (diff > 0 && pct > 10) {
          insights.push({
            type: 'warning',
            icon: AlertTriangle,
            title: 'Weekly spending surge',
            text: `Your spending this week is ${pct.toFixed(0)}% higher than last week. Review if these logs are one-time outlays.`
          });
        }
      }
    }

    // Default placeholder advice if user doesn't have enough logs
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        icon: Sparkles,
        title: 'Gathering wealth parameters',
        text: 'Logging more expenses unlocks personalized notifications, savings thresholds, and weekly comparative reviews.'
      });
    }

    return insights;
  }, [expenses, categoryData, total, period, currency, monthlyBudgets, byCategory, filtered]);

  return (
    <div className="space-y-4 fade-in">
      {/* Period Filter Chips */}
      <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 gap-1">
        {[
          ['week', 'This Week'],
          ['month', 'This Month'],
          ['all', 'All Time']
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPeriod(id)}
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

      {/* Period Summary spent */}
      <div className="cred-card py-6 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1">
          Total Spent
        </p>
        <h2 className="text-4xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
          {currency}{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </h2>
      </div>

      {categoryData.length === 0 ? (
        <div className="text-center py-16 cred-card border-dashed">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No insights available</p>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">Record logs in the chosen interval to render breakdown charts.</p>
        </div>
      ) : (
        <>
          {/* Donut Chart Card — bigger, centered with total in middle */}
          <div className="cred-card p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">Spending Breakdown</p>
            <div className="relative h-[220px] w-full">
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
                  >
                    {categoryData.map((c, i) => (
                      <Cell key={`cell-${i}`} fill={c.color} stroke="transparent" strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    formatter={(v) => [`${currency}${parseFloat(v).toLocaleString()}`, 'Spent']}
                  />
                </RePieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total</p>
                <p className="text-lg font-black font-mono text-[var(--text-primary)] tracking-tight">
                  {currency}{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Animated Category Bars */}
          <div className="cred-card p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Category Distribution</h3>
            {categoryData.map((c, idx) => {
              const pct = total ? Math.round((c.amount / total) * 100) : 0;
              return (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold font-mono text-[var(--text-primary)]">
                        {currency}{c.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  {/* Animated bar */}
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

          {/* AI Wealth Companion Insights Panel (Pulse effect) */}
          <div className="cred-card p-5 border-[var(--border-color)] relative overflow-hidden bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[rgba(var(--accent-rgb),0.02)]">
            {/* Visual glow indicator */}
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
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 p-3 rounded-xl border ${themeClasses}`}
                  >
                    <Icon size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Basic Period Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              label="Daily average" 
              value={`${currency}${avgPerDay.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
            />
            <StatCard 
              label="Entries Logged" 
              value={filtered.length} 
            />
            <StatCard 
              label="Top Category" 
              value={categoryData[0]?.name || '—'} 
              sub={categoryData[0] ? `${currency}${categoryData[0].amount.toLocaleString()}` : ''}
            />
            <StatCard
              label="Highest Day"
              value={highestDayEntry ? `${currency}${parseFloat(highestDayEntry[1]).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
              sub={highestDayEntry ? new Date(highestDayEntry[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
            />
          </div>
        </>
      )}
    </div>
  );
}
