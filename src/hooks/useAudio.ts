'use client';

import { useEffect } from 'react';
import type { SceneId } from '@/data/types';
import { audioEngine } from '@/engine/AudioEngine';

/**
 * Синхронизация динамической музыки с состоянием игры.
 * Боевая подложка реализована через `forceBattleMusic` в `AmbientMusicPlayer`.
 */
export function useGameAudioProfile(_sceneId: SceneId, _stress: number) {
  useEffect(() => {
    return () => audioEngine.stop();
  }, []);
}
