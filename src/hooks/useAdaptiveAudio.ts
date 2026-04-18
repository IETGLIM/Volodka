import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { createBrowserAudioContext } from '@/lib/browserAudioContext';

interface AudioTrack {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
}

interface AudioOptions {
  masterVolume?: number;
  musicVolume?: number;
  sfxVolume?: number;
}

/**
 * Хук для управления адаптивным аудио
 * Поддерживает кроссфейд между треками на основе стресса
 */
export function useAdaptiveAudio({
  masterVolume = 1.0,
  musicVolume = 0.5,
  sfxVolume = 0.7,
}: AudioOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const tracksRef = useRef<Map<string, { audio: HTMLAudioElement; gainNode: GainNode }>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация AudioContext
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;
    
    try {
      audioContextRef.current = createBrowserAudioContext();
      if (!audioContextRef.current) return;
      void audioContextRef.current.resume().catch(() => {});
      setIsInitialized(true);
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }, []);

  // Воспроизведение фоновой музыки с кроссфейдом
  const playMusic = useCallback((trackId: string, url: string, targetVolume = 0.5) => {
    if (typeof window === 'undefined') return;
    
    // Останавливаем другие треки
    tracksRef.current.forEach((track, id) => {
      if (id !== trackId) {
        track.audio.volume = 0;
        track.audio.pause();
      }
    });

    // Создаём или получаем существующий трек
    let track = tracksRef.current.get(trackId);
    
    if (!track) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = targetVolume * masterVolume * musicVolume;
      
      track = { audio, gainNode: null as unknown as GainNode };
      tracksRef.current.set(trackId, track);
    }

    track.audio.play().catch(() => {
      // Автовоспроизведение заблокировано, нужна инициализация по клику
    });
  }, [masterVolume, musicVolume]);

  // Кроссфейд между двумя треками
  const crossfade = useCallback((
    fromTrackId: string,
    toTrackId: string,
    toUrl: string,
    duration = 2000
  ) => {
    const fromTrack = tracksRef.current.get(fromTrackId);
    const toTrack = tracksRef.current.get(toTrackId) || { 
      audio: new Audio(toUrl), 
      gainNode: null as unknown as GainNode 
    };
    
    if (!tracksRef.current.has(toTrackId)) {
      toTrack.audio.loop = true;
      tracksRef.current.set(toTrackId, toTrack);
    }

    // Запускаем новый трек
    toTrack.audio.volume = 0;
    toTrack.audio.play().catch(() => {});

    // Анимируем переход
    const steps = 60;
    const stepDuration = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      if (fromTrack) {
        fromTrack.audio.volume = (1 - progress) * masterVolume * musicVolume;
      }
      toTrack.audio.volume = progress * masterVolume * musicVolume;

      if (step >= steps) {
        clearInterval(interval);
        if (fromTrack) {
          fromTrack.audio.pause();
        }
      }
    }, stepDuration);
  }, [masterVolume, musicVolume]);

  // Установка громкости на основе стресса
  const setStressBasedVolume = useCallback((stress: number) => {
    // При высоком стрессе делаем музыку тревожнее
    // Это можно использовать для кроссфейда между calm и tension треками
  }, []);

  // Остановка всей музыки
  const stopAllMusic = useCallback(() => {
    tracksRef.current.forEach(track => {
      track.audio.pause();
      track.audio.currentTime = 0;
    });
  }, []);

  // Воспроизведение звукового эффекта
  const playSFX = useCallback((url: string, volume = 1.0) => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio(url);
    audio.volume = volume * masterVolume * sfxVolume;
    audio.play().catch(() => {});
  }, [masterVolume, sfxVolume]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      tracksRef.current.forEach(track => {
        track.audio.pause();
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    initAudio,
    isInitialized,
    playMusic,
    crossfade,
    setStressBasedVolume,
    stopAllMusic,
    playSFX,
  };
}

/**
 * Адаптивный музыкальный плеер
 * Меняет музыку в зависимости от стресса
 */
export function useAdaptiveMusic(stress: number) {
  const { initAudio, playMusic, crossfade, playSFX } = useAdaptiveAudio();
  const previousTrackRef = useRef<string>('calm');
  
  // Определяем, какой трек должен играть (мемоизированное значение)
  const targetTrack = useMemo(() => {
    if (stress >= 80) return 'panic';
    if (stress >= 50) return 'tension';
    return 'calm';
  }, [stress]);

  // Меняем музыку при изменении стресса
  useEffect(() => {
    const fromTrack = previousTrackRef.current;
    
    if (targetTrack !== fromTrack) {
      previousTrackRef.current = targetTrack;
      
      // URL для треков (можно заменить на реальные)
      const trackUrls: Record<string, string> = {
        calm: '/audio/ambient_calm.mp3',
        tension: '/audio/ambient_tension.mp3',
        panic: '/audio/ambient_panic.mp3',
      };
      
      // Кроссфейд между треками
      crossfade(fromTrack, targetTrack, trackUrls[targetTrack] || trackUrls.calm, 3000);
    }
  }, [targetTrack, crossfade]);

  return {
    initAudio,
    playSFX,
    currentTrack: targetTrack,
  };
}

export default useAdaptiveAudio;
