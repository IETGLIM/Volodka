/* ─── Library Basement: archive vault under the stacks ───
 * Not LibraryDay — low concrete, rusted shelves, amber terminal glow.
 * Procedural envelope owns walkable space; Kenney library GLB blocked exterior.
 */

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import {
  allowsSelectiveMeshPhysicalWet,
  getIndustrialDampFloorSettings,
  getRainSpillInFloorBoost,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { getInteriorShellScale, isWalkableInteriorShellAllowed } from '@/config/interiorShellScale';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';

interface LibraryBasementVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 14;
const D = 12;
const H = 2.9;

const matWall = getSharedStandardMaterial({ color: '#16120e', roughness: 0.9 });
const matCeil = getSharedStandardMaterial({ color: '#100c08', roughness: 0.95 });
const matShelf = getSharedStandardMaterial({ color: '#3a2e22', roughness: 0.75, metalness: 0.15 });
const matBook = getSharedStandardMaterial({ color: '#4a3020', roughness: 0.85 });
const matTerminal = getSharedStandardMaterial({
  color: '#1a1000',
  emissive: '#ffcc66',
  emissiveIntensity: 1.35,
});
const matPipe = getSharedStandardMaterial({ color: '#2a3230', metalness: 0.55, roughness: 0.4 });
const matCrate = getSharedStandardMaterial({ color: '#2e2418', roughness: 0.88 });
const matDust = getSharedStandardMaterial({
  color: '#3a3020',
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
});
const matAmberSpill = getSharedStandardMaterial({
  color: '#1a1000',
  emissive: '#ffaa44',
  emissiveIntensity: 0.35,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
});

export function LibraryBasementVisual(_props: LibraryBasementVisualProps) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const useAuthoredShell =
    !preset.visualLite && isWalkableInteriorShellAllowed('library');
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  // Shell is Kenney exterior (blocked) — keep archive shelves; prop dressing overlays.
  const hideProceduralClutter = useAuthoredShell && useGltfDressing;
  const usePhysicalCrt = allowsSelectiveMeshPhysicalWet('library_basement', selectedPreset, {
    coarsePointer,
  });
  const crtGlass = useMemo(() => getWetGlassPhysicalParams('crtTerminalGlass'), []);
  const oilPuddle = useMemo(() => getWetPuddlePhysicalParams(0.48), []);
  const rootRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const damp = useMemo(() => getIndustrialDampFloorSettings('library_basement'), []);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const spill = useMemo(
    () => getRainSpillInFloorBoost('library_basement', rainIntensity),
    [rainIntensity],
  );
  const floorRoughness = Math.max(0.22, (damp?.roughness ?? 0.92) - (spill?.roughnessDrop ?? 0));
  const floorMetalness = Math.min(0.5, (damp?.metalness ?? 0) + (spill?.metalnessBoost ?? 0));
  const shellScale = useMemo(
    () => getInteriorShellScale('library', [W, H, D]),
    [],
  );

  const shelves = useMemo(
    () =>
      [
        [-3.2, -2],
        [-3.2, 0.4],
        [-3.2, 2.6],
        [3.2, -2],
        [3.2, 0.4],
        [3.2, 2.6],
      ] as const,
    [],
  );

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const pulse = 1.15 + Math.sin(tRef.current * 2.4) * 0.25 + Math.sin(tRef.current * 11) * 0.06;
      if (screenRef.current) {
        (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      {useAuthoredShell ? (
        <AuthoredInteriorShell
          sceneId="library_basement"
          url={INTERIOR_SHELL_MODELS.library}
          scale={shellScale}
          castShadow={preset.shadows}
        />
      ) : (
        <>
          {[
            { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.18] as [number, number, number] },
            { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.18] as [number, number, number] },
            { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.18, H, D] as [number, number, number] },
            { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.18, H, D] as [number, number, number] },
          ].map((w, i) => (
            <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
          ))}
          <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />
        </>
      )}

      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        {/* WS19-C: MeshPhysicalMaterial with clearcoat for indoor wet-concrete effect */}
        <meshPhysicalMaterial
          color="#1a1610"
          roughness={floorRoughness}
          metalness={floorMetalness}
          clearcoat={0.45}
          clearcoatRoughness={0.4}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {spill && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, D * 0.32]} geometry={getSharedCircleGeometry(2.1, 22)}>
          {usePhysicalCrt ? (
            <meshPhysicalMaterial
              color="#1a2218"
              metalness={Math.max(damp?.oilMetalness ?? 0.48, oilPuddle.metalness + 0.12)}
              roughness={Math.min(damp?.oilRoughness ?? 0.28, oilPuddle.roughness + 0.04)}
              clearcoat={oilPuddle.clearcoat * 0.9}
              clearcoatRoughness={oilPuddle.clearcoatRoughness}
              transparent
              opacity={Math.min(0.72, Math.max(spill.puddleOpacity, oilPuddle.opacity * 0.8))}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          ) : (
            <meshStandardMaterial
              color="#1a2218"
              metalness={damp?.oilMetalness ?? 0.48}
              roughness={damp?.oilRoughness ?? 0.28}
              transparent
              opacity={spill.puddleOpacity}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          )}
        </mesh>
      )}

      {!hideProceduralClutter ? (
        <>
          {shelves.map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 1.1, 0]} castShadow geometry={getSharedBoxGeometry(0.35, 2.2, 1.4)} material={matShelf} />
              <mesh position={[x < 0 ? 0.22 : -0.22, 1.4, 0]} geometry={getSharedBoxGeometry(0.12, 0.7, 1.1)} material={matBook} />
            </group>
          ))}

          <mesh position={[0, 0.45, -3.2]} castShadow geometry={getSharedBoxGeometry(1.1, 0.9, 0.55)} material={matShelf} />

          <mesh position={[-1.5, 2.55, 0]} geometry={getSharedBoxGeometry(4, 0.08, 0.08)} material={matPipe} />
          <mesh position={[2.2, 2.55, -1]} geometry={getSharedBoxGeometry(0.08, 0.08, 3)} material={matPipe} />
          <mesh position={[0, 2.55, 2.4]} geometry={getSharedBoxGeometry(6, 0.06, 0.06)} material={matPipe} />

          {[
            [-1.8, -3.4],
            [1.6, -3.5],
            [0.2, 3.2],
          ].map(([x, z], i) => (
            <mesh
              key={`crate-${i}`}
              position={[x, 0.28, z]}
              castShadow
              geometry={getSharedBoxGeometry(0.7, 0.55, 0.55)}
              material={matCrate}
            />
          ))}
        </>
      ) : null}

      {usePhysicalCrt ? (
        <mesh ref={screenRef} position={[0, 0.95, -2.95]} geometry={getSharedBoxGeometry(0.55, 0.35, 0.04)}>
          <meshPhysicalMaterial
            color="#1a1000"
            emissive="#ffcc66"
            emissiveIntensity={1.35}
            roughness={crtGlass.roughness}
            metalness={crtGlass.metalness}
            transmission={crtGlass.transmission}
            thickness={crtGlass.thickness}
            clearcoat={crtGlass.clearcoat}
            clearcoatRoughness={crtGlass.clearcoatRoughness}
            transparent
            opacity={crtGlass.opacity}
          />
        </mesh>
      ) : (
        <mesh
          ref={screenRef}
          position={[0, 0.95, -2.95]}
          geometry={getSharedBoxGeometry(0.55, 0.35, 0.04)}
          material={matTerminal}
        />
      )}

      <mesh position={[0, 0.02, -2.6]} rotation-x={-Math.PI / 2} geometry={getSharedCircleGeometry(1.4, 18)} material={matAmberSpill} />
      <mesh position={[0, 1.4, 0]} rotation-x={-Math.PI / 2} geometry={getSharedCircleGeometry(3.2, 20)} material={matDust} />

      <pointLight position={[0, 2.2, -2.8]} intensity={0.85} color="#ffcc66" distance={9} />
      <pointLight position={[-2.5, 1.8, 1]} intensity={0.35} color="#668888" distance={7} />
    </group>
  );
}
