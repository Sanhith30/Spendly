import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, Trophy, Sparkles, TrendingUp,
  Calendar, Share2, Award, Copy, Check, Heart, BarChart2, Flame,
} from 'lucide-react';
import {
  playWrappedIntroSound, playTrophySound, playCashRegisterSound,
  playCoinsShimmerSound, playFanfareSound, playWhooshSound,
  playHeartbeatSound, playEpicRevealSound,
} from '../utils/sounds';
import { CATEGORY_ICONS } from './ExpenseFormModal';

// ── Confetti particle component ───────────────────────────────────────────────
function WrappedConfetti({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      size: 4 + Math.random() * 6,
      color: ['#C9F31D','#a78bfa','#f472b6','#34d399','#fb923c','#60a5fa','#fbbf24'][Math.floor(Math.random() * 7)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 6,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.rotV;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      if (alive) animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />;
}

// ── Animated number counter ───────────────────────────────────────────────────
function CountUp({ end, duration = 1400, prefix = '', suffix = '', decimals = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      start = eased * end;
      setVal(start);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {val.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// ── Slide backgrounds ─────────────────────────────────────────────────────────
const SLIDE_BG = [
  'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',   // 0 Intro
  'linear-gradient(145deg, #180e29 0%, #3b0764 50%, #581c87 100%)',   // 1 Top Category
  'linear-gradient(145deg, #022c22 0%, #065f46 50%, #047857 100%)',   // 2 Peak Day
  'linear-gradient(145deg, #172554 0%, #1e3a8a 50%, #1d4ed8 100%)',   // 3 Savings
  'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',   // 4 Category Breakdown
  'linear-gradient(145deg, #1c1917 0%, #451a03 50%, #78350f 100%)',   // 5 Days Tracked
  'linear-gradient(145deg, #0c0a09 0%, #1c0533 50%, #2e0f5e 100%)',   // 6 Badge / Final
];

const SLIDE_SOUNDS = [
  playWrappedIntroSound,
  playTrophySound,
  playCashRegisterSound,
  playCoinsShimmerSound,
  playWhooshSound,
  playHeartbeatSound,
  playEpicRevealSound,
];

// ── Mini bar chart for monthly heatmap ───────────────────────────────────────
function MonthBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="w-full bg-white/10 rounded-full overflow-hidden" style={{ height: 60 }}>
        <div
          className="w-full rounded-full transition-all duration-700"
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%`, backgroundColor: color, opacity: pct > 0 ? 1 : 0.15 }}
        />
      </div>
      <span className="text-[9px] font-mono font-bold text-white/60">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function YearWrappedModal({ expenses, currency, income, onClose, getCategoryMeta }) {
  const currentYear = new Date().getFullYear();
  const [slideIndex, setSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [animKey, setAnimKey] = useState(0); // re-triggers CountUp on slide change
  const touchStartX = useRef(null);
  const totalSlides = 7;

  // Play sound on each slide
  useEffect(() => {
    SLIDE_SOUNDS[slideIndex]?.();
    setAnimKey(k => k + 1);
  }, [slideIndex]);

  // Auto-advance (6 sec per slide, pauses at last)
  useEffect(() => {
    if (slideIndex >= totalSlides - 1) return;
    const t = setTimeout(() => setSlideIndex(p => p + 1), 6000);
    return () => clearTimeout(t);
  }, [slideIndex]);

  // Swipe gesture support
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  // Tap zones (left 40% = back, right 60% = forward)
  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) goPrev();
    else goNext();
  };

  const goPrev = useCallback(() => setSlideIndex(p => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setSlideIndex(p => Math.min(totalSlides - 1, p + 1)), []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const yrExp = expenses.filter(e => new Date(e.date).getFullYear() === currentYear);
    const totalSpent = yrExp.reduce((s, e) => s + e.amount, 0);
    const totalCount = yrExp.length;

    // Category totals
    const catTotals = {};
    yrExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const topCat = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a])[0] || 'Other';
    const topCatAmt = catTotals[topCat] || 0;
    const topCatPct = totalSpent ? Math.round((topCatAmt / totalSpent) * 100) : 0;

    // Top 4 categories for breakdown
    const topCats = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amt]) => ({ name, amt, pct: totalSpent ? Math.round((amt / totalSpent) * 100) : 0 }));

    // Biggest single purchase
    const biggestTx = yrExp.reduce((max, e) => (e.amount > (max?.amount || 0) ? e : max), null);

    // Peak spending day
    const dayTotals = {};
    yrExp.forEach(e => { dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount; });
    const peakEntry = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    const peakDateStr = peakEntry?.[0] || '';
    const peakDayAmt = peakEntry?.[1] || 0;
    const peakDateFmt = peakDateStr
      ? new Date(peakDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A';

    // Monthly breakdown (Jan-Dec)
    const monthlyTotals = Array(12).fill(0);
    yrExp.forEach(e => { const m = new Date(e.date).getMonth(); monthlyTotals[m] += e.amount; });
    const maxMonthly = Math.max(...monthlyTotals);

    // Days tracked
    const uniqueDays = new Set(yrExp.map(e => e.date)).size;

    // Savings
    const annualIncome = income * 12;
    const estimatedSaved = Math.max(0, annualIncome - totalSpent);

    // Financial personality
    let badge = 'Smart Saver', badgeEmoji = '🥷', badgeDesc = 'You keep a close eye on every penny!';
    if (topCat === 'Tea' || topCat === 'Breakfast') {
      badge = 'Morning Ritual Master'; badgeEmoji = '☕'; badgeDesc = 'Your day starts with rich morning brews!';
    } else if (topCat === 'Lunch' || topCat === 'Dinner') {
      badge = 'Feast Master'; badgeEmoji = '🍔'; badgeDesc = 'Good food is your ultimate wealth investment.';
    } else if (estimatedSaved > totalSpent) {
      badge = 'Wealth Ninja'; badgeEmoji = '🚀'; badgeDesc = 'You save more than you spend! Exponential growth ahead.';
    } else if (totalCount > 50) {
      badge = 'Log Champion'; badgeEmoji = '⚡'; badgeDesc = 'Ultimate consistency — you track every transaction.';
    } else if (uniqueDays > 200) {
      badge = 'Discipline King'; badgeEmoji = '👑'; badgeDesc = 'Over 200 days tracked — you are relentless!';
    }

    return {
      totalSpent, totalCount, topCat, topCatAmt, topCatPct, topCats,
      peakDateFmt, peakDayAmt, estimatedSaved,
      monthlyTotals, maxMonthly, uniqueDays,
      biggestTx, badge, badgeEmoji, badgeDesc,
    };
  }, [expenses, income, currentYear]);

  const TopIcon = CATEGORY_ICONS[stats.topCat] || Trophy;
  const topMeta = getCategoryMeta ? getCategoryMeta(stats.topCat) : { color: '#C9F31D' };
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const COLORS = ['#C9F31D','#a78bfa','#f472b6','#34d399','#fb923c','#60a5fa','#fbbf24'];

  // ── Share / Copy ──────────────────────────────────────────────────────────
  const handleCopy = () => {
    const text =
      `🎊 My ${currentYear} Spendly Wrapped!\n` +
      `💸 Total Spent: ${currency}${stats.totalSpent.toLocaleString()}\n` +
      `📦 Transactions: ${stats.totalCount}\n` +
      `👑 Top Category: ${stats.topCat} (${stats.topCatPct}%)\n` +
      `📅 Biggest Day: ${stats.peakDateFmt} — ${currency}${stats.peakDayAmt.toLocaleString()}\n` +
      `💰 Estimated Saved: ${currency}${stats.estimatedSaved.toLocaleString()}\n` +
      `🏆 My Persona: ${stats.badgeEmoji} ${stats.badge}\n` +
      `📲 Track yours on Spendly!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10 select-none"
        style={{ height: 'min(720px, 92vh)', background: SLIDE_BG[slideIndex], transition: 'background 0.7s ease' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {/* Confetti on final slide */}
        <WrappedConfetti active={slideIndex === totalSlides - 1} />

        {/* ── Progress bars ──────────────────────────────────────────────── */}
        <div className="flex gap-1 p-4 pb-2 z-10">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: idx < slideIndex ? '100%' : idx === slideIndex ? '100%' : '0%',
                  transition: idx === slideIndex ? 'width 6s linear' : 'width 0.3s ease',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Close ──────────────────────────────────────────────────────── */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-10 right-4 z-30 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full backdrop-blur-md transition"
        >
          <X size={18} />
        </button>

        {/* ── Slide Content ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center items-center z-10 px-6 py-4 overflow-hidden">

          {/* SLIDE 0: Intro */}
          {slideIndex === 0 && (
            <div key={animKey} className="space-y-5 text-center slide-up w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold tracking-wider">
                <Sparkles size={13} className="text-[#C9F31D]" /> {currentYear} WRAPPED
              </div>
              <h2 className="text-4xl font-black tracking-tight leading-tight text-white">
                Your Year<br />in Money 💸
              </h2>
              <div className="py-4">
                <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-1">Total Logged</p>
                <p className="text-5xl font-black font-mono text-[#C9F31D]">
                  <CountUp key={animKey} end={stats.totalSpent} prefix={currency} duration={1600} />
                </p>
              </div>
              <p className="text-sm text-white/80 max-w-xs mx-auto">
                You logged <strong className="text-white font-mono">{stats.totalCount} transactions</strong> this year. Here's your full story 👇
              </p>
              <p className="text-[10px] text-white/40 animate-pulse">Tap right to continue →</p>
            </div>
          )}

          {/* SLIDE 1: Top Category */}
          {slideIndex === 1 && (
            <div key={animKey} className="space-y-5 text-center slide-up w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold">
                👑 Top Category Champion
              </span>
              <div
                className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center bg-white/10 border border-white/20 shadow-2xl"
                style={{ animation: 'bounceIn 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)' }}
              >
                <TopIcon size={46} style={{ color: topMeta.color || '#C9F31D' }} />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight text-white">{stats.topCat}</h3>
                <p className="text-4xl font-black font-mono text-[#C9F31D] mt-2">
                  <CountUp key={animKey} end={stats.topCatAmt} prefix={currency} duration={1200} />
                </p>
                <span className="inline-block mt-3 text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-full text-purple-200">
                  {stats.topCatPct}% of your total annual spend
                </span>
              </div>
              {/* Top 3 mini list */}
              <div className="space-y-1.5 w-full">
                {stats.topCats.slice(0, 3).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-[11px] font-mono bg-white/5 rounded-xl px-3 py-1.5">
                    <span className="text-white/70">{['🥇','🥈','🥉'][i]} {c.name}</span>
                    <span className="text-white font-bold">{currency}{c.amt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 2: Peak Spending Day */}
          {slideIndex === 2 && (
            <div key={animKey} className="space-y-5 text-center slide-up w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                📈 Your Biggest Spending Day
              </span>
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                <Calendar size={40} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-200">Your highest day was</p>
                <h3 className="text-2xl font-black text-white mt-1">{stats.peakDateFmt}</h3>
                <p className="text-4xl font-black font-mono text-[#C9F31D] mt-3">
                  <CountUp key={animKey} end={stats.peakDayAmt} prefix={currency} duration={1200} />
                </p>
              </div>
              {stats.biggestTx && (
                <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white/80 space-y-1">
                  <p className="font-bold text-white text-sm">💳 Biggest Single Purchase</p>
                  <p className="font-mono text-[#C9F31D] font-black text-lg">
                    {currency}{stats.biggestTx.amount.toLocaleString()}
                  </p>
                  <p className="text-white/60">{stats.biggestTx.category} · {stats.biggestTx.date}{stats.biggestTx.note ? ` · ${stats.biggestTx.note}` : ''}</p>
                </div>
              )}
            </div>
          )}

          {/* SLIDE 3: Savings Estimate */}
          {slideIndex === 3 && (
            <div key={animKey} className="space-y-5 text-center slide-up w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-bold">
                💰 Wealth Saved This Year
              </span>
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-blue-500/20 border border-blue-400/30 text-blue-300">
                <TrendingUp size={40} />
              </div>
              <div>
                <p className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider mb-1">Estimated Savings</p>
                <p className="text-5xl font-black font-mono text-[#C9F31D]">
                  <CountUp key={animKey} end={stats.estimatedSaved} prefix={currency} duration={1500} />
                </p>
              </div>
              {/* Savings vs spend bar */}
              <div className="w-full space-y-2">
                {(() => {
                  const total = stats.totalSpent + stats.estimatedSaved || 1;
                  const spendPct = Math.round((stats.totalSpent / total) * 100);
                  const savePct = 100 - spendPct;
                  return (
                    <>
                      <div className="flex rounded-full overflow-hidden h-4 text-[9px] font-bold">
                        <div className="flex items-center justify-center bg-red-500/60" style={{ width: `${spendPct}%` }}>
                          {spendPct > 15 ? `${spendPct}% spent` : ''}
                        </div>
                        <div className="flex items-center justify-center bg-emerald-500/70" style={{ width: `${savePct}%` }}>
                          {savePct > 15 ? `${savePct}% saved` : ''}
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-white/60">
                        <span>🔴 Spent: {currency}{stats.totalSpent.toLocaleString()}</span>
                        <span>🟢 Saved: {currency}{stats.estimatedSaved.toLocaleString()}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-[10px] text-white/50">Based on monthly income × 12 vs logged expenses</p>
            </div>
          )}

          {/* SLIDE 4: Category Breakdown */}
          {slideIndex === 4 && (
            <div key={animKey} className="space-y-4 text-center slide-up w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-pink-300 font-bold">
                📊 Where Your Money Went
              </span>
              <div className="w-full space-y-2 mt-2">
                {stats.topCats.map((c, i) => (
                  <div key={c.name} className="w-full">
                    <div className="flex justify-between text-[11px] font-mono mb-0.5">
                      <span className="text-white/80">{c.name}</span>
                      <span className="font-bold" style={{ color: COLORS[i] }}>{c.pct}%</span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${c.pct}%`, backgroundColor: COLORS[i], transitionDelay: `${i * 100}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Monthly heatmap bars */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2">Monthly Breakdown</p>
                <div className="flex gap-0.5 items-end h-16">
                  {stats.monthlyTotals.map((v, i) => (
                    <MonthBar key={i} label={MONTHS[i].slice(0,1)} value={v} max={stats.maxMonthly} color={COLORS[i % COLORS.length]} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 5: Days Tracked */}
          {slideIndex === 5 && (
            <div key={animKey} className="space-y-5 text-center slide-up w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-300 font-bold">
                🔥 Your Tracking Streak
              </span>
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-orange-500/20 border border-orange-400/30 text-orange-300">
                <Flame size={40} />
              </div>
              <div>
                <p className="text-6xl font-black font-mono text-[#C9F31D]">
                  <CountUp key={animKey} end={stats.uniqueDays} duration={1000} />
                </p>
                <p className="text-sm font-semibold text-white/80 mt-1">days tracked in {currentYear}</p>
                {/* Progress ring text */}
                <p className="text-xs text-white/60 mt-2">
                  That's{' '}
                  <span className="font-bold text-white">
                    {Math.round((stats.uniqueDays / 365) * 100)}%
                  </span>{' '}
                  of the entire year! 🗓️
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-[#C9F31D] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((stats.uniqueDays / 365) * 100, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['📦', 'Transactions', stats.totalCount],
                  ['📅', 'Days Active', stats.uniqueDays],
                  ['💸', 'Avg/Day', stats.uniqueDays ? Math.round(stats.totalSpent / stats.uniqueDays) : 0],
                ].map(([icon, label, val]) => (
                  <div key={label} className="bg-white/10 rounded-xl p-2">
                    <div className="text-lg">{icon}</div>
                    <div className="text-xs font-black font-mono text-white">{typeof val === 'number' ? val.toLocaleString() : val}</div>
                    <div className="text-[9px] text-white/50">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 6: Final Badge */}
          {slideIndex === 6 && (
            <div key={animKey} className="space-y-5 text-center slide-up w-full">
              <div className="text-7xl" style={{ animation: 'bounceIn 0.7s cubic-bezier(0.68,-0.55,0.27,1.55), pulse 2s infinite 0.8s' }}>
                {stats.badgeEmoji}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                  🏆 Your {currentYear} Financial Persona
                </span>
                <h3 className="text-3xl font-black text-amber-200 tracking-tight mt-1">{stats.badge}</h3>
                <p className="text-xs text-white/75 mt-2 max-w-xs mx-auto leading-relaxed">{stats.badgeDesc}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-xs text-white/90 space-y-1">
                <p className="font-bold">🚀 Keep crushing it in {currentYear + 1}!</p>
                <p className="text-white/60">Total tracked: {currency}{stats.totalSpent.toLocaleString()} across {stats.totalCount} transactions</p>
              </div>

              {/* Share / Copy buttons */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/15 border border-white/25 text-xs font-bold text-white hover:bg-white/25 transition flex items-center justify-center gap-1.5"
                >
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Summary</>}
                </button>
                {navigator.share && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.share({
                        title: `My ${currentYear} Spendly Wrapped`,
                        text: `I spent ${currency}${stats.totalSpent.toLocaleString()} this year! My persona: ${stats.badgeEmoji} ${stats.badge}`,
                      });
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#C9F31D]/20 border border-[#C9F31D]/40 text-xs font-bold text-[#C9F31D] hover:bg-[#C9F31D]/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={13} /> Share
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom nav arrows ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between z-10 px-5 py-4 border-t border-white/10">
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={slideIndex === 0}
            className="p-2.5 rounded-full bg-white/10 text-white disabled:opacity-20 hover:bg-white/20 transition"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setSlideIndex(i); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slideIndex ? 20 : 6,
                  height: 6,
                  backgroundColor: i === slideIndex ? '#C9F31D' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            disabled={slideIndex === totalSlides - 1}
            className="p-2.5 rounded-full bg-white/10 text-white disabled:opacity-20 hover:bg-white/20 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.15); opacity: 1; }
          70%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        .slide-up {
          animation: slideUpFade 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
