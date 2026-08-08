/* ─── Albert Backroom: café storage / hush room ───
 * Not CaféVisual — crates, warm desk lamp, magenta neon drip.
 * Procedural envelope owns walkable space; Kenney cafe GLB is blocked exterior.
 */

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import {
  allowsSelectiveMeshPhysicalWet,
  getIndustrialDampFloorSettings,
  getWetGlassPhysicalParams,
  getWetPuddlePhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { getInteriorShellScale, isWalkableInteriorShellAllowed } from '@/config/interiorShellScale';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';

interface AlbertBackroomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 8;
const D = 6;
const H = 2.7;

const matWall = getSharedStandardMaterial({ color: '#221a28', roughness: 0.88 });
const matCeil = getSharedStandardMaterial({ color: '#141018', roughness: 0.92 });
const matCrate = getSharedStandardMaterial({ color: '#3a2a1a', roughness: 0.8 });
const matMetal = getSharedStandardMaterial({ color: '#2a2830', metalness: 0.5, roughness: 0.45 });
const matLamp = getSharedStandardMaterial({
  color: '#2a1808',
  emissive: '#ffaa55',
  emissiveIntensity: 1.5,
});
const matNeon = getSharedStandardMaterial({
  color: '#1a0012',
  emissive: '#ff4499',
  emissiveIntensity: 1.3,
});
const matShelf = getSharedStandardMaterial({ color: '#2e2430', roughness: 0.78 });
const matSack = getSharedStandardMaterial({ color: '#4a3a28', roughness: 0.92 });
const matTerminal = getSharedStandardMaterial({
  color: '#120818',
  emissive: '#aa66ff',
  emissiveIntensity: 0.9,
});

export function AlbertBackroomVisual(_props: AlbertBackroomVisualProps) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const useAuthoredShell =
    !preset.visualLite && isWalkableInteriorShellAllowed('cafe');
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  // Shell is Kenney exterior (blocked) — prop dressing overlays, does not replace crates/shelves.
  const hideProceduralClutter = useAuthoredShell && useGltfDressing;
  const usePhysicalCrt = allowsSelectiveMeshPhysicalWet('albert_backroom', selectedPreset, {
    coarsePointer,
  });
  const crtGlass = useMemo(() => getWetGlassPhysicalParams('crtTerminalGlass'), []);
  const oilPuddle = useMemo(() => getWetPuddlePhysicalParams(0.4), []);
  const rootRef = useRef<THREE.Group>(null);
  const neonRef = useRef<THREE.Mesh>(null);
  const lampRef = useRef<THREE.Mesh>(null);
  const termRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const damp = useMemo(() => getIndustrialDampFloorSettings('albert_backroom'), []);
  const floorRoughness = damp?.roughness ?? 0.8;
  const floorMetalness = damp?.metalness ?? 0.08;
  const shellScale = useMemo(
    () => getInteriorShellScale('cafe', [W, H, D]),
    [],
  );

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const neonPulse = 1.1 + Math.sin(tRef.current * 1.9) * 0.35;
      const lampPulse = 1.35 + Math.sin(tRef.current * 3.1) * 0.12;
      if (neonRef.current) {
        (neonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = neonPulse;
      }
      if (lampRef.current) {
        (lampRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = lampPulse;
      }
      if (termRef.current) {
        (termRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.75 + Math.sin(tRef.current * 4.2) * 0.2;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      {useAuthoredShell ? (
        <AuthoredInteriorShell
          sceneId="albert_backroom"
          url={INTERIOR_SHELL_MODELS.cafe}
          scale={shellScale}
          castShadow={preset.shadows}
        />
      ) : (
        <>
          {[
            { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.16] as [number, number, number] },
            { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.16] as [number, number, number] },
            { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.16, H, D] as [number, number, number] },
            { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.16, H, D] as [number, number, number] },
          ].map((w, i) => (
            <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
          ))}
          <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />
        </>
      )}

      {/* WS21-C: PBR upgrade — varnished wood floor with clearcoat */}
      {/* WS26-C: tuned clearcoat 0.5 → 0.4 for varnished wood (sane bound) */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshPhysicalMaterial
          color="#1e1820"
          roughness={floorRoughness}
          metalness={floorMetalness}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {damp && (
        <mesh rotation-x={-Math.PI / 2} position={[0.8, 0.008, 1.2]} geometry={getSharedCircleGeometry(0.9, 16)}>
          {usePhysicalCrt ? (
            <meshPhysicalMaterial
              color="#1a1420"
              metalness={Math.max(damp.oilMetalness, oilPuddle.metalness + 0.08)}
              roughness={Math.min(damp.oilRoughness, oilPuddle.roughness + 0.06)}
              clearcoat={oilPuddle.clearcoat * 0.85}
              clearcoatRoughness={oilPuddle.clearcoatRoughness}
              transparent
              opacity={Math.min(0.45, Math.max(0.32, oilPuddle.opacity * 0.55))}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          ) : (
            <meshStandardMaterial
              color="#1a1420"
              metalness={damp.oilMetalness}
              roughness={damp.oilRoughness}
              transparent
              opacity={0.32}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          )}
        </mesh>
      )}

      {!hideProceduralClutter ? (
        <>
          {[
            [-2.2, -1.4],
            [-1.4, -1.5],
            [2.0, -1.2],
            [2.5, 1.4],
            [-2.4, 1.2],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.45, z]} castShadow geometry={getSharedBoxGeometry(0.7, 0.9, 0.55)} material={matCrate} />
          ))}

          <mesh position={[0.2, 1.1, -2.7]} castShadow geometry={getSharedBoxGeometry(2.4, 2.2, 0.2)} material={matShelf} />
          <mesh position={[0.2, 0.7, -2.55]} geometry={getSharedBoxGeometry(2.1, 0.08, 0.35)} material={matShelf} />
          <mesh position={[0.2, 1.3, -2.55]} geometry={getSharedBoxGeometry(2.1, 0.08, 0.35)} material={matShelf} />
          <mesh position={[0.2, 1.9, -2.55]} geometry={getSharedBoxGeometry(2.1, 0.08, 0.35)} material={matShelf} />
          <mesh position={[-0.6, 0.35, 1.8]} castShadow geometry={getSharedBoxGeometry(0.55, 0.7, 0.45)} material={matSack} />
          <mesh position={[0.1, 0.3, 1.9]} castShadow geometry={getSharedBoxGeometry(0.5, 0.6, 0.4)} material={matSack} />
        </>
      ) : null}

      <mesh position={[-1.5, 0.55, -1]} castShadow geometry={getSharedBoxGeometry(0.9, 0.85, 0.5)} material={matMetal} />
      <mesh
        ref={lampRef}
        position={[-1.5, 1.15, -0.85]}
        geometry={getSharedCylinderGeometry(0.08, 0.12, 0.1, 12)}
        material={matLamp}
      />
      {usePhysicalCrt ? (
        <mesh ref={termRef} position={[-1.5, 1.05, -1.15]} geometry={getSharedBoxGeometry(0.35, 0.22, 0.03)}>
          <meshPhysicalMaterial
            color="#120818"
            emissive="#aa66ff"
            emissiveIntensity={0.9}
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
          ref={termRef}
          position={[-1.5, 1.05, -1.15]}
          geometry={getSharedBoxGeometry(0.35, 0.22, 0.03)}
          material={matTerminal}
        />
      )}

      <mesh
        ref={neonRef}
        position={[2.4, 1.8, 0]}
        rotation-z={Math.PI / 2}
        geometry={getSharedBoxGeometry(1.4, 0.06, 0.04)}
        material={matNeon}
      />
      <mesh
        position={[2.4, 1.2, 0.6]}
        rotation-z={Math.PI / 2}
        geometry={getSharedBoxGeometry(0.7, 0.04, 0.03)}
        material={matNeon}
      />

      <pointLight position={[-1.5, 1.4, -0.8]} intensity={1.2} color="#ffaa55" distance={5} />
      <pointLight position={[2.2, 1.8, 0]} intensity={0.55} color="#ff4499" distance={4} />
    </group>
  );
}
