// Tiny sound engine using Web Audio API — no external deps

let _ctx = null;
function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

function note(ctx, freq, start, dur, vol = 0.1, type = 'sine') {
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.start(start); o.stop(start + dur + 0.02);
  } catch (e) {}
}

export function playCoinSound() {
  try {
    const ctx = getCtx();
    note(ctx, 1200, ctx.currentTime,       0.10, 0.18);
    note(ctx, 1600, ctx.currentTime + 0.04, 0.12, 0.12);
  } catch (e) {}
}

export function playDeleteSound() {
  try {
    const ctx = getCtx();
    note(ctx, 400, ctx.currentTime, 0.15, 0.1, 'sine');
  } catch (e) {}
}

export function playSuccessSound() {
  try {
    const ctx = getCtx();
    [523, 659, 784].forEach((f, i) => note(ctx, f, ctx.currentTime + i * 0.06, 0.25, 0.09));
  } catch (e) {}
}

// ── Wrapped per-slide sounds ──────────────────────────────────────────────────

/** Slide 0: big opening rising sweep + sparkle */
export function playWrappedIntroSound() {
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.55);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.65);
    [900, 1100, 1400].forEach((f, i) => note(ctx, f, ctx.currentTime + 0.4 + i * 0.07, 0.2, 0.07));
  } catch (e) {}
}

/** Slide 1: trophy chime arpeggio */
export function playTrophySound() {
  try {
    const ctx = getCtx();
    [880, 1108, 1320, 1760].forEach((f, i) => note(ctx, f, ctx.currentTime + i * 0.09, 0.4, 0.1));
  } catch (e) {}
}

/** Slide 2: cash register cha-ching */
export function playCashRegisterSound() {
  try {
    const ctx = getCtx();
    [1047, 1319].forEach((f, i) => note(ctx, f, ctx.currentTime + i * 0.05, 0.35, 0.15, 'triangle'));
    // Short noise burst (drawer)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.05;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gn = ctx.createGain(); gn.gain.value = 0.25;
    src.connect(gn); gn.connect(ctx.destination);
    src.start(ctx.currentTime + 0.1);
  } catch (e) {}
}

/** Slide 3: sparkly coins shimmer */
export function playCoinsShimmerSound() {
  try {
    const ctx = getCtx();
    for (let i = 0; i < 7; i++) {
      const f = 800 + Math.random() * 700;
      note(ctx, f, ctx.currentTime + i * 0.055, 0.18, 0.06);
    }
  } catch (e) {}
}

/** Slide 4: level-up scale + final chord */
export function playFanfareSound() {
  try {
    const ctx = getCtx();
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) =>
      note(ctx, f, ctx.currentTime + i * 0.05, 0.18, 0.06, 'square')
    );
    [523, 659, 784].forEach(f => note(ctx, f, ctx.currentTime + 0.48, 0.6, 0.1));
  } catch (e) {}
}

/** Slide 5: category donut whoosh */
export function playWhooshSound() {
  try {
    const ctx = getCtx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(700, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

/** Slide 6: heartbeat pulse (days tracked) */
export function playHeartbeatSound() {
  try {
    const ctx = getCtx();
    [[80, 0], [95, 0.13], [80, 0.5], [95, 0.63]].forEach(([f, d]) =>
      note(ctx, f, ctx.currentTime + d, 0.1, 0.15)
    );
  } catch (e) {}
}

/** Final badge slide: epic boom + arpeggio */
export function playEpicRevealSound() {
  try {
    const ctx = getCtx();
    // Low boom
    const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
    o1.connect(g1); g1.connect(ctx.destination);
    o1.type = 'sine';
    o1.frequency.setValueAtTime(65, ctx.currentTime);
    o1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
    g1.gain.setValueAtTime(0.22, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o1.start(ctx.currentTime); o1.stop(ctx.currentTime + 0.55);
    // Sparkle arpeggio
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      note(ctx, f, ctx.currentTime + 0.1 + i * 0.08, 0.35, 0.09)
    );
  } catch (e) {}
}
