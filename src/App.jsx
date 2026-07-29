import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
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
import { db } from './supabase';

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
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(0);
  const [currency, setCurrency] = useState('₹');
  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saveError, setSaveError] = useState(false);

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

  // Load configuration and expenses on mount
  useEffect(() => {
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
  }, []);

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
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
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
      // EDIT MODE
      const updated = {
        ...payload,
        updatedAt: new Date().toISOString()
      };
      
      const nextExpenses = expenses.map(e => e.id === payload.id ? updated : e);
      setExpenses(nextExpenses);
      
      try {
        await db.saveExpense(updated);
        setSaveError(false);
      } catch (err) {
        setSaveError(true);
      }
    } else {
      // ADD MODE
      const newEntry = {
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...payload,
        createdAt: new Date().toISOString()
      };
      
      const nextExpenses = [...expenses, newEntry];
      setExpenses(nextExpenses);

      try {
        await db.saveExpense(newEntry);
        setSaveError(false);
      } catch (err) {
        setSaveError(true);
      }
    }
    setEditingExpense(null);
  }

  // Delete Expense handler
  async function handleDeleteExpense(id) {
    const nextExpenses = expenses.filter(e => e.id !== id);
    setExpenses(nextExpenses);

    try {
      await db.deleteExpense(id);
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
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
    // Current month expenses
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = income - totalSpent;

    return {
      monthlySpent: totalSpent,
      balance: balance
    };
  }, [expenses, income]);

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
    <div className="min-h-screen bg-[var(--bg-primary)] pb-28 font-sans transition-colors duration-300">
      {/* Header component */}
      <Header 
        darkMode={darkMode} 
        setDarkMode={handleToggleDarkMode} 
        onSettings={() => setShowSettings(true)} 
      />

      <main className="px-5 pt-6 max-w-xl mx-auto space-y-6">
        {/* Core Wealth Dashboard Cards */}
        {activeTab !== 'insights' && activeTab !== 'search' && (
          <div className="grid grid-cols-2 gap-3.5">
            {/* Income Card */}
            <StatCard 
              label="Monthly Income" 
              value={`${currency}${income.toLocaleString()}`} 
              sub="Baseline income metrics"
              trend="Current"
              trendType="success"
            />
            {/* Net Balance Card */}
            <StatCard 
              label="Remaining Net Balance" 
              value={`${currency}${stats.balance.toLocaleString()}`} 
              sub="Income minus monthly spent"
              trend={stats.balance >= 0 ? `+${currency}${stats.balance.toLocaleString()}` : `-${currency}${Math.abs(stats.balance).toLocaleString()}`}
              trendType={stats.balance >= 0 ? 'down' : 'up'}
            />
            
            {/* Monthly Budget Card */}
            <BudgetCard 
              budget={monthlyBudgets[currentMonthStr] || 0}
              spent={stats.monthlySpent}
              currency={currency}
              onSetBudget={() => setShowSettings(true)}
            />
          </div>
        )}

        {/* Tab view selectors */}
        {activeTab === 'today' && (
          <TodayView 
            expenses={expenses} 
            currency={currency} 
            getCategoryMeta={getCategoryMeta} 
            onEdit={handleEditTrigger}
            onDelete={handleDeleteExpense} 
            onOpenAdd={() => {
              setEditingExpense(null);
              setShowAddModal(true);
            }}
          />
        )}
        {activeTab === 'week' && (
          <WeekView 
            expenses={expenses} 
            currency={currency} 
            weekOffset={weekOffset} 
            setWeekOffset={setWeekOffset} 
          />
        )}
        {activeTab === 'month' && (
          <MonthView 
            expenses={expenses} 
            currency={currency} 
            monthOffset={monthOffset} 
            setMonthOffset={setMonthOffset} 
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView 
            expenses={expenses} 
            currency={currency} 
            getCategoryMeta={getCategoryMeta}
            onEdit={handleEditTrigger}
            onDelete={handleDeleteExpense}
          />
        )}
        {activeTab === 'search' && (
          <SearchView 
            expenses={expenses} 
            currency={currency} 
            getCategoryMeta={getCategoryMeta}
            onEdit={handleEditTrigger}
            onDelete={handleDeleteExpense}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsView 
            expenses={expenses} 
            currency={currency} 
            getCategoryMeta={getCategoryMeta}
            period={insightPeriod}
            setPeriod={setInsightPeriod}
            monthlyBudgets={monthlyBudgets}
          />
        )}
      </main>

      {/* Floating Add Expense Trigger */}
      <button
        onClick={() => {
          setEditingExpense(null);
          setShowAddModal(true);
        }}
        aria-label="Add transaction"
        className="fixed bottom-20 right-6 z-10 bg-[var(--accent)] text-[var(--accent-text)] rounded-full p-4.5 shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-[0_0_20px_rgba(201,243,29,0.4)]"
      >
        <Plus size={24} />
      </button>

      {/* Persistent Save Error Banner */}
      {saveError && (
        <div className="fixed bottom-24 left-6 right-6 max-w-xl mx-auto bg-[var(--danger)]/15 border border-[var(--danger)]/35 text-[var(--danger)] text-xs px-4 py-2.5 rounded-xl text-center z-15 backdrop-blur-md">
          Unable to synchronize changes. Verify network connection and retry.
        </div>
      )}

      {/* Navigation tabs */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modal overlays */}
      {showAddModal && (
        <ExpenseFormModal
          categories={allCategories}
          onAddCategory={handleAddCategory}
          onSubmit={handleExpenseSubmit}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
          expense={editingExpense}
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
    </div>
  );
}
