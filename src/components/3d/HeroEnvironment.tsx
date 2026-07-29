/* Photographic Poly Haven HDRI for hero scenes — falls back to baked PMREM / drei presets. */

import { Suspense, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  getOrBakeHeroEnvMap,
  resolveHeroEnvKind,
  type HeroEnvKind,
} from '@/engine/graphics/proceduralEnvMaps';
import {
  resolveHeroHdriPath,
  usesPhotographicHdriBackground,
} from '@/config/polyhavenAssets';

interface HeroEnvironmentProps {
  sceneId: string;
  intensity: number;
  fallbackPreset: 'night' | 'dawn' | 'sunset' | 'city' | 'park' | 'warehouse' | 'forest' | 'apartment' | 'lobby';
}

function PhotographicHdri({
  files,
  intensity,
  asBackground,
}: {
  files: string;
  intensity: number;
  asBackground: boolean;
}) {
  return (
    <Environment
      files={files}
      path=""
      background={asBackground}
      environmentIntensity={intensity}
    />
  );
}

function BakedOrPresetFallback({
  sceneId,
  intensity,
  fallbackPreset,
}: HeroEnvironmentProps) {
  const gl = useThree((s) => s.gl);
  const kind = resolveHeroEnvKind(sceneId);
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!kind) {
      setMap(null);
      return;
    }
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      try {
        const baked = getOrBakeHeroEnvMap(gl, kind as HeroEnvKind);
        if (!cancelled) setMap(baked);
      } catch {
        if (!cancelled) setMap(null);
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [gl, kind, sceneId]);

  if (kind && map) {
    return <Environment map={map} background={false} environmentIntensity={intensity} />;
  }

  return (
    <Environment
      preset={fallbackPreset}
      background={false}
      environmentIntensity={intensity}
    />
  );
}

export function HeroEnvironment({ sceneId, intensity, fallbackPreset }: HeroEnvironmentProps) {
  const hdri = resolveHeroHdriPath(sceneId);
  const asBackground = usesPhotographicHdriBackground(sceneId);

  if (hdri) {
    return (
      <Suspense
        fallback={
          <BakedOrPresetFallback
            sceneId={sceneId}
            intensity={intensity}
            fallbackPreset={fallbackPreset}
          />
        }
      >
        <PhotographicHdri files={hdri} intensity={intensity} asBackground={asBackground} />
      </Suspense>
    );
  }

  return (
    <BakedOrPresetFallback
      sceneId={sceneId}
      intensity={intensity}
      fallbackPreset={fallbackPreset}
    />
  );
}
