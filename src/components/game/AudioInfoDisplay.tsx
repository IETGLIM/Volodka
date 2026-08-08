'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
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

/** Animated procedural audio visualization bars (CSS-only) */
function AudioBars({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="audio-info-bar"
          style={{
            '--bar-delay': `${i * 0.15}s`,
            '--bar-color': color,
            opacity: active ? 1 : 0.2,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

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
      className="audio-info-widget glass-noise"
      style={{ position: 'fixed', bottom: '8px', right: '8px', zIndex: 11 }}
      role="status"
      aria-label={`Аудио: ${isPlaying ? 'воспроизведение' : 'пауза'}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="audio-info-toggle"
          onClick={toggleMute}
          aria-label={audioSettings.muted ? 'Включить звук' : 'Выключить звук'}
          title={audioSettings.muted ? 'Включить звук' : 'Выключить звук'}
        >
          {audioSettings.muted ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400/80" />
          )}
        </button>

        <AudioBars
          active={isPlaying}
          color={isPlaying ? '#00e5ff' : '#64748b'}
        />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <Music className="w-2.5 h-2.5 text-slate-500 shrink-0" />
            <span className="audio-info-status text-[9px] font-mono">
              {audioSettings.muted
                ? 'Без звука'
                : isPlaying
                  ? 'Воспроизведение'
                  : audioSettings.musicEnabled
                    ? 'Ожидание'
                    : 'Музыка выкл.'}
            </span>
          </div>
          {activeSceneName && isPlaying && (
            <span className="audio-info-scene text-[8px] font-mono text-slate-500 truncate">
              {activeSceneName}
            </span>
          )}
        </div>

        <div className="audio-info-volume" aria-label={`Громкость: ${volumePercent}%`}>
          <div className="flex gap-[1px]">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className="w-[3px] rounded-full"
                style={{
                  height: `${4 + bar * 2}px`,
                  background: volumePercent >= bar * 25
                    ? '#00e5ff'
                    : 'rgba(100,116,139,0.3)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
