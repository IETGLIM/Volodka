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
   * «Кино» в геймплее (`volodka_room`, `blue_pit`): bloom мониторов/неона, виньетка, лёгкая хрома (Blade Runner / Matrix).
   */
  explorationCyberGrade?: boolean;
  /**
   * Тёплый интерьер (`zarema_albert_room`): мягкий bloom ламп/окна, виньетка без «кибер»-хромы.
   */
  explorationWarmInterior?: boolean;
  /** Диалог в обходе — сильнее виньетка (фокус на панели / NPC). */
  dialogueCinematic?: boolean;
}

/**
 * Постобработка обхода: по умолчанию выключена (исторический шаг А диагностики мерцания).
 * Включается для `cinematicIntro` или мягко для `explorationCyberGrade` в комнате Володьки.
 */
export const ExplorationPostFX = memo(function ExplorationPostFX({
  sceneId,
  cinematicIntro,
  explorationCyberGrade,
  explorationWarmInterior,
  dialogueCinematic,
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

  if (explorationWarmInterior) {
    const vd = 0.36 + (dialogueCinematic ? 0.12 : 0);
    const vo = 0.11 + (dialogueCinematic ? 0.04 : 0);
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.32}
          luminanceSmoothing={0.55}
          intensity={0.44}
          radius={0.5}
        />
        <Vignette eskil={false} offset={vo} darkness={Math.min(0.78, vd)} />
      </EffectComposer>
    );
  }

  if (explorationCyberGrade) {
    const volodkaBoost = sceneId === 'volodka_room';
    const vignetteDarkness = (volodkaBoost ? 0.44 : 0.48) + (dialogueCinematic ? 0.14 : 0);
    const vignetteOffset = 0.14 + (dialogueCinematic ? 0.05 : 0);
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          luminanceThreshold={volodkaBoost ? 0.26 : 0.28}
          luminanceSmoothing={volodkaBoost ? 0.44 : 0.48}
          intensity={volodkaBoost ? 0.6 : 0.52}
          radius={volodkaBoost ? 0.52 : 0.48}
        />
        <Vignette eskil={false} offset={vignetteOffset} darkness={Math.min(0.82, vignetteDarkness)} />
        <ChromaticAberration
          offset={chromaOffset}
          radialModulation
          modulationOffset={0.12}
        />
      </EffectComposer>
    );
  }

  return null;
});
