/* ─── Volodka RPG – AAA procedural audio engine ───
 *  Ambient music, spatial audio, UI sounds, footstep variety
 *  All procedural via Web Audio API — zero audio files required
 */

import type { SceneId } from '@/shared/types/game';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type {
  AmbientLayer,
  AmbientMusicConfig,
  NoiseLayerDef,
  RandomSoundDef,
} from './types';
import { safeStop } from './types';
import { SFX_PRESETS, FOOTSTEP_PRESETS } from './sfxPresets';
import {
  AMBIENT_CONFIGS,
  AMBIENT_MUSIC_CONFIGS,
  REVERB_PRESETS,
  SCENE_REVERB_PRESETS,
} from './ambientConfigs';
import {
  getSharedAudioContext,
  getReverbImpulse,
  getAmbientReverbImpulse,
  safeResume,
  whenAudioReady,
  releaseBufferSource,
  releaseConvolver,
} from './AudioEngineCore';
import {
  connectSpatialSource,
  connectWithStereoPan,
  tryCreateConvolver,
} from './audioCapabilities';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { RandomSoundLoopRegistry } from './randomSoundLoopRegistry';

export type PlayFootstepOptions = {
  /** Stable id — when set, replaces any still-playing footstep on this voice. */
  sourceId?: string;
  /** Default false when sourceId is set; true when omitted (legacy one-shot behavior). */
  allowOverlap?: boolean;
};

type FootstepVoice = {
  noise: AudioBufferSourceNode;
  click?: OscillatorNode;
};

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
  /** Bumped on dispose — stale setTimeout callbacks no-op after StrictMode unmount. */
  private engineGeneration = 0;
  private readonly pendingEngineTimers = new Set<ReturnType<typeof setTimeout>>();

  // Ambient state
  private ambientNodes: Array<{
    osc: OscillatorNode;
    gain: GainNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    harmonicOsc?: OscillatorNode;
    harmonicGain?: GainNode;
  }> = [];
  private ambientGain: GainNode | null = null;
  private currentAmbientScene: SceneId | null = null;
  private readonly randomSoundLoopRegistry = new RandomSoundLoopRegistry();

  private guardRandomSoundLoop(
    loop: Parameters<RandomSoundLoopRegistry['guard']>[0],
  ): boolean {
    return this.randomSoundLoopRegistry.guard(loop, this.disposed);
  }

  // Noise layer state
  private noiseSourceNodes: Array<AudioBufferSourceNode> = [];
  private noiseGainNodes: Array<GainNode> = [];
  private noiseLfoNodes: Array<OscillatorNode> = [];
  private noiseFilterNodes: Array<BiquadFilterNode> = [];

  // Ambient music state
  private musicNodes: Array<{
    osc: OscillatorNode;
    gain: GainNode;
  }> = [];
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

  /** One-shot spatial SFX (footsteps, doors) — shared scene reverb + dialogue duck */
  private sfxMasterGain: GainNode | null = null;
  private sfxDryGain: GainNode | null = null;
  private sfxWetGain: GainNode | null = null;
  private sfxConvolver: ConvolverNode | null = null;
  /** Deferred scene-teardown — flushed on the next scene change so buffers unload promptly */
  private pendingAmbientCleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingAmbientCleanup: (() => void) | null = null;
  private pendingMusicCleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingMusicCleanup: (() => void) | null = null;

  // Blur/focus handlers for audio context suspend/resume
  private _onBlur: (() => void) | null = null;
  private _onFocus: (() => void) | null = null;

  /** One voice per sourceId — prevents footstep stacking on fast cadence or lag spikes. */
  private footstepVoiceBySourceId = new Map<string, FootstepVoice>();

  /** Schedule a timer that self-cancels when dispose() bumps engineGeneration. */
  private scheduleEngineTimer(fn: () => void, delayMs: number): ReturnType<typeof setTimeout> {
    const generation = this.engineGeneration;
    const timerId = setTimeout(() => {
      this.pendingEngineTimers.delete(timerId);
      if (this.disposed || generation !== this.engineGeneration) return;
      fn();
    }, delayMs);
    this.pendingEngineTimers.add(timerId);
    return timerId;
  }

  private cancelPendingEngineTimers(): void {
    this.engineGeneration += 1;
    for (const timerId of this.pendingEngineTimers) {
      clearTimeout(timerId);
    }
    this.pendingEngineTimers.clear();
  }

  private clearTrackedTimer(timer: ReturnType<typeof setTimeout> | null): void {
    if (timer === null) return;
    clearTimeout(timer);
    this.pendingEngineTimers.delete(timer);
  }

  constructor() {
    // DEFER AudioContext creation — browsers require a user gesture before
    // AudioContext can start. Creating it here (module load time) causes:
    //   "The AudioContext was not allowed to start. It must be resumed
    //    (or created) after a user gesture on the page."
    // Instead, we lazily create the context on the first audio method call
    // (playSfx, playFootstep, playAmbient, etc.) which is always triggered
    // by user interaction.
    //
    // We still register blur/focus handlers so the context is suspended/resumed
    // correctly once it exists.

    // P1-3.5 FIX: No longer creating a separate AudioContext.
    // SharedAudioContext module manages the singleton context + blur/focus.
    // Individual blur/focus handlers removed — managed centrally.
  }

  /** Lazily get the shared AudioContext (P1-3.5 FIX) */
  private initContext(): void {
    if (this.ctx) return;
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.ensureSfxBus();
    }
  }

  /** Footstep / door one-shots — dry + wet through scene reverb preset. */
  private ensureSfxBus(): void {
    if (!this.ctx || !this.masterGain || this.sfxMasterGain) return;

    const ctx = this.ctx;
    this.sfxMasterGain = ctx.createGain();
    this.sfxMasterGain.gain.value = 1;
    this.sfxMasterGain.connect(this.masterGain);

    this.sfxDryGain = ctx.createGain();
    this.sfxWetGain = ctx.createGain();
    this.sfxDryGain.connect(this.sfxMasterGain);
    this.sfxWetGain.connect(this.sfxMasterGain);

    this.applySfxReverbPreset(this.currentReverbPreset ?? 'small_room', false);
  }

  private applySfxReverbPreset(preset: string, smooth: boolean): void {
    if (!this.ctx || !this.sfxDryGain || !this.sfxWetGain) return;

    const reverbConfig = REVERB_PRESETS[preset] ?? REVERB_PRESETS['small_room'];
    const wetMix = reverbConfig.wetMix * 0.35;
    const dryMix = 1 - wetMix;
    const now = this.ctx.currentTime;

    if (this.sfxConvolver) {
      releaseConvolver(this.sfxConvolver);
      this.sfxConvolver = null;
    }
    this.sfxConvolver = tryCreateConvolver(
      this.ctx,
      getAmbientReverbImpulse(this.ctx, reverbConfig.decay * 0.65),
    );
    if (this.sfxConvolver) {
      this.sfxConvolver.connect(this.sfxWetGain);
    }

    if (smooth) {
      this.sfxWetGain.gain.setValueAtTime(this.sfxWetGain.gain.value, now);
      this.sfxWetGain.gain.linearRampToValueAtTime(this.sfxConvolver ? wetMix : 0, now + 0.5);
      this.sfxDryGain.gain.setValueAtTime(this.sfxDryGain.gain.value, now);
      this.sfxDryGain.gain.linearRampToValueAtTime(this.sfxConvolver ? dryMix : 1, now + 0.5);
    } else {
      this.sfxWetGain.gain.value = this.sfxConvolver ? wetMix : 0;
      this.sfxDryGain.gain.value = this.sfxConvolver ? dryMix : 1;
    }
  }

  private connectSpatialOneShot(node: AudioNode): void {
    this.ensureSfxBus();
    if (!this.sfxDryGain) {
      node.connect(this.masterGain!);
      return;
    }
    node.connect(this.sfxDryGain);
    if (this.sfxConvolver) {
      node.connect(this.sfxConvolver);
    }
  }

  /** Ensure context is running (browsers require user gesture) */
  private resume(): void {
    safeResume();
  }

  /** Disconnect one-shot graph nodes; Web Audio throws if already disconnected. */
  private disconnectOneShot(...nodes: (AudioNode | null | undefined)[]): void {
    for (const node of nodes) {
      if (node) {
        try { node.disconnect(); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Play a procedural SFX sound.
   * @param type — preset name (click, confirm, cancel, notify, etc.)
   */
  playSfx(type: string): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this._playSfxInternal(type);
    });
  }

  private _playSfxInternal(type: string): void {
    this.initContext();
    this.resume();

    const preset = SFX_PRESETS[type] ?? SFX_PRESETS['click'];
    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.frequency, now);

    // Envelope gain
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(preset.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

    osc.connect(envGain);
    this.connectSpatialOneShot(envGain);

    osc.start(now);
    safeStop(osc, now + preset.duration + 0.01);
    osc.onended = () => {
      this.disconnectOneShot(osc, envGain);
    };
  }

  private stopFootstepVoice(sourceId: string): void {
    const voice = this.footstepVoiceBySourceId.get(sourceId);
    if (!voice) return;
    releaseBufferSource(voice.noise);
    if (voice.click) safeStop(voice.click);
    this.footstepVoiceBySourceId.delete(sourceId);
  }

  private clearFootstepVoices(): void {
    for (const sourceId of [...this.footstepVoiceBySourceId.keys()]) {
      this.stopFootstepVoice(sourceId);
    }
    this.footstepVoiceBySourceId.clear();
  }

  /**
   * Play a procedural footstep sound.
   * @param material — surface material (default, wood, concrete, metal, carpet, snow, tile, gravel, grass, metal_grate)
   * @param options — optional voice id; when sourceId is set, previous step on that voice is stopped unless allowOverlap is true
   */
  playFootstep(material?: string, options?: PlayFootstepOptions): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this._playFootstepInternal(material, options);
    });
  }

  private _playFootstepInternal(material?: string, options?: PlayFootstepOptions): void {
    this.initContext();
    this.resume();

    const sourceId = options?.sourceId;
    const allowOverlap = options?.allowOverlap ?? sourceId === undefined;
    if (sourceId && !allowOverlap) {
      this.stopFootstepVoice(sourceId);
    }

    const preset = FOOTSTEP_PRESETS[material ?? 'default'] ?? FOOTSTEP_PRESETS['default'];
    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Create a short burst of filtered noise for the footstep "thud"
    const bufferSize = Math.ceil(ctx.sampleRate * preset.noiseDuration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with random noise shaped by a decay envelope
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 12);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Band-pass filter to shape the sound for the material
    const filter = ctx.createBiquadFilter();
    filter.type = preset.filterType;
    filter.frequency.value = preset.baseFreq;
    filter.Q.value = preset.filterQ;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(preset.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.noiseDuration);

    noiseSource.connect(filter);
    filter.connect(envGain);
    this.connectSpatialOneShot(envGain);

    noiseSource.start(now);
    safeStop(noiseSource, now + preset.noiseDuration + 0.01);

    // Additional click/harmonic for hard surfaces (tile, metal_grate, wood, gravel)
    let clickOsc: OscillatorNode | undefined;
    if (preset.clickFreq > 0) {
      clickOsc = ctx.createOscillator();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(preset.clickFreq * (0.9 + Math.random() * 0.2), now);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(preset.clickGain, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      clickOsc.connect(clickGain);
      this.connectSpatialOneShot(clickGain);

      clickOsc.start(now);
      safeStop(clickOsc, now + 0.05);
      clickOsc.onended = () => {
        this.disconnectOneShot(clickOsc, clickGain);
      };
    }

    noiseSource.onended = () => {
      if (this.disposed) return;
      releaseBufferSource(noiseSource);
      this.disconnectOneShot(filter, envGain);
      if (sourceId) {
        const current = this.footstepVoiceBySourceId.get(sourceId);
        if (current?.noise === noiseSource) {
          this.footstepVoiceBySourceId.delete(sourceId);
        }
      }
    };

    if (sourceId) {
      this.footstepVoiceBySourceId.set(sourceId, { noise: noiseSource, click: clickOsc });
    }
  }

  /**
   * Play ambient sound for a scene.
   * Stops any currently playing ambient before starting the new one.
   * @param sceneId — the scene to play ambient for
   */
  playAmbient(sceneId: SceneId): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // If same scene, do nothing
    if (this.currentAmbientScene === sceneId) return;

    // Stop current ambient
    this.stopAmbient();

    const config = AMBIENT_CONFIGS[resolveDerivedSceneId(sceneId as SceneId)];
    if (!config) {
      this.currentAmbientScene = sceneId;
      return; // No ambient for this scene
    }

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    // ── Dialogue muffle filter (lowpass on ambient bus) ──
    this.ambientMuffleFilter = ctx.createBiquadFilter();
    this.ambientMuffleFilter.type = 'lowpass';
    this.ambientMuffleFilter.frequency.value = this.muffleEnabled ? 800 : 22050;
    this.ambientMuffleFilter.Q.value = 1.0;

    // ── Ambient reverb (convolver with dry/wet mix) ──
    const reverbPreset = this.currentReverbPreset ?? this.getDefaultReverbPreset(sceneId);
    const reverbConfig = REVERB_PRESETS[reverbPreset] ?? REVERB_PRESETS['small_room'];

    this.ambientConvolver = tryCreateConvolver(
      ctx,
      getAmbientReverbImpulse(ctx, reverbConfig.decay),
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

    // Create a dedicated gain node for ambient volume control
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.6;

    // Routing: muffleFilter → (dry [+ reverb]) → ambientGain → masterGain
    this.ambientDryReverbGain.connect(this.ambientGain);
    if (this.ambientConvolver) {
      this.ambientReverbGain.connect(this.ambientGain);
    }

    this.ambientGain.connect(dest);

    // ── Drone oscillator layers ── (connect to muffle filter, not directly to gain)
    for (const layer of config.layers) {
      const nodes = this.createAmbientLayer(ctx, layer, this.ambientMuffleFilter);
      this.ambientNodes.push(nodes);

      // Legacy: support layer-level randomSound for backward compat
      if (layer.randomInterval > 0 && layer.randomSound) {
        this.startLegacyRandomSoundLoop(layer.randomInterval, layer.randomSound);
      }
    }

    // ── Noise layers (rain, wind, steam hiss, etc.) ── (also route through muffle filter)
    if (config.noiseLayers) {
      for (const noiseDef of config.noiseLayers) {
        this.createNoiseLayer(ctx, noiseDef, this.ambientMuffleFilter);
      }
    }

    // ── Scene-level random sound events ── (route through muffle filter)
    if (config.randomSounds) {
      for (const soundDef of config.randomSounds) {
        this.startRandomSoundLoop(soundDef);
      }
    }

    this.currentAmbientScene = sceneId;
  }

  /** Create a single ambient layer (drone oscillator + optional harmonic + LFO) */
  private createAmbientLayer(
    ctx: AudioContext,
    layer: AmbientLayer,
    destination: GainNode,
  ): {
    osc: OscillatorNode;
    gain: GainNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    harmonicOsc?: OscillatorNode;
    harmonicGain?: GainNode;
  } {
    const now = ctx.currentTime;

    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = layer.type;
    osc.frequency.setValueAtTime(layer.frequency, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(layer.gain, now);

    // LFO for frequency modulation (subtle wobble)
    let lfo: OscillatorNode | undefined;
    let lfoGain: GainNode | undefined;
    if (layer.lfoFreq > 0) {
      lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(layer.lfoFreq, now);

      lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(layer.lfoDepth, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
    }

    osc.connect(gain);
    gain.connect(destination);

    // Harmonic layer (optional)
    let harmonicOsc: OscillatorNode | undefined;
    let harmonicGain: GainNode | undefined;
    if (layer.harmonic) {
      harmonicOsc = ctx.createOscillator();
      harmonicOsc.type = layer.harmonic.type;
      harmonicOsc.frequency.setValueAtTime(layer.harmonic.frequency, now);

      harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(layer.harmonic.gain, now);

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(destination);

      harmonicOsc.start(now);
    }

    osc.start(now);
    lfo?.start(now);

    return { osc, gain, lfo, lfoGain, harmonicOsc, harmonicGain };
  }

  /** Create a continuous noise layer (for rain, wind, steam, etc.) */
  private createNoiseLayer(
    ctx: AudioContext,
    noiseDef: NoiseLayerDef,
    destination: GainNode,
  ): void {
    const now = ctx.currentTime;

    // Create a looping white noise buffer (2 seconds, looping)
    const bufferSize = Math.ceil(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter to shape the noise
    const filter = ctx.createBiquadFilter();
    filter.type = noiseDef.filterType;
    filter.frequency.setValueAtTime(noiseDef.filterFreq, now);
    filter.Q.value = noiseDef.filterQ;

    // Gain control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(noiseDef.gain, now);

    // Optional LFO on filter frequency (for wind gusts, etc.)
    if (noiseDef.lfoFreq > 0) {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(noiseDef.lfoFreq, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(noiseDef.lfoDepth, now);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      lfo.start(now);
      this.noiseLfoNodes.push(lfo);
    }

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    source.start(now);

    this.noiseSourceNodes.push(source);
    this.noiseGainNodes.push(gainNode);
    this.noiseFilterNodes.push(filter);
  }

  /** Legacy random sound loop for layer-level randomSound (backward compat) */
  private startLegacyRandomSoundLoop(
    interval: number,
    sound: NonNullable<AmbientLayer['randomSound']>,
  ): void {
    const loop = this.randomSoundLoopRegistry.register();

    const playRandom = () => {
      if (!this.guardRandomSoundLoop(loop)) return;
      if (!this.ctx || !this.ambientMuffleFilter) return;
      this.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = sound.type;
      osc.frequency.setValueAtTime(
        sound.frequency * (0.85 + Math.random() * 0.3),
        now,
      );

      const envGain = this.ctx.createGain();
      envGain.gain.setValueAtTime(sound.gain, now);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

      osc.connect(envGain);
      envGain.connect(this.ambientMuffleFilter);

      osc.start(now);
      safeStop(osc, now + sound.duration + 0.01);
      osc.onended = () => {
        this.disconnectOneShot(osc, envGain);
      };
    };

    const scheduleNext = () => {
      if (!this.guardRandomSoundLoop(loop)) return;
      const delay = interval * (0.8 + Math.random() * 0.4) * 1000;
      loop.timer = setTimeout(() => {
        loop.timer = null;
        if (!this.guardRandomSoundLoop(loop)) return;
        playRandom();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  /** Scene-level random sound loop — tracks every rescheduled timeout for stopAmbient/dispose */
  private startRandomSoundLoop(soundDef: RandomSoundDef): void {
    const loop = this.randomSoundLoopRegistry.register();

    const playSound = () => {
      if (!this.guardRandomSoundLoop(loop)) return;
      if (!this.ctx || !this.ambientMuffleFilter) return;
      this.resume();

      const ctx = this.ctx;
      const now = ctx.currentTime;

      if (soundDef.useNoise) {
        const duration = soundDef.duration;
        const bufferSize = Math.ceil(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const t = i / bufferSize;
          const envelope = Math.exp(-t * 5);
          data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = soundDef.noiseFilterFreq ?? soundDef.frequency;
        filter.Q.value = 1.0;

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(soundDef.gain, now);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        let cleanupPan = () => {};
        source.connect(filter);
        filter.connect(envGain);
        if (soundDef.panStart !== undefined && soundDef.panEnd !== undefined) {
          cleanupPan = connectWithStereoPan(
            ctx,
            envGain,
            this.ambientMuffleFilter,
            soundDef.panStart,
            soundDef.panEnd,
            now,
            duration,
          );
        } else {
          envGain.connect(this.ambientMuffleFilter);
        }

        source.start(now);
        source.onended = () => {
          releaseBufferSource(source);
          this.disconnectOneShot(filter, envGain);
          cleanupPan();
        };
      } else {
        const osc = ctx.createOscillator();
        osc.type = soundDef.type;
        const pitchVar = 0.8 + Math.random() * 0.4;
        osc.frequency.setValueAtTime(soundDef.frequency * pitchVar, now);

        if (soundDef.frequencyRamp) {
          osc.frequency.exponentialRampToValueAtTime(
            soundDef.frequencyRamp * pitchVar,
            now + soundDef.duration,
          );
        }

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(soundDef.gain, now);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + soundDef.duration);

        let cleanupPan = () => {};
        osc.connect(envGain);
        if (soundDef.panStart !== undefined && soundDef.panEnd !== undefined) {
          cleanupPan = connectWithStereoPan(
            ctx,
            envGain,
            this.ambientMuffleFilter,
            soundDef.panStart,
            soundDef.panEnd,
            now,
            soundDef.duration,
          );
        } else {
          envGain.connect(this.ambientMuffleFilter);
        }

        osc.start(now);
        safeStop(osc, now + soundDef.duration + 0.01);
        osc.onended = () => {
          this.disconnectOneShot(osc, envGain);
          cleanupPan();
        };
      }
    };

    const scheduleNext = () => {
      if (!this.guardRandomSoundLoop(loop)) return;
      const { minInterval, maxInterval } = soundDef;
      const baseInterval = minInterval + Math.random() * (maxInterval - minInterval);
      const variation = baseInterval * (0.8 + Math.random() * 0.4);
      const delay = variation * 1000;
      loop.timer = setTimeout(() => {
        loop.timer = null;
        if (!this.guardRandomSoundLoop(loop)) return;
        playSound();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }

  private clearRandomSoundLoops(): void {
    this.randomSoundLoopRegistry.clearAll();
  }

  private flushPendingAmbientCleanup(): void {
    if (this.pendingAmbientCleanupTimer) {
      clearTimeout(this.pendingAmbientCleanupTimer);
      this.pendingAmbientCleanupTimer = null;
    }
    this.pendingAmbientCleanup?.();
    this.pendingAmbientCleanup = null;
  }

  private flushPendingMusicCleanup(): void {
    if (this.pendingMusicCleanupTimer) {
      clearTimeout(this.pendingMusicCleanupTimer);
      this.pendingMusicCleanupTimer = null;
    }
    this.pendingMusicCleanup?.();
    this.pendingMusicCleanup = null;
  }

  /** Stop all ambient sounds */
  stopAmbient(): void {
    this.clearRandomSoundLoops();
    this.flushPendingAmbientCleanup();

    // Stop noise layers and release loop buffers immediately
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

    // Fade out and stop all ambient nodes
    const ctx = this.ctx;
    if (ctx && this.ambientGain) {
      const now = ctx.currentTime;
      // Capture current nodes so the deferred cleanup doesn't kill newly-started ones
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

      if (this.disposed) {
        releaseCapturedAmbient();
      } else {
        gainToDisconnect.gain.setValueAtTime(gainToDisconnect.gain.value, now);
        gainToDisconnect.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        this.pendingAmbientCleanup = releaseCapturedAmbient;
        this.pendingAmbientCleanupTimer = this.scheduleEngineTimer(() => {
          this.pendingAmbientCleanupTimer = null;
          this.pendingAmbientCleanup = null;
          releaseCapturedAmbient();
        }, 600);
      }
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

  /* ─── Ambient Music System ─── */

  /**
   * Play procedural ambient music for a scene.
   * Creates evolving chord pads with LFO, filtering, and reverb.
   * Stops any currently playing music before starting new.
   * @param sceneId — the scene to play music for
   */
  playAmbientMusic(sceneId: SceneId): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // If same scene, do nothing
    if (this.currentMusicScene === sceneId) return;

    // Stop current music
    this.stopAmbientMusic();

    const config = AMBIENT_MUSIC_CONFIGS[sceneId];
    if (!config) {
      this.currentMusicScene = sceneId;
      return;
    }

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // ── Create convolver (reverb) — skipped when unsupported (dry path only) ──
    this.musicConvolver = tryCreateConvolver(ctx, getReverbImpulse(ctx, config.reverbDecay));

    this.musicConvolverGain = ctx.createGain();
    this.musicDryGain = ctx.createGain();

    if (this.musicConvolver) {
      this.musicConvolverGain.gain.value = config.reverbMix;
      this.musicDryGain.gain.value = 1 - config.reverbMix;
      this.musicConvolver.connect(this.musicConvolverGain);
    } else {
      this.musicConvolverGain.gain.value = 0;
      this.musicDryGain.gain.value = 1;
    }

    // ── Music master gain ──
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0, now);
    this.musicGain.gain.linearRampToValueAtTime(config.gain, now + 2); // 2s fade-in

    // ── Filter for pad warmth ──
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = config.filterFreq;
    this.musicFilter.Q.value = config.filterQ;

    // ── LFO on filter cutoff for movement ──
    this.musicLfo = ctx.createOscillator();
    this.musicLfo.type = 'sine';
    this.musicLfo.frequency.setValueAtTime(config.lfoFreq, now);

    this.musicLfoGain = ctx.createGain();
    this.musicLfoGain.gain.setValueAtTime(config.lfoDepth, now);

    this.musicLfo.connect(this.musicLfoGain);
    this.musicLfoGain.connect(this.musicFilter.frequency);

    // ── Routing: pad oscs → filter → gain → (dry [+ wet]) → master ──
    this.musicFilter.connect(this.musicGain);
    this.musicGain.connect(this.musicDryGain);
    if (this.musicConvolver) {
      this.musicGain.connect(this.musicConvolver);
    }
    this.musicDryGain.connect(dest);
    if (this.musicConvolver) {
      this.musicConvolverGain.connect(dest);
    }

    this.musicLfo.start(now);

    // ── Play first chord ──
    this.playMusicChord(config, 0, now);

    // ── Texture layer (detuned oscillator for richness) ──
    if (config.textureLayer) {
      const tl = config.textureLayer;
      this.textureOsc = ctx.createOscillator();
      this.textureOsc.type = tl.type;
      // Use root frequency from first chord × multiplier
      const rootFreq = config.chords[0].frequencies[0] * tl.freqMult;
      this.textureOsc.frequency.setValueAtTime(rootFreq, now);

      this.textureGain = ctx.createGain();
      this.textureGain.gain.setValueAtTime(tl.gain, now);

      // Texture LFO
      this.textureLfo = ctx.createOscillator();
      this.textureLfo.type = 'sine';
      this.textureLfo.frequency.setValueAtTime(tl.lfoFreq, now);

      this.textureLfoGain = ctx.createGain();
      this.textureLfoGain.gain.setValueAtTime(tl.lfoDepth, now);

      this.textureLfo.connect(this.textureLfoGain);
      this.textureLfoGain.connect(this.textureOsc.frequency);

      this.textureOsc.connect(this.textureGain);
      this.textureGain.connect(this.musicFilter);

      this.textureOsc.start(now);
      this.textureLfo.start(now);
    }

    this.currentMusicScene = sceneId;
  }

  /** Play a single chord from the progression and schedule the next */
  private playMusicChord(config: AmbientMusicConfig, chordIndex: number, startTime: number): void {
    if (this.disposed || !this.ctx || !this.musicFilter) return;

    const ctx = this.ctx;
    const chord = config.chords[chordIndex % config.chords.length];
    const now = startTime;

    // Create an oscillator for each voice in the chord
    for (const freq of chord.frequencies) {
      const osc = ctx.createOscillator();
      osc.type = config.padType;
      osc.frequency.setValueAtTime(freq, now);

      // Slight detuning per voice for richness (±3 cents)
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

      const voiceGain = ctx.createGain();
      // Gentle attack
      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.7 / chord.frequencies.length, now + 1.5);

      osc.connect(voiceGain);
      voiceGain.connect(this.musicFilter);

      osc.start(now);
      // Stop after chord duration + fade-out + buffer
      safeStop(osc, now + chord.duration + 1);
      osc.onended = () => {
        this.disconnectOneShot(osc, voiceGain);
      };

      this.musicNodes.push({ osc, gain: voiceGain });
    }

    // Schedule fade-out of current voices near end of chord
    const fadeTime = now + chord.duration - 1;
    for (const node of this.musicNodes) {
      try {
        node.gain.gain.setValueAtTime(node.gain.gain.value, fadeTime);
        node.gain.gain.linearRampToValueAtTime(0.001, fadeTime + 1);
      } catch { /* node may already be stopping */ }
    }

    // Schedule next chord
    this.musicChordTimer = this.scheduleEngineTimer(() => {
      if (this.disposed || !this.ctx || !this.musicFilter) return;
      // Clean up finished oscillators
      this.musicNodes = this.musicNodes.filter((n) => {
        try {
          n.osc.stop();
        } catch { /* already stopped */ }
        this.disconnectOneShot(n.osc, n.gain);
        return false;
      });

      // Schedule next chord
      const nextIndex = (chordIndex + 1) % config.chords.length;
      if (!this.disposed && this.currentMusicScene !== null) {
        this.playMusicChord(config, nextIndex, ctx.currentTime);
      }
    }, chord.duration * 1000);
  }

  /** Stop all ambient music */
  stopAmbientMusic(): void {
    // Clear chord timer
    this.clearTrackedTimer(this.musicChordTimer);
    this.musicChordTimer = null;
    this.flushPendingMusicCleanup();

    const ctx = this.ctx;

    // Fade out music gain
    if (ctx && this.musicGain) {
      const now = ctx.currentTime;
      // Capture current nodes so the deferred cleanup doesn't kill newly-started ones
      const nodesToStop = [...this.musicNodes];
      const lfoToStop = this.musicLfo;
      const textureOscToStop = this.textureOsc;
      const textureLfoToStop = this.textureLfo;
      const gainToDisconnect = this.musicGain;
      const filterToDisconnect = this.musicFilter;
      const convolverToDisconnect = this.musicConvolver;
      const convolverGainToDisconnect = this.musicConvolverGain;
      const dryGainToDisconnect = this.musicDryGain;

      // Immediately clear instance refs so playAmbientMusic can set new ones
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

      if (this.disposed) {
        releaseCapturedMusic();
      } else {
        gainToDisconnect.gain.setValueAtTime(gainToDisconnect.gain.value, now);
        gainToDisconnect.gain.linearRampToValueAtTime(0, now + 1);

        this.pendingMusicCleanup = releaseCapturedMusic;
        this.pendingMusicCleanupTimer = this.scheduleEngineTimer(() => {
          this.pendingMusicCleanupTimer = null;
          this.pendingMusicCleanup = null;
          releaseCapturedMusic();
        }, 1200);
      }
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

  /* ─── Door Sounds ─── */

  /**
   * Play a door opening sound — metallic creak followed by thud.
   */
  playDoorOpen(): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this._playDoorOpenInternal();
    });
  }

  private _playDoorOpenInternal(): void {
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Metallic creak (ascending sawtooth)
    const creakOsc = ctx.createOscillator();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(120, now);
    creakOsc.frequency.exponentialRampToValueAtTime(350, now + 0.25);

    const creakGain = ctx.createGain();
    creakGain.gain.setValueAtTime(0.08, now);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    creakOsc.connect(creakGain);
    this.connectSpatialOneShot(creakGain);
    creakOsc.start(now);
    safeStop(creakOsc, now + 0.35);
    creakOsc.onended = () => {
      this.disconnectOneShot(creakOsc, creakGain);
    };

    // Thud / impact (low frequency noise burst)
    const thudSize = Math.ceil(ctx.sampleRate * 0.1);
    const thudBuffer = ctx.createBuffer(1, thudSize, ctx.sampleRate);
    const thudData = thudBuffer.getChannelData(0);
    for (let i = 0; i < thudSize; i++) {
      const t = i / thudSize;
      thudData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
    }

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
    this.connectSpatialOneShot(thudGain);
    thudSource.start(now + 0.15);
    thudSource.onended = () => {
      releaseBufferSource(thudSource);
      this.disconnectOneShot(thudFilter, thudGain);
    };
  }

  /**
   * Play a door closing sound — slam followed by click.
   */
  playDoorClose(): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this._playDoorCloseInternal();
    });
  }

  private _playDoorCloseInternal(): void {
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Slam (quick low burst)
    const slamSize = Math.ceil(ctx.sampleRate * 0.06);
    const slamBuffer = ctx.createBuffer(1, slamSize, ctx.sampleRate);
    const slamData = slamBuffer.getChannelData(0);
    for (let i = 0; i < slamSize; i++) {
      const t = i / slamSize;
      slamData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    }

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
    this.connectSpatialOneShot(slamGain);
    slamSource.start(now);
    slamSource.onended = () => {
      releaseBufferSource(slamSource);
      this.disconnectOneShot(slamFilter, slamGain);
    };

    // Latch click (sharp square blip)
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(900, now + 0.08);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.12, now + 0.08);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    clickOsc.connect(clickGain);
    this.connectSpatialOneShot(clickGain);
    clickOsc.start(now + 0.08);
    safeStop(clickOsc, now + 0.15);
    clickOsc.onended = () => {
      this.disconnectOneShot(clickOsc, clickGain);
    };
  }

  /* ─── UI Sound Polish ─── */

  /** Play a level-up fanfare — ascending arpeggio with shimmer */
  playLevelUp(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const delay = i * 0.1;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now + delay);
      envGain.gain.linearRampToValueAtTime(0.18, now + delay + 0.03);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

      // Shimmer: add a quiet octave harmonic
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(freq * 2, now + delay);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, now + delay);
      shimmerGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.05);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.connect(envGain);
      this.connectSpatialOneShot(envGain);
      shimmer.connect(shimmerGain);
      this.connectSpatialOneShot(shimmerGain);

      osc.start(now + delay);
      safeStop(osc, now + delay + 0.6);
      osc.onended = () => {
        this.disconnectOneShot(osc, envGain);
      };
      shimmer.start(now + delay);
      safeStop(shimmer, now + delay + 0.5);
      shimmer.onended = () => {
        this.disconnectOneShot(shimmer, shimmerGain);
      };
    });
  }

  /** Play a poem collection sound — ethereal chime with reverb tail */
  playPoemCollect(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Main chime — crystal sine at high frequency
    const chimeFreqs = [1318.5, 1567.98, 2093.0]; // E6, G6, C7

    // Simple reverb via delay feedback
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.15;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;

    reverbGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    this.connectSpatialOneShot(delay);
    this.connectSpatialOneShot(reverbGain);

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
      osc.onended = () => {
        this.disconnectOneShot(osc, envGain);
      };
    });

    // Clean up delay after 3 seconds
    this.scheduleEngineTimer(() => {
      this.disconnectOneShot(reverbGain, delay, feedback);
    }, 3000);
  }

  /** Play a quest complete sound — triumphant three-note fanfare */
  playQuestComplete(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Triumphant I-IV-V pattern
    const notes = [
      { freq: 261.63, time: 0, dur: 0.3 },    // C4
      { freq: 349.23, time: 0.2, dur: 0.3 },   // F4
      { freq: 392.0, time: 0.4, dur: 0.5 },    // G4
      { freq: 523.25, time: 0.5, dur: 0.6 },   // C5 (final)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Add triangle harmonic for warmth
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
      this.connectSpatialOneShot(envGain);
      harm.connect(harmGain);
      this.connectSpatialOneShot(harmGain);

      osc.start(now + time);
      safeStop(osc, now + time + dur + 0.1);
      osc.onended = () => {
        this.disconnectOneShot(osc, envGain);
      };
      harm.start(now + time);
      safeStop(harm, now + time + dur + 0.1);
      harm.onended = () => {
        this.disconnectOneShot(harm, harmGain);
      };
    });
  }

  /** Play a damage sound — harsh impact with low thud */
  playDamage(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Low thud (noise burst)
    const thudSize = Math.ceil(ctx.sampleRate * 0.08);
    const thudBuffer = ctx.createBuffer(1, thudSize, ctx.sampleRate);
    const thudData = thudBuffer.getChannelData(0);
    for (let i = 0; i < thudSize; i++) {
      const t = i / thudSize;
      thudData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 25);
    }

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
    this.connectSpatialOneShot(thudGain);
    thudSource.start(now);
    thudSource.onended = () => {
      releaseBufferSource(thudSource);
      this.disconnectOneShot(thudFilter, thudGain);
    };

    // Harsh high-frequency sting (descending sawtooth)
    const stingOsc = ctx.createOscillator();
    stingOsc.type = 'sawtooth';
    stingOsc.frequency.setValueAtTime(800, now);
    stingOsc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    const stingGain = ctx.createGain();
    stingGain.gain.setValueAtTime(0.1, now);
    stingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    stingOsc.connect(stingGain);
    this.connectSpatialOneShot(stingGain);
    stingOsc.start(now);
    safeStop(stingOsc, now + 0.25);
    stingOsc.onended = () => {
      this.disconnectOneShot(stingOsc, stingGain);
    };
  }

  /** Play a heal sound — gentle ascending shimmer with reverb */
  playHeal(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;

    // Gentle ascending sparkle
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major triad

    notes.forEach((freq, i) => {
      const delay = i * 0.12;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now + delay);
      envGain.gain.linearRampToValueAtTime(0.12, now + delay + 0.05);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

      // Gentle vibrato
      const vibrato = ctx.createOscillator();
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(5, now + delay);

      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 3;

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      osc.connect(envGain);
      this.connectSpatialOneShot(envGain);

      osc.start(now + delay);
      safeStop(osc, now + delay + 1);
      osc.onended = () => {
        this.disconnectOneShot(osc, envGain, vibrato, vibratoGain);
      };
      vibrato.start(now + delay);
      safeStop(vibrato, now + delay + 1);
    });
  }

  /* ─── Spatial Audio ─── */

  /**
   * Play a spatial SFX at a 3D position using PannerNode.
   * Used for NPC barks, ambient sources, and positional audio cues.
   * @param type — SFX preset name
   * @param position — [x, y, z] world position of the sound source
   * @param options — optional panner configuration
   */
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
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const preset = SFX_PRESETS[type] ?? SFX_PRESETS['click'];
    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    const spatial = connectSpatialSource(ctx, dest, position, {
      refDistance: options?.refDistance,
      maxDistance: options?.maxDistance,
      rolloffFactor: options?.rolloffFactor,
      coneInnerAngle: options?.coneInnerAngle,
      coneOuterAngle: options?.coneOuterAngle,
      coneOuterGain: options?.coneOuterGain,
    });

    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.frequency, now);

    // Envelope gain
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(preset.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

    osc.connect(envGain);
    envGain.connect(spatial.input);

    osc.start(now);
    safeStop(osc, now + preset.duration + 0.01);
    osc.onended = () => {
      this.disconnectOneShot(osc, envGain);
      spatial.disconnect();
    };
  }

  /**
   * Play a spatial NPC bark at a 3D position.
   * Creates a distinctive voice-like sound with formant filtering.
   * @param text — bark text (used to vary the sound subtly)
   * @param position — [x, y, z] world position of the NPC
   */
  playSpatialBark(text: string, position: [number, number, number]): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    const spatial = connectSpatialSource(ctx, dest, position, {
      refDistance: 2,
      maxDistance: 20,
      rolloffFactor: 1.5,
    });

    // Generate a brief voice-like tone — frequency varies with text hash
    const textHash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const baseFreq = 150 + (textHash % 100); // 150–250 Hz range

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);

    // Formant filter to simulate vocal tract
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.value = 800 + (textHash % 400); // Varies per character
    formant1.Q.value = 3;

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.frequency.value = 1200 + (textHash % 300);
    formant2.Q.value = 4;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.06, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    const formant2Gain = ctx.createGain();
    formant2Gain.gain.value = 0.3;

    osc.connect(formant1);
    formant1.connect(envGain);
    envGain.connect(spatial.input);

    osc.connect(formant2);
    formant2.connect(formant2Gain);
    formant2Gain.connect(envGain);

    osc.start(now);
    safeStop(osc, now + 0.25);
    osc.onended = () => {
      this.disconnectOneShot(osc, formant1, formant2, envGain, formant2Gain);
      spatial.disconnect();
    };
  }

  /**
   * Create a spatial ambient source at a 3D position.
   * Returns a handle to stop the source later.
   * @param position — [x, y, z] world position
   * @param config — oscillator configuration
   */
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

    const now = ctx.currentTime;

    const spatial = connectSpatialSource(ctx, dest, position, {
      refDistance: 1,
      maxDistance: 25,
      rolloffFactor: 1,
    });

    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(config.gain, now);

    // Optional LFO
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (config.lfoFreq && config.lfoDepth) {
      lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(config.lfoFreq, now);

      lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(config.lfoDepth, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
    }

    osc.connect(gainNode);
    gainNode.connect(spatial.input);
    osc.start(now);

    return {
      setPosition: spatial.setPosition,
      stop: () => {
        const stopNow = ctx.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, stopNow);
        gainNode.gain.linearRampToValueAtTime(0, stopNow + 0.5);
        this.scheduleEngineTimer(() => {
          if (this.disposed) return;
          try { osc.stop(); } catch { /* already stopped */ }
          try { lfo?.stop(); } catch { /* already stopped */ }
          spatial.disconnect();
          this.disconnectOneShot(osc, gainNode, lfo, lfoGain);
        }, 600);
      },
    };
  }

  /* ─── Stingers ─── */

  /**
   * Play a procedural music stinger for key game moments.
   * @param type — stinger type: tension, discovery, danger, emotional, mystery
   */
  playStinger(type: 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery'): void {
    if (this.disposed) return;
    whenAudioReady(() => {
      this._playStingerInternal(type);
    });
  }

  private _playStingerInternal(type: 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery'): void {
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'tension': {
        // Low rising sawtooth (80→200Hz over 2s) + filtered noise
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

        // Filtered noise layer
        const noiseSize = Math.ceil(ctx.sampleRate * 2);
        const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseSize; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * 0.5;
        }
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
        osc.onended = () => {
          this.disconnectOneShot(osc, filter, envGain);
        };
        noiseSource.start(now);
        noiseSource.onended = () => {
          releaseBufferSource(noiseSource);
          this.disconnectOneShot(noiseFilter, noiseGain);
        };
        break;
      }
      case 'discovery': {
        // Bright ascending arpeggio (C5-E5-G5-C6 triangle waves, 150ms each)
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const delay = i * 0.15;
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);

          const envGain = ctx.createGain();
          envGain.gain.setValueAtTime(0, now + delay);
          envGain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
          envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

          // Octave shimmer
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
          osc.onended = () => {
            this.disconnectOneShot(osc, envGain);
          };
          shimmer.start(now + delay);
          safeStop(shimmer, now + delay + 0.7);
          shimmer.onended = () => {
            this.disconnectOneShot(shimmer, shimmerGain);
          };
        });
        break;
      }
      case 'danger': {
        // Harsh descending tone (400→100Hz over 1s) + noise burst
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
        osc.onended = () => {
          this.disconnectOneShot(osc, envGain);
        };

        // Noise burst
        const burstSize = Math.ceil(ctx.sampleRate * 0.15);
        const burstBuffer = ctx.createBuffer(1, burstSize, ctx.sampleRate);
        const burstData = burstBuffer.getChannelData(0);
        for (let i = 0; i < burstSize; i++) {
          const t = i / burstSize;
          burstData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10);
        }
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
        burstSource.onended = () => {
          releaseBufferSource(burstSource);
          this.disconnectOneShot(burstFilter, burstGain);
        };
        break;
      }
      case 'emotional': {
        // Soft sustained chord (A3-C#4-E4 sine waves, 3s fade in/out)
        const chordFreqs = [220, 277.18, 329.63]; // A3, C#4, E4
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
          osc.onended = () => {
            this.disconnectOneShot(osc, envGain);
          };
        });
        break;
      }
      case 'mystery': {
        // Detuned pair (220Hz + 223Hz sine, beating effect, 2s)
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
        const cleanupMystery = () => {
          this.disconnectOneShot(osc1, osc2, envGain);
        };
        osc1.onended = cleanupMystery;
        osc2.onended = cleanupMystery;
        break;
      }
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }

  /* ─── Dialogue Muffle Filter ─── */

  /**
   * Enable dialogue muffle — smoothly ramp ambient lowpass filter down to 800Hz.
   * Creates a "behind the wall" effect so dialogue stands out.
   */
  enableDialogueMuffle(): void {
    if (this.disposed || !this.ctx) return;
    this.muffleEnabled = true;
    const now = this.ctx.currentTime;
    if (this.ambientMuffleFilter) {
      this.ambientMuffleFilter.frequency.setValueAtTime(this.ambientMuffleFilter.frequency.value, now);
      this.ambientMuffleFilter.frequency.linearRampToValueAtTime(800, now + 0.3);
    }
    if (this.sfxMasterGain) {
      this.sfxMasterGain.gain.setValueAtTime(this.sfxMasterGain.gain.value, now);
      this.sfxMasterGain.gain.linearRampToValueAtTime(0.5, now + 0.3);
    }
  }

  /**
   * Disable dialogue muffle — smoothly ramp ambient lowpass filter back to full range.
   */
  disableDialogueMuffle(): void {
    if (this.disposed || !this.ctx) return;
    this.muffleEnabled = false;
    const now = this.ctx.currentTime;
    if (this.ambientMuffleFilter) {
      this.ambientMuffleFilter.frequency.setValueAtTime(this.ambientMuffleFilter.frequency.value, now);
      this.ambientMuffleFilter.frequency.linearRampToValueAtTime(22050, now + 0.5);
    }
    if (this.sfxMasterGain) {
      this.sfxMasterGain.gain.setValueAtTime(this.sfxMasterGain.gain.value, now);
      this.sfxMasterGain.gain.linearRampToValueAtTime(1, now + 0.5);
    }
  }

  /* ─── Ambient Reverb Presets ─── */

  /**
   * Set the reverb preset for the ambient bus.
   * Takes effect on the next playAmbient() call, or immediately if ambient is playing.
   */
  setReverbPreset(preset: string): void {
    this.currentReverbPreset = preset;

    // If ambient is currently playing, apply the new reverb immediately
    if (this.ambientConvolver && this.ctx && this.ambientReverbGain && this.ambientDryReverbGain) {
      const reverbConfig = REVERB_PRESETS[preset] ?? REVERB_PRESETS['small_room'];
      const now = this.ctx.currentTime;

      // Smoothly transition the wet/dry mix
      this.ambientReverbGain.gain.setValueAtTime(this.ambientReverbGain.gain.value, now);
      this.ambientReverbGain.gain.linearRampToValueAtTime(reverbConfig.wetMix, now + 0.5);
      this.ambientDryReverbGain.gain.setValueAtTime(this.ambientDryReverbGain.gain.value, now);
      this.ambientDryReverbGain.gain.linearRampToValueAtTime(1 - reverbConfig.wetMix, now + 0.5);
    }

    this.applySfxReverbPreset(preset, true);
  }

  /** Get default reverb preset based on scene ID */
  private getDefaultReverbPreset(sceneId: SceneId): string {
    if (SCENE_REVERB_PRESETS[sceneId]) return SCENE_REVERB_PRESETS[sceneId];
    return 'small_room';
  }

  /* ─── Volume & Lifecycle ─── */

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  /** Stop all audio immediately */
  stop(): void {
    this.stopAmbient();
    this.stopAmbientMusic();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelPendingEngineTimers();
    this.clearFootstepVoices();
    this.flushPendingAmbientCleanup();
    this.flushPendingMusicCleanup();
    this.stopAmbient();
    this.stopAmbientMusic();

    // Remove blur/focus handlers
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
    if (this.sfxConvolver) {
      releaseConvolver(this.sfxConvolver);
      this.sfxConvolver = null;
    }
    for (const node of [this.sfxDryGain, this.sfxWetGain, this.sfxMasterGain]) {
      if (node) {
        try { node.disconnect(); } catch { /* ignore */ }
      }
    }
    this.sfxDryGain = null;
    this.sfxWetGain = null;
    this.sfxMasterGain = null;
    // Shared AudioContext is closed by disposeSharedAudioContext()
    this.ctx = null;
  }

  /** Re-arm after orchestrator remount (React StrictMode). Idempotent — generation stays bumped until new timers schedule. */
  revive(): void {
    if (!this.disposed) return;
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
