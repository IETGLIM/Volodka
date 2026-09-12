/**
 * Pillar 7 — Procedural soundscapes (NAudio → Web Audio OfflineAudioContext / BufferSource)
 * + AnalyserNode → shader uniform for flicker.
 */

import type { ProceduralAaaParams } from './params';
import { getSharedAudioContext, whenAudioReady } from '@/engine/SharedAudioContext';

export interface ProceduralSoundscapeHandle {
  start: () => Promise<void>;
  stop: () => void;
  /** 0..1 spectrum energy for shader sync */
  getSpectrumEnergy: () => number;
  setGain: (g: number) => void;
  dispose: () => void;
}

function fillNoiseBuffer(ctx: BaseAudioContext, seconds: number, seed: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      // Pink-ish: lowpass white
      const white = rnd() * 2 - 1;
      lp = lp * 0.98 + white * 0.02;
      // Rain crackle + distant hum
      const t = i / rate;
      const hum = Math.sin(t * Math.PI * 2 * 55) * 0.08 + Math.sin(t * Math.PI * 2 * 110.5) * 0.04;
      const drip = rnd() > 0.997 ? (rnd() - 0.5) * 0.6 : 0;
      data[i] = lp * 0.55 + hum + drip;
    }
  }
  return buf;
}

/** Offline render a short ambience clip (NAudio offline mix equivalent). */
export async function renderOfflineAmbience(
  seconds = 4,
  seed = 4729,
): Promise<AudioBuffer> {
  const offline = new OfflineAudioContext(2, 44100 * seconds, 44100);
  const buf = fillNoiseBuffer(offline, seconds, seed);
  const src = offline.createBufferSource();
  src.buffer = buf;
  const filter = offline.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2400;
  const gain = offline.createGain();
  gain.gain.value = 0.45;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(offline.destination);
  src.start(0);
  return offline.startRendering();
}

export function createProceduralSoundscape(
  params: ProceduralAaaParams,
): ProceduralSoundscapeHandle {
  /* FIX (v4.17.1): используем ОБЩИЙ SharedAudioContext вместо собственного
   * `new AudioContext()`. Каждый смонтированный ProceduralAaaSceneRoot
   * создавал отдельный контекст; Chrome ограничивает ~6 одновременных
   * AudioContext, а dispose() закрывает их асинхронно — при ремаунтах
   * (StrictMode/смена сцен) лимит исчерпывался и звук молчал.
   * OfflineAudioContext для рендера буфера остаётся — он не считается
   * против лимита воспроизводящих контекстов. */
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let gainNode: GainNode | null = null;
  let source: AudioBufferSourceNode | null = null;
  let freqData: Uint8Array | null = null;
  let running = false;

  const ensureCtx = () => {
    if (!ctx) {
      ctx = getSharedAudioContext();
      if (!ctx) return null;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      gainNode = ctx.createGain();
      gainNode.gain.value = params.audioGain;
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);
    }
    return ctx;
  };

  return {
    async start() {
      if (running) return;
      let c = ensureCtx();
      if (!c) {
        // FIX (v4.17.1): общий контекст доступен только после первого жеста
        // пользователя (autoplay-политика Chrome) — ждём готовности и
        // стартуем эмбиенс, как только контекст появится.
        await new Promise<void>((resolve) => whenAudioReady(() => resolve()));
        c = ensureCtx();
        if (!c) return;
      }
      if (c.state === 'suspended') await c.resume();
      const buffer = await renderOfflineAmbience(6, params.seed);
      source = c.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode!);
      source.start();
      running = true;
    },
    stop() {
      try {
        source?.stop();
      } catch {
        /* already stopped */
      }
      source?.disconnect();
      source = null;
      running = false;
    },
    getSpectrumEnergy() {
      if (!analyser || !freqData) return 0;
      analyser.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>);
      let sum = 0;
      const n = Math.min(32, freqData.length);
      for (let i = 0; i < n; i++) sum += freqData[i]!;
      return (sum / (n * 255)) * params.spectrumFlicker;
    },
    setGain(g: number) {
      if (gainNode) gainNode.gain.value = g;
    },
    dispose() {
      this.stop();
      // FIX (v4.17.1): общий контекст НЕ закрываем — им пользуются все
      // аудио-движки игры. Диспозим только собственные узлы.
      try {
        gainNode?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        analyser?.disconnect();
      } catch {
        /* ignore */
      }
      ctx = null;
      analyser = null;
      gainNode = null;
      freqData = null;
    },
  };
}
