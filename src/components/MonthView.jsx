import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

const pad = (n) => String(n).padStart(2, '0');

export default function MonthView({ expenses, currency, monthOffset, setMonthOffset }) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const key = `${year}-${pad(month + 1)}-${pad(d)}`;
    const dayTotal = expenses
      .filter((e) => e.date === key)
      .reduce((s, e) => s + e.amount, 0);
    return { 
      day: d, 
      amount: dayTotal 
    };
  });

  const total = chartData.reduce((s, d) => s + d.amount, 0);
  const daysWithData = chartData.filter((d) => d.amount > 0).length;
  const avg = daysWithData ? total / daysWithData : 0;
  const highest = chartData.reduce((max, d) => (d.amount > max.amount ? d : max), chartData[0]);

  const monthLabel = target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shortMonthName = target.toLocaleDateString('en-US', { month: 'short' });

  const gridColor = 'rgba(255, 255, 255, 0.05)';
  const tickColor = 'var(--text-secondary)';

  return (
    <div className="space-y-4 fade-in">
      {/* Month Navigator */}
      <div className="flex items-center justify-between cred-card py-3 px-4">
        <button
          onClick={() => setMonthOffset(monthOffset - 1)}
          aria-label="Previous month"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
          {monthLabel}
        </p>
        <button
          onClick={() => setMonthOffset(monthOffset + 1)}
          disabled={monthOffset >= 0}
          aria-label="Next month"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition disabled:opacity-20"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Line Chart Card */}
      <div className="cred-card p-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 9, fill: tickColor }} 
                axisLine={false} 
                tickLine={false} 
                interval={2}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: tickColor, fontFamily: 'JetBrains Mono' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, sans-serif'
                }}
                formatter={(value) => [`${currency}${parseFloat(value).toLocaleString()}`, 'Spent']}
                labelFormatter={(label) => `${shortMonthName} ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--accent)" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 5, fill: 'var(--accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
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
          sub={highest.amount > 0 ? `${shortMonthName} ${highest.day}` : ''}
          trendType={highest.amount > 0 ? 'up' : 'neutral'}
        />
        <StatCard 
          label="Days tracked" 
          value={`${daysWithData} / ${daysInMonth}`} 
          sub="Days with active transactions"
        />
      </div>
    </div>
  );
}
export { pad };
