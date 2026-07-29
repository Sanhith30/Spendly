import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ─── Auth Helpers ──────────────────────────────────────────────────────────

export const auth = {
  async signUp(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },

  async resetPassword(email) {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  },
};

// ─── Get current user_id ───────────────────────────────────────────────────

async function getUserId() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// ─── Storage API Helper ────────────────────────────────────────────────────
// Falls back to LocalStorage if Supabase is not configured or user is not logged in.

export const db = {
  isSupabase: () => !!supabase,

  // Load all expenses
  async getExpenses() {
    const userId = await getUserId();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getExpenses failed, loading from localStorage:', err);
      }
    }
    const local = localStorage.getItem('moneytracker_expenses');
    return local ? JSON.parse(local) : [];
  },

  // Save an expense
  async saveExpense(expense) {
    const userId = await getUserId();
    const nextExpense = { ...expense, user_id: userId };
    if (supabase && userId) {
      try {
        const { error } = await supabase
          .from('expenses')
          .upsert(nextExpense, { onConflict: 'id' });
        if (error) throw error;
        return; // Skip localStorage when Supabase succeeds
      } catch (err) {
        console.error('Supabase saveExpense failed, falling back to localStorage:', err);
      }
    }
    // Fallback: keep localStorage updated
    const localExpenses = JSON.parse(localStorage.getItem('moneytracker_expenses') || '[]');
    const index = localExpenses.findIndex((e) => e.id === expense.id);
    if (index > -1) {
      localExpenses[index] = nextExpense;
    } else {
      localExpenses.push(nextExpense);
    }
    localStorage.setItem('moneytracker_expenses', JSON.stringify(localExpenses));
  },

  // Delete an expense
  async deleteExpense(id) {
    const userId = await getUserId();
    if (supabase && userId) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return;
      } catch (err) {
        console.error('Supabase deleteExpense failed, falling back to localStorage:', err);
      }
    }
    const localExpenses = JSON.parse(localStorage.getItem('moneytracker_expenses') || '[]');
    const filtered = localExpenses.filter((e) => e.id !== id);
    localStorage.setItem('moneytracker_expenses', JSON.stringify(filtered));
  },

  // Load app settings (budget, income, custom categories, currency, etc)
  async getSettings() {
    const userId = await getUserId();
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error('Supabase getSettings failed, loading from localStorage:', err);
      }
    }
    const local = localStorage.getItem('moneytracker_settings');
    return local ? JSON.parse(local) : {};
  },

  // Save settings
  async saveSettings(settingsData) {
    const userId = await getUserId();
    const payload = {
      ...settingsData,
      user_id: userId,
      updated_at: new Date().toISOString()
    };
    if (supabase && userId) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        return;
      } catch (err) {
        console.error('Supabase saveSettings failed, falling back to localStorage:', err);
      }
    }
    localStorage.setItem('moneytracker_settings', JSON.stringify(payload));
  }
};
