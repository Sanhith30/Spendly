import React, { useMemo } from 'react';
import { Settings, Sun, Moon, LogOut, Sparkles } from 'lucide-react';
import { CURRENCIES } from '../utils/currency';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(email) {
  if (!email) return 'U';
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(email) {
  if (!email) return '#C9F31D';
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#C9F31D', '#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#fb923c'];
  return colors[Math.abs(hash) % colors.length];
}

export default function Header({
  darkMode,
  setDarkMode,
  onSettings,
  onSignOut,
  userEmail,
  currency = '₹',
  onCurrencyChange,
  onOpenWrapped
}) {
  const greeting = useMemo(getGreeting, []);
  const initials = getInitials(userEmail);
  const avatarColor = getAvatarColor(userEmail);
  const firstName = userEmail ? userEmail.split('@')[0].split(/[._]/)[0] : '';
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

  return (
    <header className="border-b border-[var(--border-color)] px-4 sm:px-6 py-3 sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur-md">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
        {/* Greeting + name */}
        <div className="min-w-0 flex-1">
          {userEmail ? (
            <div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-medium tracking-wide truncate">
                {greeting} 👋
              </p>
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-[var(--text-primary)] leading-tight truncate">
                {displayName || 'LEDGER'}
              </h1>
            </div>
          ) : (
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                LEDGER
              </h1>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] truncate">Your wealth dashboard</p>
            </div>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Spendly Wrapped Story Button */}
          {onOpenWrapped && (
            <button
              onClick={onOpenWrapped}
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-black text-black tracking-wide shadow-md transition-all hover:scale-105 active:scale-95 animate-pulse shrink-0"
              style={{
                background: 'linear-gradient(135deg, #C9F31D 0%, #a78bfa 100%)',
                boxShadow: '0 0 10px rgba(201,243,29,0.3)',
              }}
              title="View 2026 Year-in-Review Wrapped"
            >
              <Sparkles size={12} />
              <span className="hidden xs:inline">Wrapped</span>
            </button>
          )}

          {/* Quick Currency Selector Pill */}
          {onCurrencyChange && (
            <div className="relative flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-1.5 py-0.5 gap-1 text-[11px] font-mono font-semibold text-[var(--text-primary)] hover:border-[var(--text-muted)] transition shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live FX Rates Synced" />
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] font-bold outline-none cursor-pointer text-[11px]"
                aria-label="Display Currency"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.symbol} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition shrink-0"
          >
            {darkMode
              ? <Sun size={17} className="text-[#C9F31D]" />
              : <Moon size={17} />
            }
          </button>

          {/* Settings */}
          <button
            onClick={onSettings}
            aria-label="Settings"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition shrink-0"
          >
            <Settings size={17} />
          </button>

          {/* Sign out */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="text-[var(--text-secondary)] hover:text-red-400 p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition shrink-0"
            >
              <LogOut size={17} />
            </button>
          )}

          {/* User avatar */}
          {userEmail && (
            <div
              title={userEmail}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black text-black ml-0.5 cursor-default select-none shrink-0"
              style={{
                backgroundColor: avatarColor,
                boxShadow: `0 0 10px ${avatarColor}50`
              }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
