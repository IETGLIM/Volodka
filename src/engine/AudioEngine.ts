/**
 * Лёгкий аудио-слой поверх процедурного `useAmbientMusic`.
 * Для меню/интро — простые зацикленные клипы (файлы опциональны).
 */

import { createBrowserAudioContext } from '@/lib/browserAudioContext';
import { UI_SFX_FILE_OVERRIDES } from '@/lib/uiSfxMap';

type TrackId = 'menu' | 'intro' | 'ambient';

class AudioEngineImpl {
  private muted = false;
  private current: HTMLAudioElement | null = null;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.current) this.current.muted = muted;
  }

  playMusic(trackId: TrackId | string) {
    if (this.muted || typeof window === 'undefined') return;
    try {
      this.stop();
      const path =
        trackId === 'menu' || trackId === 'intro'
          ? `/audio/ui/${trackId === 'menu' ? 'menu_ambient' : 'intro_ambient'}.mp3`
          : `/audio/ui/${trackId}.mp3`;
      const a = new Audio(path);
      a.loop = trackId !== 'intro';
      a.volume = 0.22;
      a.muted = this.muted;
      void a.play().catch(() => {});
      this.current = a;
    } catch {
      /* ignore */
    }
  }

  playAmbient(_sceneId: string) {
    /* Процедурный эмбиент уже ведёт `AmbientMusicPlayer` — точка расширения под клипы по сцене. */
  }

  /** Короткий SFX по событию `sound:play` (файлы опциональны — есть программный fallback). */
  playSfx(type: string, volume = 0.35) {
    if (this.muted || typeof window === 'undefined') return;
    const entry = UI_SFX_FILE_OVERRIDES[type];
    const mapped =
      entry === undefined
        ? undefined
        : Array.isArray(entry)
          ? entry[Math.floor(Math.random() * entry.length)]
          : entry;
    if (mapped) {
      try {
        const a = new Audio(mapped);
        a.volume = volume;
        a.muted = this.muted;
        void a.play().catch(() => this.playSfxBeep(type, volume));
      } catch {
        this.playSfxBeep(type, volume);
      }
      return;
    }
    /** Шаги по материалу — только процедурный звук (нет `sfx_footstep_*.mp3` в `public/` → без 404 в консоли). */
    if (type.startsWith('footstep_')) {
      this.playFootstepBeep(type.slice('footstep_'.length), volume);
      return;
    }
    const a = new Audio(`/audio/ui/sfx_${type}.mp3`);
    a.volume = volume;
    a.muted = this.muted;
    void a.play().catch(() => {
      const b = new Audio(`/audio/ui/${type}.mp3`);
      b.volume = volume;
      b.muted = this.muted;
      void b.play().catch(() => this.playSfxBeep(type, volume));
    });
  }

  private playSfxBeep(type: string, volume: number) {
    if (type.startsWith('footstep_')) {
      this.playFootstepBeep(type.slice('footstep_'.length), volume);
      return;
    }
    try {
      const ctx = createBrowserAudioContext();
      if (!ctx) return;
      void ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const base =
        type === 'ui_success'
          ? 620
          : type === 'ui_fail'
            ? 280
            : type === 'loot'
              ? 560
              : type === 'skill'
                ? 720
                : type === 'ui'
                  ? 480
                  : 440;
      const variance = Math.random() * 40 - 20;
      osc.frequency.value = base + variance;
      gain.gain.value = volume * 0.12;
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }
  }

  /** Короткий «сухой» шаг без семпла: полосовой шум + затухание по материалу. */
  private playFootstepBeep(material: string, volume: number) {
    try {
      const ctx = createBrowserAudioContext();
      if (!ctx) return;
      void ctx.resume().catch(() => {});
      const dur = 0.045;
      const sampleRate = ctx.sampleRate;
      const n = Math.floor(sampleRate * dur);
      const buf = ctx.createBuffer(1, n, sampleRate);
      const data = buf.getChannelData(0);
      const center =
        material === 'wood'
          ? 0.22
          : material === 'concrete'
            ? 0.42
            : material === 'grass'
              ? 0.14
              : material === 'metal'
                ? 0.55
                : material === 'carpet'
                  ? 0.1
                  : 0.28;
      const q = material === 'metal' ? 4.2 : 2.4;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const env = Math.sin((t * Math.PI) ** 1.6) * (1 - t * 0.35);
        const noise = (Math.random() * 2 - 1) * env;
        const ph = 2 * Math.PI * center * i;
        const tone = Math.sin(ph) * (material === 'metal' ? 0.35 : 0.2) * env;
        data[i] = (noise * 0.55 + tone) * volume * 0.45;
      }
      const src = ctx.createBufferSource();
      const filt = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buf;
      filt.type = 'bandpass';
      filt.frequency.value =
        material === 'wood'
          ? 380
          : material === 'concrete'
            ? 620
            : material === 'grass'
              ? 260
              : material === 'metal'
                ? 1100
                : material === 'carpet'
                  ? 220
                  : 440;
      filt.Q.value = q;
      gain.gain.value = 0.85;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + dur + 0.02);
      src.onended = () => {
        try {
          src.disconnect();
          filt.disconnect();
          gain.disconnect();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }
  }

  /**
   * Низкий «гул кабины» для интро-лифта (WebAudio, без обязательного MP3 в `public/`).
   * Короткий спад громкости в конце — чтобы не резать обрывком.
   */
  playElevatorHum(durationSec: number, volume = 0.18) {
    if (this.muted || typeof window === 'undefined') return;
    try {
      const ctx = createBrowserAudioContext();
      if (!ctx) return;
      void ctx.resume().catch(() => {});
      const dur = Math.min(22, Math.max(0.5, durationSec));
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const band = ctx.createBiquadFilter();
      const out = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(48, t0);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2.4, t0);
      lfoGain.gain.setValueAtTime(14, t0);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      band.type = 'lowpass';
      band.frequency.setValueAtTime(420, t0);
      band.Q.setValueAtTime(0.7, t0);
      out.gain.setValueAtTime(0.0001, t0);
      out.gain.exponentialRampToValueAtTime(volume * 0.055, t0 + 0.35);
      out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(band);
      band.connect(out);
      out.connect(ctx.destination);
      osc.start(t0);
      lfo.start(t0);
      osc.stop(t0 + dur + 0.05);
      lfo.stop(t0 + dur + 0.05);
      osc.onended = () => {
        try {
          osc.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
          band.disconnect();
          out.disconnect();
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }
  }

  stop() {
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
  }
}

export const audioEngine = new AudioEngineImpl();
