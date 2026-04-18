/**
 * Лёгкий аудио-слой поверх процедурного `useAmbientMusic`.
 * Для меню/интро — простые зацикленные клипы (файлы опциональны).
 */

import { createBrowserAudioContext } from '@/lib/browserAudioContext';

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
      const freq =
        type === 'loot' ? 560 : type === 'skill' ? 720 : type === 'ui' ? 480 : 440;
      osc.frequency.value = freq;
      gain.gain.value = volume * 0.12;
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
      osc.onended = () => void ctx.close();
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
      src.onended = () => void ctx.close();
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
