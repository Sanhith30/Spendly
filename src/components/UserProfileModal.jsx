import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Flame,
  Trophy,
  Target,
  LogOut,
  Settings,
  Check,
  Camera,
  Palette,
  Edit3,
  Trash2,
} from 'lucide-react';
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
  onSignOut,
  onOpenSettings,
  onClose,
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName || '');

  const [savingsTarget, setSavingsTarget] = useState(() => {
    return localStorage.getItem('spendly_savings_target') || '5000';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('spendly_accent_color') || '#C9F31D';
  });

  const initials = useMemo(() => {
    const name = userName || userEmail || 'SA';
    return name.slice(0, 2).toUpperCase();
  }, [userName, userEmail]);

  // ── Image compression (200×200 JPEG @ 70%) ──────────────────────────────
  const compressImage = (dataUrl) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX; } }
        else        { if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });

  // ── Photo upload → Supabase Storage ─────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('⚠️ Photo must be smaller than 10MB'); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const compressed = await compressImage(ev.target.result);
        setProfilePic(compressed); // instant preview

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        if (!userId) throw new Error('Not logged in');

        const publicUrl = await auth.uploadAvatar(userId, compressed);
        setProfilePic(publicUrl);
        localStorage.setItem('spendly_profile_pic', publicUrl);
        toast('Profile photo saved to cloud! 📸☁️');
      } catch (err) {
        console.error('Avatar upload failed:', err);
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
      toast('Profile photo removed 🗑️');
    } catch {
      toast('Profile photo removed locally');
    }
  };

  // ── Save name → Supabase user_metadata ──────────────────────────────────
  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    localStorage.setItem('spendly_user_name', trimmed);
    setIsEditingName(false);
    try {
      await auth.updateUserProfile({ display_name: trimmed });
      toast('Name saved to cloud! 👤☁️');
    } catch {
      toast('Name saved locally');
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalSpent = useMemo(
    () => expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [expenses]
  );

  const streakDays = useMemo(() => {
    if (!expenses.length) return 0;
    const dateSet = new Set(expenses.map((e) => e.date));
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const pad = (n) => String(n).padStart(2, '0');
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (dateSet.has(key)) { streak++; d.setDate(d.getDate() - 1); }
      else if (i === 0)     { d.setDate(d.getDate() - 1); }
      else break;
    }
    return Math.max(streak, 1);
  }, [expenses]);

  const handleSavingsChange = (val) => {
    setSavingsTarget(val);
    localStorage.setItem('spendly_savings_target', val);
  };

  const handleAccentChange = (color) => {
    setAccentColor(color);
    localStorage.setItem('spendly_accent_color', color);
    document.documentElement.style.setProperty('--accent', color);
    toast('Accent theme updated! 🎨');
  };

  const targetNum  = parseFloat(savingsTarget) || 0;
  const progressPct = targetNum > 0 ? Math.min(Math.round((totalSpent / targetNum) * 100), 100) : 0;

  // ── Badge label ──────────────────────────────────────────────────────────
  const badge =
    expenses.length >= 50 ? '🏆 Legend'
    : expenses.length >= 20 ? '🥇 Master'
    : expenses.length >= 10 ? '🥈 Pro'
    : expenses.length >= 1  ? '🥉 Novice'
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">My Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-white/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden file input */}
        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

        {/* ── Profile Card ────────────────────────────────────────────────── */}
        <div className="cred-card p-4 flex flex-col items-center text-center space-y-3 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[rgba(var(--accent-rgb),0.05)] border-[var(--border-color)]">

          {/* Avatar */}
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
            <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white font-bold text-[10px]">
              <Camera size={18} className="mb-0.5" />
              <span>Change</span>
            </div>
          </div>

          {/* Photo actions */}
          <div className="flex items-center gap-3 text-[10px]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[var(--accent)] hover:underline font-bold flex items-center gap-1"
            >
              <Camera size={11} /> Upload Photo
            </button>
            {profilePic && (
              <button
                onClick={handleRemovePhoto}
                className="text-red-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>

          {/* Editable name */}
          <div className="w-full">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="Enter your name"
                  autoFocus
                  className="bg-[var(--bg-input)] border border-[var(--accent)] rounded-lg px-2.5 py-1 text-sm font-bold text-center text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] font-bold"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">
                  {userName || (userEmail ? userEmail.split('@')[0] : 'Your Name')}
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
            <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{userEmail || ''}</p>
            <div className="flex items-center justify-center mt-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck size={10} /> Supabase RLS Encrypted 🔒
              </span>
            </div>
          </div>
        </div>

        {/* ── Streak & Badge ───────────────────────────────────────────────── */}
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
              <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Badge</p>
              <p className="text-xs font-bold text-[var(--text-primary)]">{badge}</p>
            </div>
          </div>
        </div>

        {/* ── Accent Color Picker ──────────────────────────────────────────── */}
        <div className="cred-card p-3 space-y-2">
          <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Palette size={14} className="text-[var(--accent)]" /> Neon Accent Theme
          </span>
          <div className="flex items-center justify-between pt-1">
            {[
              ['Cyber Lime',      '#C9F31D'],
              ['Electric Violet', '#8B5CF6'],
              ['Ocean Cyan',      '#06B6D4'],
              ['Neon Pink',       '#EC4899'],
              ['Sunset Orange',   '#F97316'],
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

        {/* ── Monthly Spending Target ──────────────────────────────────────── */}
        <div className="cred-card p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Target size={14} className="text-[var(--accent)]" /> Monthly Spending Target
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
            Logged: {currency}{totalSpent.toLocaleString()} / {currency}{Number(savingsTarget).toLocaleString()} ({progressPct}%)
          </p>
        </div>

        {/* ── App Settings Shortcut ────────────────────────────────────── */}
        <button
          onClick={() => { onClose(); onOpenSettings && onOpenSettings(); }}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-white/5 transition flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <Settings size={15} className="text-[var(--accent)]" />
            App Settings
          </span>
          <span className="text-[var(--text-muted)] text-[10px] flex items-center gap-1">
            Budget · Currency · Reminders · Export
            <span className="text-base leading-none">›</span>
          </span>
        </button>

        {/* ── Sign Out ─────────────────────────────────────────────────────── */}
        {onSignOut && (
          <button
            onClick={() => { onClose(); onSignOut(); }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center gap-2"
          >
            <LogOut size={15} /> Sign Out of Account
          </button>
        )}

      </div>
    </div>
  );
}
