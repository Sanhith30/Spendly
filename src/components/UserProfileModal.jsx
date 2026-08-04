import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Flame,
  Trophy,
  Target,
  Download,
  LogOut,
  Bell,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Check,
  Camera,
  Globe,
  Palette,
  Edit3,
  Trash2,
} from 'lucide-react';
import { CURRENCIES } from '../utils/currency';
import { scheduleNextReminder } from '../utils/reminder';
import { useToast } from './Toast';
import { auth, supabase } from '../supabase';

export default function UserProfileModal({
  userEmail,
  userName,
  setUserName,
  profilePic,
  setProfilePic,
  expenses = [],
  currency = '₹',
  onCurrencyChange,
  darkMode,
  setDarkMode,
  onSignOut,
  onClose,
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName || '');

  // Local state for savings target & settings
  const [savingsTarget, setSavingsTarget] = useState(() => {
    return localStorage.getItem('spendly_savings_target') || '5000';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('spendly_sound_enabled') !== 'false';
  });

  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem('spendly_reminder_enabled') === 'true';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('spendly_accent_color') || '#C9F31D';
  });

  const initials = useMemo(() => {
    const name = userName || userEmail || 'SA';
    return name.slice(0, 2).toUpperCase();
  }, [userName, userEmail]);

  // Compress image to max 200x200 JPEG at 70% quality before saving to Supabase
  const compressImage = (dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        // Scale down to fit within 200x200 while keeping aspect ratio
        if (width > height) {
          if (width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  // Handle Profile Picture File Upload — uploads to Supabase Storage, saves URL
  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('⚠️ Photo must be smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Show compressed preview immediately (for instant feedback)
        const compressed = await compressImage(event.target.result);
        setProfilePic(compressed);

        // Get the logged-in user's ID for Storage path
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        if (!userId) throw new Error('Not logged in');

        // Upload compressed image to Supabase Storage → get public URL
        const publicUrl = await auth.uploadAvatar(userId, compressed);

        // Save the public URL (tiny string) to localStorage as cache
        setProfilePic(publicUrl);
        localStorage.setItem('spendly_profile_pic', publicUrl);

        toast('Profile photo saved to cloud! 📸☁️');
      } catch (err) {
        console.error('Failed to upload avatar:', err);
        toast('⚠️ Upload failed. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setProfilePic(null);
    localStorage.removeItem('spendly_profile_pic');
    try {
      await auth.updateUserProfile({ avatar_url: null });
      toast('Profile photo removed from cloud 🗑️');
    } catch (err) {
      console.error('Failed to remove photo from Supabase:', err);
      toast('Profile photo removed locally');
    }
  };

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    localStorage.setItem('spendly_user_name', trimmed);
    setIsEditingName(false);
    try {
      await auth.updateUserProfile({ display_name: trimmed });
      toast('Name saved to cloud! 👤☁️');
    } catch (err) {
      console.error('Failed to save name to Supabase:', err);
      toast('Name saved locally (cloud sync failed)');
    }
  };

  // Compute stats
  const totalSpent = useMemo(() => {
    return expenses.reduce((s, e) => s + (e.amount || 0), 0);
  }, [expenses]);

  const streakDays = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    const dateSet = new Set(expenses.map((e) => e.date));
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const pad = (n) => String(n).padStart(2, '0');
      const key = `${checkDate.getFullYear()}-${pad(checkDate.getMonth() + 1)}-${pad(checkDate.getDate())}`;
      if (dateSet.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(streak, 1);
  }, [expenses]);

  const handleSavingsChange = (val) => {
    setSavingsTarget(val);
    localStorage.setItem('spendly_savings_target', val);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('spendly_sound_enabled', String(next));
    toast(next ? 'Sound FX enabled 🔊' : 'Sound FX muted 🔇');
  };

  const handleToggleReminder = async () => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    localStorage.setItem('spendly_reminder_enabled', String(next));
    if (next) {
      const scheduled = await scheduleNextReminder();
      if (scheduled) {
        toast('⏰ 9:00 PM Daily Reminder active!');
      } else {
        toast('⚠️ Notification permission required');
      }
    } else {
      toast('Reminder disabled');
    }
  };

  const handleAccentChange = (color) => {
    setAccentColor(color);
    localStorage.setItem('spendly_accent_color', color);
    document.documentElement.style.setProperty('--accent', color);
    toast('Accent theme updated! 🎨');
  };

  const handleExportCSV = () => {
    if (!expenses || expenses.length === 0) {
      toast('No transactions to export!');
      return;
    }

    const headers = ['ID', 'Date', 'Category', 'Amount', 'Currency', 'Note'];
    const rows = expenses.map((e) => [
      e.id,
      e.date,
      `"${e.category}"`,
      e.amount,
      currency,
      `"${e.note || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Spendly_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast('CSV Data downloaded successfully! 📊');
  };

  const currentMonthSpent = totalSpent;
  const targetNum = parseFloat(savingsTarget) || 0;
  const progressPct = targetNum > 0 ? Math.min(Math.round((currentMonthSpent / targetNum) * 100), 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">User Profile & Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden File Input for Avatar Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Profile Card with Photo Upload & Editable Name */}
        <div className="cred-card p-4 flex flex-col items-center text-center space-y-3 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[rgba(var(--accent-rgb),0.05)] border-[var(--border-color)] relative">
          
          {/* Avatar Photo with Upload Button */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[var(--accent)]/50 shadow-xl"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-black ring-4 ring-[var(--accent)]/50 shadow-xl"
                style={{ backgroundColor: accentColor }}
              >
                {initials}
              </div>
            )}

            {/* Camera Overlay Icon */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white font-bold text-[10px]">
              <Camera size={18} className="mb-0.5" />
              <span>Change</span>
            </div>
          </div>

          {/* Photo Actions: Upload / Remove */}
          <div className="flex items-center gap-2 text-[10px]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[var(--accent)] hover:underline font-bold flex items-center gap-1"
            >
              <Camera size={11} /> Upload Photo
            </button>
            {profilePic && (
              <button
                onClick={handleRemovePhoto}
                className="text-red-400 hover:underline font-semibold flex items-center gap-1 ml-2"
              >
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>

          {/* Editable Display Name */}
          <div className="w-full">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  className="bg-[var(--bg-input)] border border-[var(--accent)] rounded-lg px-2.5 py-1 text-sm font-bold text-center text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] font-bold text-xs"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">
                  {userName || (userEmail ? userEmail.split('@')[0] : 'Sanhith Reddy')}
                </h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)] transition"
                  title="Edit Name"
                >
                  <Edit3 size={13} />
                </button>
              </div>
            )}
            <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{userEmail || 'user@spendly.app'}</p>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck size={10} /> Supabase RLS Encrypted 🔒
              </span>
            </div>
          </div>
        </div>

        {/* Daily Streak & Achievement Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="cred-card p-3 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
              <Flame size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Daily Streak</p>
              <p className="text-sm font-bold font-mono text-[var(--text-primary)]">{streakDays} Days 🔥</p>
            </div>
          </div>

          <div className="cred-card p-3 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Badges</p>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {expenses.length >= 10 ? '🥇 Master' : expenses.length >= 1 ? '🥉 Novice' : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Accent Color Switcher */}
        <div className="cred-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Palette size={14} className="text-[var(--accent)]" /> Neon Accent Theme
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            {[
              ['Cyber Lime', '#C9F31D'],
              ['Electric Violet', '#8B5CF6'],
              ['Ocean Cyan', '#06B6D4'],
              ['Neon Pink', '#EC4899'],
              ['Sunset Orange', '#F97316'],
            ].map(([name, col]) => (
              <button
                key={col}
                onClick={() => handleAccentChange(col)}
                title={name}
                className={`w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center ${
                  accentColor === col ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: col }}
              >
                {accentColor === col && <Check size={12} className="text-black font-black" />}
              </button>
            ))}
          </div>
        </div>

        {/* Savings Target Progress Ring */}
        <div className="cred-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Target size={14} className="text-[var(--accent)]" /> Monthly Target
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">{currency}</span>
              <input
                type="number"
                value={savingsTarget}
                onChange={(e) => handleSavingsChange(e.target.value)}
                className="w-16 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-md px-1.5 py-0.5 text-xs text-right font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="h-1.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] font-mono text-right">
            Total Logged: {currency}{totalSpent.toLocaleString()}
          </p>
        </div>

        {/* Settings Toggles */}
        <div className="cred-card p-3 space-y-3 divide-y divide-[var(--border-color)]/30 text-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
              <Globe size={14} className="text-[var(--accent)]" /> Currency
            </span>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.symbol}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2.5 pb-2">
            <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
              {darkMode ? <Sun size={14} className="text-[var(--accent)]" /> : <Moon size={14} />} Theme
            </span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:bg-white/5 transition"
            >
              {darkMode ? 'Dark CRED' : 'Light Mode'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5 pb-2">
            <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
              {soundEnabled ? <Volume2 size={14} className="text-[var(--accent)]" /> : <VolumeX size={14} />} Sound Effects
            </span>
            <button
              onClick={handleToggleSound}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                soundEnabled
                  ? 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]'
                  : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
              <Bell size={14} className="text-[var(--accent)]" /> 9:00 PM Daily Reminder
            </span>
            <button
              onClick={handleToggleReminder}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                reminderEnabled
                  ? 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]'
                  : 'bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {reminderEnabled ? 'Active' : 'Off'}
            </button>
          </div>
        </div>

        {/* 1-Tap CSV Data Export */}
        <button
          onClick={handleExportCSV}
          className="w-full py-2.5 px-4 cred-button-secondary rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-white/5 transition"
        >
          <Download size={15} className="text-[var(--accent)]" /> Export CSV Data Spreadsheet
        </button>

        {/* Sign Out Button */}
        {onSignOut && (
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
          >
            <LogOut size={15} /> Sign Out of Account
          </button>
        )}
      </div>
    </div>
  );
}
