/**
 * Лёгкий аудио-слой поверх процедурного `useAmbientMusic`.
 * Для меню/интро — простые зацикленные клипы (файлы опциональны).
 */

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
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
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

  stop() {
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
  }
}

export const audioEngine = new AudioEngineImpl();
