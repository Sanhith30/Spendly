import React from 'react';
import { Settings, Sun, Moon } from 'lucide-react';

export default function Header({ darkMode, setDarkMode, onSettings }) {
  return (
    <header className="border-b border-[var(--border-color)] px-6 py-5 sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            LEDGER
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">Your premium wealth dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition"
          >
            {darkMode ? <Sun size={20} className="text-[#C9F31D]" /> : <Moon size={20} />}
          </button>
          <button
            onClick={onSettings}
            aria-label="Settings"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
