'use client';

import { memo, useMemo } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  DepthOfField,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import type { SceneId } from '@/data/types';
import { explorationChromaOffsetFromStress } from '@/lib/explorationPostFxState';

interface ExplorationPostFXProps {
  sceneId: SceneId;
  visualLite: boolean;
  compactIndoor?: boolean;
  /** Лёгкий DOF только на достаточно быстром GPU (`RPGGameCanvas`: не узкий профиль по ширине). Tone mapping уже на WebGLRenderer. */
  enableSubtleDepthOfField?: boolean;
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
   * Тёплый интерьер (`zarema_albert_room`): мягкий bloom ламп/окна; при высоком стрессе — лёгкая хрома (не смешивается с cyber-веткой).
   */
  explorationWarmInterior?: boolean;
  /** Диалог в обходе — сильнее виньетка (фокус на панели / NPC). */
  dialogueCinematic?: boolean;
  stress?: number;
  panicMode?: boolean;
}


/**
 * Постобработка обхода: по умолчанию выключена (исторический шаг А диагностики мерцания).
 * Включается для `cinematicIntro` или мягко для `explorationCyberGrade` в комнате Володьки.
 */
const WARM_INTERIOR_STRESS_CHROMA_SCALE = 0.38;

export const ExplorationPostFX = memo(function ExplorationPostFX({
  sceneId,
  cinematicIntro,
  explorationCyberGrade,
  explorationWarmInterior,
  dialogueCinematic,
  visualLite,
  enableSubtleDepthOfField = false,
  stress = 0,
  panicMode = false,
}: ExplorationPostFXProps) {
  const chromaOffset = useMemo(() => new THREE.Vector2(0.00085, 0.0015), []);
  const warmStressChroma = useMemo(() => {
    if (!explorationWarmInterior) return new THREE.Vector2(0, 0);
    const t = Math.max(0, stress - 32);
    if (t < 0.5 && !panicMode) return new THREE.Vector2(0, 0);
    const { x, y } = explorationChromaOffsetFromStress(stress, panicMode);
    const s = WARM_INTERIOR_STRESS_CHROMA_SCALE;
    return new THREE.Vector2(x * s, y * s);
  }, [explorationWarmInterior, stress, panicMode]);

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
        {enableSubtleDepthOfField ? (
          <DepthOfField focusDistance={0.018} focalLength={0.018} bokehScale={1.35} height={520} />
        ) : (
          <></>
        )}
      </EffectComposer>
    );
  }

  if (explorationWarmInterior) {
    const stressV = Math.min(0.12, (stress / 100) * 0.1) + (panicMode ? 0.05 : 0);
    const vd = 0.36 + (dialogueCinematic ? 0.12 : 0) + stressV;
    const vo = 0.11 + (dialogueCinematic ? 0.04 : 0) + stressV * 0.35;
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          mipmapBlur
          luminanceThreshold={0.32}
          luminanceSmoothing={0.55}
          intensity={0.44}
          radius={0.5}
        />
        <Vignette eskil={false} offset={vo} darkness={Math.min(0.82, vd)} />
        <ChromaticAberration offset={warmStressChroma} radialModulation={false} modulationOffset={0} />
        {enableSubtleDepthOfField ? (
          <DepthOfField focusDistance={0.022} focalLength={0.016} bokehScale={1.15} height={520} />
        ) : (
          <></>
        )}
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
          luminanceThreshold={volodkaBoost ? 0.2 : 0.28}
          luminanceSmoothing={volodkaBoost ? 0.42 : 0.48}
          intensity={volodkaBoost ? 0.68 : 0.52}
          radius={volodkaBoost ? 0.55 : 0.48}
        />
        <Vignette eskil={false} offset={vignetteOffset} darkness={Math.min(0.82, vignetteDarkness)} />
        <ChromaticAberration
          offset={chromaOffset}
          radialModulation
          modulationOffset={0.12}
        />
        {enableSubtleDepthOfField ? (
          <DepthOfField focusDistance={0.02} focalLength={0.019} bokehScale={1.28} height={520} />
        ) : (
          <></>
        )}
      </EffectComposer>
    );
  }

  return null;
});
