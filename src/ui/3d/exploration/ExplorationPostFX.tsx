'use client';

import { memo, useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { SceneId } from '@/data/types';

interface ExplorationPostFXProps {
  sceneId: SceneId;
  visualLite: boolean;
  stress: number;
  compactIndoor?: boolean;
  /**
   * Кинематографический стек для 3D-интро (Bloom + виньетка + лёгкая хроматическая аберрация).
   * Отключён при `visualLite` или без флага — чтобы не вернуть глобальные артефакты поста в обычном обходе.
   */
  cinematicIntro?: boolean;
  /**
   * Лёгкий «кибер»-пост в геймплее (только `volodka_room`): слабый Bloom + виньетка, без хромы.
   */
  explorationCyberGrade?: boolean;
}

/**
 * Постобработка обхода: по умолчанию выключена (исторический шаг А диагностики мерцания).
 * Включается для `cinematicIntro` или мягко для `explorationCyberGrade` в комнате Володьки.
 */
export const ExplorationPostFX = memo(function ExplorationPostFX({
  cinematicIntro,
  explorationCyberGrade,
  visualLite,
}: ExplorationPostFXProps) {
  const chromaOffset = useMemo(() => new THREE.Vector2(0.00085, 0.0015), []);

  if (visualLite) {
    return null;
  }

  if (cinematicIntro) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.22}
          luminanceSmoothing={0.38}
          intensity={0.95}
          radius={0.55}
        />
        <Vignette eskil={false} offset={0.17} darkness={0.5} />
        <ChromaticAberration offset={chromaOffset} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
    );
  }

  if (explorationCyberGrade) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.38}
          luminanceSmoothing={0.55}
          intensity={0.38}
          radius={0.42}
        />
        <Vignette eskil={false} offset={0.12} darkness={0.38} />
      </EffectComposer>
    );
  }

  return null;
});
