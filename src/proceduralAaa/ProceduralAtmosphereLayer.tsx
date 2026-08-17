/**
 * Pillar 6 React — volumetric rays + fog apply + auto LUT sampling hook.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Group, MathUtils, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  applyHeightDistanceFog,
  buildAtmosphereState,
  computeAutoLutTarget,
  createVolumetricRayPlanes,
} from './ProceduralAtmosphere';
import {
  getProceduralAaaParams,
  onProceduralAaaParamsChange,
  resolveSoftWorkForQuality,
} from './params';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

export function ProceduralAtmosphereLayer() {
  const { scene, camera } = useThree();
  const groupRef = useRef<Group>(null);
  const avg = useRef({ r: 0.25, g: 0.28, b: 0.38 });
  const { preset } = useGraphicsQuality();

  const rays = useMemo(() => {
    const p = getProceduralAaaParams();
    const soft = resolveSoftWorkForQuality(preset.id, p);
    if (soft.skipSoftVolumetrics) {
      return createVolumetricRayPlanes(new Vector3(4, 10, -6), 2, soft.volumetricRays);
    }
    const count = Math.max(2, Math.round(4 * soft.volumetricRays));
    return createVolumetricRayPlanes(new Vector3(4, 10, -6), count, soft.volumetricRays);
  }, [preset.id]);

  useEffect(() => {
    const unsub = onProceduralAaaParamsChange((p) => {
      applyHeightDistanceFog(scene, p, camera.position.y);
      if (groupRef.current) {
        const soft = resolveSoftWorkForQuality(preset.id, p);
        groupRef.current.visible = soft.volumetricRays > 0.05 && !soft.skipSoftVolumetrics;
      }
    });
    applyHeightDistanceFog(scene, getProceduralAaaParams(), camera.position.y);
    return unsub;
  }, [scene, camera, preset.id]);

  useFrameTick('misc', () => {
    const p = getProceduralAaaParams();
    applyHeightDistanceFog(scene, p, camera.position.y);
    // Cheap auto-LUT: drift scene average toward fog-tinted night
    const target = computeAutoLutTarget(avg.current, p.autoLutStrength);
    avg.current.r = MathUtils.lerp(avg.current.r, 0.22 + target.lift.r, 0.02);
    avg.current.g = MathUtils.lerp(avg.current.g, 0.25 + target.lift.g, 0.02);
    avg.current.b = MathUtils.lerp(avg.current.b, 0.36 + target.lift.b, 0.02);
    void buildAtmosphereState(p);
  }, { priority: 15, label: 'proceduralAaa/atmosphere' });

  return (
    <group ref={groupRef}>
      <primitive object={rays} />
      {/* Neon key lights for hero readability */}
      <pointLight position={[4, 6, -4]} intensity={2.2} color="#6688ff" distance={28} />
      <pointLight position={[-5, 4, 3]} intensity={1.4} color="#ff4488" distance={22} />
      <pointLight position={[0, 3, 2]} intensity={0.9} color="#aaccff" distance={14} />
      <directionalLight
        position={[6, 14, 4]}
        intensity={0.35}
        color="#8899cc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </group>
  );
}
