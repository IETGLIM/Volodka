'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { musicEngine } from '@/engine/MusicEngine';
import { readAudioSettings, AUDIO_SETTINGS_CHANGED, type AudioSettingsSnapshot } from '@/engine/audio/AudioSettings';
import { SCENE_LABELS } from '@/engine/menu/menuConstants';

/** Simple sceneId -> display name fallback (augments SCENE_LABELS) */
function sceneDisplayName(sceneId: string): string {
  if (SCENE_LABELS[sceneId]) return SCENE_LABELS[sceneId];
  return sceneId
    .replace(/_/g, ' ')
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

/**
 * v4.45.0 «Ночная тетрадь»: эквалайзер-«WinAmp» вырезан (жалоба арт-ревью —
 * «плеер в лицо съедает атмосферу нарративной RPG»). Осталась тихая строка:
 * иконка звука · сцена · 4 миниатюрных деления громкости. Сворачивается
 * до одной иконки, когда музыки нет.
 */
export function AudioInfoDisplay() {
  const [audioSettings, setAudioSettings] = useState<AudioSettingsSnapshot>(readAudioSettings);
  const [musicScene, setMusicScene] = useState<string | null>(null);
  const [pollTick, setPollTick] = useState(0);

  // Subscribe to audio settings changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AudioSettingsSnapshot>).detail;
      if (detail) setAudioSettings(detail);
    };
    window.addEventListener(AUDIO_SETTINGS_CHANGED, handler);
    return () => window.removeEventListener(AUDIO_SETTINGS_CHANGED, handler);
  }, []);

  // Poll music engine state every 2s (it has no event emitter)
  useEffect(() => {
    const id = setInterval(() => setPollTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  // Read from music engine on poll tick
  useEffect(() => {
    setMusicScene(musicEngine.getCurrentScene());
  }, [pollTick]);

  const isPlaying = musicScene !== null && audioSettings.musicEnabled && !audioSettings.muted;
  const volumePercent = Math.round(audioSettings.musicVolume * 100);
  const activeSceneName = musicScene ? sceneDisplayName(musicScene) : null;

  const toggleMute = useCallback(() => {
    try {
      const nextMuted = !audioSettings.muted;
      localStorage.setItem('volodka_muted', String(nextMuted));
      window.dispatchEvent(new CustomEvent('volodka:audio-settings-changed'));
    } catch {
      /* ignore */
    }
  }, [audioSettings.muted]);

  return (
    <div
      className="audio-info-widget"
      style={{ position: 'fixed', bottom: '8px', right: '8px', zIndex: UI_LAYERS.HUD + 1 }}
      role="status"
      aria-label={`Аудио: ${isPlaying ? 'воспроизведение' : 'пауза'}`}
    >
      <button
        type="button"
        className="audio-info-toggle"
        onClick={toggleMute}
        aria-label={audioSettings.muted ? 'Включить звук' : 'Выключить звук'}
        title={audioSettings.muted ? 'Включить звук' : 'Выключить звук'}
      >
        {audioSettings.muted ? (
          <VolumeX className="w-3.5 h-3.5" style={{ color: 'rgba(130,128,118,0.8)' }} />
        ) : (
          <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--vk-amber)' }} />
        )}
      </button>

      {activeSceneName && isPlaying && (
        <span className="audio-info-scene text-[10px] truncate max-w-[110px]">
          {activeSceneName}
        </span>
      )}

      <div className="audio-info-volume flex gap-[2px] items-end" aria-label={`Громкость: ${volumePercent}%`}>
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className="w-[2px] rounded-full"
            style={{
              height: `${3 + bar * 2}px`,
              background: volumePercent >= bar * 25
                ? 'rgba(226,168,75,0.75)'
                : 'rgba(157,179,200,0.22)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
