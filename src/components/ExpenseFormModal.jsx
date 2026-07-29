import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Calendar, Coffee, UtensilsCrossed, Cookie, Sun, Moon, Wallet } from 'lucide-react';

const CATEGORY_ICONS = {
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

export default function ExpenseFormModal({ categories, onAddCategory, onSubmit, onClose, expense }) {
  const isEditing = !!expense;
  
  const [category, setCategory] = useState(expense?.category || '');
  const [amount, setAmount] = useState(expense?.amount ? String(expense.amount) : '');
  const [note, setNote] = useState(expense?.note || '');
  const [date, setDate] = useState(expense?.date || todayKey());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

  // Update fields if the expense details change (e.g. switching which item to edit)
  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setNote(expense.note);
      setDate(expense.date);
    }
  }, [expense]);

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    
    // Check duplication
    if (!categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      onAddCategory(name);
    }
    setCategory(name);
    setAddingCategory(false);
    setNewCategoryName('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const payload = {
      category,
      amount: parsedAmount,
      note: note.trim(),
      date,
    };

    if (isEditing) {
      payload.id = expense.id;
      payload.createdAt = expense.createdAt;
    }

    onSubmit(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-[var(--bg-modal)] border-t border-[var(--border-color)] rounded-t-3xl w-full max-w-xl p-6 pb-8 overflow-y-auto max-h-[85vh] slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Close" 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category selection */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const Icon = CATEGORY_ICONS[c.name] || Wallet;
                const selected = category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border transition-all duration-200 ${
                      selected 
                        ? 'text-white border-transparent' 
                        : 'text-[var(--text-secondary)] border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                    }`}
                    style={selected ? { backgroundColor: c.color, boxShadow: `0 4px 12px ${c.color}33` } : {}}
                  >
                    <Icon size={14} />
                    {c.name}
                  </button>
                );
              })}
              
              {!addingCategory ? (
                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm border border-dashed border-[var(--text-muted)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                >
                  <Plus size={14} /> Add
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-2 py-0.5">
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category"
                    className="bg-transparent text-sm text-[var(--text-primary)] outline-none w-24 py-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCategory} 
                    aria-label="Confirm category" 
                    className="text-[var(--accent)] p-1 hover:bg-[var(--bg-primary)] rounded-full"
                  >
                    <Check size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Amount</p>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="cred-input text-2xl font-bold font-mono tracking-tight"
              required
            />
          </div>

          {/* Date input */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Date</p>
            <input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => setDate(e.target.value)}
              className="cred-input text-sm"
              required
            />
          </div>

          {/* Note input */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Note (optional)</p>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. coffee with team, monthly internet bill"
              className="cred-input text-sm"
            />
          </div>

          {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}

          <button 
            type="submit" 
            className="w-full cred-btn-primary"
          >
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
export { CATEGORY_ICONS };
