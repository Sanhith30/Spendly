import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust so Monday is the first day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDay(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function WeekView({ expenses, currency, weekOffset, setWeekOffset }) {
  const base = addDays(startOfWeek(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(base, i));
  const keys = days.map(toKey);

  const todayStr = toKey(new Date());

  const chartData = days.map((d, i) => {
    const dayTotal = expenses
      .filter((e) => e.date === keys[i])
      .reduce((s, e) => s + e.amount, 0);
    return {
      day: fmtDay(d),
      amount: dayTotal,
      isToday: keys[i] === todayStr,
      dateLabel: fmtShort(d)
    };
  });

  const total = chartData.reduce((s, d) => s + d.amount, 0);
  const daysWithData = chartData.filter((d) => d.amount > 0).length;
  const avg = daysWithData ? total / daysWithData : 0;
  const highest = chartData.reduce((max, d) => (d.amount > max.amount ? d : max), chartData[0]);

  // Determine accent color theme for Recharts
  const accentColor = 'var(--accent)';
  const gridColor = 'rgba(255, 255, 255, 0.05)';
  const tickColor = 'var(--text-secondary)';

  return (
    <div className="space-y-4 fade-in">
      {/* Week Navigator */}
      <div className="flex items-center justify-between cred-card py-3 px-4">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          aria-label="Previous week"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          {fmtShort(days[0])} – {fmtShort(days[6])}
        </p>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          disabled={weekOffset >= 0}
          aria-label="Next week"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition disabled:opacity-20"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Bar Chart Card */}
      <div className="cred-card p-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: tickColor }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 10, fill: tickColor, fontFamily: 'JetBrains Mono' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif'
                }}
                formatter={(value) => [`${currency}${parseFloat(value).toLocaleString()}`, 'Spent']}
                labelFormatter={(label, items) => items[0]?.payload?.dateLabel || label}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.amount === 0 ? 'rgba(255, 255, 255, 0.05)' : (entry.isToday ? accentColor : 'rgba(255, 255, 255, 0.25)')} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          label="Total spent" 
          value={`${currency}${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
        />
        <StatCard 
          label="Daily average" 
          value={`${currency}${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
        />
        <StatCard
          label="Highest Day"
          value={highest.amount > 0 ? `${currency}${highest.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
          sub={highest.amount > 0 ? `${highest.day} (${highest.dateLabel})` : ''}
          trendType={highest.amount > 0 ? 'up' : 'neutral'}
        />
      </div>
    </div>
  );
}
export { startOfWeek, addDays, toKey };
