'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { musicEngine } from '@/engine/MusicEngine';
import { audioEngine } from '@/engine/AudioEngine';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import {
  getAmbienceForScene,
  getAmbientTransitionDuration,
  AMBIENT_SOUNDS,
  type AmbientSoundType,
  type AmbientSoundDef,
} from '@/data/ambientSounds';
import { getSharedAudioContext } from '@/engine/SharedAudioContext';

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
  /** Noise layer nodes */
  noiseSource?: AudioBufferSourceNode;
  noiseGain?: GainNode;
  noiseFilter?: BiquadFilterNode;
  noiseLfo?: OscillatorNode;
  noiseLfoGain?: GainNode;
  /** Filter node for the oscillator bus */
  filter: BiquadFilterNode;
  /** Random sound timers */
  randomTimers: Array<ReturnType<typeof setTimeout>>;
  /** Whether this instance is being faded out */
  fadingOut: boolean;
}

class AmbientSoundPlayer {
  private ctx: AudioContext | null = null;
  private destination: GainNode | null = null;
  private currentAmbient: PlayingAmbient | null = null;
  private previousAmbient: PlayingAmbient | null = null;
  private currentType: AmbientSoundType | null = null;
  private disposed = false;

  // Volume state
  private baseVolume = 0.7;
  private combatMuted = false;
  private dialogueDucked = false;

  // Crossfade timer
  private crossfadeTimer: ReturnType<typeof setTimeout> | null = null;

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

    // Same type already playing — no change needed
    if (this.currentType === type && this.currentAmbient && !this.currentAmbient.fadingOut) {
      return;
    }

    const ctx = this.ctx;
    const dest = this.destination;
    if (!ctx || !dest) return;

    const def = AMBIENT_SOUNDS[type];
    if (!def) return;

    const now = ctx.currentTime;
    const crossfadeSec = crossfadeMs / 1000;

    // ── Fade out current ambient ──
    if (this.currentAmbient) {
      this.fadeOutAmbient(this.currentAmbient, crossfadeSec);
    }

    // ── Create new ambient ──
    const newAmbient = this.createAmbientInstance(def, now, crossfadeSec);
    this.currentAmbient = newAmbient;
    this.currentType = type;
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

    return instance;
  }

  /** Schedule a random sound event at a random interval */
  private scheduleRandomSound(
    instance: PlayingAmbient,
    rs: NonNullable<AmbientSoundDef['randomSounds']>[number],
    _def: AmbientSoundDef,
  ): void {
    if (this.disposed) return;

    const interval =
      rs.minInterval + Math.random() * (rs.maxInterval - rs.minInterval);

    const timer = setTimeout(() => {
      if (this.disposed || instance.fadingOut) return;
      if (this.currentAmbient !== instance) return; // Instance was replaced

      this.playRandomSound(rs);

      // Schedule next occurrence
      this.scheduleRandomSound(instance, rs, _def);
    }, interval * 1000);

    instance.randomTimers.push(timer);
  }

  /** Play a single random sound event */
  private playRandomSound(rs: NonNullable<AmbientSoundDef['randomSounds']>[number]): void {
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
    const ctx = this.ctx;
    if (!ctx) {
      this.cleanupAmbient(ambient);
      return;
    }

    ambient.fadingOut = true;

    // Clear random timers
    for (const timer of ambient.randomTimers) {
      clearTimeout(timer);
    }
    ambient.randomTimers = [];

    // Fade out master gain
    const now = ctx.currentTime;
    try {
      ambient.masterGain.gain.setValueAtTime(ambient.masterGain.gain.value, now);
      ambient.masterGain.gain.linearRampToValueAtTime(0, now + durationSec);
    } catch {
      // Gain may already be at 0
    }

    // Schedule cleanup after fade
    const timer = setTimeout(() => {
      this.cleanupAmbient(ambient);
    }, (durationSec + 0.5) * 1000);

    // Track for cleanup
    if (this.previousAmbient && this.previousAmbient !== ambient) {
      // Clean up any older previous ambient
      this.cleanupAmbient(this.previousAmbient);
    }
    this.previousAmbient = ambient;

    // Clear crossfade timer if exists
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
    }
    this.crossfadeTimer = timer;
  }

  /** Stop and disconnect all nodes for an ambient instance */
  private cleanupAmbient(ambient: PlayingAmbient): void {
    // Clear random timers
    for (const timer of ambient.randomTimers) {
      clearTimeout(timer);
    }

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

    // Stop noise layer
    if (ambient.noiseSource) {
      try { ambient.noiseSource.stop(); } catch { /* already stopped */ }
    }
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

    // Clear reference if this is the previous ambient
    if (this.previousAmbient === ambient) {
      this.previousAmbient = null;
    }
    if (this.currentAmbient === ambient) {
      this.currentAmbient = null;
      this.currentType = null;
    }
  }

  /** Stop all ambient sounds immediately */
  stopAll(): void {
    if (this.currentAmbient) {
      this.cleanupAmbient(this.currentAmbient);
      this.currentAmbient = null;
      this.currentType = null;
    }
    if (this.previousAmbient) {
      this.cleanupAmbient(this.previousAmbient);
      this.previousAmbient = null;
    }
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }

  /** Set combat mute state */
  setCombatMuted(muted: boolean): void {
    this.combatMuted = muted;
    this.applyVolume();
  }

  /** Set dialogue duck state */
  setDialogueDucked(ducked: boolean): void {
    this.dialogueDucked = ducked;
    this.applyVolume();
  }

  /** Set the base volume (0–1) */
  setVolume(vol: number): void {
    this.baseVolume = Math.max(0, Math.min(1, vol));
    this.applyVolume();
  }

  /** Apply the effective volume to the current ambient's master gain */
  private applyVolume(): void {
    if (!this.currentAmbient || !this.ctx) return;

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
    return this.currentType;
  }

  /** Dispose of all resources */
  dispose(): void {
    this.disposed = true;
    this.stopAll();

    if (this.destination) {
      try { this.destination.disconnect(); } catch { /* ignore */ }
      this.destination = null;
    }
    this.ctx = null; // Release reference to shared context (don't close it)
  }
}

/* ─── Singleton ambient player ─── */
let ambientPlayerInstance: AmbientSoundPlayer | null = null;

function getAmbientPlayer(): AmbientSoundPlayer {
  if (!ambientPlayerInstance) {
    ambientPlayerInstance = new AmbientSoundPlayer();
  }
  return ambientPlayerInstance;
}

/**
 * Sub-orchestrator that handles all audio-related EventBus subscriptions:
 * - Music control based on game mode (play/stop, dialogue muffle)
 * - Audio stingers on game events (poem collected, combat start, quest activated)
 * - Reverb presets on scene changes
 * - Camera shake on visual effects (glitch, scene enter)
 * - **Ambient sound system**: procedural ambient sounds per scene with crossfade,
 *   combat mute, and dialogue ducking
 */
export function useAudioOrchestrator() {
  const ambientPlayerRef = useRef<AmbientSoundPlayer | null>(null);

  // Ensure ambient player is created
  useEffect(() => {
    ambientPlayerRef.current = getAmbientPlayer();
    return () => {
      // Don't dispose the singleton on unmount — it persists across re-renders
    };
  }, []);

  // Music control + dialogue muffle + ambient initial state based on game mode
  useEffect(() => {
    const mode = useGameStore.getState().mode;
    if (mode === 'menu' || mode === 'intro') {
      musicEngine.stopMusic(1);
      ambientPlayerRef.current?.stopAll();
    } else if (mode === 'exploration') {
      const sceneId = useGameStore.getState().exploration.currentSceneId;
      musicEngine.playSceneMusic(sceneId);

      // Start ambient for initial scene
      const timeOfDay = useGameStore.getState().exploration.timeOfDay;
      const ambientType = getAmbienceForScene(sceneId, timeOfDay);
      if (ambientType) {
        ambientPlayerRef.current?.play(ambientType, 2000);
      }
    }

    // ── World Director: dialogue muffle when narrative overlay is active ──
    const showStoryOverlay = useGameStore.getState().showStoryOverlay;
    if (showStoryOverlay) {
      audioEngine.enableDialogueMuffle();
      ambientPlayerRef.current?.setDialogueDucked(true);
    } else if (mode === 'exploration') {
      audioEngine.disableDialogueMuffle();
      ambientPlayerRef.current?.setDialogueDucked(false);
    }

    // Combat mute
    if (mode === 'combat') {
      ambientPlayerRef.current?.setCombatMuted(true);
    } else {
      ambientPlayerRef.current?.setCombatMuted(false);
    }
  }, []);

  // Audio stingers on game events + reverb on scene change + visual camera shakes + ambient scene changes
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Stinger: poem collected
    unsubs.push(
      eventBus.on('poem:collected', () => {
        audioEngine.playStinger('discovery');
      }),
    );

    // Stinger: combat start
    unsubs.push(
      eventBus.on('combat:start', () => {
        audioEngine.playStinger('danger');
        // Switch ambient to combat type
        ambientPlayerRef.current?.setCombatMuted(false);
        ambientPlayerRef.current?.play('combat', 1500);
      }),
    );

    // Stinger: quest activated
    unsubs.push(
      eventBus.on('quest:activated', () => {
        audioEngine.playStinger('mystery');
      }),
    );

    // Reverb preset on scene change + ambient sound change
    unsubs.push(
      eventBus.on('scene:enter', ({ sceneId }) => {
        const reverbPresets: Partial<Record<string, string>> = {
          volodka_room: 'small_room',
          zarema_albert_room: 'small_room',
          home_evening: 'small_room',
          volodka_corridor: 'corridor',
          office_day: 'corridor',
          cafe_evening: 'corridor',
          library_day: 'corridor',
          street_night: 'large_space',
          park_day: 'large_space',
          street_winter: 'large_space',
          rooftop_edge: 'large_space',
          abandoned_factory: 'large_space',
          battle: 'corridor',
          sleep_dream: 'dream',
        };
        const preset = reverbPresets[sceneId];
        if (preset) audioEngine.setReverbPreset(preset);

        // ── Ambient sound transition ──
        const timeOfDay = useGameStore.getState().exploration.timeOfDay;
        const ambientType = getAmbienceForScene(sceneId, timeOfDay);
        if (ambientType) {
          const crossfadeMs = getAmbientTransitionDuration(sceneId);
          ambientPlayerRef.current?.play(ambientType, crossfadeMs);
        } else {
          // No ambient for this scene — fade out current
          ambientPlayerRef.current?.stopAll();
        }
      }),
    );

    // Combat end: restore scene ambient
    unsubs.push(
      eventBus.on('combat:end', () => {
        const state = useGameStore.getState();
        const sceneId = state.exploration.currentSceneId;
        const timeOfDay = state.exploration.timeOfDay;
        const ambientType = getAmbienceForScene(sceneId, timeOfDay);
        ambientPlayerRef.current?.setCombatMuted(false);
        if (ambientType) {
          const crossfadeMs = getAmbientTransitionDuration(sceneId);
          ambientPlayerRef.current?.play(ambientType, crossfadeMs);
        }
      }),
    );

    // Camera shake on glitch effect
    unsubs.push(
      eventBus.on('fx:glitch', () => {
        triggerCameraShake(0.05, 8);
      }),
    );

    // Camera shake on scene enter
    unsubs.push(
      eventBus.on('scene:enter', () => {
        triggerCameraShake(0.03, 3);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  // Mode-based audio control: react to mode changes reactively
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.mode !== prev.mode) {
        if (state.mode === 'menu' || state.mode === 'intro') {
          musicEngine.stopMusic(1);
          ambientPlayerRef.current?.stopAll();
        } else if (state.mode === 'exploration' && prev.mode !== 'exploration') {
          const sceneId = state.exploration.currentSceneId;
          musicEngine.playSceneMusic(sceneId);

          // Start ambient for current scene
          const timeOfDay = state.exploration.timeOfDay;
          const ambientType = getAmbienceForScene(sceneId, timeOfDay);
          if (ambientType) {
            const crossfadeMs = getAmbientTransitionDuration(sceneId);
            ambientPlayerRef.current?.play(ambientType, crossfadeMs);
          }
        }

        // ── World Director: dialogue muffle when narrative overlay is active ──
        if (state.showStoryOverlay) {
          audioEngine.enableDialogueMuffle();
          ambientPlayerRef.current?.setDialogueDucked(true);
        } else if (state.mode === 'exploration') {
          audioEngine.disableDialogueMuffle();
          ambientPlayerRef.current?.setDialogueDucked(false);
        }

        // Combat mute
        if (state.mode === 'combat') {
          ambientPlayerRef.current?.setCombatMuted(true);
        } else {
          ambientPlayerRef.current?.setCombatMuted(false);
        }
      }

      // ── React to scene changes within exploration mode ──
      if (
        state.mode === 'exploration' &&
        state.exploration.currentSceneId !== prev.exploration.currentSceneId
      ) {
        const sceneId = state.exploration.currentSceneId;
        const timeOfDay = state.exploration.timeOfDay;
        const ambientType = getAmbienceForScene(sceneId, timeOfDay);
        if (ambientType) {
          const crossfadeMs = getAmbientTransitionDuration(sceneId);
          ambientPlayerRef.current?.play(ambientType, crossfadeMs);
        }
      }

      // ── React to time-of-day changes that might switch day/night ambient ──
      if (
        state.mode === 'exploration' &&
        state.exploration.timeOfDay !== prev.exploration.timeOfDay
      ) {
        // Check if we crossed the day/night boundary (6:00 or 20:00)
        const prevTime = prev.exploration.timeOfDay;
        const currTime = state.exploration.timeOfDay;
        const crossedBoundary =
          (prevTime < 6 && currTime >= 6) ||
          (prevTime < 20 && currTime >= 20) ||
          (prevTime >= 6 && currTime < 6) ||
          (prevTime >= 20 && currTime < 20);

        if (crossedBoundary) {
          const sceneId = state.exploration.currentSceneId;
          const ambientType = getAmbienceForScene(sceneId, currTime);
          if (ambientType) {
            const crossfadeMs = getAmbientTransitionDuration(sceneId);
            ambientPlayerRef.current?.play(ambientType, crossfadeMs);
          }
        }
      }
    });
    return unsub;
  }, []);
}
