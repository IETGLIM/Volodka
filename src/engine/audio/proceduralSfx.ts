/**
 * Fire-and-forget procedural one-shots (UI, doors, combat cues, stingers).
 * Stateless — callers supply AudioContext + destination bus.
 */

import type { FootstepConfig, SfxConfig } from './types';
import { safeStop } from './types';
import { SFX_PRESETS, FOOTSTEP_PRESETS } from './sfxPresets';
import { createDecayedNoiseBuffer, fillWhiteNoise } from './audioNoiseBuffers';

export type StingerType = 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery';

export function synthesizeSfx(
  ctx: AudioContext,
  dest: AudioNode,
  type: string,
): void {
  const preset: SfxConfig = SFX_PRESETS[type] ?? SFX_PRESETS['click'];
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = preset.type;
  osc.frequency.setValueAtTime(preset.frequency, now);

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(preset.gain, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

  osc.connect(envGain);
  envGain.connect(dest);

  osc.start(now);
  safeStop(osc, now + preset.duration + 0.01);
}

export function synthesizeFootstep(
  ctx: AudioContext,
  dest: AudioNode,
  material?: string,
): void {
  const preset: FootstepConfig =
    FOOTSTEP_PRESETS[material ?? 'default'] ?? FOOTSTEP_PRESETS['default'];
  const now = ctx.currentTime;

  const bufferSize = Math.ceil(ctx.sampleRate * preset.noiseDuration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 12);
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = preset.filterType;
  filter.frequency.value = preset.baseFreq;
  filter.Q.value = preset.filterQ;

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(preset.gain, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.noiseDuration);

  noiseSource.connect(filter);
  filter.connect(envGain);
  envGain.connect(dest);

  noiseSource.start(now);

  if (preset.clickFreq > 0) {
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(
      preset.clickFreq * (0.9 + Math.random() * 0.2),
      now,
    );

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(preset.clickGain, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);

    clickOsc.start(now);
    safeStop(clickOsc, now + 0.05);
  }
}

export function synthesizeDoorOpen(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;

  const creakOsc = ctx.createOscillator();
  creakOsc.type = 'sawtooth';
  creakOsc.frequency.setValueAtTime(120, now);
  creakOsc.frequency.exponentialRampToValueAtTime(350, now + 0.25);

  const creakGain = ctx.createGain();
  creakGain.gain.setValueAtTime(0.08, now);
  creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  creakOsc.connect(creakGain);
  creakGain.connect(dest);
  creakOsc.start(now);
  safeStop(creakOsc, now + 0.35);

  const thudBuffer = createDecayedNoiseBuffer(ctx, 0.1, 20);
  const thudSource = ctx.createBufferSource();
  thudSource.buffer = thudBuffer;

  const thudFilter = ctx.createBiquadFilter();
  thudFilter.type = 'lowpass';
  thudFilter.frequency.value = 200;

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.15, now + 0.15);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  thudSource.connect(thudFilter);
  thudFilter.connect(thudGain);
  thudGain.connect(dest);
  thudSource.start(now + 0.15);
}

export function synthesizeDoorClose(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;

  const slamBuffer = createDecayedNoiseBuffer(ctx, 0.06, 30);
  const slamSource = ctx.createBufferSource();
  slamSource.buffer = slamBuffer;

  const slamFilter = ctx.createBiquadFilter();
  slamFilter.type = 'lowpass';
  slamFilter.frequency.value = 150;

  const slamGain = ctx.createGain();
  slamGain.gain.setValueAtTime(0.2, now);
  slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  slamSource.connect(slamFilter);
  slamFilter.connect(slamGain);
  slamGain.connect(dest);
  slamSource.start(now);

  const clickOsc = ctx.createOscillator();
  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(900, now + 0.08);

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.12, now + 0.08);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  clickOsc.connect(clickGain);
  clickGain.connect(dest);
  clickOsc.start(now + 0.08);
  safeStop(clickOsc, now + 0.15);
}

export function synthesizeLevelUp(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, i) => {
    const delay = i * 0.1;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0, now + delay);
    envGain.gain.linearRampToValueAtTime(0.18, now + delay + 0.03);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(freq * 2, now + delay);

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now + delay);
    shimmerGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

    osc.connect(envGain);
    envGain.connect(dest);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(dest);

    osc.start(now + delay);
    safeStop(osc, now + delay + 0.6);
    shimmer.start(now + delay);
    safeStop(shimmer, now + delay + 0.5);
  });
}

export function synthesizePoemCollect(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;
  const chimeFreqs = [1318.5, 1567.98, 2093.0];

  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.3;
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.15;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.4;

  reverbGain.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(dest);
  reverbGain.connect(dest);

  chimeFreqs.forEach((freq, i) => {
    const delayTime = i * 0.15;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delayTime);

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0, now + delayTime);
    envGain.gain.linearRampToValueAtTime(0.15, now + delayTime + 0.02);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + delayTime + 1.2);

    osc.connect(envGain);
    envGain.connect(reverbGain);

    osc.start(now + delayTime);
    safeStop(osc, now + delayTime + 1.5);
  });

  setTimeout(() => {
    try { reverbGain.disconnect(); } catch { /* ignore */ }
    try { delay.disconnect(); } catch { /* ignore */ }
    try { feedback.disconnect(); } catch { /* ignore */ }
  }, 3000);
}

export function synthesizeQuestComplete(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;
  const notes = [
    { freq: 261.63, time: 0, dur: 0.3 },
    { freq: 349.23, time: 0.2, dur: 0.3 },
    { freq: 392.0, time: 0.4, dur: 0.5 },
    { freq: 523.25, time: 0.5, dur: 0.6 },
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    const harm = ctx.createOscillator();
    harm.type = 'triangle';
    harm.frequency.setValueAtTime(freq * 2, now + time);

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0, now + time);
    envGain.gain.linearRampToValueAtTime(0.2, now + time + 0.02);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0, now + time);
    harmGain.gain.linearRampToValueAtTime(0.06, now + time + 0.02);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur * 0.8);

    osc.connect(envGain);
    envGain.connect(dest);
    harm.connect(harmGain);
    harmGain.connect(dest);

    osc.start(now + time);
    safeStop(osc, now + time + dur + 0.1);
    harm.start(now + time);
    safeStop(harm, now + time + dur + 0.1);
  });
}

export function synthesizeDamage(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;

  const thudBuffer = createDecayedNoiseBuffer(ctx, 0.08, 25);
  const thudSource = ctx.createBufferSource();
  thudSource.buffer = thudBuffer;

  const thudFilter = ctx.createBiquadFilter();
  thudFilter.type = 'lowpass';
  thudFilter.frequency.value = 300;

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.25, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  thudSource.connect(thudFilter);
  thudFilter.connect(thudGain);
  thudGain.connect(dest);
  thudSource.start(now);

  const stingOsc = ctx.createOscillator();
  stingOsc.type = 'sawtooth';
  stingOsc.frequency.setValueAtTime(800, now);
  stingOsc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

  const stingGain = ctx.createGain();
  stingGain.gain.setValueAtTime(0.1, now);
  stingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  stingOsc.connect(stingGain);
  stingGain.connect(dest);
  stingOsc.start(now);
  safeStop(stingOsc, now + 0.25);
}

export function synthesizeHeal(ctx: AudioContext, dest: AudioNode): void {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];

  notes.forEach((freq, i) => {
    const delay = i * 0.12;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0, now + delay);
    envGain.gain.linearRampToValueAtTime(0.12, now + delay + 0.05);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

    const vibrato = ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5, now + delay);

    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = 3;

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    osc.connect(envGain);
    envGain.connect(dest);

    osc.start(now + delay);
    safeStop(osc, now + delay + 1);
    vibrato.start(now + delay);
    safeStop(vibrato, now + delay + 1);
  });
}

export function synthesizeStinger(
  ctx: AudioContext,
  dest: AudioNode,
  type: StingerType,
): void {
  const now = ctx.currentTime;

  switch (type) {
    case 'tension': {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 2);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      envGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 2;

      const noiseSize = Math.ceil(ctx.sampleRate * 2);
      const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
      fillWhiteNoise(noiseBuffer.getChannelData(0), 0.5);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 400;
      noiseFilter.Q.value = 1;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.5);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

      osc.connect(filter);
      filter.connect(envGain);
      envGain.connect(dest);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);

      osc.start(now);
      safeStop(osc, now + 2.3);
      noiseSource.start(now);
      break;
    }
    case 'discovery': {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const delay = i * 0.15;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0, now + delay);
        envGain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(freq * 2, now + delay);

        const shimmerGain = ctx.createGain();
        shimmerGain.gain.setValueAtTime(0, now + delay);
        shimmerGain.gain.linearRampToValueAtTime(0.04, now + delay + 0.03);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

        osc.connect(envGain);
        envGain.connect(dest);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(dest);

        osc.start(now + delay);
        safeStop(osc, now + delay + 0.9);
        shimmer.start(now + delay);
        safeStop(shimmer, now + delay + 0.7);
      });
      break;
    }
    case 'danger': {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 1);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0.15, now);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(envGain);
      envGain.connect(dest);
      osc.start(now);
      safeStop(osc, now + 1.3);

      const burstBuffer = createDecayedNoiseBuffer(ctx, 0.15, 10);
      const burstSource = ctx.createBufferSource();
      burstSource.buffer = burstBuffer;

      const burstFilter = ctx.createBiquadFilter();
      burstFilter.type = 'lowpass';
      burstFilter.frequency.value = 500;

      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(0.2, now);

      burstSource.connect(burstFilter);
      burstFilter.connect(burstGain);
      burstGain.connect(dest);
      burstSource.start(now);
      break;
    }
    case 'emotional': {
      const chordFreqs = [220, 277.18, 329.63];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(0.1, now + 1.5);
        envGain.gain.setValueAtTime(0.1, now + 2);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

        osc.connect(envGain);
        envGain.connect(dest);
        osc.start(now);
        safeStop(osc, now + 3.1);
      });
      break;
    }
    case 'mystery': {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, now);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(223, now);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      envGain.gain.setValueAtTime(0.12, now + 1.5);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc1.connect(envGain);
      osc2.connect(envGain);
      envGain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      safeStop(osc1, now + 2.3);
      safeStop(osc2, now + 2.3);
      break;
    }
  }
}
