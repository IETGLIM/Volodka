'use client';

import { memo, Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, BufferAttribute, BufferGeometry, type Mesh, MeshStandardMaterial, PlaneGeometry, ShaderMaterial } from 'three';

import { createVolodkaRoomCanvasMapsSync, type VolodkaRoomCanvasMaps } from '@/ui/3d/exploration/volodkaRoomTextureBundle';
import { MatrixRainScreenMesh } from '@/ui/3d/exploration/MatrixRainScreenMesh';
import {
  INTERIOR_REF_DOOR_HEIGHT_M,
  INTERIOR_REF_DOOR_WIDTH_M,
  INTERIOR_REF_SOFA_GROUP_CENTER_Y_M,
  interiorDeskVisualGroupCenterY,
  interiorDoorCenterYFromFloor,
  interiorWardrobeCenterYFromFloor,
} from '@/lib/explorationInteriorReference';
import { createGlitchDataPlaneMaterial } from '@/lib/glitchDataPlaneMaterial';
import { PropModel } from '@/ui/3d/exploration/PropModel';
import { StreamingChunk } from '@/ui/3d/exploration/StreamingChunk';
import { buildVolodkaRoomMergedShell } from '@/ui/3d/exploration/volodkaRoomMergedGeometries';

const VOLODKA_MONITOR_LEFT_LINES = ['STATUS: DEGRADED', 'Grafana · Prometheus', 'pod/monitoring-01'] as const;
const VOLODKA_MONITOR_RIGHT_LINES = ['RETRO INCIDENT', 'on-call: Володька', 'silence: 0 active'] as const;

const GEO = {
  monitorBack: new BoxGeometry(0.36, 0.44, 0.028),
  deskPartition: new BoxGeometry(1.12, 0.52, 0.04),
  laptopBase: new BoxGeometry(0.5, 0.28, 0.025),
  corridorVoid: new BoxGeometry(
    INTERIOR_REF_DOOR_WIDTH_M * 1.12,
    INTERIOR_REF_DOOR_HEIGHT_M * 1.06,
    2.45,
  ),
} as const;

const SHARED_ZFIGHT_MAT_PROPS = {
  depthWrite: true,
  depthTest: true,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
} as const;

function ensureUv2(geo: BufferGeometry): void {
  const uv = geo.attributes.uv as BufferAttribute | undefined;
  if (uv && !geo.attributes.uv2) {
    geo.setAttribute('uv2', uv.clone());
  }
}

type VolodkaRoomVisualProps = {
  explorationCharacterModelScale?: number;
};

const VolodkaGlitchPanel = memo(function VolodkaGlitchPanel() {
  const meshRef = useRef<Mesh>(null);
  const material = useMemo(() => createGlitchDataPlaneMaterial('#38bdf8'), []);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const m = meshRef.current?.material;
    if (m && m instanceof ShaderMaterial) {
      m.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh
      ref={meshRef}
      material={material}
      position={[6.86, 1.22, 0.15]}
      rotation={[0, -Math.PI / 2, 0]}
      userData={{ noCameraCollision: true }}
    >
      <planeGeometry args={[1.35, 0.62]} />
    </mesh>
  );
});

const VolodkaRoomVisualInner = memo(function VolodkaRoomVisualInner({
  explorationCharacterModelScale = 1,
}: VolodkaRoomVisualProps) {
  const maps = useMemo(() => createVolodkaRoomCanvasMapsSync(), []);

  const w = 14;
  const d = 10;
  const h = 2.85;
  const t = 0.1;
  const hd = d / 2;
  const doorY = interiorDoorCenterYFromFloor(0);
  const dw = INTERIOR_REF_DOOR_WIDTH_M;
  const dh = INTERIOR_REF_DOOR_HEIGHT_M;
  const doorFaceZ = hd - t - 0.02;
  const jambW = 0.14;
  const jambD = 0.12;

  const merged = useMemo(
    () =>
      buildVolodkaRoomMergedShell({
        w,
        h,
        t,
        hd,
        dw,
        dh,
        doorY,
        doorFaceZ,
        jambW,
        jambD,
      }),
    [w, h, t, hd, dw, dh, doorY, doorFaceZ, jambW, jambD],
  );

  const floorGeometry = useMemo(() => {
    const g = new PlaneGeometry(w - 0.08, d - 0.08);
    g.rotateX(-Math.PI / 2);
    ensureUv2(g);
    return g;
  }, [w, d]);

  const roomMaterials = useMemo(() => {
    const floorMat = new MeshStandardMaterial({
      map: maps.floorMap,
      lightMap: maps.floorLightmap,
      lightMapIntensity: 0.95,
      roughness: 0.82,
      metalness: 0.04,
      ...SHARED_ZFIGHT_MAT_PROPS,
    });
    const carpetMat = new MeshStandardMaterial({
      map: maps.carpetMap,
      roughness: 0.92,
      color: '#ffffff',
      ...SHARED_ZFIGHT_MAT_PROPS,
    });
    const wallMat = new MeshStandardMaterial({
      map: maps.wallMap,
      lightMap: maps.wallLightmap,
      lightMapIntensity: 0.88,
      roughness: 0.88,
      metalness: 0.02,
      ...SHARED_ZFIGHT_MAT_PROPS,
    });
    const woodMat = new MeshStandardMaterial({
      map: maps.woodMap,
      roughness: 0.78,
      metalness: 0.08,
      ...SHARED_ZFIGHT_MAT_PROPS,
    });
    const darkMat = new MeshStandardMaterial({ color: '#050608', roughness: 0.98, metalness: 0.02 });
    const monitorMat = new MeshStandardMaterial({ color: '#0b0f0c', roughness: 0.75, metalness: 0.35 });

    return {
      floorMat,
      carpetMat,
      wallMat,
      woodMat,
      darkMat,
      monitorMat,
    };
  }, [maps]);

  useEffect(
    () => () => {
      const { floorMat, carpetMat, wallMat, woodMat, darkMat, monitorMat } = roomMaterials;
      floorMat.dispose();
      carpetMat.dispose();
      wallMat.dispose();
      woodMat.dispose();
      darkMat.dispose();
      monitorMat.dispose();
      merged.dispose();
      floorGeometry.dispose();
    },
    [roomMaterials, merged, floorGeometry],
  );

  const { floorMat, carpetMat, wallMat, woodMat, darkMat, monitorMat } = roomMaterials;

  return (
    <group name="VolodkaRoomVisual" userData={{ noCameraCollision: true }}>
      {/* Одна люстра: динамические тени персонажа; остальной fill — lightmap + Bloom на emissive мониторов. */}
      <pointLight
        position={[0, 2.35, 0]}
        intensity={0.92}
        color="#e8dcc8"
        distance={22}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow geometry={floorGeometry} material={floorMat} />

      <mesh geometry={merged.wallShell} castShadow receiveShadow material={wallMat} />
      <mesh geometry={merged.woodShell} castShadow receiveShadow material={woodMat} />
      <mesh geometry={merged.darkShell} userData={{ noCameraCollision: true }} material={darkMat} />

      <VolodkaGlitchPanel />

      <PropModel propId="volodka_window" sceneScale={explorationCharacterModelScale} position={[-5.85, 1.05, -hd + t + 0.02]}>
        <mesh receiveShadow>
          <planeGeometry args={[2.2, 1.15]} />
          <meshStandardMaterial
            color="#1a2840"
            emissive="#4a7ab0"
            emissiveIntensity={0.42}
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
      </PropModel>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, -2.2]} receiveShadow renderOrder={1} material={carpetMat}>
        <planeGeometry args={[4.2, 3.2]} />
      </mesh>

      {/*
        GLB (`PropModel`) подвешивает `useGLTF` → без своего Suspense всплывает к глобальному в `RPGGameCanvas`
        и на время загрузки подменяется весь мир (пол/стены исчезают — «чёрная дыра»).
      */}
      <Suspense fallback={null}>
      <group position={[3.2, interiorDeskVisualGroupCenterY(0), 0.1]}>
        <PropModel propId="desk_volodka" sceneScale={explorationCharacterModelScale} />
        <PropModel
          propId="mug_techsupport"
          sceneScale={explorationCharacterModelScale}
          position={[0.42, 0.48, 0.18]}
          rotation={[0, 0.35, 0]}
        />
        <PropModel
          propId="keyboard_ibm"
          sceneScale={explorationCharacterModelScale}
          position={[-0.28, 0.44, 0.12]}
          rotation={[-Math.PI / 2 + 0.08, 0, 0.12]}
        />

        <mesh position={[0, 0.28, -0.05]} castShadow receiveShadow geometry={GEO.deskPartition}>
          <meshStandardMaterial color="#151a22" roughness={0.45} metalness={0.2} />
        </mesh>

        <mesh position={[0.15, 0.52, 0.42]} castShadow geometry={GEO.laptopBase}>
          <meshStandardMaterial
            color="#1a2430"
            emissive="#0ea5e9"
            emissiveIntensity={0.22}
            roughness={0.55}
            metalness={0.25}
          />
        </mesh>

        <group position={[0.52, 0.52, -0.38]}>
          <mesh position={[0, 0, -0.014]} geometry={GEO.monitorBack} material={monitorMat} />
          <group position={[0.19, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <MatrixRainScreenMesh
              seed={41}
              width={0.34}
              height={0.4}
              emissive="#4ade80"
              emissiveIntensity={2.55}
              statusLines={VOLODKA_MONITOR_LEFT_LINES}
            />
          </group>
        </group>

        <group position={[0.52, 0.52, 0.38]}>
          <mesh position={[0, 0, -0.014]} geometry={GEO.monitorBack} material={monitorMat} />
          <group position={[0.19, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <MatrixRainScreenMesh
              seed={73}
              width={0.34}
              height={0.4}
              emissive="#22d3ee"
              emissiveIntensity={2.45}
              statusLines={VOLODKA_MONITOR_RIGHT_LINES}
            />
          </group>
        </group>
      </group>

      <StreamingChunk chunkId="volodka_room::furniture" assets={['/desk_volodka.glb', '/Chair.glb']}>
        <group position={[0.8, interiorDeskVisualGroupCenterY(0), -2.8]}>
          <PropModel propId="desk_volodka" sceneScale={explorationCharacterModelScale} />
          <mesh position={[-0.2, 0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.35, 0.4, 0.25]} />
            <meshStandardMaterial color="#e8d4c0" roughness={0.85} />
          </mesh>
        </group>
        <PropModel
          propId="chair_volodka"
          sceneScale={explorationCharacterModelScale}
          position={[0.15, 0.22, -1.78]}
          rotation={[-Math.PI / 2, Math.PI, 0]}
        />
      </StreamingChunk>

      <StreamingChunk chunkId="volodka_room::props" assets={['/mug.glb', '/Keyboard.glb']}>
        {[
          [5.2, interiorWardrobeCenterYFromFloor(0), 0.2] as const,
          [5.2, interiorWardrobeCenterYFromFloor(0), -1.4] as const,
        ].map((p, i) => (
          <PropModel
            key={`wardrobe-${i}`}
            propId="wardrobe_soviet"
            sceneScale={explorationCharacterModelScale}
            position={[p[0], p[1], p[2]]}
            rotation={[0, i === 0 ? 0.04 : -0.03, 0]}
          />
        ))}

        <PropModel propId="volodka_sofa" sceneScale={explorationCharacterModelScale} position={[-3.8, INTERIOR_REF_SOFA_GROUP_CENTER_Y_M, 1.2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.85, 0.52, 0.88]} />
            <meshStandardMaterial color="#4a3d55" roughness={0.9} map={carpetMat.map} />
          </mesh>
          <mesh position={[0, 0.32, -0.25]} castShadow receiveShadow>
            <boxGeometry args={[1.7, 0.45, 0.15]} />
            <meshStandardMaterial color="#3d3350" roughness={0.92} />
          </mesh>
        </PropModel>
      </StreamingChunk>
      </Suspense>

      <group position={[-4.8, 0.22, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.35, 2.1]} />
          <meshStandardMaterial color="#5c4a4a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.2, 2.05]} />
          <meshStandardMaterial color="#7a5c4a" roughness={0.95} map={carpetMat.map} />
        </mesh>
      </group>

      <mesh position={[0.05, doorY, hd + 1.18]} receiveShadow userData={{ noCameraCollision: true }} geometry={GEO.corridorVoid}>
        <meshStandardMaterial color="#07090d" roughness={0.97} metalness={0.04} emissive="#0c1220" emissiveIntensity={0.06} />
      </mesh>
    </group>
  );
});

/**
 * Комната Володьки: merged shell + lightmap-слоты (процедурно до Blender), один fill-свет, мониторы на emissive + Bloom (`ExplorationPostFX`).
 * Текстуры собираются синхронно; GLB — только внутри вложенного `<Suspense>`, чтобы не гасить оболочку комнаты.
 */
export const VolodkaRoomVisual = memo(function VolodkaRoomVisual(props: VolodkaRoomVisualProps) {
  return <VolodkaRoomVisualInner {...props} />;
});
