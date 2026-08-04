import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowRight, Loader2, Sparkles, Shield, TrendingUp, Zap } from 'lucide-react';
import { auth } from '../supabase';

// ── Web Audio: satisfying UI sounds ──────────────────────────────────────────
let _actx = null;
const actx = () => { if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)(); return _actx; };

function playTypingTick() {
  try {
    const c = actx(); const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square'; o.frequency.value = 800 + Math.random() * 200;
    g.gain.setValueAtTime(0.03, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    o.start(c.currentTime); o.stop(c.currentTime + 0.05);
  } catch (e) { }
}

function playFocusSound() {
  try {
    const c = actx();
    [440, 554].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      const t = c.currentTime + i * 0.04;
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.17);
    });
  } catch (e) { }
}

function playSuccessLogin() {
  try {
    const c = actx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      const t = c.currentTime + i * 0.07;
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.35);
    });
  } catch (e) { }
}

function playErrorSound() {
  try {
    const c = actx();
    [300, 220].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sawtooth'; o.frequency.value = f;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.18);
    });
  } catch (e) { }
}

function playTabSwitch() {
  try {
    const c = actx(); const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.08);
    g.gain.setValueAtTime(0.07, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    o.start(c.currentTime); o.stop(c.currentTime + 0.12);
  } catch (e) { }
}

// ── 3D Canvas Background: floating coins, charts & particles ─────────────────
function AnimatedBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    // Floating coin particles
    const coins = Array.from({ length: 18 }, () => ({
      x: Math.random() * W,
      y: H + Math.random() * H,
      r: 8 + Math.random() * 16,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.4 + Math.random() * 0.8),
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.02,
      opacity: 0.08 + Math.random() * 0.18,
      symbol: ['₹', '$', '€', '£', '¥'][Math.floor(Math.random() * 5)],
    }));

    // Floating chart bars
    const bars = Array.from({ length: 8 }, (_, i) => ({
      x: (W / 9) * (i + 1),
      y: H * 0.7,
      targetH: 40 + Math.random() * 120,
      currentH: 0,
      w: 18 + Math.random() * 10,
      speed: 0.5 + Math.random() * 1,
      opacity: 0.04 + Math.random() * 0.08,
      color: Math.random() > 0.5 ? '#C9F31D' : '#a78bfa',
    }));

    // Small glowing dots / particles
    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.5 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: 0.1 + Math.random() * 0.3,
      color: Math.random() > 0.5 ? '#C9F31D' : '#a78bfa',
    }));

    // Glowing orbs
    const orbs = [
      { x: W * 0.2, y: H * 0.3, r: 160, color: '#C9F31D', opacity: 0.04 },
      { x: W * 0.8, y: H * 0.6, r: 200, color: '#a78bfa', opacity: 0.035 },
      { x: W * 0.5, y: H * 0.85, r: 140, color: '#06b6d4', opacity: 0.03 },
    ];

    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      t++;

      // Background gradient
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      bg.addColorStop(0, '#0a0a0a');
      bg.addColorStop(1, '#050505');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines (subtle perspective)
      ctx.save();
      ctx.strokeStyle = 'rgba(201,243,29,0.03)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let gx = 0; gx < W; gx += gridSize) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
      ctx.restore();

      // Glowing orbs
      orbs.forEach(orb => {
        const pulse = 1 + Math.sin(t * 0.008) * 0.15;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * pulse);
        grad.addColorStop(0, orb.color + Math.round(orb.opacity * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bar chart (breathing animation)
      bars.forEach(b => {
        b.currentH += (b.targetH - b.currentH) * 0.02;
        const pulse = 1 + Math.sin(t * 0.015 + b.x) * 0.08;
        ctx.save();
        ctx.globalAlpha = b.opacity;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x - b.w / 2, b.y - b.currentH * pulse, b.w, b.currentH * pulse, 4);
        ctx.fill();
        ctx.restore();
      });

      // Floating dots
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.04 + d.x);
        ctx.save();
        ctx.globalAlpha = d.opacity * pulse;
        ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // 3D-perspective floating coins
      coins.forEach(coin => {
        coin.x += coin.vx; coin.y += coin.vy; coin.rot += coin.rotV;
        if (coin.y < -60) { coin.y = H + 20; coin.x = Math.random() * W; }

        // 3D coin effect using ellipse
        const scaleX = Math.abs(Math.cos(coin.rot));
        ctx.save();
        ctx.globalAlpha = coin.opacity * (0.5 + 0.5 * Math.abs(Math.cos(t * 0.02 + coin.x)));
        ctx.translate(coin.x, coin.y);

        // Coin body
        const grad = ctx.createRadialGradient(-coin.r * 0.3, -coin.r * 0.3, 0, 0, 0, coin.r);
        grad.addColorStop(0, '#f0c040');
        grad.addColorStop(0.5, '#c9a020');
        grad.addColorStop(1, '#8a6a00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, coin.r * Math.max(scaleX, 0.1), coin.r, 0, 0, Math.PI * 2);
        ctx.fill();

        // Coin shine
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(-coin.r * 0.25, -coin.r * 0.25, coin.r * 0.3 * Math.max(scaleX, 0.1), coin.r * 0.25, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // Currency symbol
        if (scaleX > 0.3) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = `bold ${coin.r * 0.9}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.scale(scaleX, 1);
          ctx.fillText(coin.symbol, 0, 0);
        }
        ctx.restore();
      });

      // Connecting lines between nearby dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - dist / 100) * 0.06;
            ctx.strokeStyle = '#C9F31D';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
            ctx.restore();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}

// ── Input with glow effect ────────────────────────────────────────────────────
function GlowInput({ icon: Icon, type, value, onChange, placeholder, autoComplete, required, minLength, rightEl, id }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative transition-all duration-300"
      style={{ filter: focused ? 'drop-shadow(0 0 8px rgba(201,243,29,0.25))' : 'none' }}
    >
      <Icon size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused ? 'text-[#C9F31D]' : 'text-white/30'}`} />
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        value={value}
        onChange={e => { onChange(e); if (value.length % 2 === 0) playTypingTick(); }}
        onFocus={() => { setFocused(true); playFocusSound(); }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full bg-white/[0.04] border rounded-xl pl-10 pr-${rightEl ? '11' : '4'} py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all duration-300 ${focused
            ? 'border-[#C9F31D]/60 bg-white/[0.07]'
            : 'border-white/10 hover:border-white/20'
          }`}
      />
      {rightEl && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>}
    </div>
  );
}

// ── Floating stats badge ──────────────────────────────────────────────────────
function StatBadge({ icon: Icon, text, delay = '0s' }) {
  return (
    <div
      className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[10px] font-semibold text-white/50 backdrop-blur-sm"
      style={{ animation: `floatBadge 4s ease-in-out infinite ${delay}` }}
    >
      <Icon size={11} className="text-[#C9F31D]" />
      {text}
    </div>
  );
}

// ── Main Auth Component ───────────────────────────────────────────────────────
export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [btnPressed, setBtnPressed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
  }, []);

  const switchMode = (m) => {
    playTabSwitch();
    setMode(m); setError(''); setSuccessMsg('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    setBtnPressed(true);
    setLoading(true);
    setTimeout(() => setBtnPressed(false), 200);

    try {
      if (mode === 'reset') {
        await auth.resetPassword(email);
        setSuccessMsg('Reset link sent! Check your email inbox.');
        setLoading(false);
        return;
      }
      if (mode === 'signup') {
        const data = await auth.signUp(email, password);
        if (data?.user && !data.session) {
          setSuccessMsg('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
        } else if (data?.session) {
          playSuccessLogin();
          onAuthSuccess(data.session.user);
        }
      } else {
        const data = await auth.signIn(email, password);
        playSuccessLogin();
        onAuthSuccess(data.user);
      }
    } catch (err) {
      playErrorSound();
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <AnimatedBackground />

      {/* Centered form */}
      <div
        className="relative z-10 w-full max-w-sm mx-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
          transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #C9F31D 0%, #a4c800 100%)', boxShadow: '0 0 30px rgba(201,243,29,0.4), 0 0 60px rgba(201,243,29,0.15)' }}
          >
            <TrendingUp size={26} className="text-black" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9F31D] rounded-full animate-ping opacity-60" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">
            SPENDLY
          </h1>
          <p className="text-[11px] text-white/30 mt-1 tracking-widest uppercase font-mono">
            Premium Wealth Dashboard
          </p>
          {/* Feature badges */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <StatBadge icon={Shield} text="Encrypted" delay="0s" />
            <StatBadge icon={Zap} text="Real-time Sync" delay="0.5s" />
            <StatBadge icon={Sparkles} text="AI Insights" delay="1s" />
          </div>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl border border-white/[0.08] backdrop-blur-2xl p-6 shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(201,243,29,0.05)',
          }}
        >
          {/* Mode tabs */}
          {mode !== 'reset' && (
            <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-5 gap-1">
              {['signin', 'signup'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${mode === m
                      ? 'text-black shadow-lg'
                      : 'text-white/40 hover:text-white/70'
                    }`}
                  style={mode === m ? {
                    background: 'linear-gradient(135deg, #C9F31D 0%, #a4c800 100%)',
                    boxShadow: '0 2px 12px rgba(201,243,29,0.3)',
                  } : {}}
                >
                  {m === 'signin' ? '→ Sign In' : '+ Sign Up'}
                </button>
              ))}
            </div>
          )}

          {/* Title */}
          <div className="mb-5">
            <h2 className="text-lg font-black text-white tracking-tight">
              {mode === 'signin' && '👋 Welcome back'}
              {mode === 'signup' && '🚀 Start your journey'}
              {mode === 'reset' && '🔑 Reset password'}
            </h2>
            <p className="text-[11px] text-white/35 mt-1">
              {mode === 'signin' && 'Sign in to access your wealth dashboard'}
              {mode === 'signup' && 'Your data syncs across all your devices'}
              {mode === 'reset' && "We'll send a secure reset link to your email"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <GlowInput
              id="auth-email"
              icon={Mail}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            {mode !== 'reset' && (
              <GlowInput
                id="auth-password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                rightEl={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="text-white/30 hover:text-white/70 transition"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.08)', animation: 'shakeX 0.4s ease' }}
              >
                <span className="text-red-400 font-bold mt-px">!</span> {error}
              </div>
            )}

            {/* Success */}
            {successMsg && (
              <div className="rounded-xl border border-[#C9F31D]/20 text-[#C9F31D] text-xs px-3.5 py-2.5"
                style={{ background: 'rgba(201,243,29,0.07)' }}
              >
                ✓ {successMsg}
              </div>
            )}

            {/* Submit button */}
            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-black py-3.5 rounded-xl text-sm text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mt-1"
              style={{
                background: 'linear-gradient(135deg, #C9F31D 0%, #d4f530 50%, #C9F31D 100%)',
                backgroundSize: '200% 100%',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(201,243,29,0.35), 0 0 0 1px rgba(201,243,29,0.2)',
                transform: btnPressed ? 'scale(0.97)' : 'scale(1)',
                animation: !loading && !btnPressed ? 'shimmerBtn 3s ease-in-out infinite' : 'none',
              }}
            >
              {/* Button shine sweep */}
              {!loading && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
                    animation: 'shineSweep 2.5s ease-in-out infinite',
                  }}
                />
              )}
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
                onClick={() => switchMode('reset')}
                className="text-xs text-white/25 hover:text-[#C9F31D]/70 transition"
              >
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs text-white/25 hover:text-[#C9F31D]/70 transition"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Bottom security note */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <Shield size={11} className="text-white/20" />
          <p className="text-[10px] text-white/20 font-mono">
            End-to-end encrypted · Supabase RLS · Zero data selling
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes shineSweep {
          0%   { transform: translateX(-100%); }
          40%, 100% { transform: translateX(200%); }
        }
        @keyframes shimmerBtn {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
