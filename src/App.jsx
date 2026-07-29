import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import StatCard from './components/StatCard';
import BudgetCard from './components/BudgetCard';
import ExpenseFormModal from './components/ExpenseFormModal';
import SettingsModal from './components/SettingsModal';
import TodayView from './components/TodayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import InsightsView from './components/InsightsView';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import AuthModal from './components/AuthModal';
import Confetti from './components/Confetti';
import YearWrappedModal from './components/YearWrappedModal';
import { useToast } from './components/Toast';
import { db, auth } from './supabase';
import { CATEGORY_ICONS } from './components/ExpenseFormModal';
import { Wallet } from 'lucide-react';
import { playDeleteSound, playSuccessSound } from './utils/sounds';
import { scheduleNextReminder } from './utils/reminder';

const DEFAULT_CATEGORIES = [
  { name: 'Breakfast', color: '#C17817' },
  { name: 'Tea', color: '#8B5A2B' },
  { name: 'Lunch', color: '#B5502F' },
  { name: 'Snacks', color: '#7A5C8E' },
  { name: 'Dinner', color: '#3B4C6B' },
  { name: 'Other', color: '#8A8578' },
];

const PALETTE = ['#B5502F', '#7A5C8E', '#3B4C6B', '#8B5A2B', '#C17817', '#4B6B53'];

const pad = (n) => String(n).padStart(2, '0');
const currentMonthStr = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
})();

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(0);
  const [currency, setCurrency] = useState('₹');
  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('today');
  const [tabKey, setTabKey] = useState(0); // forces re-mount on tab switch for animation
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showWrapped, setShowWrapped] = useState(false);

  // Toast
  const toast = useToast();

  // Pull-to-refresh touch tracking
  const ptrStartY = useRef(null);
  const mainRef = useRef(null);

  // Offsets and periods
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [insightPeriod, setInsightPeriod] = useState('week');

  const allCategories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);

  // Apply dark mode theme to root elements
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#080808';
    } else {
      root.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#f6f8fa';
    }
  }, [darkMode]);

  // Check existing auth session on mount + subscribe to changes
  useEffect(() => {
    scheduleNextReminder();

    async function initAuth() {
      const session = await auth.getSession();
      setUser(session?.user || null);
    }
    initAuth();

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load configuration and expenses once user is authenticated
  useEffect(() => {
    if (!user) return; // Not logged in yet

    async function loadData() {
      try {
        setLoading(true);
        const [fetchedExpenses, settings] = await Promise.all([
          db.getExpenses(),
          db.getSettings()
        ]);

        setExpenses(fetchedExpenses || []);
        setIncome(settings.income || 0);
        setCurrency(settings.currency || '₹');
        setMonthlyBudgets(settings.monthly_budgets || {});
        setCustomCategories(settings.custom_categories || []);
        if (settings.dark_mode !== undefined) {
          setDarkMode(settings.dark_mode);
        }
      } catch (err) {
        console.error('Failed to load data from storage:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Save Settings wrapper
  async function handleSaveSettings({ currency: nextCurrency, income: nextIncome, budget: nextBudget }) {
    const nextBudgets = {
      ...monthlyBudgets,
      [currentMonthStr]: nextBudget
    };
    
    setCurrency(nextCurrency);
    setIncome(nextIncome);
    setMonthlyBudgets(nextBudgets);

    try {
      await db.saveSettings({
        currency: nextCurrency,
        income: nextIncome,
        monthly_budgets: nextBudgets,
        custom_categories: customCategories,
        dark_mode: darkMode
      });
      playSuccessSound();
    } catch (e) {
      console.error('settings save error', e);
    }
  }

  // Toggle Dark Mode
  async function handleToggleDarkMode(val) {
    setDarkMode(val);
    try {
      await db.saveSettings({
        currency,
        income,
        monthly_budgets: monthlyBudgets,
        custom_categories: customCategories,
        dark_mode: val
      });
    } catch (e) {
      console.error('Failed to save dark mode setting:', e);
    }
  }

  // Add category
  async function handleAddCategory(name) {
    const color = PALETTE[customCategories.length % PALETTE.length];
    const nextCategories = [...customCategories, { name, color }];
    setCustomCategories(nextCategories);
    
    try {
      await db.saveSettings({
        currency,
        income,
        monthly_budgets: monthlyBudgets,
        custom_categories: nextCategories,
        dark_mode: darkMode
      });
    } catch (e) {
      console.error('Failed to save new category:', e);
    }
  }

  // Add or Update Expense handler
  async function handleExpenseSubmit(payload) {
    if (payload.id) {
      const updated = { ...payload, updatedAt: new Date().toISOString() };
      setExpenses(prev => prev.map(e => e.id === payload.id ? updated : e));
      try {
        await db.saveExpense(updated);
        toast('Expense updated ✓', 'success');
      } catch (err) {
        toast('Failed to save changes', 'error');
      }
    } else {
      const newEntry = {
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...payload,
        createdAt: new Date().toISOString()
      };
      setExpenses(prev => [...prev, newEntry]);
      try {
        await db.saveExpense(newEntry);
        toast(`${payload.category} logged ✓`, 'success');
      } catch (err) {
        toast('Failed to sync — saved locally', 'warning');
      }
    }
    setEditingExpense(null);
  }

  // Delete Expense handler
  async function handleDeleteExpense(id) {
    playDeleteSound();
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await db.deleteExpense(id);
      toast('Expense deleted', 'info');
    } catch (err) {
      toast('Delete failed', 'error');
    }
  }

  // Edit Expense trigger
  function handleEditTrigger(expense) {
    setEditingExpense(expense);
    setShowAddModal(true);
  }

  // Categories metadata lookups
  function getCategoryMeta(name) {
    return allCategories.find((c) => c.name === name) || { name, color: '#8A8578' };
  }

  // Dashboard Stats Computations
  const stats = useMemo(() => {
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = income - totalSpent;
    return { monthlySpent: totalSpent, balance };
  }, [expenses, income]);

  // Spending streak (consecutive days with at least 1 expense, going backwards from today)
  const streak = useMemo(() => {
    const pad2 = n => String(n).padStart(2, '0');
    const toKey = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    const dateSet = new Set(expenses.map(e => e.date));
    let count = 0;
    const d = new Date();
    while (dateSet.has(toKey(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [expenses]);

  // Confetti when budget is healthy (< 60% used)
  const budget = monthlyBudgets[currentMonthStr] || 0;
  const prevBudgetOk = useRef(false);
  useEffect(() => {
    if (budget > 0 && stats.monthlySpent / budget < 0.6) {
      if (!prevBudgetOk.current) setConfettiTrigger(t => t + 1);
      prevBudgetOk.current = true;
    } else {
      prevBudgetOk.current = false;
    }
  }, [budget, stats.monthlySpent]);

  // Pull-to-refresh handlers
  const handlePTRStart = useCallback((e) => {
    if (mainRef.current?.scrollTop === 0) ptrStartY.current = e.touches[0].clientY;
  }, []);

  const handlePTREnd = useCallback(async (e) => {
    if (ptrStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - ptrStartY.current;
    ptrStartY.current = null;
    if (dy > 60) {
      setIsRefreshing(true);
      try {
        const [fetchedExpenses, settings] = await Promise.all([db.getExpenses(), db.getSettings()]);
        setExpenses(fetchedExpenses || []);
        setIncome(settings.income || 0);
        toast('Data refreshed ✓', 'success');
      } catch { toast('Refresh failed', 'error'); }
      finally { setIsRefreshing(false); }
    }
  }, [toast]);

  // Tab switch with animation
  function switchTab(tab) {
    setActiveTab(tab);
    setTabKey(k => k + 1);
  }

  // Checking session — blank screen while resolving
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show auth screen
  if (user === null) {
    return <AuthModal onAuthSuccess={(u) => setUser(u)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">Syncing with ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg-primary)] pb-28 font-sans transition-colors duration-300"
      onTouchStart={handlePTRStart}
      onTouchEnd={handlePTREnd}
    >
      <Confetti trigger={confettiTrigger} />

      {/* Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={handleToggleDarkMode}
        onSettings={() => setShowSettings(true)}
        onOpenWrapped={() => setShowWrapped(true)}
        userEmail={user?.email}
        streak={streak}
        currency={currency}
        onCurrencyChange={(c) => handleSaveSettings({ currency: c, income, budget: monthlyBudgets[currentMonthStr] || 0 })}
        onSignOut={async () => {
          await auth.signOut();
          setUser(null);
          setExpenses([]);
          toast('Signed out successfully', 'info');
        }}
      />

      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
        </div>
      )}

      <main ref={mainRef} className="px-5 pt-6 max-w-xl mx-auto space-y-6">
        {/* Streak badge */}
        {streak >= 2 && activeTab === 'today' && (
          <div className="flex justify-end">
            <div
              className="streak-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-black"
              style={{ backgroundColor: '#C9F31D' }}
            >
              🔥 {streak} day streak
            </div>
          </div>
        )}

        {/* Core Wealth Dashboard Cards */}
        {activeTab !== 'insights' && activeTab !== 'search' && (
          <div className="grid grid-cols-2 gap-3.5">
            <StatCard
              label="Monthly Income"
              value={`${currency}${income.toLocaleString()}`}
              sub="Baseline income metrics"
              trend="Current"
              trendType="success"
              rawAmount={income}
            />
            <StatCard
              label="Remaining Net Balance"
              value={stats.balance >= 0 ? `${currency}${stats.balance.toLocaleString()}` : `-${currency}${Math.abs(stats.balance).toLocaleString()}`}
              sub="Income minus monthly spent"
              trend={stats.balance >= 0 ? `+${currency}${stats.balance.toLocaleString()}` : `-${currency}${Math.abs(stats.balance).toLocaleString()}`}
              trendType={stats.balance >= 0 ? 'down' : 'up'}
              rawAmount={stats.balance}
            />
            <BudgetCard
              budget={monthlyBudgets[currentMonthStr] || 0}
              spent={stats.monthlySpent}
              currency={currency}
              onSetBudget={() => setShowSettings(true)}
            />
          </div>
        )}

        {/* Tab views — key forces re-mount for enter animation */}
        <div key={tabKey} className="tab-enter">
          {activeTab === 'today' && (
            <TodayView
              expenses={expenses}
              currency={currency}
              getCategoryMeta={getCategoryMeta}
              onEdit={handleEditTrigger}
              onDelete={handleDeleteExpense}
              onOpenAdd={() => { setEditingExpense(null); setShowAddModal(true); }}
            />
          )}
          {activeTab === 'week' && (
            <WeekView expenses={expenses} currency={currency} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
          )}
          {activeTab === 'month' && (
            <MonthView expenses={expenses} currency={currency} monthOffset={monthOffset} setMonthOffset={setMonthOffset} />
          )}
          {activeTab === 'calendar' && (
            <CalendarView expenses={expenses} currency={currency} getCategoryMeta={getCategoryMeta} onEdit={handleEditTrigger} onDelete={handleDeleteExpense} />
          )}
          {activeTab === 'search' && (
            <SearchView expenses={expenses} currency={currency} getCategoryMeta={getCategoryMeta} onEdit={handleEditTrigger} onDelete={handleDeleteExpense} />
          )}
          {activeTab === 'insights' && (
            <InsightsView expenses={expenses} currency={currency} getCategoryMeta={getCategoryMeta} period={insightPeriod} setPeriod={setInsightPeriod} monthlyBudgets={monthlyBudgets} />
          )}
        </div>
      </main>

      {/* Quick-add FAB menu */}
      {showFabMenu && (
        <div className="fixed bottom-24 right-4 z-20 flex flex-col items-end gap-2">
          {/* Close overlay */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowFabMenu(false)} />
          {allCategories.slice(0, 6).map((cat, i) => {
            const Icon = CATEGORY_ICONS[cat.name] || Wallet;
            return (
              <button
                key={cat.name}
                className="fab-menu-item flex items-center gap-2 pl-3 pr-4 py-2 rounded-2xl text-sm font-semibold text-white backdrop-blur-md border"
                style={{
                  animationDelay: `${i * 40}ms`,
                  background: `${cat.color}22`,
                  borderColor: `${cat.color}40`,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
                }}
                onClick={() => {
                  setShowFabMenu(false);
                  setEditingExpense(null);
                  setShowAddModal(true);
                }}
              >
                <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}30` }}>
                  <Icon size={14} style={{ color: cat.color }} />
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* FAB Button — tap opens modal, long-press opens quick menu */}
      <button
        onPointerDown={(() => {
          let timer;
          return (e) => {
            e.currentTarget._longpressTimer = setTimeout(() => {
              setShowFabMenu(v => !v);
            }, 400);
          };
        })()}
        onPointerUp={(e) => {
          clearTimeout(e.currentTarget._longpressTimer);
        }}
        onClick={() => {
          if (!showFabMenu) {
            setEditingExpense(null);
            setShowAddModal(true);
          }
          setShowFabMenu(false);
        }}
        aria-label="Add transaction"
        className="fixed bottom-20 right-6 z-10 bg-[var(--accent)] text-[var(--accent-text)] rounded-full p-4.5 shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-[0_0_24px_rgba(201,243,29,0.5)]"
      >
        <Plus size={24} className={showFabMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
      </button>

      {/* Navigation tabs */}
      <BottomNav activeTab={activeTab} setActiveTab={switchTab} />

      {/* Modal overlays */}
      {showAddModal && (
        <ExpenseFormModal
          categories={allCategories}
          onAddCategory={handleAddCategory}
          onSubmit={handleExpenseSubmit}
          onClose={() => { setShowAddModal(false); setEditingExpense(null); }}
          expense={editingExpense}
          baseCurrency={currency}
        />
      )}
      {showSettings && (
        <SettingsModal
          currency={currency}
          income={income}
          monthlyBudgets={monthlyBudgets}
          currentMonth={currentMonthStr}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          expenses={expenses}
        />
      )}
      {showWrapped && (
        <YearWrappedModal
          expenses={expenses}
          currency={currency}
          income={income}
          onClose={() => setShowWrapped(false)}
          getCategoryMeta={getCategoryMeta}
        />
      )}
    </div>
  );
}
