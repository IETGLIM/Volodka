'use client';

import { memo, useMemo } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

interface CameraEffectsProps {
  stress: number;
  panicMode: boolean;
  stability: number;
  creativity: number;
  /** Не монтировать второй `EffectComposer` — пост задаёт `ExplorationPostFX` (volodka_room / blue_pit / zarema_albert_room). */
  deferPostProcessing?: boolean;
}

const CameraEffects = memo(function CameraEffects({
  stress,
  panicMode,
  stability,
  creativity,
  deferPostProcessing = false,
}: CameraEffectsProps) {
  // Хуки всегда в одном порядке (нельзя ранний return до хуков).
  const aberrationOffset = useMemo(
    () =>
      new THREE.Vector2(
        stress * 0.0008 + (panicMode ? 0.002 : 0),
        stress * 0.0008 + (panicMode ? 0.002 : 0),
      ),
    [stress, panicMode],
  );

  const bloomIntensity = useMemo(() => 1.2 + (creativity / 100) * 0.8, [creativity]);

  const vignetteIntensity = useMemo(
    () => 0.3 + ((100 - stability) / 100) * 0.4 + (panicMode ? 0.3 : 0),
    [stability, panicMode],
  );

  const noiseOpacity = useMemo(
    () => 0.04 + (stress / 100) * 0.08 + (panicMode ? 0.06 : 0),
    [stress, panicMode],
  );

  if (deferPostProcessing) {
    return null;
  }

  // Эффекты отключены при низком уровне стресса для оптимизации
  const needsEffects = stress > 20 || stability < 50 || creativity > 60 || panicMode;
  const needsChromaticAberration = stress > 40 || panicMode;

  // Минимальный набор эффектов для нормального состояния
  if (!needsEffects) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom 
          luminanceThreshold={0.8} 
          luminanceSmoothing={0.9} 
          intensity={bloomIntensity}
          mipmapBlur
        />
      </EffectComposer>
    );
  }

  // Полный набор эффектов
  return (
    <EffectComposer multisampling={0}>
      <Bloom 
        luminanceThreshold={0.6} 
        luminanceSmoothing={0.8} 
        intensity={bloomIntensity}
        mipmapBlur
      />
      <Noise 
        opacity={noiseOpacity} 
        blendFunction={BlendFunction.OVERLAY} 
      />
      <Vignette 
        offset={0.3}
        darkness={vignetteIntensity}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration 
        offset={needsChromaticAberration ? aberrationOffset : new THREE.Vector2(0, 0)}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
});

export default CameraEffects;
