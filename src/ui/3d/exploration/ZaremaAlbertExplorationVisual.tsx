'use client';

import { memo, Suspense, useEffect, useState } from 'react';
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
  interiorDeskVisualGroupCenterY,
  interiorWardrobeCenterYFromFloor,
} from '@/lib/explorationInteriorReference';
import { PropModel } from '@/ui/3d/exploration/PropModel';
import { MatrixRainScreenMesh } from '@/ui/3d/exploration/MatrixRainScreenMesh';

/**
 * Визуал квартиры Заремы и Альберта для режима обхода (`RPGGameCanvas`).
 * Только меши — коллайдеры уже в `ZaremaAlbertColliders` (`PhysicsSceneColliders`).
 *
 * GLB-мебель (если появится): после `useGLTF` — ручной `scale` / правка в DCC; персонажи — `modelMeta`.
 * с целями из `INTERIOR_REF_DESK_SURFACE_Y_M`, `INTERIOR_REF_CHAIR_SEAT_SURFACE_Y_M` и т.д.
 *
 * Ковёр — `PropModel` + `carpet_zarema` (`children`: прежняя процедурная геометрия и `carpetMat`).
 * GLB-пропы: стол, стул, лампа, кружка, клавиатура, шкаф (см. `PROP_DEFINITIONS`); настенный «фид» — `MatrixRainScreenMesh`.
 */
const ZAREMA_TV_STATUS_LINES = [
  'duty: OK',
  'Grafana: idle',
  'IB: session token refresh',
] as const;

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

      {/* Настенный «умный» экран (матрица + строки статуса); пост warm-interior даёт мягкий bloom. */}
      <group position={[0.35, 1.42, -hd + t + 0.04]} name="ZaremaWallFeed" userData={{ explorationProp: 'zarema_matrix_tv' }}>
        <MatrixRainScreenMesh
          seed={19}
          width={0.58}
          height={0.36}
          emissive="#22d3ee"
          emissiveIntensity={1.35}
          statusLines={ZAREMA_TV_STATUS_LINES}
        />
      </group>

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
        {/* Процедурный «томик» вместо плоского «ноутбука» — кибер-экран вынесен на стену. */}
        <mesh position={[0, 0.2, 0.02]} castShadow>
          <boxGeometry args={[0.22, 0.06, 0.28]} />
          <meshStandardMaterial color="#3d2f25" roughness={0.88} metalness={0.04} />
        </mesh>
      </group>

      <Suspense fallback={null}>
        <group position={[-3.45, interiorDeskVisualGroupCenterY(0), 1.92]} rotation={[0, Math.PI / 2, 0]}>
          <PropModel propId="desk_volodka" sceneScale={explorationCharacterModelScale} />
          <PropModel
            propId="mug_techsupport"
            sceneScale={explorationCharacterModelScale}
            position={[0.4, 0.48, 0.16]}
            rotation={[0, 0.28, 0]}
          />
          <PropModel
            propId="keyboard_ibm"
            sceneScale={explorationCharacterModelScale}
            position={[-0.26, 0.44, 0.1]}
            rotation={[-Math.PI / 2 + 0.06, 0, 0.1]}
          />
          <PropModel
            propId="lamp_desk"
            sceneScale={explorationCharacterModelScale}
            position={[0.32, 0.5, -0.2]}
            rotation={[0, -0.2, 0]}
          />
        </group>
        <PropModel
          propId="chair_volodka"
          sceneScale={explorationCharacterModelScale}
          position={[-2.38, 0.22, 1.92]}
          rotation={[-Math.PI / 2, Math.PI * 0.78, 0]}
        />
        <PropModel
          propId="wardrobe_soviet"
          sceneScale={explorationCharacterModelScale}
          position={[4.32, interiorWardrobeCenterYFromFloor(0), 0.38]}
          rotation={[0, Math.PI, 0.04]}
        />
      </Suspense>

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

      {/* Акцент на рабочий угол (стол + GLB): тёплый point без теней. */}
      <pointLight position={[-3.05, 1.65, 1.25]} intensity={1.35} color="#ffd6a8" distance={8.5} decay={2} />
      <pointLight position={[0, 2.35, 0]} intensity={0.75} color="#fde68a" distance={16} decay={2} />
      <pointLight position={[-2.5, 1.75, 2.1]} intensity={0.44} color="#bae6fd" distance={11} decay={2} />
      <pointLight position={[3, 1.5, -2.2]} intensity={0.32} color="#fdba74" distance={9} decay={2} />
      <pointLight position={[2.2, 1.55, -0.35]} intensity={0.55} color="#fff7d6" distance={7} decay={2} />
    </group>
  );
});
