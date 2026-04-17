'use client';

import { useEffect } from 'react';
import type { SceneId } from '@/data/types';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';

/**
 * Синхронизация динамической музыки с состоянием игры.
 * Боевая подложка реализована через `forceBattleMusic` в `AmbientMusicPlayer`.
 */
export function useGameAudioProfile(_sceneId: SceneId, _stress: number) {
  useEffect(() => {
    return () => audioEngine.stop();
  }, []);

  useEffect(() => {
    return eventBus.on('sound:play', ({ type, volume }) => {
      audioEngine.playSfx(type, volume ?? 0.35);
    });
  }, []);
}
