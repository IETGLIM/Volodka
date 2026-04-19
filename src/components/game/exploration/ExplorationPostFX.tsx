'use client';

import { memo } from 'react';
import type { SceneId } from '@/data/types';

interface ExplorationPostFXProps {
  sceneId: SceneId;
  visualLite: boolean;
  stress: number;
  /** Квартира / узкий коридор: раньше отключали N8AO в пользу облегчённого стека. */
  compactIndoor?: boolean;
}

/**
 * Шаг А (диагностика мерцания): весь конвейер постобработки отключён — раньше здесь были
 * `EffectComposer` + `N8AO` / `Bloom` / `Vignette` / `Noise` из `@react-three/postprocessing`.
 * Сейчас компонент всегда `return null` — **ни одного** `EffectComposer` в обходе нет (legacy-пост только в `PhysicsRPGCanvas` / демо-режим).
 * См. `RPGGameCanvas`. Если мерцание исчезло → проблема в настройках поста (шаг А1); иначе → шаг Б.
 */
export const ExplorationPostFX = memo(function ExplorationPostFX(_props: ExplorationPostFXProps) {
  return null;
});
