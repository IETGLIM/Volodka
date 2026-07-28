/* ─── Volodka RPG – Procedural ambient music engine (facade) ───
 * Three-layer procedural music: Pad, Bass, Melody
 * Config / theory / synthesis live in sibling modules — this class owns bus state + lifecycle.
 */

import { getSharedAudioContext } from '../SharedAudioContext';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { releaseConvolver } from './AudioEngineCore';
import { getSceneMusicConfig, type SceneMusicConfig } from './musicConfigs';
import { advanceChordDegree, beatMsFromTempo } from './musicTheory';
import {
  applyBassPulse,
  createBassLayer,
  createPadBus,
  createPadChordVoices,
  playMelodyNote,
  schedulePadVoiceRetirement,
  stopPadVoicesImmediate,
  type BassLayer,
  type PadBus,
  type PadVoice,
} from './proceduralMusic';

/**
 * AAA+ procedural ambient music engine.
 * Generates three-layer ambient music (pad, bass, melody) using Web Audio API.
 * Each scene type has its own scale, mood, and tempo configuration.
 */
class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private musicVolume = 0.5; // 0-1 user-facing volume
  private disposed = false;
  private sceneGeneration = 0;

  private currentScene: string | null = null;
  private currentConfig: SceneMusicConfig | null = null;

  private padOscillators: PadVoice[] = [];
  private padBus: PadBus | null = null;
  private currentChordDegree = 0;
  private pendingPadRetirements: Array<{
    voices: PadVoice[];
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  private bassLayer: BassLayer | null = null;

  private melodyTimer: ReturnType<typeof setInterval> | null = null;
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private bassTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // SharedAudioContext owns the singleton context + blur/focus.
  }

  private initContext(): void {
    if (this.ctx) return;
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0;
      this.masterGainNode.connect(this.ctx.destination);
    }
  }

  private resume(): void {
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /* ═══════════════════ PUBLIC API ═══════════════════ */

  /**
   * Play procedural ambient music for a scene.
   * Smoothly transitions if changing scenes.
   */
  playSceneMusic(sceneId: string): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    if (this.currentScene === sceneId) return;

    const config = getSceneMusicConfig(sceneId);
    if (!config) {
      this.stopMusic();
      this.currentScene = sceneId;
      return;
    }

    // Capture before stopMusic nulls currentScene; stop bumps generation to drop stale callbacks.
    const hadScene = this.currentScene !== null;
    this.stopMusic(1);
    const myGeneration = this.sceneGeneration;
    const startDelay = hadScene ? 1100 : 0;

    setTimeout(() => {
      if (this.disposed || this.sceneGeneration !== myGeneration) return;
      this.startMusicForScene(sceneId, config);
    }, startDelay);
  }

  /**
   * Stop all music with optional fade duration.
   * @param fadeDuration — seconds to fade out (default 2)
   */
  stopMusic(fadeDuration = 2): void {
    this.sceneGeneration++;

    if (this.chordTimer) {
      clearTimeout(this.chordTimer as unknown as number);
      this.chordTimer = null;
    }
    if (this.bassTimer) {
      clearInterval(this.bassTimer as unknown as number);
      this.bassTimer = null;
    }
    if (this.melodyTimer) {
      clearInterval(this.melodyTimer as unknown as number);
      this.melodyTimer = null;
    }

    const ctx = this.ctx;
    if (ctx && this.masterGainNode && this.currentScene !== null) {
      const now = ctx.currentTime;
      this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
      this.masterGainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);

      setTimeout(() => {
        this.cleanupAllNodes();
      }, (fadeDuration + 0.5) * 1000);
    } else {
      this.cleanupAllNodes();
    }

    this.currentScene = null;
    this.currentConfig = null;
    this.currentChordDegree = 0;
  }

  setVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.applyVolume();
  }

  getVolume(): number {
    return this.musicVolume;
  }

  getCurrentScene(): string | null {
    return this.currentScene;
  }

  /** Dispose — does NOT close shared AudioContext */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopMusic(0);

    if (this.masterGainNode) {
      try { this.masterGainNode.disconnect(); } catch { /* ignore */ }
      this.masterGainNode = null;
    }
    this.ctx = null;
  }

  /** Re-arm after orchestrator remount (React StrictMode). */
  revive(): void {
    this.disposed = false;
  }

  /* ═══════════════════ PRIVATE ═══════════════════ */

  private startMusicForScene(sceneId: string, config: SceneMusicConfig): void {
    const ctx = this.ctx;
    const dest = this.masterGainNode;
    if (!ctx || !dest) return;

    this.currentConfig = config;
    this.currentChordDegree = Math.floor(Math.random() * config.scale.intervals.length);

    const now = ctx.currentTime;
    this.padBus = createPadBus(ctx, dest, config);

    const effectiveGain = config.masterGain * this.musicVolume;
    dest.gain.setValueAtTime(0, now);
    dest.gain.linearRampToValueAtTime(effectiveGain, now + 2);

    this.playPadChord(config, now);
    this.startBassLayer(config, now);
    this.startMelodyLayer(config);
    this.scheduleChordChange(config);

    this.currentScene = sceneId;
  }

  private playPadChord(config: SceneMusicConfig, startTime: number): void {
    const ctx = this.ctx;
    const padFilter = this.padBus?.padFilter;
    if (!ctx || !padFilter) return;

    const outgoing = this.padOscillators;
    this.padOscillators = [];
    if (outgoing.length > 0) {
      this.retirePadVoices(outgoing, startTime, 2);
    }

    this.padOscillators = createPadChordVoices(
      ctx,
      padFilter,
      config,
      this.currentChordDegree,
      startTime,
    );
  }

  private retirePadVoices(voices: PadVoice[], startTime: number, durationSec: number): void {
    const timer = schedulePadVoiceRetirement(voices, startTime, durationSec, () => {
      const idx = this.pendingPadRetirements.findIndex((entry) => entry.timer === timer);
      if (idx !== -1) this.pendingPadRetirements.splice(idx, 1);
    });
    if (timer) {
      this.pendingPadRetirements.push({ voices, timer });
    }
  }

  private cancelPendingPadRetirements(): void {
    for (const entry of this.pendingPadRetirements) {
      clearTimeout(entry.timer);
      stopPadVoicesImmediate(entry.voices);
    }
    this.pendingPadRetirements = [];
  }

  private scheduleChordChange(config: SceneMusicConfig): void {
    if (this.chordTimer) {
      clearTimeout(this.chordTimer as unknown as number);
    }

    const myGeneration = this.sceneGeneration;

    this.chordTimer = setTimeout(() => {
      if (this.disposed || !this.currentConfig || this.currentScene === null) return;
      if (this.sceneGeneration !== myGeneration) return;

      this.currentChordDegree = advanceChordDegree(
        this.currentChordDegree,
        config.scale.intervals.length,
      );

      const ctx = this.ctx;
      if (ctx) {
        this.playPadChord(config, ctx.currentTime);
      }

      this.scheduleChordChange(config);
    }, config.chordChangeInterval * 1000) as unknown as ReturnType<typeof setTimeout>;
  }

  private startBassLayer(config: SceneMusicConfig, startTime: number): void {
    const ctx = this.ctx;
    const dest = this.masterGainNode;
    if (!ctx || !dest) return;

    this.bassLayer = createBassLayer(ctx, dest, config, startTime);
    this.startBassPulse(config);
  }

  private startBassPulse(config: SceneMusicConfig): void {
    if (this.bassTimer) {
      clearInterval(this.bassTimer as unknown as number);
    }

    const beatMs = beatMsFromTempo(config.tempo);
    const beatCount = { value: 0 };

    this.bassTimer = setInterval(() => {
      if (this.disposed || !this.bassLayer || !this.ctx) return;

      beatCount.value++;
      const beatInBar = beatCount.value % 4;
      if (beatInBar === 0 || beatInBar === 2) {
        applyBassPulse(
          this.bassLayer.bassGain,
          this.ctx,
          config.bassGain * this.musicVolume,
          beatMs,
        );
      }
    }, beatMs) as unknown as ReturnType<typeof setInterval>;
  }

  private startMelodyLayer(config: SceneMusicConfig): void {
    if (this.melodyTimer) {
      clearInterval(this.melodyTimer as unknown as number);
    }

    const beatMs = beatMsFromTempo(config.tempo);

    this.melodyTimer = setInterval(() => {
      if (this.disposed || !this.ctx || !this.masterGainNode) return;
      if (Math.random() > config.melodyChance) return;

      const myGeneration = this.sceneGeneration;
      const note = playMelodyNote(this.ctx, this.masterGainNode, config, this.musicVolume);
      setTimeout(() => {
        if (this.sceneGeneration !== myGeneration) return;
        note.disconnect();
      }, (note.duration + 0.5) * 1000);
    }, beatMs) as unknown as ReturnType<typeof setInterval>;
  }

  private applyVolume(): void {
    if (!this.masterGainNode || !this.ctx) return;

    const effectiveGain = (this.currentConfig?.masterGain ?? 0.04) * this.musicVolume;
    const now = this.ctx.currentTime;
    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
    this.masterGainNode.gain.linearRampToValueAtTime(effectiveGain, now + 0.3);
  }

  private cleanupAllNodes(): void {
    this.cancelPendingPadRetirements();

    for (const node of this.padOscillators) {
      try { node.osc.stop(); } catch { /* already stopped */ }
      try { node.gain.disconnect(); } catch { /* ignore */ }
    }
    this.padOscillators = [];

    const bus = this.padBus;
    if (bus) {
      try { bus.padLfo.stop(); } catch { /* already stopped */ }
      try { bus.padGain.disconnect(); } catch { /* ignore */ }
      try { bus.padFilter.disconnect(); } catch { /* ignore */ }
      if (bus.padConvolver) releaseConvolver(bus.padConvolver);
      try { bus.padConvolverGain.disconnect(); } catch { /* ignore */ }
      try { bus.padDryGain.disconnect(); } catch { /* ignore */ }
      this.padBus = null;
    }

    const bass = this.bassLayer;
    if (bass) {
      try { bass.bassOsc.stop(); } catch { /* already stopped */ }
      try { bass.bassGain.disconnect(); } catch { /* ignore */ }
      try { bass.bassFilter.disconnect(); } catch { /* ignore */ }
      this.bassLayer = null;
    }
  }
}

export const musicEngine = new MusicEngine();
export default musicEngine;

export function disposeMusicEngine(): void {
  musicEngine.dispose();
}

export function reviveMusicEngine(): void {
  musicEngine.revive();
}

registerHmrDispose(disposeMusicEngine);
