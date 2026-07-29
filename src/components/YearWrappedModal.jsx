import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Trophy, Sparkles, TrendingUp, Calendar, Zap, Share2, Award, HeartHandshake } from 'lucide-react';
import { playSuccessSound } from '../utils/sounds';
import { CATEGORY_ICONS } from './ExpenseFormModal';

export default function YearWrappedModal({ expenses, currency, income, onClose, getCategoryMeta }) {
  const currentYear = new Date().getFullYear();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    playSuccessSound();
  }, []);

  // Compute Year Statistics
  const stats = useMemo(() => {
    const yearExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear;
    });

    const totalSpent = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCount = yearExpenses.length;

    // Category breakdown
    const catTotals = {};
    yearExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    const topCategoryName = Object.keys(catTotals).reduce(
      (max, cat) => (catTotals[cat] > (catTotals[max] || 0) ? cat : max),
      Object.keys(catTotals)[0] || 'Other'
    );
    const topCategoryAmount = catTotals[topCategoryName] || 0;
    const topCategoryPct = totalSpent ? Math.round((topCategoryAmount / totalSpent) * 100) : 0;

    // Highest spending day
    const dayTotals = {};
    yearExpenses.forEach((e) => {
      dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount;
    });

    let highestDateStr = '';
    let highestDayAmount = 0;
    Object.entries(dayTotals).forEach(([dateStr, amt]) => {
      if (amt > highestDayAmount) {
        highestDayAmount = amt;
        highestDateStr = dateStr;
      }
    });

    // Formatting highest day date
    let highestDateFormatted = 'N/A';
    if (highestDateStr) {
      const d = new Date(highestDateStr);
      highestDateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Estimated Savings
    const annualIncome = income * 12;
    const estimatedSaved = Math.max(0, annualIncome - totalSpent);

    // Financial Personality Badge Logic
    let badge = 'Smart Saver';
    let badgeEmoji = '🥷';
    let badgeDesc = 'You keep a close eye on every penny and master your cashflow.';

    if (topCategoryName === 'Tea' || topCategoryName === 'Breakfast') {
      badge = 'Caffeine & Morning Lover';
      badgeEmoji = '☕';
      badgeDesc = 'Your day starts with good food & rich morning brews!';
    } else if (topCategoryName === 'Lunch' || topCategoryName === 'Dinner') {
      badge = 'Feast Master';
      badgeEmoji = '🍔';
      badgeDesc = 'Good food is your ultimate wealth investment.';
    } else if (estimatedSaved > totalSpent) {
      badge = 'Wealth Ninja';
      badgeEmoji = '🚀';
      badgeDesc = 'You save more than you spend! Exponential growth ahead.';
    } else if (totalCount > 50) {
      badge = 'Log Champion';
      badgeEmoji = '⚡';
      badgeDesc = 'Ultimate consistency! You track every single transaction.';
    }

    return {
      totalSpent,
      totalCount,
      topCategoryName,
      topCategoryAmount,
      topCategoryPct,
      highestDateFormatted,
      highestDayAmount,
      estimatedSaved,
      badge,
      badgeEmoji,
      badgeDesc,
      catTotals
    };
  }, [expenses, income, currentYear]);

  const totalSlides = 5;

  // Auto-advance timer (5 seconds per slide)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (slideIndex < totalSlides - 1) {
        setSlideIndex((prev) => prev + 1);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [slideIndex]);

  const TopIcon = CATEGORY_ICONS[stats.topCategoryName] || Trophy;
  const topMeta = getCategoryMeta ? getCategoryMeta(stats.topCategoryName) : { color: '#C9F31D' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 fade-in">
      {/* Story Card Container */}
      <div
        className="relative w-full max-w-md h-[680px] rounded-3xl overflow-hidden flex flex-col justify-between p-6 text-white shadow-2xl border border-white/10"
        style={{
          background:
            slideIndex === 0
              ? 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)'
              : slideIndex === 1
              ? 'linear-gradient(145deg, #180e29 0%, #3b0764 50%, #581c87 100%)'
              : slideIndex === 2
              ? 'linear-gradient(145deg, #022c22 0%, #065f46 50%, #047857 100%)'
              : slideIndex === 3
              ? 'linear-gradient(145deg, #1e1b4b 0%, #3730a3 50%, #4338ca 100%)'
              : 'linear-gradient(145deg, #1c1917 0%, #451a03 50%, #78350f 100%)',
          transition: 'background 0.6s ease',
        }}
      >
        {/* Top Progress Bars */}
        <div className="flex gap-1.5 z-10">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: idx < slideIndex ? '100%' : idx === slideIndex ? '100%' : '0%',
                  transitionDuration: idx === slideIndex ? '6s' : '0.3s',
                  transitionTimingFunction: 'linear',
                }}
              />
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-10 right-6 z-20 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col justify-center my-auto z-10 py-6">
          {/* SLIDE 0: Annual Intro */}
          {slideIndex === 0 && (
            <div className="space-y-6 text-center slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-mono font-bold tracking-wider">
                <Sparkles size={14} className="text-[#C9F31D]" /> {currentYear} WRAPPED
              </div>
              <h2 className="text-4xl font-black tracking-tight leading-tight">
                Your Year in Money
              </h2>
              <div className="py-6">
                <p className="text-xs uppercase tracking-widest text-white/60 font-semibold mb-2">Total Logged Spend</p>
                <p className="text-5xl font-black font-mono tracking-tight text-[#C9F31D]">
                  {currency}{stats.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <p className="text-sm text-white/80 font-medium max-w-xs mx-auto">
                You logged <strong className="text-white font-mono">{stats.totalCount} transactions</strong> throughout the year. Let's see your story!
              </p>
            </div>
          )}

          {/* SLIDE 1: Top Category */}
          {slideIndex === 1 && (
            <div className="space-y-6 text-center slide-up">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">
                👑 Top Category Champion
              </span>
              <div className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center bg-white/10 border border-white/20 shadow-2xl backdrop-blur-md">
                <TopIcon size={44} style={{ color: topMeta.color || '#C9F31D' }} />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight">{stats.topCategoryName}</h3>
                <p className="text-4xl font-black font-mono text-[#C9F31D] mt-2">
                  {currency}{stats.topCategoryAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <span className="inline-block mt-3 text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-full text-purple-200">
                  {stats.topCategoryPct}% of total annual spending
                </span>
              </div>
            </div>
          )}

          {/* SLIDE 2: Peak Spending Day */}
          {slideIndex === 2 && (
            <div className="space-y-6 text-center slide-up">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-300 font-bold">
                📈 Biggest Spending Spree
              </span>
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                <Calendar size={40} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-200">Your highest day was</p>
                <h3 className="text-2xl font-black tracking-tight text-white mt-1">
                  {stats.highestDateFormatted}
                </h3>
                <p className="text-4xl font-black font-mono text-[#C9F31D] mt-3">
                  {currency}{stats.highestDayAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 3: Savings Estimate */}
          {slideIndex === 3 && (
            <div className="space-y-6 text-center slide-up">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold">
                💰 Estimated Wealth Saved
              </span>
              <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <TrendingUp size={40} />
              </div>
              <div>
                <p className="text-xs text-indigo-200 uppercase font-semibold tracking-wider mb-1">Annual Surplus Reserve</p>
                <p className="text-4xl font-black font-mono text-[#C9F31D]">
                  {currency}{stats.estimatedSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-white/70 mt-3 max-w-xs mx-auto">
                  Based on your monthly income configuration vs logged expenses.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 4: Personality Badge */}
          {slideIndex === 4 && (
            <div className="space-y-5 text-center slide-up">
              <div className="text-6xl animate-bounce">{stats.badgeEmoji}</div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
                  🏆 Your Financial Persona
                </span>
                <h3 className="text-3xl font-black text-amber-200 tracking-tight mt-1">
                  {stats.badge}
                </h3>
                <p className="text-xs text-white/80 mt-2 max-w-xs mx-auto leading-relaxed">
                  {stats.badgeDesc}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-white/90">
                <p className="font-bold">Keep crushing your wealth goals in {currentYear + 1}! 🚀</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="flex items-center justify-between z-10 pt-4 border-t border-white/10">
          <button
            onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={slideIndex === 0}
            className="p-2.5 rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-mono font-bold text-white/70">
            {slideIndex + 1} / {totalSlides}
          </span>
          <button
            onClick={() => setSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
            disabled={slideIndex === totalSlides - 1}
            className="p-2.5 rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
