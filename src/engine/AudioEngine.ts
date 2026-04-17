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

  stop() {
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
  }
}

export const audioEngine = new AudioEngineImpl();
