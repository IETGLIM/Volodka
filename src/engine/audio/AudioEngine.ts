/* ─── Volodka RPG – AAA procedural audio engine (facade) ───
 * Ambient music, spatial audio, UI sounds, footstep variety
 * Synthesis lives in procedural* modules — this class owns bus state + lifecycle.
 */

import type { SceneId } from '@/shared/types/game';
import type { AmbientLayer, AmbientMusicConfig, RandomSoundDef } from './types';
import {
  AMBIENT_CONFIGS,
  AMBIENT_MUSIC_CONFIGS,
  REVERB_PRESETS,
  SCENE_REVERB_PRESETS,
} from './ambientConfigs';
import {
  getSharedAudioContext,
  createAmbientReverbImpulse,
  safeResume,
  whenAudioReady,
  releaseBufferSource,
  releaseConvolver,
} from './AudioEngineCore';
import { tryCreateConvolver } from './audioCapabilities';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  createDeferredCleanupHandle,
  flushDeferredCleanup,
  scheduleDeferredCleanup,
  type DeferredCleanupHandle,
} from './deferredNodeCleanup';
import {
  synthesizeSfx,
  synthesizeFootstep,
  synthesizeDoorOpen,
  synthesizeDoorClose,
  synthesizeLevelUp,
  synthesizePoemCollect,
  synthesizeQuestComplete,
  synthesizeDamage,
  synthesizeHeal,
  synthesizeStinger,
  type StingerType,
} from './proceduralSfx';
import {
  createAmbientLayer,
  createNoiseLayer,
  playLegacyRandomSound,
  playRandomSoundEvent,
  nextRandomSoundDelayMs,
  nextLegacyRandomDelayMs,
  type AmbientLayerNodes,
} from './proceduralAmbient';
import {
  createAmbientMusicBus,
  startMusicChordVoices,
  type MusicVoiceNodes,
} from './proceduralAmbientMusic';
import {
  synthesizeSpatialSfx,
  synthesizeSpatialBark,
  createSpatialAmbientSource,
} from './proceduralSpatial';

/**
 * AAA procedural audio engine using the Web Audio API.
 * Generates ambient music, SFX, footstep sounds, ambient drones, spatial audio,
 * door sounds, and UI feedback without any audio files.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.7;
  private disposed = false;

  // Ambient state
  private ambientNodes: AmbientLayerNodes[] = [];
  private ambientGain: GainNode | null = null;
  private currentAmbientScene: SceneId | null = null;
  private randomSoundLoops: Array<{
    timer: ReturnType<typeof setTimeout> | null;
    cancelled: boolean;
    generation: number;
  }> = [];
  private randomSoundGeneration = 0;

  // Noise layer state
  private noiseSourceNodes: Array<AudioBufferSourceNode> = [];
  private noiseGainNodes: Array<GainNode> = [];
  private noiseLfoNodes: Array<OscillatorNode> = [];
  private noiseFilterNodes: Array<BiquadFilterNode> = [];

  // Ambient music state
  private musicNodes: MusicVoiceNodes[] = [];
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicLfo: OscillatorNode | null = null;
  private musicLfoGain: GainNode | null = null;
  private currentMusicScene: SceneId | null = null;
  private musicChordTimer: ReturnType<typeof setTimeout> | null = null;
  private musicConvolver: ConvolverNode | null = null;
  private musicConvolverGain: GainNode | null = null;
  private musicDryGain: GainNode | null = null;
  private textureOsc: OscillatorNode | null = null;
  private textureGain: GainNode | null = null;
  private textureLfo: OscillatorNode | null = null;
  private textureLfoGain: GainNode | null = null;

  // Dialogue muffle filter state
  private ambientMuffleFilter: BiquadFilterNode | null = null;
  private muffleEnabled = false;

  // Ambient reverb state
  private ambientConvolver: ConvolverNode | null = null;
  private ambientReverbGain: GainNode | null = null;
  private ambientDryReverbGain: GainNode | null = null;
  private currentReverbPreset: string | null = null;
  private pendingAmbientCleanup: DeferredCleanupHandle = createDeferredCleanupHandle();
  private pendingMusicCleanup: DeferredCleanupHandle = createDeferredCleanupHandle();

  // Blur/focus handlers for audio context suspend/resume
  private _onBlur: (() => void) | null = null;
  private _onFocus: (() => void) | null = null;

  constructor() {
    // DEFER AudioContext creation — browsers require a user gesture.
    // SharedAudioContext module manages the singleton context + blur/focus.
  }

  /** Lazily get the shared AudioContext (P1-3.5 FIX) */
  private initContext(): void {
    if (this.ctx) return;
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  private resume(): void {
    safeResume();
  }

  private withBus(fn: (ctx: AudioContext, dest: GainNode) => void): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();
    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;
    fn(ctx, dest);
  }

  playSfx(type: string): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this.withBus((ctx, dest) => synthesizeSfx(ctx, dest, type));
    });
  }

  playFootstep(material?: string): void {
    this.withBus((ctx, dest) => synthesizeFootstep(ctx, dest, material));
  }

  playAmbient(sceneId: SceneId): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    if (this.currentAmbientScene === sceneId) return;

    this.stopAmbient();

    const config = AMBIENT_CONFIGS[sceneId];
    if (!config) {
      this.currentAmbientScene = sceneId;
      return;
    }

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    this.ambientMuffleFilter = ctx.createBiquadFilter();
    this.ambientMuffleFilter.type = 'lowpass';
    this.ambientMuffleFilter.frequency.value = this.muffleEnabled ? 800 : 22050;
    this.ambientMuffleFilter.Q.value = 1.0;

    const reverbPreset = this.currentReverbPreset ?? this.getDefaultReverbPreset(sceneId);
    const reverbConfig = REVERB_PRESETS[reverbPreset] ?? REVERB_PRESETS['small_room'];

    this.ambientConvolver = tryCreateConvolver(
      ctx,
      createAmbientReverbImpulse(ctx, reverbConfig.decay),
    );

    this.ambientReverbGain = ctx.createGain();
    this.ambientDryReverbGain = ctx.createGain();

    if (this.ambientConvolver) {
      this.ambientReverbGain.gain.value = reverbConfig.wetMix;
      this.ambientDryReverbGain.gain.value = 1 - reverbConfig.wetMix;
      this.ambientMuffleFilter.connect(this.ambientDryReverbGain);
      this.ambientMuffleFilter.connect(this.ambientConvolver);
      this.ambientConvolver.connect(this.ambientReverbGain);
    } else {
      this.ambientReverbGain.gain.value = 0;
      this.ambientDryReverbGain.gain.value = 1;
      this.ambientMuffleFilter.connect(this.ambientDryReverbGain);
    }

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.6;

    this.ambientDryReverbGain.connect(this.ambientGain);
    if (this.ambientConvolver) {
      this.ambientReverbGain.connect(this.ambientGain);
    }

    this.ambientGain.connect(dest);

    for (const layer of config.layers) {
      const nodes = createAmbientLayer(ctx, layer, this.ambientMuffleFilter);
      this.ambientNodes.push(nodes);

      if (layer.randomInterval > 0 && layer.randomSound) {
        this.startLegacyRandomSoundLoop(layer.randomInterval, layer.randomSound);
      }
    }

    if (config.noiseLayers) {
      for (const noiseDef of config.noiseLayers) {
        const nodes = createNoiseLayer(ctx, noiseDef, this.ambientMuffleFilter);
        this.noiseSourceNodes.push(nodes.source);
        this.noiseGainNodes.push(nodes.gain);
        this.noiseFilterNodes.push(nodes.filter);
        if (nodes.lfo) this.noiseLfoNodes.push(nodes.lfo);
      }
    }

    if (config.randomSounds) {
      for (const soundDef of config.randomSounds) {
        this.startRandomSoundLoop(soundDef);
      }
    }

    this.currentAmbientScene = sceneId;
  }

  private startLegacyRandomSoundLoop(
    interval: number,
    sound: NonNullable<AmbientLayer['randomSound']>,
  ): void {
    const loopGeneration = this.randomSoundGeneration;
    const loop = { timer: null as ReturnType<typeof setTimeout> | null, cancelled: false, generation: loopGeneration };
    this.randomSoundLoops.push(loop);

    const playRandom = () => {
      if (this.disposed || !this.ctx || !this.ambientMuffleFilter) return;
      if (loop.cancelled || loop.generation !== this.randomSoundGeneration) return;
      this.resume();
      playLegacyRandomSound(this.ctx, this.ambientMuffleFilter, sound);
    };

    const scheduleNext = () => {
      if (loop.cancelled || this.disposed || loop.generation !== this.randomSoundGeneration) return;
      loop.timer = setTimeout(() => {
        loop.timer = null;
        if (loop.cancelled || this.disposed || loop.generation !== this.randomSoundGeneration) return;
        playRandom();
        scheduleNext();
      }, nextLegacyRandomDelayMs(interval));
    };

    scheduleNext();
  }

  private startRandomSoundLoop(soundDef: RandomSoundDef): void {
    const loopGeneration = this.randomSoundGeneration;
    const loop = { timer: null as ReturnType<typeof setTimeout> | null, cancelled: false, generation: loopGeneration };
    this.randomSoundLoops.push(loop);

    const playSound = () => {
      if (this.disposed || !this.ctx || !this.ambientMuffleFilter) return;
      if (loop.cancelled || loop.generation !== this.randomSoundGeneration) return;
      this.resume();
      playRandomSoundEvent(this.ctx, this.ambientMuffleFilter, soundDef);
    };

    const scheduleNext = () => {
      if (loop.cancelled || this.disposed || loop.generation !== this.randomSoundGeneration) return;
      loop.timer = setTimeout(() => {
        loop.timer = null;
        if (loop.cancelled || this.disposed || loop.generation !== this.randomSoundGeneration) return;
        playSound();
        scheduleNext();
      }, nextRandomSoundDelayMs(soundDef));
    };

    scheduleNext();
  }

  private clearRandomSoundLoops(): void {
    this.randomSoundGeneration++;
    for (const loop of this.randomSoundLoops) {
      loop.cancelled = true;
      if (loop.timer) clearTimeout(loop.timer);
    }
    this.randomSoundLoops = [];
  }

  stopAmbient(): void {
    this.clearRandomSoundLoops();
    flushDeferredCleanup(this.pendingAmbientCleanup);

    for (const lfo of this.noiseLfoNodes) {
      try { lfo.stop(); } catch { /* already stopped */ }
    }
    this.noiseLfoNodes = [];
    for (const source of this.noiseSourceNodes) {
      releaseBufferSource(source);
    }
    this.noiseSourceNodes = [];
    for (const gain of this.noiseGainNodes) {
      try { gain.disconnect(); } catch { /* ignore */ }
    }
    this.noiseGainNodes = [];
    for (const filter of this.noiseFilterNodes) {
      try { filter.disconnect(); } catch { /* ignore */ }
    }
    this.noiseFilterNodes = [];

    const ctx = this.ctx;
    if (ctx && this.ambientGain) {
      const now = ctx.currentTime;
      const nodesToStop = [...this.ambientNodes];
      const gainToDisconnect = this.ambientGain;
      const muffleFilterToDisconnect = this.ambientMuffleFilter;
      const convolverToDisconnect = this.ambientConvolver;
      const reverbGainToDisconnect = this.ambientReverbGain;
      const dryReverbGainToDisconnect = this.ambientDryReverbGain;
      this.ambientNodes = [];
      this.ambientGain = null;
      this.ambientMuffleFilter = null;
      this.ambientConvolver = null;
      this.ambientReverbGain = null;
      this.ambientDryReverbGain = null;

      const releaseCapturedAmbient = () => {
        for (const node of nodesToStop) {
          try { node.osc.stop(); } catch { /* already stopped */ }
          try { node.lfo?.stop(); } catch { /* already stopped */ }
          try { node.harmonicOsc?.stop(); } catch { /* already stopped */ }
          try { node.gain.disconnect(); } catch { /* ignore */ }
          try { node.lfoGain?.disconnect(); } catch { /* ignore */ }
          try { node.harmonicGain?.disconnect(); } catch { /* ignore */ }
        }
        try { gainToDisconnect.disconnect(); } catch { /* ignore */ }
        try { muffleFilterToDisconnect?.disconnect(); } catch { /* ignore */ }
        if (convolverToDisconnect) releaseConvolver(convolverToDisconnect);
        try { reverbGainToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { dryReverbGainToDisconnect?.disconnect(); } catch { /* ignore */ }
      };

      if (!this.disposed) {
        gainToDisconnect.gain.setValueAtTime(gainToDisconnect.gain.value, now);
        gainToDisconnect.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      }

      scheduleDeferredCleanup(
        this.pendingAmbientCleanup,
        releaseCapturedAmbient,
        600,
        this.disposed,
      );
    } else {
      this.ambientNodes = [];
      this.ambientGain = null;
      this.ambientMuffleFilter = null;
      this.ambientConvolver = null;
      this.ambientReverbGain = null;
      this.ambientDryReverbGain = null;
    }

    this.currentAmbientScene = null;
  }

  playAmbientMusic(sceneId: SceneId): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    if (this.currentMusicScene === sceneId) return;

    this.stopAmbientMusic();

    const config = AMBIENT_MUSIC_CONFIGS[sceneId];
    if (!config) {
      this.currentMusicScene = sceneId;
      return;
    }

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const bus = createAmbientMusicBus(ctx, dest, config);
    this.musicGain = bus.musicGain;
    this.musicFilter = bus.musicFilter;
    this.musicLfo = bus.musicLfo;
    this.musicLfoGain = bus.musicLfoGain;
    this.musicConvolver = bus.musicConvolver;
    this.musicConvolverGain = bus.musicConvolverGain;
    this.musicDryGain = bus.musicDryGain;
    this.textureOsc = bus.textureOsc;
    this.textureGain = bus.textureGain;
    this.textureLfo = bus.textureLfo;
    this.textureLfoGain = bus.textureLfoGain;

    this.playMusicChord(config, 0, ctx.currentTime);
    this.currentMusicScene = sceneId;
  }

  private playMusicChord(config: AmbientMusicConfig, chordIndex: number, startTime: number): void {
    if (this.disposed || !this.ctx || !this.musicFilter) return;

    const ctx = this.ctx;
    const { voices, chordDuration } = startMusicChordVoices(
      ctx,
      this.musicFilter,
      config,
      chordIndex,
      startTime,
    );
    this.musicNodes.push(...voices);

    this.musicChordTimer = setTimeout(() => {
      this.musicNodes = this.musicNodes.filter((n) => {
        try {
          n.osc.stop();
        } catch { /* already stopped */ }
        return false;
      });

      const nextIndex = (chordIndex + 1) % config.chords.length;
      if (!this.disposed && this.currentMusicScene !== null) {
        this.playMusicChord(config, nextIndex, ctx.currentTime);
      }
    }, chordDuration * 1000) as unknown as ReturnType<typeof setTimeout>;
  }

  stopAmbientMusic(): void {
    if (this.musicChordTimer) {
      clearTimeout(this.musicChordTimer as unknown as number);
      this.musicChordTimer = null;
    }
    flushDeferredCleanup(this.pendingMusicCleanup);

    const ctx = this.ctx;

    if (ctx && this.musicGain) {
      const now = ctx.currentTime;
      const nodesToStop = [...this.musicNodes];
      const lfoToStop = this.musicLfo;
      const textureOscToStop = this.textureOsc;
      const textureLfoToStop = this.textureLfo;
      const gainToDisconnect = this.musicGain;
      const filterToDisconnect = this.musicFilter;
      const convolverToDisconnect = this.musicConvolver;
      const convolverGainToDisconnect = this.musicConvolverGain;
      const dryGainToDisconnect = this.musicDryGain;

      this.musicNodes = [];
      this.musicGain = null;
      this.musicFilter = null;
      this.musicLfo = null;
      this.musicLfoGain = null;
      this.musicConvolver = null;
      this.musicConvolverGain = null;
      this.musicDryGain = null;
      this.textureOsc = null;
      this.textureGain = null;
      this.textureLfo = null;
      this.textureLfoGain = null;

      const releaseCapturedMusic = () => {
        for (const node of nodesToStop) {
          try { node.osc.stop(); } catch { /* already stopped */ }
          try { node.gain.disconnect(); } catch { /* ignore */ }
        }

        try { lfoToStop?.stop(); } catch { /* already stopped */ }
        try { textureOscToStop?.stop(); } catch { /* already stopped */ }
        try { textureLfoToStop?.stop(); } catch { /* already stopped */ }

        try { gainToDisconnect.disconnect(); } catch { /* ignore */ }
        try { filterToDisconnect?.disconnect(); } catch { /* ignore */ }
        if (convolverToDisconnect) releaseConvolver(convolverToDisconnect);
        try { convolverGainToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { dryGainToDisconnect?.disconnect(); } catch { /* ignore */ }
      };

      if (!this.disposed) {
        gainToDisconnect.gain.setValueAtTime(gainToDisconnect.gain.value, now);
        gainToDisconnect.gain.linearRampToValueAtTime(0, now + 1);
      }

      scheduleDeferredCleanup(
        this.pendingMusicCleanup,
        releaseCapturedMusic,
        1200,
        this.disposed,
      );
    } else {
      this.musicNodes = [];
      this.musicGain = null;
      this.musicFilter = null;
      this.musicLfo = null;
      this.musicLfoGain = null;
      this.musicConvolver = null;
      this.musicConvolverGain = null;
      this.musicDryGain = null;
      this.textureOsc = null;
      this.textureGain = null;
      this.textureLfo = null;
      this.textureLfoGain = null;
    }

    this.currentMusicScene = null;
  }

  playDoorOpen(): void {
    this.withBus((ctx, dest) => synthesizeDoorOpen(ctx, dest));
  }

  playDoorClose(): void {
    this.withBus((ctx, dest) => synthesizeDoorClose(ctx, dest));
  }

  playLevelUp(): void {
    this.withBus((ctx, dest) => synthesizeLevelUp(ctx, dest));
  }

  playPoemCollect(): void {
    this.withBus((ctx, dest) => synthesizePoemCollect(ctx, dest));
  }

  playQuestComplete(): void {
    this.withBus((ctx, dest) => synthesizeQuestComplete(ctx, dest));
  }

  playDamage(): void {
    this.withBus((ctx, dest) => synthesizeDamage(ctx, dest));
  }

  playHeal(): void {
    this.withBus((ctx, dest) => synthesizeHeal(ctx, dest));
  }

  playSpatialSfx(
    type: string,
    position: [number, number, number],
    options?: {
      refDistance?: number;
      maxDistance?: number;
      rolloffFactor?: number;
      coneInnerAngle?: number;
      coneOuterAngle?: number;
      coneOuterGain?: number;
    },
  ): void {
    this.withBus((ctx, dest) => synthesizeSpatialSfx(ctx, dest, type, position, options));
  }

  playSpatialBark(text: string, position: [number, number, number]): void {
    this.withBus((ctx, dest) => synthesizeSpatialBark(ctx, dest, text, position));
  }

  createSpatialAmbient(
    position: [number, number, number],
    config: {
      type: OscillatorType;
      frequency: number;
      gain: number;
      lfoFreq?: number;
      lfoDepth?: number;
    },
  ): { stop: () => void; setPosition: (position: [number, number, number]) => void } {
    if (this.disposed || !this.ctx || !this.masterGain) {
      return { stop: () => {}, setPosition: () => {} };
    }

    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return { stop: () => {}, setPosition: () => {} };

    return createSpatialAmbientSource(ctx, dest, position, config);
  }

  playStinger(type: StingerType): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this.withBus((ctx, dest) => synthesizeStinger(ctx, dest, type));
    });
  }

  enableDialogueMuffle(): void {
    if (this.disposed || !this.ambientMuffleFilter || !this.ctx) return;
    this.muffleEnabled = true;
    const now = this.ctx.currentTime;
    this.ambientMuffleFilter.frequency.setValueAtTime(this.ambientMuffleFilter.frequency.value, now);
    this.ambientMuffleFilter.frequency.linearRampToValueAtTime(800, now + 0.3);
  }

  disableDialogueMuffle(): void {
    if (this.disposed || !this.ambientMuffleFilter || !this.ctx) return;
    this.muffleEnabled = false;
    const now = this.ctx.currentTime;
    this.ambientMuffleFilter.frequency.setValueAtTime(this.ambientMuffleFilter.frequency.value, now);
    this.ambientMuffleFilter.frequency.linearRampToValueAtTime(22050, now + 0.5);
  }

  setReverbPreset(preset: string): void {
    this.currentReverbPreset = preset;

    if (!this.ambientConvolver || !this.ctx || !this.ambientReverbGain || !this.ambientDryReverbGain) return;

    const reverbConfig = REVERB_PRESETS[preset] ?? REVERB_PRESETS['small_room'];
    const now = this.ctx.currentTime;

    this.ambientReverbGain.gain.setValueAtTime(this.ambientReverbGain.gain.value, now);
    this.ambientReverbGain.gain.linearRampToValueAtTime(reverbConfig.wetMix, now + 0.5);
    this.ambientDryReverbGain.gain.setValueAtTime(this.ambientDryReverbGain.gain.value, now);
    this.ambientDryReverbGain.gain.linearRampToValueAtTime(1 - reverbConfig.wetMix, now + 0.5);
  }

  private getDefaultReverbPreset(sceneId: SceneId): string {
    if (SCENE_REVERB_PRESETS[sceneId]) return SCENE_REVERB_PRESETS[sceneId];
    return 'small_room';
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  stop(): void {
    this.stopAmbient();
    this.stopAmbientMusic();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    flushDeferredCleanup(this.pendingAmbientCleanup);
    flushDeferredCleanup(this.pendingMusicCleanup);
    this.stopAmbient();
    this.stopAmbientMusic();

    if (typeof window !== 'undefined' && this._onBlur) {
      window.removeEventListener('blur', this._onBlur);
      window.removeEventListener('focus', this._onFocus!);
      this._onBlur = null;
      this._onFocus = null;
    }

    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch { /* ignore */ }
      this.masterGain = null;
    }
    this.ctx = null;
  }

  revive(): void {
    this.disposed = false;
  }
}

/** Singleton audio engine instance */
export const audioEngine = new AudioEngine();
export default audioEngine;

export function disposeAudioEngine(): void {
  audioEngine.dispose();
}

export function reviveAudioEngine(): void {
  audioEngine.revive();
}

registerHmrDispose(disposeAudioEngine);
