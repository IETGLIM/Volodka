/* ─── Volodka RPG – typewriter keystroke SFX ───
 * Short percussive "key strike" used by the cinematic intro when poem letters
 * lock into place. Self-contained on the shared AudioContext so it never opens
 * a second context (Chrome caps simultaneous contexts at ~6).
 *
 * Silent until the context is running (i.e. after the first user gesture), so
 * it never throws on autoplay-policy-blocked contexts.
 */

import { getSharedAudioContext } from '@/engine/SharedAudioContext';

let lastStrikeAt = 0;

/**
 * Play a single mechanical typewriter key strike.
 * @param volume 0..1 master gain for this strike (default 0.06)
 */
export function playTypewriterKey(volume = 0.06): void {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  // Throttle: avoid stacking nodes if called faster than ~25ms apart.
  if (now - lastStrikeAt < 0.02) return;
  lastStrikeAt = now;

  try {
    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, volume));
    master.connect(ctx.destination);

    // ── Body: short square "clack" with slight random pitch ──
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1500 + Math.random() * 600, now);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(1, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    osc.connect(oscGain);
    oscGain.connect(master);

    // ── Click transient: very short filtered noise burst for "snap" ──
    const noiseLen = Math.floor(ctx.sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2600;
    bandpass.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.5;
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(master);

    osc.start(now);
    osc.stop(now + 0.06);
    noise.start(now);
    noise.stop(now + 0.025);

    const cleanup = () => {
      try {
        osc.disconnect();
        oscGain.disconnect();
        noise.disconnect();
        bandpass.disconnect();
        noiseGain.disconnect();
        master.disconnect();
      } catch {
        /* already torn down */
      }
    };
    osc.onended = cleanup;
  } catch {
    /* audio unavailable — fail silent */
  }
}

/**
 * Play a soft "carriage return" swell — a gentle low whoosh for line breaks.
 * @param volume 0..1 (default 0.05)
 */
export function playTypewriterReturn(volume = 0.05): void {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
    osc.onended = () => {
      try {
        osc.disconnect();
        g.disconnect();
      } catch {
        /* already torn down */
      }
    };
  } catch {
    /* fail silent */
  }
}
