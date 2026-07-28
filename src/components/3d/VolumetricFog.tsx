/* ─── Volodka RPG – Volumetric Fog (layered semi-transparent planes) ───
 *  Creates the illusion of volume by stacking multiple semi-transparent
 *  planes at different positions and rotations. Very slow drift and
 *  vertical pulsing add life without hurting performance.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { getFogPlaneCount } from '@/shared/utils/mobileParticleScale';
import { DEFAULT_FOG_CONFIG, FOG_PRESETS, type VolumetricFogConfig } from './fogPresets';

/* ── Pre-computed plane layout ── */

interface FogPlaneData {
  position: [number, number, number];
  rotation: [number, number, number];
  opacityScale: number;
  phase: number;
}

function generatePlaneLayout(config: VolumetricFogConfig): FogPlaneData[] {
  const planes: FogPlaneData[] = [];
  const count = config.planeCount;

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;

    planes.push({
      position: [
        (t - 0.5) * config.spreadX * 2 + (Math.random() - 0.5) * config.spreadX * 0.5,
        config.baseY + Math.random() * 0.3,
        (Math.random() - 0.5) * config.spreadZ * 2,
      ],
      rotation: [
        0,
        Math.random() * Math.PI, // random yaw
        (Math.random() - 0.5) * 0.1, // very slight tilt
      ],
      opacityScale: 0.7 + Math.random() * 0.6, // varied per plane
      phase: Math.random() * Math.PI * 2,
    });
  }

  return planes;
}

/* ── Component ── */

interface VolumetricFogProps {
  config?: Partial<VolumetricFogConfig>;
  sceneId?: string;
}

export function VolumetricFog({ config: userConfig, sceneId }: VolumetricFogProps) {
  const isMobile = useIsMobileVisual();
  const { visualLite } = useMobileVisualPerf();

  const mergedConfig = useMemo<VolumetricFogConfig>(() => {
    const preset = sceneId ? FOG_PRESETS[sceneId] ?? {} : {};
    const merged = { ...DEFAULT_FOG_CONFIG, ...preset, ...userConfig };
    return {
      ...merged,
      planeCount: getFogPlaneCount(merged.planeCount, isMobile, visualLite),
    };
  }, [sceneId, userConfig, isMobile, visualLite]);

  const planeData = useMemo(() => generatePlaneLayout(mergedConfig), [mergedConfig]);

  if (mergedConfig.planeCount <= 0) return null;

  return (
    <group>
      {planeData.map((plane, idx) => (
        <FogPlane
          key={idx}
          data={plane}
          config={mergedConfig}
        />
      ))}
    </group>
  );
}

/* ── Single fog plane with animation ── */

function FogPlane({ data, config }: { data: FogPlaneData; config: VolumetricFogConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const timeRef = useRef(0);

  // Shared geometry — all planes use the same shape
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(config.planeWidth, config.height),
    [config.planeWidth, config.height],
  );

  const baseOpacity = config.opacity * data.opacityScale;

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('weather', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Slow lateral drift
    meshRef.current.position.x += config.driftSpeed * delta;

    // Wrap around when drifting too far
    if (meshRef.current.position.x > config.spreadX * 1.5) {
      meshRef.current.position.x = -config.spreadX * 1.5;
    }

    // Subtle vertical pulsing
    meshRef.current.position.y =
      data.position[1] + Math.sin(t * config.pulseFreq * Math.PI * 2 + data.phase) * config.pulseAmp;

    // Gentle opacity pulsing for breathing effect
    if (materialRef.current) {
      materialRef.current.opacity =
        baseOpacity * (0.85 + 0.15 * Math.sin(t * 0.3 + data.phase));
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={data.position}
      rotation={data.rotation}
      geometry={geometry}
    >
      <meshBasicMaterial
        ref={materialRef}
        color={config.color}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
