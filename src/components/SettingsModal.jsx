import React, { useState, useEffect } from 'react';
import { X, Download, ShieldCheck, ShieldAlert, RefreshCw, Bell, Clock, Check, AlertCircle } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/export';
import { db } from '../supabase';
import { CURRENCIES, fetchLiveRates } from '../utils/currency';
import {
  isReminderEnabled,
  setReminderEnabled,
  getReminderTime,
  setReminderTime,
  requestNotificationPermission,
  getNotificationStatus,
  triggerReminderNotification,
} from '../utils/reminder';

export default function SettingsModal({
  currency,
  income,
  monthlyBudgets,
  currentMonth,
  onSave,
  onClose,
  expenses
}) {
  const [currencyVal, setCurrencyVal] = useState(currency);
  const [incomeVal, setIncomeVal] = useState(String(income));
  const [budgetVal, setBudgetVal] = useState(String(monthlyBudgets[currentMonth] || ''));
  const [error, setError] = useState('');
  const [fxRates, setFxRates] = useState(null);

  // Reminder states
  const [reminderOn, setReminderOn] = useState(isReminderEnabled());
  const [reminderTimeVal, setReminderTimeVal] = useState(getReminderTime());
  const [notifPermission, setNotifPermission] = useState(getNotificationStatus());
  const [testSent, setTestSent] = useState(false);

  const isSupabase = db.isSupabase();

  useEffect(() => {
    async function loadRates() {
      const rates = await fetchLiveRates('INR');
      setFxRates(rates);
    }
    loadRates();
  }, []);

  useEffect(() => {
    setCurrencyVal(currency);
    setIncomeVal(String(income));
    setBudgetVal(String(monthlyBudgets[currentMonth] || ''));
  }, [currency, income, monthlyBudgets, currentMonth]);

  async function handleToggleReminder() {
    const nextState = !reminderOn;

    if (nextState) {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);

      if (perm === 'granted') {
        setReminderOn(true);
        setReminderEnabled(true);
      } else {
        setError('Notification permission was blocked or denied by your browser.');
        setReminderOn(false);
        setReminderEnabled(false);
      }
    } else {
      setReminderOn(false);
      setReminderEnabled(false);
    }
  }

  function handleTimeChange(e) {
    const time = e.target.value;
    setReminderTimeVal(time);
    setReminderTime(time);
  }

  function handleSendTestNotif() {
    triggerReminderNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  function handleSave() {
    const parsedIncome = parseFloat(incomeVal) || 0;
    const parsedBudget = parseFloat(budgetVal) || 0;

    if (parsedIncome < 0 || parsedBudget < 0) {
      setError('Values cannot be negative');
      return;
    }

    onSave({
      currency: currencyVal,
      income: parsedIncome,
      budget: parsedBudget
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-[var(--bg-modal)] border-t border-[var(--border-color)] rounded-t-3xl w-full max-w-xl p-6 pb-8 overflow-y-auto max-h-[85vh] slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            App Settings
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Close" 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Supabase Status Banner */}
        <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs mb-5 ${
          isSupabase 
            ? 'bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]' 
            : 'bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]'
        }`}>
          {isSupabase ? (
            <>
              <ShieldCheck size={18} />
              <div>
                <p className="font-semibold text-[var(--success)]">Supabase Live Database Synced</p>
                <p className="opacity-80">All records auto-save to cloud DB with device isolation.</p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert size={18} />
              <div>
                <p className="font-semibold text-[var(--warning)]">Local Storage Mode</p>
                <p className="opacity-80">Add VITE_SUPABASE_URL & KEY to enable cloud syncing.</p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-5">
          {/* Currency with Live FX rates badge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Primary Display Currency</p>
              <span className="text-[10px] font-mono text-[var(--accent)] flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '8s' }} /> Live FX Rates Active
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCurrencyVal(c.symbol)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition ${
                    currencyVal === c.symbol 
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_12px_rgba(201,243,29,0.15)]' 
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-lg font-bold font-mono leading-none">{c.symbol}</span>
                  <span className="text-[10px] font-mono font-semibold opacity-80 mt-1">{c.code}</span>
                </button>
              ))}
            </div>

            {/* Live rates snippet */}
            {fxRates && (
              <div className="mt-2.5 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] flex justify-between items-center">
                <span>1 USD = ₹{(1 / (fxRates['USD'] || 0.0116)).toFixed(2)} INR</span>
                <span>1 EUR = ₹{(1 / (fxRates['EUR'] || 0.0107)).toFixed(2)} INR</span>
                <span>1 GBP = ₹{(1 / (fxRates['GBP'] || 0.0092)).toFixed(2)} INR</span>
              </div>
            )}
          </div>

          {/* Income */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Monthly Income</p>
            <div className="relative">
              <span className="absolute left-4 top-3 text-[var(--text-secondary)] font-mono">{currencyVal}</span>
              <input
                type="number"
                inputMode="decimal"
                value={incomeVal}
                onChange={(e) => setIncomeVal(e.target.value)}
                placeholder="0"
                className="cred-input pl-10"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Monthly Budget ({currentMonth})
            </p>
            <div className="relative">
              <span className="absolute left-4 top-3 text-[var(--text-secondary)] font-mono">{currencyVal}</span>
              <input
                type="number"
                inputMode="decimal"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="0"
                className="cred-input pl-10"
              />
            </div>
          </div>

          {/* Daily Evening Expense Reminder Section */}
          <div className="cred-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[var(--accent)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Daily Evening Reminder</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Reminds you to log daily expenses</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleReminder}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  reminderOn ? 'bg-[var(--accent)]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    reminderOn ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {reminderOn && (
              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)] font-medium">Reminder Time:</span>
                  <input
                    type="time"
                    value={reminderTimeVal}
                    onChange={handleTimeChange}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-lg px-2 py-1 outline-none text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestNotif}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-white/10 border border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-primary)] transition"
                >
                  {testSent ? '✓ Sent!' : 'Test Push'}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}

          <button 
            onClick={handleSave} 
            className="w-full cred-btn-primary"
          >
            Save Configuration
          </button>

          {/* Export Report Data */}
          <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Export Wealth Reports
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exportToCSV(expenses, income, monthlyBudgets, currency, currentMonth)}
                className="cred-btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={() => exportToPDF(expenses, income, monthlyBudgets, currency, currentMonth)}
                className="cred-btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <Download size={16} />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
