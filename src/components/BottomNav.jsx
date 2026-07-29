import React, { useRef, useEffect, useState } from 'react';
import { Calendar, BarChart3, CalendarDays, PieChart, Search, CalendarRange } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'week', label: 'Week', icon: BarChart3 },
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'calendar', label: 'Cal', icon: CalendarRange },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'insights', label: 'Insights', icon: PieChart },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  const navRef = useRef(null);
  const itemRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeEl = itemRefs.current[activeTab];
    const navEl = navRef.current;
    if (!activeEl || !navEl) return;

    const navRect = navEl.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();

    setPillStyle({
      left: itemRect.left - navRect.left,
      width: itemRect.width,
      opacity: 1,
    });
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-md z-15">
      <div ref={navRef} className="max-w-xl mx-auto flex justify-around px-2 py-2 relative">
        {/* Sliding pill background */}
        <div
          className="absolute top-2 bottom-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20"
          style={{
            left: pillStyle.left,
            width: pillStyle.width,
            opacity: pillStyle.opacity,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { itemRefs.current[item.id] = el; }}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 relative z-10 ${
                active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[9px] tracking-wide font-${active ? 'bold' : 'medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
