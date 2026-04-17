'use client';

import { memo, useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, Noise, N8AO } from '@react-three/postprocessing';
import type { SceneId } from '@/data/types';

interface ExplorationPostFXProps {
  sceneId: SceneId;
  visualLite: boolean;
  stress: number;
}

export const ExplorationPostFX = memo(function ExplorationPostFX({
  sceneId,
  visualLite,
  stress,
}: ExplorationPostFXProps) {
  const bloom = useMemo(() => {
    const nightish = sceneId === 'street_night' || sceneId === 'dream' || sceneId === 'rooftop_night';
    return {
      intensity: nightish ? 0.52 : 0.36,
      threshold: nightish ? 0.58 : 0.66,
      radius: 0.42,
    };
  }, [sceneId]);

  const vignetteDark = useMemo(() => 0.22 + Math.min(0.32, stress / 150), [stress]);

  if (visualLite) {
    return (
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom luminanceThreshold={0.72} intensity={0.2} mipmapBlur radius={0.32} />
        <Vignette eskil={false} offset={0.18} darkness={0.2} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer enableNormalPass multisampling={0}>
      <N8AO halfRes quality="performance" aoRadius={2.2} intensity={0.95} distanceFalloff={0.65} />
      <Bloom
        luminanceThreshold={bloom.threshold}
        intensity={bloom.intensity}
        mipmapBlur
        radius={bloom.radius}
      />
      <Vignette eskil={false} offset={0.14} darkness={vignetteDark} />
      <Noise premultiply opacity={0.035} />
    </EffectComposer>
  );
});
