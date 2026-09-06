/* Non-box desk / thin monitor slabs for Volodka room — kills cube kitbash interactables. */

import { Suspense, useMemo, type MutableRefObject } from 'react';
import { CircleGeometry, Color, Group, Material, Texture } from 'three';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import {
  allowsSelectiveMeshPhysicalWet,
  getWetGlassPhysicalParams,
} from '@/engine/graphics/wetStreetScenes';

const MONITOR_EMISSIVE = new Color('#5a9a88');

/** Extruded-feel desk fallback (Low): thick top + tapered cylinder legs — not four box posts.
 *  Medium+ wake room mounts Poly Haven paintedWoodenTable instead (VolodkaRoomVisual).
 *
 *  topY — верх столешницы в метрах. Дефолт 0.78 (Low-комплект: мониторы сидят на
 *  surfaceY=0.78). В GLB-пресете fallback рендерится как Suspense-fallback пока
 *  paintedWoodenTable стримится — туда передаётся topY=deskSurfaceY (0.98),
 *  иначе ThinMonitor/клавиатура на якорях 0.98 ПАРЯТ над fallback-столом 0.78
 *  («мониторы висят в воздухе» — репорт игрока v4.15). */
export function CraftedDeskShell({
  matFallback,
  topY = 0.78,
}: {
  matFallback: Material;
  topY?: number;
}) {
  // topY=0.78 (дефолт) даёт ровно прежнюю геометрию: топ 0.72..0.78, фартук 0.64..0.72.
  const topCenterY = topY - 0.03;
  const apronCenterY = topY - 0.1;
  const legHeight = topY - 0.14;
  const legCenterY = legHeight / 2;
  return (
    <>
      <mesh position={[0, topCenterY, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.06, 0.82]} />
        <Suspense fallback={<primitive object={matFallback} attach="material" />}>
          <PolyHavenStandardMaterial materialId="wood_floor" repeatScale={1.5} color="#b89870" metalness={0.04} roughness={0.78} />
        </Suspense>
      </mesh>
      {/* Soft underside apron */}
      <mesh position={[0, apronCenterY, 0]} castShadow>
        <boxGeometry args={[1.78, 0.08, 0.76]} />
        <meshStandardMaterial color="#3a2e22" roughness={0.88} metalness={0.05} />
      </mesh>
      {/* Tapered cylinder legs — от пола до низа фартука */}
      {([[-0.78, -0.32], [0.78, -0.32], [-0.78, 0.32], [0.78, 0.32]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, legCenterY, z]} castShadow geometry={getSharedCylinderGeometry(0.045, 0.06, legHeight, 8)}>
          <meshStandardMaterial color="#2a241c" roughness={0.82} metalness={0.08} />
        </mesh>
      ))}
    </>
  );
}

interface ThinMonitorProps {
  id: string;
  tex: Texture;
  x: number;
  rotY: number;
  /** Desk surface height — monitor stand foot rests just above this. */
  surfaceY?: number;
  groupRef?: MutableRefObject<Group | null>;
  alertLed?: Material;
}

/** Thin bezel + plane screen with photo-PBR metal housing (not a cube monitor). */
export function ThinMonitor({
  id,
  tex,
  x,
  rotY,
  surfaceY = 0.75,
  groupRef,
  alertLed,
}: ThinMonitorProps) {
  // Compute CRT wet-glass gate internally — keeps the change self-contained in
  // this file (VolodkaRoomVisual.tsx is owned by another agent for the light
  // dedupe). volodka_room is already in SELECTIVE_PHYSICAL_WET_SCENE_IDS.
  const { selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const usePhysicalGlass = allowsSelectiveMeshPhysicalWet('volodka_room', selectedPreset, {
    coarsePointer,
  });
  const crtGlass = useMemo(() => getWetGlassPhysicalParams('crtTerminalGlass'), []);

  // Stand foot at -0.29 relative → group.y = surfaceY + 0.29 keeps the disc on the desk.
  const groupY = surfaceY + 0.29;
  return (
    <group ref={groupRef} position={[x, groupY, -0.06]} rotation={[0, rotY, 0]}>
      {/* Housing: shallow slab + slightly larger rear plate (reads as thin display, not PC tower) */}
      <mesh castShadow geometry={getSharedBoxGeometry(0.5, 0.3, 0.016)}>
        <Suspense fallback={<meshStandardMaterial color="#12141a" roughness={0.55} metalness={0.35} />}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.4} color="#1a1e28" metalness={0.42} roughness={0.48} />
        </Suspense>
      </mesh>
      <mesh position={[0, 0, -0.014]} castShadow geometry={getSharedBoxGeometry(0.46, 0.26, 0.012)}>
        <meshStandardMaterial color="#0a0c10" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.01]} geometry={getSharedPlaneGeometry(0.46, 0.26)} renderOrder={2}>
        {usePhysicalGlass ? (
          <meshPhysicalMaterial
            map={tex}
            emissive={MONITOR_EMISSIVE}
            emissiveMap={tex}
            emissiveIntensity={0.85}
            toneMapped
            depthWrite={false}
            transparent
            roughness={crtGlass.roughness}
            metalness={crtGlass.metalness}
            transmission={crtGlass.transmission}
            thickness={crtGlass.thickness}
            clearcoat={crtGlass.clearcoat}
            clearcoatRoughness={crtGlass.clearcoatRoughness}
            opacity={crtGlass.opacity}
          />
        ) : (
          <meshStandardMaterial
            map={tex}
            emissive={MONITOR_EMISSIVE}
            emissiveMap={tex}
            emissiveIntensity={0.85}
            toneMapped
            depthWrite={false}
            roughness={0.35}
            metalness={0.05}
          />
        )}
      </mesh>
      {alertLed ? (
        <mesh position={[0.21, 0.12, 0.014]} geometry={new CircleGeometry(0.01, 8)} material={alertLed} />
      ) : null}
      {/* Neck + disc foot — cylinder language, not box stand */}
      <mesh position={[0, -0.2, -0.01]} geometry={getSharedCylinderGeometry(0.016, 0.022, 0.16, 10)}>
        <Suspense fallback={<meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={3.2} color="#2a3038" metalness={0.5} roughness={0.42} />
        </Suspense>
      </mesh>
      <mesh position={[0, -0.29, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={getSharedCylinderGeometry(0.11, 0.11, 0.016, 20)}>
        <Suspense fallback={<meshStandardMaterial color="#1a1c22" roughness={0.55} metalness={0.35} />}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.8} color="#222830" metalness={0.48} roughness={0.45} />
        </Suspense>
      </mesh>
      <mesh visible={false} userData={{ monitorId: id }} />
    </group>
  );
}
