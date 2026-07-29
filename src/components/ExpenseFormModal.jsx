import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Coffee, UtensilsCrossed, Cookie, Sun, Moon, Wallet, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { playCoinSound } from '../utils/sounds';
import { CURRENCIES, convertAmount, fetchLiveRates } from '../utils/currency';

export const CATEGORY_ICONS = {
  Breakfast: Sun,
  Tea: Coffee,
  Lunch: UtensilsCrossed,
  Snacks: Cookie,
  Dinner: Moon,
  Other: Wallet,
};

function todayKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ExpenseFormModal({ categories, onAddCategory, onSubmit, onClose, expense, baseCurrency = '₹' }) {
  const isEditing = !!expense;

  const [category, setCategory] = useState(expense?.category || '');
  const [amount, setAmount] = useState(expense?.amount ? String(expense.amount) : '');
  const [currency, setCurrency] = useState(expense?.currency || baseCurrency || '₹');
  const [note, setNote] = useState(expense?.note || '');
  const [date, setDate] = useState(expense?.date || todayKey());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [fxRates, setFxRates] = useState({});

  useEffect(() => {
    async function loadRates() {
      const rates = await fetchLiveRates('INR');
      setFxRates(rates);
    }
    loadRates();
  }, []);

  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setCurrency(expense.currency || baseCurrency || '₹');
      setNote(expense.note || '');
      setDate(expense.date);
    }
  }, [expense, baseCurrency]);

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      onAddCategory(name);
    }
    setCategory(name);
    setAddingCategory(false);
    setNewCategoryName('');
  }

  // Get FX code from symbol or code
  const currObj = CURRENCIES.find(c => c.symbol === currency || c.code === currency) || CURRENCIES[0];
  const baseCurrObj = CURRENCIES.find(c => c.symbol === baseCurrency || c.code === baseCurrency) || CURRENCIES[0];

  const parsedAmt = parseFloat(amount) || 0;
  const convertedInBase = convertAmount(parsedAmt, currObj.code, baseCurrObj.code, fxRates);

  function handleSubmit(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!category) { setError('Please select a category'); return; }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid amount'); return; }

    playCoinSound();

    const payload = {
      category,
      amount: parsedAmount,
      currency: currObj.symbol,
      convertedAmount: convertedInBase,
      note: note.trim(),
      date
    };

    if (isEditing) {
      payload.id = expense.id;
      payload.createdAt = expense.createdAt;
    }
    onSubmit(payload);
    onClose();
  }

  const selectedCat = categories.find(c => c.name === category);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-xl overflow-y-auto max-h-[90vh]"
        style={{
          background: 'var(--bg-modal)',
          borderTop: '1px solid var(--border-color)',
          borderRadius: '24px 24px 0 0',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-4 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '6s' }} /> Live FX
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-white/5 transition"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category — horizontal pill chips */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const Icon = CATEGORY_ICONS[c.name] || Wallet;
                  const selected = category === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 active:scale-95"
                      style={selected ? {
                        backgroundColor: `${c.color}20`,
                        borderColor: `${c.color}70`,
                        color: c.color,
                        boxShadow: `0 0 12px ${c.color}30`,
                      } : {
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Icon size={13} />
                      {c.name}
                      {selected && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}

                {!addingCategory ? (
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm border border-dashed border-[var(--text-muted)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition"
                  >
                    <Plus size={13} /> Add
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-3 py-1">
                    <input
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="bg-transparent text-sm text-[var(--text-primary)] outline-none w-28 py-1"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                    />
                    <button type="button" onClick={handleAddCategory} className="text-[var(--accent)] p-1">
                      <Check size={15} />
                    </button>
                    <button type="button" onClick={() => setAddingCategory(false)} className="text-[var(--text-muted)] p-1">
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Currency Picker & Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Amount & Currency</p>
                <div className="flex gap-1">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.symbol)}
                      className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md border transition ${
                        currObj.code === c.code
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3 text-lg font-bold font-mono text-[var(--text-secondary)]">
                  {currObj.symbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  autoFocus={!isEditing}
                  className="cred-input text-xl font-bold font-mono pl-10"
                  style={{
                    borderColor: selectedCat && amount ? `${selectedCat.color}50` : undefined,
                    boxShadow: selectedCat && amount ? `0 0 0 3px ${selectedCat.color}12` : undefined,
                  }}
                  required
                />
              </div>

              {/* Live FX Conversion rate preview */}
              {parsedAmt > 0 && currObj.code !== baseCurrObj.code && (
                <div className="mt-2 text-xs font-mono text-[var(--accent)] bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft size={13} />
                    <span>Live converted to {baseCurrObj.code}:</span>
                  </div>
                  <span className="font-bold text-sm">
                    {baseCurrObj.symbol}{convertedInBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">Date</p>
              <input
                type="date"
                value={date}
                max={todayKey()}
                onChange={(e) => setDate(e.target.value)}
                className="cred-input text-sm"
                required
              />
            </div>

            {/* Note */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">Note (optional)</p>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. online software purchase in USD, travel lunch"
                className="cred-input text-sm"
              />
            </div>

            {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}

            <button type="submit" className="w-full cred-btn-primary text-sm font-bold py-4 rounded-2xl active:scale-98">
              {isEditing ? 'Save Changes' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
