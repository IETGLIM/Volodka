'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';

interface AudioManagerConfig {
  stress: number;
  panicMode: boolean;
  sceneId: string;
  enabled: boolean;
}

// URLs для аудио (можно заменить на реальные файлы)
const AUDIO_CONFIG = {
  ambient: {
    calm: '/audio/ambient-calm.mp3',
    tense: '/audio/ambient-tense.mp3',
  },
  ui: {
    click: '/audio/click.mp3',
    hover: '/audio/hover.mp3',
    notification: '/audio/notification.mp3',
  },
  sfx: {
    glitch: '/audio/glitch.mp3',
    heartbeat: '/audio/heartbeat.mp3',
    breath: '/audio/breath.mp3',
  }
};

// Глобальный менеджер аудио
class GameAudioManager {
  private ambientCalm: Howl | null = null;
  private ambientTense: Howl | null = null;
  private heartbeat: Howl | null = null;
  private initialized = false;
  private currentStress = 0;

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    // Инициализация аудио с заглушками (тихий fallback при отсутствии файлов)
    // Примечание: процедурная музыка обрабатывается отдельно в useAmbientMusic.ts
    this.ambientCalm = new Howl({
      src: [AUDIO_CONFIG.ambient.calm],
      loop: true,
      volume: 0.3,
      html5: true,
      onloaderror: () => {}, // Тихий fallback - процедурная музыка работает параллельно
    });

    this.ambientTense = new Howl({
      src: [AUDIO_CONFIG.ambient.tense],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => {}, // Тихий fallback
    });

    this.heartbeat = new Howl({
      src: [AUDIO_CONFIG.sfx.heartbeat],
      loop: true,
      volume: 0,
      rate: 1,
      onloaderror: () => {}, // Тихий fallback
    });

    this.initialized = true;
  }

  startAmbient() {
    if (!this.initialized) return;
    this.ambientCalm?.play();
    this.ambientTense?.play();
    this.heartbeat?.play();
  }

  stopAmbient() {
    this.ambientCalm?.stop();
    this.ambientTense?.stop();
    this.heartbeat?.stop();
  }

  updateStress(stress: number, panicMode: boolean) {
    if (!this.initialized) return;
    
    const stressNorm = stress / 100; // 0-1
    
    // Crossfade между спокойным и тревожным эмбиентом
    const calmVolume = Math.max(0, 0.3 * (1 - stressNorm * 1.5));
    const tenseVolume = Math.min(0.5, 0.5 * stressNorm);
    
    this.ambientCalm?.volume(calmVolume);
    this.ambientTense?.volume(tenseVolume);

    // Сердцебиение при высоком стрессе
    if (stress > 60 || panicMode) {
      const heartbeatVol = Math.min(0.4, (stress - 60) / 100 + (panicMode ? 0.3 : 0));
      const heartbeatRate = 1 + (stressNorm * 0.5) + (panicMode ? 0.3 : 0);
      this.heartbeat?.volume(heartbeatVol);
      this.heartbeat?.rate(heartbeatRate);
      
      if (!this.heartbeat?.playing()) {
        this.heartbeat?.play();
      }
    } else {
      this.heartbeat?.volume(0);
    }

    this.currentStress = stress;
  }

  playUI(sound: 'click' | 'hover' | 'notification') {
    const url = AUDIO_CONFIG.ui[sound];
    new Howl({
      src: [url],
      volume: 0.3,
      onloaderror: () => {}, // Молча игнорируем ошибку
    }).play();
  }

  playGlitch() {
    const url = AUDIO_CONFIG.sfx.glitch;
    new Howl({
      src: [url],
      volume: 0.2,
      rate: 0.8 + Math.random() * 0.4,
      onloaderror: () => {},
    }).play();
  }

  setMuted(muted: boolean) {
    Howler.mute(muted);
  }
}

// Синглтон менеджера
export const gameAudio = new GameAudioManager();

// Хук для использования в компонентах
export function useAudioManager({ stress, panicMode, sceneId, enabled }: AudioManagerConfig) {
  const startedRef = useRef(false);

  // Инициализация при первом использовании
  useEffect(() => {
    if (enabled && !startedRef.current) {
      gameAudio.init();
      gameAudio.startAmbient();
      startedRef.current = true;
    }

    return () => {
      if (startedRef.current) {
        gameAudio.stopAmbient();
        startedRef.current = false;
      }
    };
  }, [enabled]);

  // Обновление на основе стресса
  useEffect(() => {
    if (enabled) {
      gameAudio.updateStress(stress, panicMode);
    }
  }, [stress, panicMode, enabled]);

  // Воспроизведение UI звуков
  const playClick = useCallback(() => {
    if (enabled) gameAudio.playUI('click');
  }, [enabled]);

  const playHover = useCallback(() => {
    if (enabled) gameAudio.playUI('hover');
  }, [enabled]);

  const playNotification = useCallback(() => {
    if (enabled) gameAudio.playUI('notification');
  }, [enabled]);

  const playGlitch = useCallback(() => {
    if (enabled) gameAudio.playGlitch();
  }, [enabled]);

  return {
    playClick,
    playHover,
    playNotification,
    playGlitch,
  };
}

export default useAudioManager;
