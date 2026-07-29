import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '../supabase';

export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        await auth.resetPassword(email);
        setSuccessMsg('Reset link sent! Check your email inbox.');
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const data = await auth.signUp(email, password);
        // Supabase may require email confirmation depending on settings
        if (data?.user && !data.session) {
          setSuccessMsg('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        } else if (data?.session) {
          onAuthSuccess(data.session.user);
        }
      } else {
        const data = await auth.signIn(email, password);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9F31D]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#C9F31D]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white">LEDGER</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 tracking-widest uppercase">
            Your premium wealth dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 backdrop-blur-xl p-7 shadow-2xl"
          style={{ boxShadow: '0 0 60px rgba(201,243,29,0.04), 0 25px 50px rgba(0,0,0,0.5)' }}
        >
          {/* Mode tabs */}
          {mode !== 'reset' && (
            <div className="flex bg-[var(--bg-primary)] rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === 'signin'
                    ? 'bg-[#C9F31D] text-black shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-[#C9F31D] text-black shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Title */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create an account'}
              {mode === 'reset' && 'Reset your password'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {mode === 'signin' && 'Sign in to sync your data across all devices'}
              {mode === 'signup' && 'Your data will sync across all your devices'}
              {mode === 'reset' && "We'll send a reset link to your email"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[#C9F31D]/60 focus:ring-1 focus:ring-[#C9F31D]/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-10 pr-11 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[#C9F31D]/60 focus:ring-1 focus:ring-[#C9F31D]/30 transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs px-3.5 py-2.5">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="rounded-xl bg-[#C9F31D]/10 border border-[#C9F31D]/25 text-[#C9F31D] text-xs px-3.5 py-2.5">
                {successMsg}
              </div>
            )}

            {/* Submit button */}
            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#C9F31D] hover:bg-[#d4f530] text-black font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && <><LogIn size={15} /> Sign In</>}
                  {mode === 'signup' && <><UserPlus size={15} /> Create Account</>}
                  {mode === 'reset' && <><ArrowRight size={15} /> Send Reset Link</>}
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-4 text-center">
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
                className="text-xs text-[var(--text-secondary)] hover:text-[#C9F31D] transition"
              >
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                className="text-xs text-[var(--text-secondary)] hover:text-[#C9F31D] transition"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--text-secondary)]/40 mt-5">
          Data is encrypted and synced securely via Supabase
        </p>
      </div>
    </div>
  );
}
