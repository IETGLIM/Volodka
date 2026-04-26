'use client';

import { memo, useEffect, useState } from 'react';
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
} from '@/lib/explorationInteriorReference';
import { PropModel } from '@/ui/3d/exploration/PropModel';

/**
 * Визуал квартиры Заремы и Альберта для режима обхода (`RPGGameCanvas`).
 * Только меши — коллайдеры уже в `ZaremaAlbertColliders` (`PhysicsSceneColliders`).
 *
 * GLB-мебель (если появится): после `useGLTF` — ручной `scale` / правка в DCC; персонажи — `modelMeta`.
 * с целями из `INTERIOR_REF_DESK_SURFACE_Y_M`, `INTERIOR_REF_CHAIR_SEAT_SURFACE_Y_M` и т.д.
 *
 * Ковёр — `PropModel` + `carpet_zarema` (`children`: прежняя процедурная геометрия и `carpetMat`).
 */
type ZaremaAlbertExplorationVisualProps = {
  explorationCharacterModelScale?: number;
};

export const ZaremaAlbertExplorationVisual = memo(function ZaremaAlbertExplorationVisual({
  explorationCharacterModelScale = 1,
}: ZaremaAlbertExplorationVisualProps) {
  const w = 10;
  const d = 8;
  const h = 2.85;
  const t = 0.1;
  const hd = d / 2;

  const [assets, setAssets] = useState<{
    floorMat: THREE.MeshStandardMaterial;
    carpetMat: THREE.MeshStandardMaterial;
    wallMat: THREE.MeshStandardMaterial;
    woodMat: THREE.MeshStandardMaterial;
    landingPlateTex: THREE.CanvasTexture;
  } | null>(null);

  useEffect(() => {
    const wallMap = createVolodkaWallTexture();
    wallMap.repeat.set(2.8, 2.1);
    wallMap.offset.set(0, 0);

    const woodMap = createVolodkaWoodTexture();
    woodMap.repeat.set(2.4, 2.4);

    const carpetMap = createVolodkaCarpetTexture();
    carpetMap.repeat.set(2, 1.6);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallMap,
      color: '#f2e6d4',
      roughness: 0.84,
      metalness: 0.035,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      map: woodMap,
      roughness: 0.78,
      metalness: 0.1,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: woodMap,
      color: '#c4a574',
      roughness: 0.8,
      metalness: 0.05,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetMap,
      color: '#fff7ed',
      roughness: 0.9,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 200;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable for landing plate');
    
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
    
    const landingPlateTex = new THREE.CanvasTexture(c);
    landingPlateTex.colorSpace = THREE.SRGBColorSpace;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setAssets({ floorMat, carpetMat, wallMat, woodMat, landingPlateTex });
    });

    return () => {
      cancelled = true;
      wallMat.dispose();
      woodMat.dispose();
      floorMat.dispose();
      carpetMat.dispose();
      wallMap.dispose();
      woodMap.dispose();
      carpetMap.dispose();
      landingPlateTex.dispose();
    };
  }, []);

  if (!assets) return null;
  const { floorMat, carpetMat, wallMat, woodMat, landingPlateTex } = assets;

  return (
    <group name="ZaremaAlbertExplorationVisual" userData={{ noCameraCollision: true }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow material={floorMat}>
        <planeGeometry args={[w - 0.12, d - 0.12]} />
      </mesh>

      <PropModel propId="carpet_zarema" sceneScale={explorationCharacterModelScale} position={[0, 0.035, -0.6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={carpetMat}>
          <planeGeometry args={[3.6, 2.8]} />
        </mesh>
      </PropModel>

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

      {/* Южная стена (+Z) */}
      <mesh position={[0, h / 2, hd - t / 2]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[w - 0.2, h, t]} />
      </mesh>

      {/* Окно / ночной силуэт за стеклом (южная стена, +Z). */}
      <mesh position={[0, 1.25, hd - t / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[INTERIOR_REF_WINDOW_WIDTH_M, INTERIOR_REF_WINDOW_HEIGHT_M]} />
        <meshStandardMaterial
          color="#0a1528"
          emissive="#5ec8ff"
          emissiveIntensity={0.42}
          roughness={0.4}
          metalness={0.12}
          transparent
          opacity={0.93}
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
        {/* Тёплая настольная лампа — якорь света у книги */}
        <group position={[0.55, 0.2, 0.12]}>
          <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.14, 16]} />
            <meshStandardMaterial color="#3d2c1e" roughness={0.75} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial
              color="#fff8e7"
              emissive="#ffb84d"
              emissiveIntensity={1.35}
              toneMapped={false}
              roughness={0.35}
            />
          </mesh>
        </group>
      </group>

      <group position={[-2.4, INTERIOR_REF_COMPACT_SOFA_GROUP_CENTER_Y_M, 1.6]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.42, 0.95]} />
          <meshStandardMaterial color="#5c4838" roughness={0.93} metalness={0.04} />
        </mesh>
        <mesh position={[0, 0.38, -0.35]} castShadow receiveShadow>
          <boxGeometry args={[2.05, 0.55, 0.12]} />
          <meshStandardMaterial color="#4a3a30" roughness={0.92} metalness={0.03} />
        </mesh>
        <mesh position={[0, 0.48, 0.12]} castShadow receiveShadow>
          <boxGeometry args={[1.95, 0.22, 0.55]} />
          <meshStandardMaterial color="#6b5645" roughness={0.9} metalness={0.02} />
        </mesh>
      </group>

      <pointLight position={[0, 2.4, 0]} intensity={0.88} color="#fde68a" distance={16} decay={2} />
      <pointLight position={[-2.5, 1.8, 2.2]} intensity={0.48} color="#bae6fd" distance={11} decay={2} />
      <pointLight position={[3.2, 1.5, -2.4]} intensity={0.34} color="#fdba74" distance={9} decay={2} />
      <pointLight position={[2.35, 1.65, -0.4]} intensity={0.62} color="#fff7d6" distance={6.5} decay={2} />
      <pointLight position={[0.25, 1.95, -1.45]} intensity={1.05} color="#fff1d6" distance={7} decay={2} />
    </group>
  );
});
