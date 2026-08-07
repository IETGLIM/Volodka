/* ─── Mobile LOD player model — same skeleton/animation as full model, ~12 meshes ─── */

import { useRef, useMemo, useEffect, memo } from 'react';
import * as THREE from 'three';
import { boxGeo, capsuleGeo, sphereGeo } from './proceduralNpcShared';
import {
  useProceduralPlayerAnimation,
  type ProceduralPlayerModelProps,
} from './useProceduralPlayerAnimation';
import { ProceduralAviatorGlasses } from './sceneVisuals/volodkaRoom/AviatorGlasses';

export const ProceduralPlayerModelLite = memo(function ProceduralPlayerModelLite({
  modelScale,
  karmaGlow,
  currentAnimRef,
  rotationRef,
}: ProceduralPlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useProceduralPlayerAnimation(groupRef, rotationRef, currentAnimRef);

  const mat = useMemo(
    () => ({
      hoodie: new THREE.MeshPhysicalMaterial({
        color: '#2a2a3a',
        roughness: 0.85,
        metalness: 0.05,
        sheen: 0.65,
        sheenRoughness: 0.3,
      }),
      skin: new THREE.MeshPhysicalMaterial({
        color: '#c4a882',
        roughness: 0.7,
        metalness: 0.05,
        sheen: 0.35,
        sheenRoughness: 0.5,
      }),
      hair: new THREE.MeshPhysicalMaterial({ color: '#2a1e12', roughness: 0.9, sheen: 0.15, sheenRoughness: 0.4 }),
      jeans: new THREE.MeshPhysicalMaterial({ color: '#3a4050', roughness: 0.85, sheen: 0.45, sheenRoughness: 0.35 }),
      sneaker: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 }),
    }),
    [],
  );

  const karmaMat = useMemo(
    () => ({
      wristbandGlow: new THREE.MeshStandardMaterial({
        color: karmaGlow,
        emissive: karmaGlow,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.4,
      }),
      phoneGlow: new THREE.MeshStandardMaterial({
        color: karmaGlow,
        emissive: karmaGlow,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.6,
      }),
      wristbandGeo: new THREE.TorusGeometry(0.034, 0.006, 4, 8),
    }),
    [karmaGlow],
  );

  const geo = useMemo(
    () => ({
      torso: boxGeo(0.40, 0.48, 0.24),
      head: sphereGeo(0.10, 6, 6),
      hair: sphereGeo(0.09, 5, 4),
      arm: capsuleGeo(0.048, 0.36, 3, 5),
      leg: capsuleGeo(0.055, 0.46, 3, 5),
      sneaker: boxGeo(0.085, 0.055, 0.15),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      Object.values(mat).forEach((m) => m.dispose());
    };
  }, [mat]);

  useEffect(() => {
    return () => {
      karmaMat.phoneGlow.dispose();
      karmaMat.wristbandGlow.dispose();
      karmaMat.wristbandGeo.dispose();
    };
  }, [karmaMat]);

  return (
    <group ref={groupRef} scale={[modelScale, modelScale, modelScale]}>
      <group name="torso" position={[0, 1.05, 0.02]} rotation={[0.06, 0, 0]}>
        <mesh castShadow geometry={geo.torso} material={mat.hoodie} />

        <mesh castShadow position={[0.08, -0.12, 0.128]} material={karmaMat.phoneGlow}>
          <boxGeometry args={[0.04, 0.06, 0.003]} />
        </mesh>

        <group name="head" position={[0, 0.47, 0.02]}>
          <mesh castShadow geometry={geo.head} material={mat.skin} />
          <mesh castShadow position={[0, 0.06, -0.02]} geometry={geo.hair} material={mat.hair} />
          {/* FIX: без очков во сне */}
          {(() => {
            const c = currentAnimRef.current?.toLowerCase() ?? '';
            if (c.includes('sleep')) return null;
            return <ProceduralAviatorGlasses />;
          })()}
        </group>

        <group name="leftArm" position={[0.24, 0.18, 0]} rotation={[0, 0, 0.12]}>
          <mesh castShadow position={[0, -0.22, 0]} geometry={geo.arm} material={mat.hoodie} />
          <mesh castShadow position={[0, -0.395, 0]} geometry={karmaMat.wristbandGeo} material={karmaMat.wristbandGlow} />
        </group>

        <group name="rightArm" position={[-0.24, 0.18, 0]} rotation={[0, 0, -0.12]}>
          <mesh castShadow position={[0, -0.22, 0]} geometry={geo.arm} material={mat.hoodie} />
        </group>
      </group>

      <group name="leftLeg" position={[0.09, 0.9, 0]}>
        <mesh castShadow position={[0, -0.28, 0]} geometry={geo.leg} material={mat.jeans} />
        <mesh castShadow position={[0, -0.55, 0.02]} geometry={geo.sneaker} material={mat.sneaker} />
      </group>

      <group name="rightLeg" position={[-0.09, 0.9, 0]}>
        <mesh castShadow position={[0, -0.28, 0]} geometry={geo.leg} material={mat.jeans} />
        <mesh castShadow position={[0, -0.55, 0.02]} geometry={geo.sneaker} material={mat.sneaker} />
      </group>
    </group>
  );
});
