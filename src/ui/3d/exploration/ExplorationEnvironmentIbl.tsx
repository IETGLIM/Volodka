'use client';

/**
 * HDRI через bundled preset drei — без `public/*.hdr`, без подмены `texture.dispose`.
 */

import { memo } from 'react';
import { Environment } from '@react-three/drei';
import type { ExplorationIblPreset } from '@/lib/explorationIblProfiles';

export type ExplorationEnvironmentIblProps = {
  preset: ExplorationIblPreset;
  environmentIntensity: number;
};

export const ExplorationEnvironmentIbl = memo(function ExplorationEnvironmentIbl({
  preset,
  environmentIntensity,
}: ExplorationEnvironmentIblProps) {
  return (
    <Environment
      preset={preset}
      environmentIntensity={environmentIntensity}
      background={false}
    />
  );
});
