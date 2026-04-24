'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  createVolodkaCarpetTexture,
  createVolodkaWallTexture,
  createVolodkaWoodTexture,
} from '@/ui/3d/exploration/volodkaRoomProceduralTextures';
import {
  INTERIOR_REF_COMPACT_SOFA_GROUP_CENTER_Y_M,
  INTERIOR_REF_WINDOW_HEIGHT_M,
  INTERIOR_REF_WINDOW_WIDTH_M,
  interiorCoffeeTableGroupCenterY,
} from '@/lib/explorationInteriorReference';

/**
 * Визуал квартиры Заремы и Альберта для режима обхода (`RPGGameCanvas`).
 * Только меши — коллайдеры уже в `ZaremaAlbertColliders` (`PhysicsSceneColliders`).
 *
 * GLB-мебель (если появится): после `useGLTF` — ручной `scale` / правка в DCC; персонажи — `modelMeta`.
 * с целями из `INTERIOR_REF_DESK_SURFACE_Y_M`, `INTERIOR_REF_CHAIR_SEAT_SURFACE_Y_M` и т.д.
 */
export const ZaremaAlbertExplorationVisual = memo(function ZaremaAlbertExplorationVisual() {
  const w = 10;
  const d = 8;
  const h = 2.85;
  const t = 0.1;
  const hd = d / 2;

  const { wallMap, woodMap, carpetMap } = useMemo(() => {
    const wallMap = createVolodkaWallTexture();
    wallMap.repeat.set(2.8, 2.1);
    wallMap.offset.set(0, 0);
    const woodMap = createVolodkaWoodTexture();
    woodMap.repeat.set(2.4, 2.4);
    const carpetMap = createVolodkaCarpetTexture();
    carpetMap.repeat.set(2, 1.6);
    return { wallMap, woodMap, carpetMap };
  }, []);

  useEffect(() => {
    return () => {
      wallMap.dispose();
      woodMap.dispose();
      carpetMap.dispose();
    };
  }, [wallMap, woodMap, carpetMap]);

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wallMap,
        color: '#e8dcc8',
        roughness: 0.86,
        metalness: 0.04,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [wallMap],
  );

  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodMap,
        roughness: 0.78,
        metalness: 0.1,
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
      woodMat.dispose();
    };
  }, [wallMat, woodMat]);

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodMap,
        roughness: 0.82,
        metalness: 0.06,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [woodMap],
  );

  const carpetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: carpetMap,
        color: '#fff7ed',
        roughness: 0.9,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [carpetMap],
  );

  useEffect(() => {
    return () => {
      floorMat.dispose();
      carpetMat.dispose();
    };
  }, [floorMat, carpetMat]);

  const landingPlateTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 200;
    const ctx = c.getContext('2d');
    if (!ctx) {
      throw new Error('2D context unavailable for landing plate');
    }
    ctx.fillStyle = '#0c1220';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, c.width - 12, c.height - 12);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 56px ui-monospace, monospace';
    ctx.fillText('III ЭТАЖ', 36, 78);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.92)';
    ctx.font = '26px ui-monospace, monospace';
    ctx.fillText('подъезд Б · кв. Зарема / Альберт', 36, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      landingPlateTex.dispose();
    };
  }, [landingPlateTex]);

  return (
    <group name="ZaremaAlbertExplorationVisual" userData={{ noCameraCollision: true }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[w - 0.12, d - 0.12]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, -0.6]} receiveShadow material={carpetMat}>
        <planeGeometry args={[3.6, 2.8]} />
      </mesh>

      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[t, h, d - 0.2]} />
      </mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[t, h, d - 0.2]} />
      </mesh>
      <mesh
        position={[w / 2 - t - 0.035, 1.38, 0.55]}
        rotation={[0, -Math.PI / 2, 0]}
        userData={{ explorationProp: 'zarema_floor_plate' }}
      >
        <planeGeometry args={[1.15, 0.36]} />
        <meshStandardMaterial
          map={landingPlateTex}
          emissive="#0ea5e9"
          emissiveIntensity={0.14}
          roughness={0.72}
          metalness={0.1}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, h / 2, -hd + t / 2]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[w - 0.2, h, t]} />
      </mesh>

      {/* Окно / ночной силуэт за стеклом (южная стена, +Z). */}
      <mesh position={[0, 1.25, hd - 0.06]} rotation={[0, 0, 0]}>
        <planeGeometry args={[INTERIOR_REF_WINDOW_WIDTH_M, INTERIOR_REF_WINDOW_HEIGHT_M]} />
        <meshStandardMaterial
          color="#0c1a2e"
          emissive="#38bdf8"
          emissiveIntensity={0.35}
          roughness={0.45}
          metalness={0.15}
          transparent
          opacity={0.92}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* «Зеркало Альберта»: восточная стена (+X), рядом с зоной стола — не пересекается с позициями NPC. */}
      <group
        name="AlbertMirror"
        position={[w / 2 - 0.08, 1.08, -0.42]}
        userData={{ explorationProp: 'albert_mirror' }}
      >
        <mesh rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[1.2, 1.5]} />
          <meshStandardMaterial
            color="#0b1220"
            metalness={0.82}
            roughness={0.18}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        <mesh rotation={[0, -Math.PI / 2, 0]} position={[0.04, 0, 0]}>
          <planeGeometry args={[1.32, 1.62]} />
          <meshStandardMaterial
            color="#713f12"
            roughness={0.55}
            metalness={0.25}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      </group>

      <mesh position={[0, h - 0.06, 0]} receiveShadow material={wallMat}>
        <boxGeometry args={[w - 0.15, 0.12, d - 0.15]} />
      </mesh>

      <group position={[0, 0.42, -1.8]}>
        <mesh castShadow receiveShadow material={woodMat}>
          <boxGeometry args={[1.6, 0.08, 0.85]} />
        </mesh>
        <mesh position={[0, 0.32, 0.06]} castShadow>
          <boxGeometry args={[1.35, 0.52, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      <group position={[-2.4, INTERIOR_REF_COMPACT_SOFA_GROUP_CENTER_Y_M, 1.6]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.42, 0.95]} />
          <meshStandardMaterial color="#5c4033" roughness={0.9} map={carpetMap} />
        </mesh>
        <mesh position={[0, 0.38, -0.35]} castShadow receiveShadow>
          <boxGeometry args={[2.05, 0.55, 0.12]} />
          <meshStandardMaterial color="#4a3528" roughness={0.92} />
        </mesh>
      </group>

      <pointLight position={[0, 2.4, 0]} intensity={0.75} color="#fde68a" distance={14} decay={2} />
      <pointLight position={[-2.5, 1.8, 2.2]} intensity={0.38} color="#7dd3fc" distance={9} decay={2} />
      <pointLight position={[3.2, 1.5, -2.4]} intensity={0.28} color="#fb923c" distance={8} decay={2} />
      <pointLight position={[2.35, 1.65, -0.4]} intensity={0.55} color="#fff7d6" distance={5.5} decay={2} />
    </group>
  );
});
