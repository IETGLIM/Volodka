/* Photographic Poly Haven HDRI for hero scenes — falls back to baked PMREM / drei presets. */

import { Suspense, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Texture } from 'three';
import { useDeviceTier } from '@/hooks/useDeviceTier';
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
  const [map, setMap] = useState<Texture | null>(null);

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

  // FIX S13-9: if a bake `kind` exists (e.g. 'warm_apartment' for volodka_room),
  // render NOTHING while the bake completes (~1 frame via requestAnimationFrame).
  // Previously this fell through to `<Environment preset={fallbackPreset}>` which
  // fetched an EXTERNAL HDRI (drei 'apartment' preset = lebombo_1k.hdr) from
  // raw.githack.com/pmndrs/drei-assets — a nature grassland HDRI that tinted every
  // apartment surface green + added a 1.4MB external dependency + CSP violation.
  // The bake is fast (PMREM on CPU, ~1 frame); rendering null for one frame is
  // invisible. Only scenes WITHOUT a bake kind (kind === null) fall through to
  // the stock preset fallback.
  if (kind) {
    return null;
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
  // v4.7.3: low-tier devices load the 1k HDRI variant (3.1 МБ instead of
  // 6.7 МБ — box-2x downscale, visually identical as IBL at small screens).
  const deviceTier = useDeviceTier();
  const hdri = resolveHeroHdriPath(sceneId, { lowMemory: deviceTier === 'low' });
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
