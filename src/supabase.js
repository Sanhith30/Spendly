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

// Generate or retrieve a unique client_id for data isolation without full auth
function getClientId() {
  let clientId = localStorage.getItem('moneytracker_client_id');
  if (!clientId) {
    clientId = 'client-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('moneytracker_client_id', clientId);
  }
  return clientId;
}

export const CLIENT_ID = getClientId();

/**
 * Storage API Helper
 * Falls back to LocalStorage if Supabase is not configured or fails.
 */
export const db = {
  isSupabase: () => !!supabase,

  // Load all expenses
  async getExpenses() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('client_id', CLIENT_ID)
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
    const nextExpense = { ...expense, client_id: CLIENT_ID };
    if (supabase) {
      try {
        const { error } = await supabase
          .from('expenses')
          .upsert(nextExpense);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase saveExpense failed, falling back to localStorage:', err);
      }
    }
    // Always keep localStorage updated as fallback
    const localExpenses = await this.getExpenses();
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
    if (supabase) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('client_id', CLIENT_ID);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase deleteExpense failed, falling back to localStorage:', err);
      }
    }
    const localExpenses = await this.getExpenses();
    const filtered = localExpenses.filter((e) => e.id !== id);
    localStorage.setItem('moneytracker_expenses', JSON.stringify(filtered));
  },

  // Load app settings (budget, income, custom categories, currency, etc)
  async getSettings() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('client_id', CLIENT_ID)
          .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors as exceptions
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
    const payload = {
      ...settingsData,
      client_id: CLIENT_ID,
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert(payload);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase saveSettings failed, falling back to localStorage:', err);
      }
    }
    localStorage.setItem('moneytracker_settings', JSON.stringify(payload));
  }
};
