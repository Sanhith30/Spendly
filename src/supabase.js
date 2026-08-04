import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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

  async uploadAvatar(userId, base64DataUrl) {
    if (!supabase) throw new Error('Supabase not configured');

    // Convert base64 data URL to a Blob for upload
    const res = await fetch(base64DataUrl);
    const blob = await res.blob();

    const filePath = `${userId}/avatar.jpg`;

    // Upload to Supabase Storage bucket 'avatars' (upsert = overwrite if exists)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    // Get the public URL (just a small string, safe to store in user_metadata)
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Save the public URL (not base64!) into user_metadata
    const { data: userData, error: metaError } = await supabase.auth.updateUser({
      data: { avatar_url: data.publicUrl },
    });
    if (metaError) throw metaError;

    return data.publicUrl;
  },

  async updateUserProfile({ display_name, avatar_url }) {
    if (!supabase) throw new Error('Supabase not configured');
    const updateData = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    const { data, error } = await supabase.auth.updateUser({ data: updateData });
    if (error) throw error;
    return data;
  },

  async getUserProfile() {
    if (!supabase) return { display_name: '', avatar_url: null };
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { display_name: '', avatar_url: null };
    return {
      display_name: user.user_metadata?.display_name || '',
      avatar_url: user.user_metadata?.avatar_url || null,
    };
  },
};

// ─── Get current user_id ───────────────────────────────────────────────────

async function getUserId() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// ─── Field name mappers (JS camelCase <-> DB snake_case) ──────────────────
// The DB uses snake_case (created_at) but JS objects use camelCase (createdAt).
// Without this mapping, upsert sends unknown columns and silently fails.

function toDbExpense(expense, userId) {
  return {
    id: expense.id,
    date: expense.date,
    category: expense.category,
    amount: expense.amount,
    note: expense.note || '',
    user_id: userId,
    created_at: expense.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function fromDbExpense(row) {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note || '',
    user_id: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Storage API ────────────────────────────────────────────────────────────

export const db = {
  isSupabase: () => !!supabase,

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
        return (data || []).map(fromDbExpense);
      } catch (err) {
        console.error('Supabase getExpenses failed:', err);
      }
    }
    const local = localStorage.getItem('moneytracker_expenses');
    return local ? JSON.parse(local) : [];
  },

  async saveExpense(expense) {
    const userId = await getUserId();
    if (supabase && userId) {
      try {
        const dbRow = toDbExpense(expense, userId);
        const { error } = await supabase
          .from('expenses')
          .upsert(dbRow, { onConflict: 'id' });
        if (error) throw error;
        return;
      } catch (err) {
        console.error('Supabase saveExpense failed:', err);
      }
    }
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('moneytracker_expenses') || '[]');
    const idx = local.findIndex((e) => e.id === expense.id);
    if (idx > -1) local[idx] = expense;
    else local.push(expense);
    localStorage.setItem('moneytracker_expenses', JSON.stringify(local));
  },

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
        console.error('Supabase deleteExpense failed:', err);
      }
    }
    const local = JSON.parse(localStorage.getItem('moneytracker_expenses') || '[]');
    localStorage.setItem('moneytracker_expenses', JSON.stringify(local.filter((e) => e.id !== id)));
  },

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
        console.error('Supabase getSettings failed:', err);
      }
    }
    const local = localStorage.getItem('moneytracker_settings');
    return local ? JSON.parse(local) : {};
  },

  async saveSettings(settingsData) {
    const userId = await getUserId();
    const payload = {
      ...settingsData,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    if (supabase && userId) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        return;
      } catch (err) {
        console.error('Supabase saveSettings failed:', err);
      }
    }
    localStorage.setItem('moneytracker_settings', JSON.stringify(payload));
  },
};
