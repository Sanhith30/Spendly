// Tiny sound engine using Web Audio API — no external deps
// Plays a coin/cash sound when an expense is added

let _ctx = null;
function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

export function playCoinSound() {
  try {
    const ctx = getCtx();

    // Layer 1: short metallic ping (coin clink)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.12);

    // Layer 2: second higher ping for "cha-ching" feel
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.14);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc2.start(ctx.currentTime + 0.04);
    osc2.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Silently fail if audio not supported
  }
}

export function playDeleteSound() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}

export function playSuccessSound() {
  try {
    const ctx = getCtx();
    // A major chord arpeggio: C5 → E5 → G5
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  } catch (e) {}
}
