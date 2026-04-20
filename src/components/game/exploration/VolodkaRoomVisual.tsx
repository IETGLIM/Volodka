'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  createVolodkaCarpetTexture,
  createVolodkaFloorTexture,
  createVolodkaWallTexture,
  createVolodkaWoodTexture,
} from '@/components/game/exploration/volodkaRoomProceduralTextures';

/**
 * Комната Володьки в обходе: панелька, удалёнка (два ноутбука, стойка мониторов — как `scenes.ts` / коллайдеры).
 * Текстуры процедурные (canvas), без внешних PNG.
 *
 * Шаг В (мерцание / материалы): у процедурных мешей **`depthWrite`** / **`depthTest`** и **`polygonOffset`**
 * (factor/units **1**) — меньше z-fight с полом **`PhysicsFloor`** и между наслоениями; в т.ч. **`woodMat`**.
 */
export const VolodkaRoomVisual = memo(function VolodkaRoomVisual() {
  const w = 14;
  const d = 10;
  const h = 2.85;
  const t = 0.1;
  const hd = d / 2;

  const { wallMap, floorMap, carpetMap, woodMap } = useMemo(() => {
    const wallMap = createVolodkaWallTexture();
    wallMap.repeat.set(3.2, 2.4);

    const floorMap = createVolodkaFloorTexture();
    floorMap.repeat.set(5, 4);

    const carpetMap = createVolodkaCarpetTexture();
    carpetMap.repeat.set(2.2, 1.7);

    const woodMap = createVolodkaWoodTexture();
    woodMap.repeat.set(2, 2);

    return { wallMap, floorMap, carpetMap, woodMap };
  }, []);

  useEffect(() => {
    return () => {
      wallMap.dispose();
      floorMap.dispose();
      carpetMap.dispose();
      woodMap.dispose();
    };
  }, [wallMap, floorMap, carpetMap, woodMap]);

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallMap,
        roughness: 0.88,
        metalness: 0.02,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [wallMap],
  );

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: floorMap,
        roughness: 0.82,
        metalness: 0.04,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [floorMap],
  );

  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodMap,
        roughness: 0.78,
        metalness: 0.08,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [woodMap],
  );

  useEffect(() => {
    return () => {
      wallMat.dispose();
      floorMat.dispose();
      woodMat.dispose();
    };
  }, [wallMat, floorMat, woodMat]);

  return (
    <group name="VolodkaRoomVisual" userData={{ noCameraCollision: true }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[w - 0.08, d - 0.08]} />
      </mesh>

      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[t, h, d - 0.2]} />
      </mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[t, h, d - 0.2]} />
      </mesh>

      <mesh position={[0, h / 2, -hd + t / 2]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[w - 0.2, h, t]} />
      </mesh>
      <mesh position={[-5.85, 1.05, -hd + t + 0.02]} receiveShadow>
        <planeGeometry args={[2.2, 1.15]} />
        <meshStandardMaterial
          color="#1a2840"
          emissive="#4a7ab0"
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.15}
          transparent
          opacity={0.92}
          depthWrite={false}
          depthTest
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh position={[-4.12, h / 2, hd - t / 2]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[5.9 + t, h, t]} />
      </mesh>
      <mesh position={[4.12, h / 2, hd - t / 2]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[5.9 + t, h, t]} />
      </mesh>

      <mesh position={[0, h - 0.06, 0]} receiveShadow material={wallMat}>
        <boxGeometry args={[w - 0.15, 0.12, d - 0.15]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, -2.2]} receiveShadow>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial
          map={carpetMap}
          roughness={0.92}
          color="#ffffff"
          depthWrite
          depthTest
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <group position={[3.2, 0.45, 0.1]}>
        <mesh castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[1.45, 0.08, 0.78]} />
        </mesh>
        <mesh position={[0, 0.28, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.52, 0.04]} />
          <meshStandardMaterial
            color="#151a22"
            roughness={0.45}
            metalness={0.2}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[0.22, 0.46, 0.22]} rotation={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.34, 0.02, 0.22]} />
          <meshStandardMaterial
            color="#2f3640"
            roughness={0.55}
            metalness={0.25}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[-0.12, 0.46, -0.18]} rotation={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.32, 0.02, 0.2]} />
          <meshStandardMaterial
            color="#1e272e"
            roughness={0.55}
            metalness={0.2}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[0.15, 0.52, 0.42]} castShadow>
          <boxGeometry args={[0.5, 0.28, 0.025]} />
          <meshStandardMaterial
            color="#f4e6c2"
            emissive="#c9b87a"
            emissiveIntensity={0.06}
            roughness={0.5}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[0.52, 0.52, -0.38]} castShadow>
          <boxGeometry args={[0.2, 0.24, 0.02]} />
          <meshStandardMaterial
            color="#c0392b"
            emissive="#7f1d1d"
            emissiveIntensity={0.12}
            roughness={0.45}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[0.52, 0.52, 0.38]} castShadow>
          <boxGeometry args={[0.2, 0.24, 0.02]} />
          <meshStandardMaterial
            color="#2980b9"
            emissive="#1d4ed8"
            emissiveIntensity={0.1}
            roughness={0.45}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      </group>

      <group position={[0.8, 0.45, -2.8]}>
        <mesh castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[1.05, 0.08, 0.58]} />
        </mesh>
        <mesh position={[-0.2, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.35, 0.4, 0.25]} />
          <meshStandardMaterial
            color="#e8d4c0"
            roughness={0.85}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      </group>

      {[
        [5.2, 0.95, 0.2] as const,
        [5.2, 0.95, -1.4] as const,
      ].map((p, i) => (
        <mesh key={`wardrobe-${i}`} position={p} castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[0.58, 1.75, 0.68]} />
        </mesh>
      ))}

      <group position={[-3.8, 0.42, 1.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.52, 0.88]} />
          <meshStandardMaterial
            color="#4a3d55"
            roughness={0.9}
            map={carpetMap}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[0, 0.32, -0.25]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.45, 0.15]} />
          <meshStandardMaterial
            color="#3d3350"
            roughness={0.92}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      </group>

      <group position={[-4.8, 0.22, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.35, 2.1]} />
          <meshStandardMaterial
            color="#5c4a4a"
            roughness={0.9}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.2, 2.05]} />
          <meshStandardMaterial
            color="#7a5c4a"
            roughness={0.95}
            map={carpetMap}
            depthWrite
            depthTest
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      </group>

      {/* Чуть вглубь комнаты (−Z): иначе коробка «въезжает» в слой передней стены (z≈4.9–5.0) → z-fight. */}
      <group position={[0.05, 0.55, hd - t - 0.05]}>
        <mesh castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[1.0, 1.85, 0.06]} />
        </mesh>
      </group>

      <pointLight position={[0, 2.35, 0]} intensity={0.65} color="#e8dcc8" distance={18} decay={2} />
      <pointLight position={[2.2, 2.1, 1.5]} intensity={0.38} color="#fef3c7" distance={10} decay={2} />
      <pointLight position={[-4.5, 1.6, -4.8]} intensity={0.28} color="#b8d4f0" distance={8} decay={2} />
    </group>
  );
});
