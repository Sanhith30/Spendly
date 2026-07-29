import React from 'react';
import { Calendar, BarChart3, CalendarDays, PieChart, Search, CalendarRange } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'week', label: 'Week', icon: BarChart3 },
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'calendar', label: 'Calendar', icon: CalendarRange },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'insights', label: 'Insights', icon: PieChart },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md z-15">
      <div className="max-w-xl mx-auto flex justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all duration-200 ${
                active 
                  ? 'text-[var(--accent)] font-semibold scale-105' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${active ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : ''}`}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
