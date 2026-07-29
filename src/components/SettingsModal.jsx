import React, { useState, useEffect } from 'react';
import { X, Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/export';
import { db } from '../supabase';

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

  const currencyOptions = ['₹', '$', '€', '£', '¥'];
  const isSupabase = db.isSupabase();

  useEffect(() => {
    setCurrencyVal(currency);
    setIncomeVal(String(income));
    setBudgetVal(String(monthlyBudgets[currentMonth] || ''));
  }, [currency, income, monthlyBudgets, currentMonth]);

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
          {/* Currency */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Currency Symbol</p>
            <div className="flex gap-2">
              {currencyOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCurrencyVal(opt)}
                  className={`flex-1 py-3 rounded-xl border text-lg font-semibold font-mono transition ${
                    currencyVal === opt 
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5' 
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
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
