/**
 * Hybrid overlay for street_night when procedural AAA flag is on.
 * Keeps Poly Haven PBR ground/facades; adds atmosphere + GLB landmarks.
 *
 * Does NOT mount ProceduralCharacter — PhysicsPlayer / CesiumPlayerModel is
 * the sole player avatar (AAA single-owner). A second walking mannequin caused
 * duplicate character meshes on the hybrid street.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProceduralAtmosphereLayer } from './ProceduralAtmosphereLayer';
import { StreetHybridGlbLandmarks } from './HybridGlbLandmarks';
import {
  onProceduralAaaRegenerate,
  getProceduralAaaGenerationKey,
} from './ProceduralAaaManager';

export function ProceduralAaaHybridOverlay() {
  const [, setGenKey] = useState(getProceduralAaaGenerationKey);
  const groundMeshesRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => onProceduralAaaRegenerate(setGenKey), []);

  const onGroundProxy = useCallback((mesh: THREE.Mesh | null) => {
    groundMeshesRef.current = mesh ? [mesh] : [];
  }, []);

  return (
    <group name="ProceduralAaaHybridOverlay">
      <ProceduralAtmosphereLayer />
      {/* Invisible ground plane for IK raycasts — Poly Haven mesh may be async */}
      <mesh
        ref={onGroundProxy}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        visible={false}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial />
      </mesh>
      {/* Authored landmarks — no repeating box soup on hybrid street */}
      <StreetHybridGlbLandmarks />
    </group>
  );
}
