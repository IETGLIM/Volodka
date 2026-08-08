/* ─── City Square: night plaza with monument + neon street edges ───
 * Not a reused alley — open plaza, central obelisk, wet asphalt sheen.
 */

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import {
  PLAZA_MONUMENT_SCALE,
  STREET_FACADE_SCALE,
  STREET_SHUTTER_DOOR_SCALE,
} from '@/config/metricScaleCoherence';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { disposeClonedScene, createSourceSkipSet } from '@/engine/three/disposeThreeResources';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import {
  allowsSelectiveMeshPhysicalWet,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { weatherEnvironmentMaterials } from '@/engine/graphics/materials/weatherEnvironmentMaterials';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { WetStreetGround } from './WetStreetGround';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';

interface CitySquareVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 28;
const D = 28;
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

const matStone = getSharedStandardMaterial({ color: '#3a4050', roughness: 0.8 });
const matCurb = getSharedStandardMaterial({ color: '#2e343e', roughness: 0.72, metalness: 0.08 });
const matNeonCyan = getSharedStandardMaterial({
  color: '#001820',
  emissive: '#00e5ff',
  emissiveIntensity: 0.62,
});
const matNeonMagenta = getSharedStandardMaterial({
  color: '#1a0010',
  emissive: '#ff4488',
  emissiveIntensity: 0.54,
});
const matPlaque = getSharedStandardMaterial({
  color: '#1a2030',
  emissive: '#88aacc',
  emissiveIntensity: 0.55,
  metalness: 0.4,
  roughness: 0.35,
});
const matGlass = getSharedStandardMaterial({
  color: '#88aacc',
  transparent: true,
  opacity: 0.22,
  metalness: 0.1,
  roughness: 0.08,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const matBronze = getSharedStandardMaterial({ color: '#8c6a3d', metalness: 0.58, roughness: 0.46 });
const matLampPost = getSharedStandardMaterial({ color: '#222830', metalness: 0.45, roughness: 0.5 });
const matLampGlow = getSharedStandardMaterial({
  color: '#1a1810',
  emissive: '#ffcc88',
  emissiveIntensity: 1.2,
});

function prepareAuthoredClone(source: THREE.Object3D, castShadow: boolean): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
    }
  });
  weatherEnvironmentMaterials(clone, 'plaza');
  return clone;
}

function AuthoredPlazaProp({
  url,
  position,
  rotationY = 0,
  scale = 1,
  castShadow,
}: {
  url: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  castShadow: boolean;
}) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const cloneRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const next = prepareAuthoredClone(gltf.scene, castShadow);
    if (cloneRef.current) {
      disposeClonedScene(cloneRef.current, { skip: createSourceSkipSet(gltf.scene) });
    }
    cloneRef.current = next;
    setScene(next);
    return () => {
      if (cloneRef.current) {
        disposeClonedScene(cloneRef.current, { skip: createSourceSkipSet(gltf.scene) });
        cloneRef.current = null;
      }
    };
  }, [gltf.scene, castShadow]);

  if (!scene) return null;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

const authoredBenches = [
  { position: [-6, 0, -4] as [number, number, number], rotationY: 0.08, scale: 1.18 },
  { position: [6, 0, -4] as [number, number, number], rotationY: -0.1, scale: 1.18 },
  { position: [-6, 0, 5] as [number, number, number], rotationY: Math.PI + 0.14, scale: 1.12 },
  { position: [6, 0, 5] as [number, number, number], rotationY: Math.PI - 0.08, scale: 1.12 },
  { position: [0, 0, 8] as [number, number, number], rotationY: Math.PI / 2, scale: 1.15 },
  // Match full procedural ring — High previously dropped the ±9 side seats.
  { position: [-9, 0, 1] as [number, number, number], rotationY: Math.PI / 2 + 0.12, scale: 1.1 },
  { position: [9, 0, -1] as [number, number, number], rotationY: -Math.PI / 2 - 0.1, scale: 1.1 },
];

const authoredProps = [
  { url: POLYHAVEN_MODELS.roadBarrier, position: [-10.2, 0, -8.2] as [number, number, number], rotationY: 0.2, scale: 1.45 },
  { url: POLYHAVEN_MODELS.roadBarrierAlt, position: [-6.8, 0, -9.4] as [number, number, number], rotationY: -0.1, scale: 1.15 },
  { url: POLYHAVEN_MODELS.shutterDoor, position: [10.25, 0, -8.3] as [number, number, number], rotationY: Math.PI + 0.02, scale: STREET_SHUTTER_DOOR_SCALE },
  { url: POLYHAVEN_MODELS.metalTrashCan, position: [-9.7, 0, 8.4] as [number, number, number], rotationY: 0.5, scale: 1.15 },
  { url: POLYHAVEN_MODELS.trashbag, position: [-9.25, 0, 8.75] as [number, number, number], rotationY: -0.4, scale: 1.2 },
  { url: POLYHAVEN_MODELS.cardboardBox, position: [9.4, 0, 8.25] as [number, number, number], rotationY: 0.35, scale: 1.25 },
  { url: POLYHAVEN_MODELS.wetFloorSign, position: [3.2, 0, -5.9] as [number, number, number], rotationY: -0.45, scale: 1.1 },
  { url: POLYHAVEN_MODELS.barrel, position: [-3.4, 0, -6.05] as [number, number, number], rotationY: 0.6, scale: 1.08 },
  { url: POLYHAVEN_MODELS.utilityBox, position: [10.4, 0, 8.2] as [number, number, number], rotationY: -0.2, scale: 1.05 },
  { url: POLYHAVEN_MODELS.powerBox, position: [-10.35, 0, 5.8] as [number, number, number], rotationY: Math.PI / 2, scale: 0.9 },
  { url: POLYHAVEN_MODELS.oldTyre, position: [-8.4, 0, 7.6] as [number, number, number], rotationY: 0.7, scale: 1.2 },
  { url: POLYHAVEN_MODELS.manholeCover, position: [4.8, 0.035, 3.2] as [number, number, number], rotationY: 0.2, scale: 1.1 },
  { url: POLYHAVEN_MODELS.woodenCrate, position: [8.75, 0, 7.72] as [number, number, number], rotationY: -0.35, scale: 1.16 },
  { url: POLYHAVEN_MODELS.exteriorAirconUnit, position: [-10.9, 3.6, -2.2] as [number, number, number], rotationY: Math.PI / 2, scale: 1.0 },
  { url: POLYHAVEN_MODELS.exteriorAirconUnit, position: [10.85, 3.85, 1.8] as [number, number, number], rotationY: -Math.PI / 2, scale: 0.92 },
  { url: POLYHAVEN_MODELS.securityCamera, position: [-10.55, 3.1, 3.7] as [number, number, number], rotationY: Math.PI / 2, scale: 0.82 },
  { url: POLYHAVEN_MODELS.securityCamera, position: [10.55, 3.25, -4.4] as [number, number, number], rotationY: -Math.PI / 2, scale: 0.82 },
];

const authoredArchitecture = [
  { url: POLYHAVEN_MODELS.urbanFacade, position: [-13.3, 0, -9.5] as [number, number, number], rotationY: Math.PI / 2 + 0.04, scale: STREET_FACADE_SCALE.hero },
  { url: POLYHAVEN_MODELS.urbanFacade, position: [-13.0, 0, 3.6] as [number, number, number], rotationY: Math.PI / 2 - 0.03, scale: STREET_FACADE_SCALE.mid },
  { url: POLYHAVEN_MODELS.urbanFacade, position: [13.2, 0, -10.3] as [number, number, number], rotationY: -Math.PI / 2 - 0.05, scale: STREET_FACADE_SCALE.hero + 0.04 },
  { url: POLYHAVEN_MODELS.urbanFacade, position: [13.4, 0, 4.2] as [number, number, number], rotationY: -Math.PI / 2 + 0.04, scale: STREET_FACADE_SCALE.mid + 0.02 },
  { url: POLYHAVEN_MODELS.urbanFacade, position: [-4.2, 0, -13.4] as [number, number, number], rotationY: 0.02, scale: STREET_FACADE_SCALE.mid },
  { url: POLYHAVEN_MODELS.urbanFacade, position: [5.6, 0, -13.25] as [number, number, number], rotationY: -0.03, scale: STREET_FACADE_SCALE.mid },
  { url: POLYHAVEN_MODELS.shutterDoor, position: [-10.9, 0, -4.8] as [number, number, number], rotationY: Math.PI / 2, scale: STREET_SHUTTER_DOOR_SCALE },
  { url: POLYHAVEN_MODELS.shutterDoor, position: [10.9, 0, 5.2] as [number, number, number], rotationY: -Math.PI / 2, scale: STREET_SHUTTER_DOOR_SCALE * 0.96 },
  { url: POLYHAVEN_MODELS.fireEscape, position: [-12.85, 0, 1.2] as [number, number, number], rotationY: Math.PI / 2, scale: 1.25 },
  { url: POLYHAVEN_MODELS.fireEscape, position: [12.9, 0, -6.2] as [number, number, number], rotationY: -Math.PI / 2, scale: 1.18 },
];

function AuthoredPlazaDressing({ castShadow }: { castShadow: boolean }) {
  return (
    <group>
      {authoredArchitecture.map((prop, index) => (
        <Suspense key={`authored-architecture-${index}`} fallback={null}>
          <AuthoredPlazaProp castShadow={castShadow} {...prop} />
        </Suspense>
      ))}
      {authoredBenches.map((prop, index) => (
        <Suspense key={`authored-bench-${index}`} fallback={null}>
          <AuthoredPlazaProp url={POLYHAVEN_MODELS.bench} castShadow={castShadow} {...prop} />
        </Suspense>
      ))}
      {authoredProps.map((prop, index) => (
        <Suspense key={`authored-prop-${index}`} fallback={null}>
          <AuthoredPlazaProp castShadow={castShadow} {...prop} />
        </Suspense>
      ))}
      {[
        [-8, -9],
        [8, -9],
        [-8, 10],
        [8, 10],
        [0, -11],
      ].map(([x, z], index) => (
        <Suspense key={`authored-lamp-${index}`} fallback={null}>
          <AuthoredPlazaProp
            url={index % 2 === 0 ? POLYHAVEN_MODELS.streetLamp : POLYHAVEN_MODELS.streetLampAlt}
            position={[x, 0, z]}
            rotationY={index % 2 ? Math.PI / 7 : -Math.PI / 9}
            scale={1.05}
            castShadow={castShadow}
          />
        </Suspense>
      ))}
    </group>
  );
}

function AuthoredPlazaLandmark({ castShadow }: { castShadow: boolean }) {
  return (
    <group>
      {[
        { position: [0, 0, -1.15] as [number, number, number], rotationY: 0, scale: 1.36 },
        { position: [0, 0, 1.15] as [number, number, number], rotationY: Math.PI, scale: 1.36 },
        { position: [-1.15, 0, 0] as [number, number, number], rotationY: Math.PI / 2, scale: 1.28 },
        { position: [1.15, 0, 0] as [number, number, number], rotationY: -Math.PI / 2, scale: 1.28 },
      ].map((prop, index) => (
        <Suspense key={`landmark-barrier-${index}`} fallback={null}>
          <AuthoredPlazaProp
            url={index % 2 === 0 ? POLYHAVEN_MODELS.roadBarrier : POLYHAVEN_MODELS.roadBarrierAlt}
            castShadow={castShadow}
            {...prop}
          />
        </Suspense>
      ))}

      <Suspense fallback={null}>
        <AuthoredPlazaProp
          url={POLYHAVEN_MODELS.gothicStatue}
          position={[0, 0.34, 0]}
          rotationY={Math.PI / 4}
          scale={PLAZA_MONUMENT_SCALE}
          castShadow={castShadow}
        />
      </Suspense>

      <pointLight position={[0, 2.4, 0]} intensity={0.72} color="#c8d6ff" distance={10} decay={2} />
    </group>
  );
}

export function CitySquareVisual(_props: CitySquareVisualProps) {
  const rootRef = useRef<THREE.Group>(null);
  const neonRef = useRef<THREE.Mesh>(null);
  const plaqueRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const useAuthoredDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  // Medium+ gets authored plaza massing; Low keeps procedural boxes.
  const useHighUltraAuthored = preset.id !== 'low';
  const usePhysicalWet = allowsSelectiveMeshPhysicalWet('city_square', selectedPreset, {
    coarsePointer,
  });
  const wetGlass = useMemo(() => getWetGlassPhysicalParams('plazaFacade'), []);
  const wetNeon = useMemo(() => getWetGlassPhysicalParams('neonFascia'), []);
  const wetPuddle = useMemo(
    () => getWetPuddlePhysicalParams(rainIntensity),
    [rainIntensity],
  );
  const plazaPuddles = useMemo(
    () =>
      [
        { pos: [-3.2, 2.4] as const, r: 0.85 },
        { pos: [4.1, -1.8] as const, r: 0.62 },
        { pos: [-5.5, -5.2] as const, r: 0.48 },
        { pos: [2.8, 6.1] as const, r: 0.55 },
      ] as const,
    [],
  );

  const benches = useMemo(
    () =>
      [
        [-6, -4],
        [6, -4],
        [-6, 5],
        [6, 5],
        [0, 8],
        [-9, 1],
        [9, -1],
      ] as const,
    [],
  );

  const lampPosts = useMemo(
    () =>
      [
        [-8, -9],
        [8, -9],
        [-8, 10],
        [8, 10],
        [0, -11],
      ] as const,
    [],
  );

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const pulse = 1.1 + Math.sin(tRef.current * 1.7) * 0.35;
      if (neonRef.current) {
        (neonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }
      if (plaqueRef.current) {
        (plaqueRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.45 + Math.sin(tRef.current * 2.2) * 0.18;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      <WetStreetGround
        sceneId="city_square"
        rainIntensity={rainIntensity}
        size={Math.max(W, D)}
        groundColor="#2a2e38"
      />

      {/* Selective wet asphalt puddles — MeshPhysical clearcoat, few discs only. */}
      {usePhysicalWet && rainIntensity > 0.08
        ? plazaPuddles.map((p, i) => (
            <mesh
              key={`plaza-puddle-${i}`}
              rotation-x={-Math.PI / 2}
              position={[p.pos[0], 0.012, p.pos[1]]}
              geometry={getSharedCircleGeometry(p.r, 16)}
              renderOrder={2}
            >
              <meshPhysicalMaterial
                color="#1a2230"
                roughness={wetPuddle.roughness}
                metalness={wetPuddle.metalness}
                clearcoat={wetPuddle.clearcoat}
                clearcoatRoughness={wetPuddle.clearcoatRoughness}
                transparent
                opacity={wetPuddle.opacity}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={1}
                polygonOffsetUnits={1}
              />
            </mesh>
          ))
        : null}

      {/* Plaza ring + tram rail hints — hidden on high/ultra where GLTF landmark/dressing carries the center read. */}
      {useHighUltraAuthored ? (
        <group>
          {[
            { position: [0, 0.032, 0] as [number, number, number], scale: [9.6, 0.05, 2.0] as [number, number, number], rot: 0 },
            { position: [0, 0.034, 0] as [number, number, number], scale: [9.6, 0.05, 1.35] as [number, number, number], rot: Math.PI / 2 },
            { position: [0, 0.038, -6.8] as [number, number, number], scale: [16.5, 0.04, 0.28] as [number, number, number], rot: 0 },
          ].map((p, index) => (
            <mesh
              key={`plaza-pbr-inlay-${index}`}
              position={p.position}
              rotation={[0, p.rot, 0]}
              receiveShadow
              geometry={getSharedBoxGeometry(p.scale[0], p.scale[1], p.scale[2])}
            >
              <PolyHavenStandardMaterial
                materialId={index === 2 ? 'metal_plate' : 'concrete_floor_painted'}
                repeatScale={index === 2 ? 4.0 : 1.1}
                color={index === 2 ? '#3a4450' : '#4d535e'}
                metalness={index === 2 ? 0.62 : 0.04}
                roughness={index === 2 ? 0.44 : 0.86}
                polygonOffset
              />
            </mesh>
          ))}
        </group>
      ) : (
        <>
          <mesh position={[0, 0.035, 0]} rotation-x={-Math.PI / 2} geometry={getSharedCircleGeometry(5.5, 48)}>
            <PolyHavenStandardMaterial materialId="concrete_floor_painted" repeatScale={0.75} color="#7d8390" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.055, 0]} rotation-x={-Math.PI / 2} renderOrder={1} geometry={getSharedCircleGeometry(6.2, 48)}>
            <PolyHavenStandardMaterial
              materialId="concrete_floor_painted"
              repeatScale={0.9}
              color="#363b45"
              roughness={0.72}
              transparent
              opacity={0.58}
              depthWrite={false}
              polygonOffset
            />
          </mesh>
          <mesh position={[0, 0.07, -7]} geometry={getSharedBoxGeometry(18, 0.04, 0.12)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={4.0} color="#3a4450" metalness={0.65} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.07, -6.55]} geometry={getSharedBoxGeometry(18, 0.04, 0.12)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={4.0} color="#3a4450" metalness={0.65} roughness={0.38} />
          </mesh>
        </>
      )}

      {/* WS18-C: MeshPhysicalMaterial with clearcoat for wet/rainy surface effect.
          Thin transparent sheen disc above the plaza inlay adds Blade Runner rain
          reflection without disturbing the PolyHaven concrete textures below.
          (CitySquareVisual's ground is WetStreetGround — separate component — and
          the plaza tiles use PolyHavenStandardMaterial, whose internal texture
          maps cannot be preserved if swapped for a direct meshPhysicalMaterial.
          This overlay is the cleanest way to add the wet clearcoat sheen to the
          plaza tiles.) */}
      {usePhysicalWet ? (
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, 0.045, 0]}
          geometry={getSharedCircleGeometry(5.2, 48)}
          renderOrder={2}
        >
          <meshPhysicalMaterial
            color="#1a2230"
            roughness={0.22}
            metalness={0.18}
            clearcoat={0.5}
            clearcoatRoughness={0.3}
            transparent
            opacity={0.18}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ) : null}

      {useAuthoredDressing ? (
        <Suspense fallback={null}>
          <AuthoredPlazaLandmark castShadow={preset.shadows} />
        </Suspense>
      ) : (
        <group>
          <mesh position={[0, 0.14, 0]} castShadow geometry={getSharedCylinderGeometry(1.9, 2.1, 0.28, 48)}>
            <PolyHavenStandardMaterial materialId="concrete_floor_painted" repeatScale={0.45} color="#353a46" roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.34, 0]} castShadow geometry={getSharedCylinderGeometry(1.35, 1.55, 0.22, 48)}>
            <PolyHavenStandardMaterial materialId="concrete_floor_painted" repeatScale={0.5} color="#596070" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.52, 0]} castShadow geometry={getSharedCylinderGeometry(0.82, 1.0, 0.18, 32)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={0.55} color="#8c6a3d" metalness={0.58} roughness={0.48} />
          </mesh>
          <mesh position={[0, 2.35, 0]} castShadow geometry={getSharedBoxGeometry(0.72, 3.7, 0.72)}>
            <PolyHavenStandardMaterial materialId="concrete_floor_painted" repeatScale={0.45} color="#626878" metalness={0.12} roughness={0.62} />
          </mesh>
          <mesh position={[0, 4.25, 0]} castShadow geometry={getSharedCylinderGeometry(0.42, 0.5, 0.24, 32)}>
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={0.5} color="#8c6a3d" metalness={0.58} roughness={0.48} />
          </mesh>
          <mesh position={[0, 4.48, 0]} castShadow geometry={getSharedCylinderGeometry(0.2, 0.34, 0.34, 32)}>
            <PolyHavenStandardMaterial materialId="concrete_floor_painted" repeatScale={0.4} color="#626878" metalness={0.12} roughness={0.62} />
          </mesh>
          {[
            [0, 0.62],
            [Math.PI / 2, 0.62],
            [Math.PI, 0.62],
            [-Math.PI / 2, 0.62],
          ].map(([rotY, z], i) => (
            <group key={`plaque-${i}`} rotation-y={rotY}>
              <mesh position={[0, 1.08, z]} ref={i === 0 ? plaqueRef : undefined} geometry={getSharedBoxGeometry(0.56, 0.34, 0.055)} material={matPlaque} />
              <mesh position={[0, 1.33, z + 0.005]} geometry={getSharedBoxGeometry(0.5, 0.035, 0.06)} material={matBronze} />
              <mesh position={[0, 0.83, z + 0.005]} geometry={getSharedBoxGeometry(0.5, 0.035, 0.06)} material={matBronze} />
            </group>
          ))}
          <mesh ref={neonRef} position={[0, 4.72, 0]} geometry={getSharedBoxGeometry(0.85, 0.12, 0.85)} material={matNeonCyan} />
          <mesh position={[0, 4.93, 0]} geometry={getSharedCylinderGeometry(0.08, 0.08, 0.35, 12)} material={matNeonMagenta} />
        </group>
      )}

      {/* Kiosks / planters — fallback only; authored GLB facades own high/ultra plaza architecture. */}
      {!useAuthoredDressing ? [
        { pos: [-10, 0.6, -8] as [number, number, number], size: [3.2, 1.2, 1.2] as [number, number, number] },
        { pos: [10, 0.6, -8] as [number, number, number], size: [3.2, 1.2, 1.2] as [number, number, number] },
        { pos: [-10, 0.6, 9] as [number, number, number], size: [2.8, 1.2, 1.4] as [number, number, number] },
        { pos: [10, 0.6, 9] as [number, number, number], size: [2.8, 1.2, 1.4] as [number, number, number] },
      ].map((b, i) => (
        <group key={i} position={b.pos}>
          <mesh castShadow geometry={getSharedBoxGeometry(b.size[0], b.size[1], b.size[2])} material={matStone} />
          {usePhysicalWet ? (
            <mesh position={[0, 0.75, 0.55]} geometry={getSharedBoxGeometry(b.size[0] * 0.8, 0.08, 0.06)}>
              <meshPhysicalMaterial
                color="#101018"
                emissive={i % 2 === 0 ? '#00e5ff' : '#ff4488'}
                emissiveIntensity={0.72}
                roughness={wetNeon.roughness}
                metalness={wetNeon.metalness}
                transmission={wetNeon.transmission}
                thickness={wetNeon.thickness}
                clearcoat={wetNeon.clearcoat}
                clearcoatRoughness={wetNeon.clearcoatRoughness}
              />
            </mesh>
          ) : (
            <mesh
              position={[0, 0.75, 0.55]}
              geometry={getSharedBoxGeometry(b.size[0] * 0.8, 0.08, 0.06)}
              material={i % 2 === 0 ? matNeonCyan : matNeonMagenta}
            />
          )}
          <mesh position={[0, 0.05, 0]} geometry={getSharedBoxGeometry(b.size[0] + 0.4, 0.08, b.size[2] + 0.35)} material={matCurb} />
        </group>
      )) : null}

      {!useAuthoredDressing ? benches.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.35, 0]} castShadow geometry={getSharedBoxGeometry(1.6, 0.12, 0.45)} material={matStone} />
          <mesh position={[-0.65, 0.18, 0]} geometry={getSharedBoxGeometry(0.12, 0.35, 0.4)} material={matStone} />
          <mesh position={[0.65, 0.18, 0]} geometry={getSharedBoxGeometry(0.12, 0.35, 0.4)} material={matStone} />
          <mesh position={[0, 0.55, -0.18]} geometry={getSharedBoxGeometry(1.5, 0.35, 0.08)} material={matCurb} />
        </group>
      )) : null}

      {!useAuthoredDressing ? lampPosts.map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.6, 0]} castShadow geometry={getSharedCylinderGeometry(0.06, 0.08, 3.2, 8)} material={matLampPost} />
          <mesh position={[0, 2.95, 0]} geometry={getSharedCylinderGeometry(0.42, 0.42, 0.035, 24)} material={matBronze} />
          <mesh position={[0, 3.25, 0]} geometry={getSharedCylinderGeometry(0.18, 0.14, 0.22, 10)} material={matLampGlow} />
          <pointLight position={[0, 3.2, 0]} intensity={0.55} color="#ffcc88" distance={10} decay={2} />
        </group>
      )) : null}

      {useAuthoredDressing ? <AuthoredPlazaDressing castShadow={preset.shadows} /> : null}

      {!useAuthoredDressing ? [
        [-12, 4, -13],
        [12, 5, -12],
        [-11, 3.5, 13],
        [11, 4.5, 12],
      ].map(([x, h, z], i) => (
        usePhysicalWet ? (
          <mesh
            key={`facade-${i}`}
            renderOrder={2}
            position={[x, h / 2, z]}
            geometry={getSharedBoxGeometry(4.5, h, 0.35)}
          >
            <meshPhysicalMaterial
              color="#88aacc"
              roughness={wetGlass.roughness}
              metalness={wetGlass.metalness}
              transmission={wetGlass.transmission}
              thickness={wetGlass.thickness}
              clearcoat={wetGlass.clearcoat}
              clearcoatRoughness={wetGlass.clearcoatRoughness}
              transparent
              opacity={wetGlass.opacity}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
        ) : (
          <mesh
            key={`facade-${i}`}
            renderOrder={2}
            position={[x, h / 2, z]}
            geometry={getSharedBoxGeometry(4.5, h, 0.35)}
            material={matGlass}
          />
        )
      )) : null}

      {/* Corner bollards */}
      {[
        [-4.2, -4.2],
        [4.2, -4.2],
        [-4.2, 4.2],
        [4.2, 4.2],
      ].map(([x, z], i) => (
        <mesh key={`bollard-${i}`} position={[x, 0.35, z]} castShadow geometry={getSharedCylinderGeometry(0.12, 0.14, 0.7, 8)}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.0} color="#3a4450" metalness={0.65} roughness={0.42} />
        </mesh>
      ))}

      <pointLight position={[0, 5, 0]} intensity={1.35} color="#aaccff" distance={28} decay={2} />
      <pointLight position={[-9, 3.2, -7]} intensity={0.72} color="#55e8dd" distance={16} decay={2} />
      <pointLight position={[9, 3.0, 8]} intensity={0.68} color="#ff6688" distance={15} decay={2} />
    </group>
  );
}

// FIX S13-13: module-level preload loop REMOVED — duplicate of
// sceneGpuLifecycle.ts:preloadSceneStreetDressing (CITY_SQUARE_DRESSING_URLS
// in streetDressingGpuUrls.ts). Scene-gated preload is the single source of truth.
