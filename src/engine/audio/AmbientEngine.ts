/**
 * Procedural ambient layer — scene-based drones, crossfade, combat/dialogue duck.
 * Uses ambientSounds data definitions + SharedAudioContext.
 */

import {
  AMBIENT_SOUNDS,
  type AmbientSoundType,
  type AmbientSoundDef,
} from '../../data/ambientSounds';
import { getSharedAudioContext } from '../SharedAudioContext';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { releaseBufferSource } from './AudioEngineCore';

/* ─── AmbientSoundPlayer: Procedural Ambient Sound Engine ───
 *  Generates ambient background sounds using Web Audio API oscillators and noise.
 *  Supports:
 *  - Crossfading between ambient types (2s default)
 *  - Muting during combat mode
 *  - Lowering volume when dialogue (visual-novel mode) is active
 *  - Multiple oscillator layers + noise layer + harmonic + random sound events
 */

/** Safely stop an OscillatorNode or AudioBufferSourceNode */
function safeStop(node: OscillatorNode | AudioBufferSourceNode, when?: number): void {
  try {
    if (when !== undefined) {
      node.stop(when);
    } else {
      node.stop();
    }
  } catch {
    // Node already stopped — ignore InvalidStateError
  }
}

/** State for a single playing ambient sound instance */
interface PlayingAmbient {
  /** The type of ambient being played */
  type: AmbientSoundType;
  /** Master gain node for this ambient (used for crossfade) */
  masterGain: GainNode;
  /** Oscillator nodes and their gain nodes */
  oscillators: Array<{
    osc: OscillatorNode;
    gain: GainNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
  }>;
  /** Harmonic oscillator if any */
  harmonicOsc?: OscillatorNode;
  harmonicGain?: GainNode;
  /** Optional looping noise layer (rain, wind, etc.) */
  noiseSource?: AudioBufferSourceNode;
  /** Retained until cleanup so scene change can drop the loop buffer from memory */
  noiseBuffer?: AudioBuffer;
  noiseGain?: GainNode;
  noiseFilter?: BiquadFilterNode;
  noiseLfo?: OscillatorNode;
  noiseLfoGain?: GainNode;
  /** Filter node for the oscillator bus */
  filter: BiquadFilterNode;
  /** Random sound timers */
  randomTimers: Array<ReturnType<typeof setTimeout>>;
  /** Monotonic counter — stale random-sound callbacks are ignored */
  randomSoundGeneration: number;
  /** Scheduled fade-out cleanup timer for this instance */
  fadeOutTimer?: ReturnType<typeof setTimeout>;
  /** Whether this instance is being faded out */
  fadingOut: boolean;
}

export class AmbientSoundPlayer {
  private ctx: AudioContext | null = null;
  private destination: GainNode | null = null;
  private currentAmbient: PlayingAmbient | null = null;
  private currentType: AmbientSoundType | null = null;
  private disposed = false;

  // Volume state
  private baseVolume = 0.7;
  private combatMuted = false;
  private dialogueDucked = false;

  /** Monotonic counter — stale crossfade transitions are ignored */
  private transitionGeneration = 0;

  /** Invalidates in-flight scheduleRandomSound callbacks (dispose / stopAll). */
  private randomScheduleEpoch = 0;

  /** Every setTimeout owned by this player (random events + fade-out cleanup). */
  private pendingScheduledTimers = new Set<ReturnType<typeof setTimeout>>();

  /** All live instances — dispose sweeps even if not current / fading. */
  private activeAmbients = new Set<PlayingAmbient>();

  /** Ambients currently fading out (may still be audible) */
  private fadingAmbients = new Set<PlayingAmbient>();

  /** Initialize the audio context (lazy, called on first play) */
  private initContext(): void {
    if (this.ctx) return;
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      this.destination = this.ctx.createGain();
      this.destination.gain.value = this.baseVolume;
      this.destination.connect(this.ctx.destination);
    }
  }

  /** Resume context if suspended (browser autoplay policy) */
  private resume(): void {
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /** Get the effective volume considering combat mute and dialogue duck */
  private getEffectiveVolume(): number {
    if (this.combatMuted) return 0;
    if (this.dialogueDucked) return this.baseVolume * 0.3;
    return this.baseVolume;
  }

  /**
   * Play an ambient sound type with crossfade transition.
   * @param type — The ambient sound type to play
   * @param crossfadeMs — Duration in ms for the crossfade (0 = instant)
   */
  play(type: AmbientSoundType, crossfadeMs = 2000): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // Same type already playing — no change needed (do not bump transitionGeneration)
    if (this.currentType === type && this.currentAmbient && !this.currentAmbient.fadingOut) {
      return;
    }

    const generation = ++this.transitionGeneration;

    const ctx = this.ctx;
    const dest = this.destination;
    if (!ctx || !dest) return;

    const def = AMBIENT_SOUNDS[type];
    if (!def) return;

    const crossfadeSec = crossfadeMs / 1000;

    // Rapid play() chains leave older crossfades audible — retire them immediately
    this.purgeStaleFadingAmbients();

    // Detach current before fade — rapid play() must not leave `current` on a retiring instance
    const outgoing = this.currentAmbient;
    this.currentAmbient = null;
    this.currentType = null;

    if (outgoing) {
      this.fadeOutAmbient(outgoing, crossfadeSec);
    }

    // ── Create new ambient ──
    const newAmbient = this.createAmbientInstance(def, ctx.currentTime, crossfadeSec);

    if (this.disposed) {
      this.cleanupAmbient(newAmbient);
      return;
    }

    // A newer play() superseded this transition — discard the orphaned instance
    if (generation !== this.transitionGeneration) {
      this.cleanupAmbient(newAmbient);
      return;
    }

    this.currentAmbient = newAmbient;
    this.currentType = type;
  }

  /** Drop orphaned crossfade layers (rapid play() only keeps one outgoing fade). */
  private purgeStaleFadingAmbients(): void {
    for (const stale of [...this.fadingAmbients]) {
      this.cleanupAmbient(stale);
    }
  }

  /** Create and start all nodes for an ambient sound definition */
  private createAmbientInstance(def: AmbientSoundDef, startTime: number, fadeInSec: number): PlayingAmbient {
    const ctx = this.ctx!;
    const dest = this.destination!;
    const now = startTime;

    const instance: PlayingAmbient = {
      type: def.type,
      masterGain: ctx.createGain(),
      oscillators: [],
      filter: ctx.createBiquadFilter(),
      randomTimers: [],
      randomSoundGeneration: 0,
      fadingOut: false,
    };

    // ── Master gain: start at 0, fade in ──
    const effectiveVol = this.getEffectiveVolume();
    instance.masterGain.gain.setValueAtTime(0, now);
    instance.masterGain.gain.linearRampToValueAtTime(effectiveVol, now + fadeInSec);

    // ── Filter ──
    instance.filter.type = 'lowpass';
    instance.filter.frequency.value = def.filterFreq;
    instance.filter.Q.value = 0.7;

    // ── Routing: oscillators → filter → masterGain → destination ──
    instance.filter.connect(instance.masterGain);
    instance.masterGain.connect(dest);

    // ── Create oscillator layers ──
    for (const oscType of def.oscillators) {
      const osc = ctx.createOscillator();
      osc.type = oscType;
      osc.frequency.setValueAtTime(def.baseFrequency, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(def.gain / def.oscillators.length, now);

      // LFO for oscillator
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(def.lfoRate, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(def.lfoDepth, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(oscGain);
      oscGain.connect(instance.filter);

      lfo.start(now);
      osc.start(now);

      instance.oscillators.push({ osc, gain: oscGain, lfo, lfoGain });
    }

    // ── Harmonic ──
    if (def.harmonic) {
      const harmOsc = ctx.createOscillator();
      harmOsc.type = def.harmonic.type;
      harmOsc.frequency.setValueAtTime(def.baseFrequency * def.harmonic.freqMultiplier, now);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(def.harmonic.gain, now);

      harmOsc.connect(harmGain);
      harmGain.connect(instance.filter);

      harmOsc.start(now);

      instance.harmonicOsc = harmOsc;
      instance.harmonicGain = harmGain;
    }

    // ── Noise layer ──
    if (def.noise) {
      const noiseConf = def.noise;
      const bufferSize = Math.ceil(ctx.sampleRate * 4); // 4-second noise buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = noiseConf.filterType;
      noiseFilter.frequency.value = noiseConf.filterFreq;
      noiseFilter.Q.value = noiseConf.filterQ;

      const noiseGainNode = ctx.createGain();
      noiseGainNode.gain.value = noiseConf.gain;

      // Noise LFO on filter
      let noiseLfo: OscillatorNode | undefined;
      let noiseLfoGain: GainNode | undefined;
      if (noiseConf.lfoFreq > 0) {
        noiseLfo = ctx.createOscillator();
        noiseLfo.type = 'sine';
        noiseLfo.frequency.setValueAtTime(noiseConf.lfoFreq, now);

        noiseLfoGain = ctx.createGain();
        noiseLfoGain.gain.setValueAtTime(noiseConf.lfoDepth, now);

        noiseLfo.connect(noiseLfoGain);
        noiseLfoGain.connect(noiseFilter.frequency);

        noiseLfo.start(now);
      }

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGainNode);
      noiseGainNode.connect(instance.filter);

      noiseSource.start(now);

      instance.noiseSource = noiseSource;
      instance.noiseBuffer = buffer;
      instance.noiseGain = noiseGainNode;
      instance.noiseFilter = noiseFilter;
      instance.noiseLfo = noiseLfo;
      instance.noiseLfoGain = noiseLfoGain;
    }

    // ── Random sound events ──
    if (def.randomSounds) {
      for (const rs of def.randomSounds) {
        this.scheduleRandomSound(instance, rs, def);
      }
    }

    this.activeAmbients.add(instance);
    return instance;
  }

  private trackScheduledTimer(timer: ReturnType<typeof setTimeout>): void {
    this.pendingScheduledTimers.add(timer);
  }

  private untrackScheduledTimer(timer: ReturnType<typeof setTimeout>): void {
    this.pendingScheduledTimers.delete(timer);
  }

  /** Cancel every owned timer and invalidate pending random-sound callbacks. */
  private clearAllScheduledTimers(): void {
    this.randomScheduleEpoch++;
    for (const timer of this.pendingScheduledTimers) {
      clearTimeout(timer);
    }
    this.pendingScheduledTimers.clear();
  }

  /** Cancel all pending random-sound timers for an instance */
  private clearRandomTimers(ambient: PlayingAmbient): void {
    ambient.randomSoundGeneration++;
    for (const timer of ambient.randomTimers) {
      clearTimeout(timer);
      this.untrackScheduledTimer(timer);
    }
    ambient.randomTimers = [];
  }

  /** Schedule a random sound event at a random interval */
  private scheduleRandomSound(
    instance: PlayingAmbient,
    rs: NonNullable<AmbientSoundDef['randomSounds']>[number],
    _def: AmbientSoundDef,
  ): void {
    if (this.disposed || instance.fadingOut) return;

    const capturedEpoch = this.randomScheduleEpoch;
    const capturedGen = instance.randomSoundGeneration;
    const interval =
      rs.minInterval + Math.random() * (rs.maxInterval - rs.minInterval);

    const timer = setTimeout(() => {
      this.untrackScheduledTimer(timer);
      const idx = instance.randomTimers.indexOf(timer);
      if (idx !== -1) instance.randomTimers.splice(idx, 1);

      if (this.disposed || instance.fadingOut) return;
      if (capturedEpoch !== this.randomScheduleEpoch) return;
      if (this.currentAmbient !== instance) return;
      if (capturedGen !== instance.randomSoundGeneration) return;

      this.playRandomSound(rs);
      this.scheduleRandomSound(instance, rs, _def);
    }, interval * 1000);

    instance.randomTimers.push(timer);
    this.trackScheduledTimer(timer);
  }

  /** Play a single random sound event */
  private playRandomSound(rs: NonNullable<AmbientSoundDef['randomSounds']>[number]): void {
    if (this.disposed) return;

    const ctx = this.ctx;
    const dest = this.destination;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = rs.type;
    osc.frequency.setValueAtTime(rs.frequency, now);

    if (rs.frequencyRamp) {
      osc.frequency.linearRampToValueAtTime(rs.frequencyRamp, now + rs.duration);
    }

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(rs.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + rs.duration);

    osc.connect(envGain);
    envGain.connect(dest);

    osc.start(now);
    safeStop(osc, now + rs.duration + 0.01);
  }

  /** Fade out an ambient instance and clean it up */
  private fadeOutAmbient(ambient: PlayingAmbient, durationSec: number): void {
    if (ambient.fadingOut) {
      this.cleanupAmbient(ambient);
      return;
    }

    const ctx = this.ctx;
    if (!ctx) {
      this.cleanupAmbient(ambient);
      return;
    }

    ambient.fadingOut = true;
    this.fadingAmbients.add(ambient);
    this.clearRandomTimers(ambient);

    const now = ctx.currentTime;

    if (durationSec <= 0) {
      try {
        ambient.masterGain.gain.setValueAtTime(0, now);
      } catch {
        // Gain may already be at 0
      }
      this.cleanupAmbient(ambient);
      return;
    }

    try {
      ambient.masterGain.gain.setValueAtTime(ambient.masterGain.gain.value, now);
      ambient.masterGain.gain.linearRampToValueAtTime(0, now + durationSec);
    } catch {
      // Gain may already be at 0
    }

    if (ambient.fadeOutTimer) {
      clearTimeout(ambient.fadeOutTimer);
      this.untrackScheduledTimer(ambient.fadeOutTimer);
    }

    const fadeTimer = setTimeout(() => {
      ambient.fadeOutTimer = undefined;
      this.untrackScheduledTimer(fadeTimer);
      if (this.disposed) return;
      this.cleanupAmbient(ambient);
    }, (durationSec + 0.5) * 1000);
    ambient.fadeOutTimer = fadeTimer;
    this.trackScheduledTimer(fadeTimer);
  }

  /** Stop and disconnect all nodes for an ambient instance */
  private cleanupAmbient(ambient: PlayingAmbient): void {
    this.activeAmbients.delete(ambient);
    this.fadingAmbients.delete(ambient);
    this.clearRandomTimers(ambient);

    // Stop oscillators
    for (const oscLayer of ambient.oscillators) {
      try { oscLayer.osc.stop(); } catch { /* already stopped */ }
      try { oscLayer.gain.disconnect(); } catch { /* ignore */ }
      if (oscLayer.lfo) {
        try { oscLayer.lfo.stop(); } catch { /* already stopped */ }
      }
      if (oscLayer.lfoGain) {
        try { oscLayer.lfoGain.disconnect(); } catch { /* ignore */ }
      }
    }

    // Stop harmonic
    if (ambient.harmonicOsc) {
      try { ambient.harmonicOsc.stop(); } catch { /* already stopped */ }
    }
    if (ambient.harmonicGain) {
      try { ambient.harmonicGain.disconnect(); } catch { /* ignore */ }
    }

    // Stop noise layer and release its loop buffer
    if (ambient.noiseSource) {
      releaseBufferSource(ambient.noiseSource);
      ambient.noiseSource = undefined;
    }
    ambient.noiseBuffer = undefined;
    if (ambient.noiseGain) {
      try { ambient.noiseGain.disconnect(); } catch { /* ignore */ }
    }
    if (ambient.noiseFilter) {
      try { ambient.noiseFilter.disconnect(); } catch { /* ignore */ }
    }
    if (ambient.noiseLfo) {
      try { ambient.noiseLfo.stop(); } catch { /* already stopped */ }
    }
    if (ambient.noiseLfoGain) {
      try { ambient.noiseLfoGain.disconnect(); } catch { /* ignore */ }
    }

    // Disconnect filter and master gain
    try { ambient.filter.disconnect(); } catch { /* ignore */ }
    try { ambient.masterGain.disconnect(); } catch { /* ignore */ }

    if (ambient.fadeOutTimer) {
      clearTimeout(ambient.fadeOutTimer);
      this.untrackScheduledTimer(ambient.fadeOutTimer);
      ambient.fadeOutTimer = undefined;
    }

    if (this.currentAmbient === ambient) {
      this.currentAmbient = null;
      this.currentType = null;
    }
  }

  /** Stop all ambient sounds immediately */
  stopAll(): void {
    if (this.disposed) return;
    this.doStopAll();
  }

  private doStopAll(): void {
    ++this.transitionGeneration;
    this.clearAllScheduledTimers();

    for (const ambient of [...this.activeAmbients]) {
      this.cleanupAmbient(ambient);
    }
    this.activeAmbients.clear();
    this.fadingAmbients.clear();
    this.currentAmbient = null;
    this.currentType = null;
  }

  /** Set combat mute state */
  setCombatMuted(muted: boolean): void {
    if (this.disposed) return;
    this.combatMuted = muted;
    this.applyVolume();
  }

  /** Set dialogue duck state */
  setDialogueDucked(ducked: boolean): void {
    if (this.disposed) return;
    this.dialogueDucked = ducked;
    this.applyVolume();
  }

  /** Set the base volume (0–1) */
  setVolume(vol: number): void {
    if (this.disposed) return;
    this.baseVolume = Math.max(0, Math.min(1, vol));
    this.applyVolume();
  }

  /** Apply the effective volume to the current ambient's master gain */
  private applyVolume(): void {
    if (this.disposed || !this.currentAmbient || !this.ctx) return;

    const effectiveVol = this.getEffectiveVolume();
    const now = this.ctx.currentTime;

    try {
      this.currentAmbient.masterGain.gain.setValueAtTime(
        this.currentAmbient.masterGain.gain.value,
        now,
      );
      this.currentAmbient.masterGain.gain.linearRampToValueAtTime(effectiveVol, now + 0.3);
    } catch {
      // Gain node may have been disconnected
    }
  }

  /** Get the currently playing ambient type */
  getCurrentType(): AmbientSoundType | null {
    if (this.disposed) return null;
    return this.currentType;
  }

  /** Dispose of all resources */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.doStopAll();

    if (this.destination) {
      try { this.destination.disconnect(); } catch { /* ignore */ }
      this.destination = null;
    }
    this.ctx = null; // Release reference to shared context (don't close it)
  }

  /** Re-arm after orchestrator remount (React StrictMode). */
  revive(): void {
    this.disposed = false;
  }
}

/* ─── Singleton ambient player ─── */
let ambientPlayerInstance: AmbientSoundPlayer | null = null;

export function getAmbientPlayer(): AmbientSoundPlayer {
  if (!ambientPlayerInstance) {
    ambientPlayerInstance = new AmbientSoundPlayer();
  }
  return ambientPlayerInstance;
}

export function disposeAmbientEngine(): void {
  if (!ambientPlayerInstance) return;
  ambientPlayerInstance.dispose();
  ambientPlayerInstance = null;
}

export function reviveAmbientEngine(): void {
  if (ambientPlayerInstance) {
    ambientPlayerInstance.revive();
  }
}

registerHmrDispose(disposeAmbientEngine);

export type { AmbientSoundType };

/**
 * HMR-safe facade — always forwards to the current singleton instance.
 * (A bare `const x = getAmbientPlayer()` would pin a disposed instance after hot reload.)
 */
export const ambientEngine: AmbientSoundPlayer = new Proxy({} as AmbientSoundPlayer, {
  get(_target, prop) {
    const instance = getAmbientPlayer();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});
