import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Check, Calendar, AlertTriangle, ShieldCheck, Trash2, Zap, Home, Wifi, Tv, Coffee, Wallet, Sparkles } from 'lucide-react';
import { playCoinSound, playDeleteSound } from '../utils/sounds';

const DEFAULT_BILLS = [
  { id: 'default-rent', name: 'House Rent', amount: 12000, dueDay: 1, category: 'Other', icon: 'home' },
  { id: 'default-elec', name: 'Electricity Bill', amount: 1500, dueDay: 10, category: 'Other', icon: 'zap' },
  { id: 'default-wifi', name: 'Wifi / Internet', amount: 799, dueDay: 15, category: 'Other', icon: 'wifi' },
];

const BILL_ICONS = {
  home: Home,
  zap: Zap,
  wifi: Wifi,
  tv: Tv,
  coffee: Coffee,
  wallet: Wallet,
};

function getStorageBills() {
  try {
    const local = localStorage.getItem('moneytracker_recurring_bills');
    if (local) return JSON.parse(local);
  } catch (e) {}
  return DEFAULT_BILLS;
}

function saveStorageBills(bills) {
  try {
    localStorage.setItem('moneytracker_recurring_bills', JSON.stringify(bills));
  } catch (e) {}
}

export default function RecurringBillsModal({ currency, onClose, onAddExpense, expenses }) {
  const [bills, setBills] = useState(getStorageBills);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Bill Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState(1);
  const [iconType, setIconType] = useState('home');

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentDay = today.getDate();

  // Check which bills have been paid this month by searching logged expenses
  const paidBillNames = useMemo(() => {
    const paidSet = new Set();
    expenses.forEach((e) => {
      if (e.date.startsWith(currentMonthKey)) {
        bills.forEach((b) => {
          if (
            e.category.toLowerCase().includes(b.name.toLowerCase()) ||
            (e.note && e.note.toLowerCase().includes(b.name.toLowerCase()))
          ) {
            paidSet.add(b.id);
          }
        });
      }
    });
    return paidSet;
  }, [expenses, currentMonthKey, bills]);

  function handleSaveBill(e) {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;

    const newBill = {
      id: `bill-${Date.now()}`,
      name: name.trim(),
      amount: parsedAmt,
      dueDay: parseInt(dueDay, 10) || 1,
      category: 'Other',
      icon: iconType,
    };

    const nextBills = [...bills, newBill];
    setBills(nextBills);
    saveStorageBills(nextBills);

    setName('');
    setAmount('');
    setDueDay(1);
    setShowAddForm(false);
  }

  function handleDeleteBill(id) {
    playDeleteSound();
    const next = bills.filter((b) => b.id !== id);
    setBills(next);
    saveStorageBills(next);
  }

  function handlePayBill(bill) {
    playCoinSound();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    onAddExpense({
      category: bill.category || 'Other',
      amount: bill.amount,
      note: `${bill.name} (Monthly Bill)`,
      date: todayStr,
    });
  }

  // Calculate totals
  const totalCommitment = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter((b) => paidBillNames.has(b.id)).reduce((s, b) => s + b.amount, 0);
  const totalPending = totalCommitment - totalPaid;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-xl bg-[var(--bg-modal)] border-t border-[var(--border-color)] rounded-t-3xl p-6 pb-8 overflow-y-auto max-h-[90vh] slide-up text-[var(--text-primary)]"
      >
        {/* Top Handle */}
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Monthly Bills & Subscriptions</h2>
              <p className="text-xs text-[var(--text-secondary)]">Manage fixed monthly commitments</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fixed Commitments Summary Card */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Fixed</p>
            <p className="text-base font-black font-mono mt-1 text-[var(--text-primary)]">
              {currency}{totalCommitment.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">Paid</p>
            <p className="text-base font-black font-mono mt-1 text-[var(--success)]">
              {currency}{totalPaid.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--warning)]">Pending</p>
            <p className="text-base font-black font-mono mt-1 text-[var(--warning)]">
              {currency}{totalPending.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Your Recurring Bills</p>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:opacity-80 transition"
          >
            <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Bill'}
          </button>
        </div>

        {/* Add Bill Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleSaveBill} className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 space-y-3 slide-up">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">New Recurring Bill</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bill Name (e.g. Rent, Wifi)"
                className="cred-input text-xs"
                required
              />
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (e.g. 12000)"
                className="cred-input text-xs font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Due Day:</span>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-mono font-bold rounded-lg px-2 py-1 outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}st/th of month
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                {Object.keys(BILL_ICONS).map((iconKey) => {
                  const IconCmp = BILL_ICONS[iconKey];
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setIconType(iconKey)}
                      className={`p-1.5 rounded-lg border transition ${
                        iconType === iconKey
                          ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]'
                          : 'border-white/10 text-[var(--text-secondary)]'
                      }`}
                    >
                      <IconCmp size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="w-full cred-btn-primary text-xs py-2.5">
              Save Recurring Bill
            </button>
          </form>
        )}

        {/* Bills List */}
        <div className="space-y-2.5">
          {bills.map((bill) => {
            const isPaid = paidBillNames.has(bill.id);
            const daysLeft = bill.dueDay - currentDay;

            let statusLabel = `Due on ${bill.dueDay}th`;
            let statusClass = 'text-[var(--text-muted)] bg-white/5 border-white/10';

            if (isPaid) {
              statusLabel = 'Paid ✓';
              statusClass = 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30';
            } else if (daysLeft === 0) {
              statusLabel = 'Due Today! ⚠️';
              statusClass = 'text-[var(--danger)] bg-[var(--danger)]/15 border-[var(--danger)]/40 animate-pulse';
            } else if (daysLeft > 0 && daysLeft <= 3) {
              statusLabel = `Due in ${daysLeft} days!`;
              statusClass = 'text-[var(--warning)] bg-[var(--warning)]/15 border-[var(--warning)]/30';
            }

            const IconComponent = BILL_ICONS[bill.icon] || Home;

            return (
              <div
                key={bill.id}
                className="cred-card p-3.5 flex items-center justify-between hover:border-[var(--text-muted)] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--accent)] shrink-0">
                    <IconComponent size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold truncate">{bill.name}</p>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-0.5">
                      {currency}{bill.amount.toLocaleString()} / month
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isPaid ? (
                    <button
                      onClick={() => handlePayBill(bill)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-black font-extrabold text-xs tracking-tight shadow-md hover:scale-105 active:scale-95 transition"
                    >
                      Mark Paid ✓
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[var(--success)] flex items-center gap-1">
                      <ShieldCheck size={16} /> Paid
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteBill(bill.id)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-white/5 transition"
                    title="Delete Bill"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
