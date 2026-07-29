import React, { useMemo } from 'react';
import { Settings, Sun, Moon, LogOut } from 'lucide-react';

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

export default function Header({ darkMode, setDarkMode, onSettings, onSignOut, userEmail }) {
  const greeting = useMemo(getGreeting, []);
  const initials = getInitials(userEmail);
  const avatarColor = getAvatarColor(userEmail);
  const firstName = userEmail ? userEmail.split('@')[0].split(/[._]/)[0] : '';
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <header className="border-b border-[var(--border-color)] px-6 py-4 sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Greeting + name */}
        <div>
          {userEmail ? (
            <>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium tracking-wide">
                {greeting} 👋
              </p>
              <h1 className="text-lg font-black tracking-tight text-[var(--text-primary)] leading-tight">
                {displayName || 'LEDGER'}
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                LEDGER
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">Your premium wealth dashboard</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition"
          >
            {darkMode
              ? <Sun size={19} className="text-[#C9F31D]" />
              : <Moon size={19} />
            }
          </button>

          {/* Settings */}
          <button
            onClick={onSettings}
            aria-label="Settings"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition"
          >
            <Settings size={19} />
          </button>

          {/* Sign out */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="text-[var(--text-secondary)] hover:text-red-400 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition"
            >
              <LogOut size={19} />
            </button>
          )}

          {/* User avatar */}
          {userEmail && (
            <div
              title={userEmail}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-black ml-1 cursor-default select-none flex-shrink-0"
              style={{
                backgroundColor: avatarColor,
                boxShadow: `0 0 12px ${avatarColor}60`
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
