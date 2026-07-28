
/* ─── Volodka RPG – Corridor procedural 3D visual ─── */

import { useRef, useEffect, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { useEnvironmentLod } from './lod/useEnvironmentLod';
import { EnvironmentDetail } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface VolodkaCorridorVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Narrow corridor (3.5×12m) connecting rooms */
export function VolodkaCorridorVisual({ livePlayerPositionRef: _livePlayerPositionRef }: VolodkaCorridorVisualProps) {
  const floorTexture = useCachedCanvasTexture('volodka_corridor:floor', createCorridorFloorTexture);
  const wallTexture = useCachedCanvasTexture('volodka_corridor:wall', createCorridorWallTexture);
  const { lod } = useEnvironmentLod();

  const W = 3.5;
  const D = 12;
  const H = 2.8;

  const flickerLightRef = useRef<THREE.PointLight>(null);

  // ── Interactive object animation refs ──
  const kitchenDoorRef = useRef<THREE.Group>(null);
  const streetDoorRef = useRef<THREE.Group>(null);
  const roomDoorRef = useRef<THREE.Group>(null);

  // ── Listen for object:interact events to toggle interactive objects ──
  useEffect(() => {
    const unsub = eventBus.on('object:interact', (payload) => {
      if (
        payload.objectId === 'corridor_kitchen_door' ||
        payload.objectId === 'corridor_street_door' ||
        payload.objectId === 'corridor_room_door'
      ) {
        useGameStore.getState().toggleInteractiveObject(payload.objectId);
      }
    });
    return unsub;
  }, []);

  useFrameTick('misc', ({ state, delta }) => {
    if (flickerLightRef.current) {
      // Broken light flicker — occasional drops
      const t = state.clock.elapsedTime;
      const flicker = Math.sin(t * 8) > 0.9 ? 0.2 : 1.0;
      flickerLightRef.current.intensity = flicker * 2.5;
    }

    // Interactive object animations — smooth lerp toward target rotation
    const objStates = useGameStore.getState().interactiveObjectStates;

    // Kitchen door (right wall): swings open into corridor
    if (kitchenDoorRef.current) {
      const open = objStates['corridor_kitchen_door'] ?? false;
      const targetY = open ? -Math.PI / 2 : 0;
      kitchenDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        kitchenDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    // Street door (left wall): swings open into corridor
    if (streetDoorRef.current) {
      const open = objStates['corridor_street_door'] ?? false;
      const targetY = open ? Math.PI / 2 : 0;
      streetDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        streetDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }

    // Room door (front wall): swings open into corridor
    if (roomDoorRef.current) {
      const open = objStates['corridor_room_door'] ?? false;
      const targetY = open ? -Math.PI / 2 : 0;
      roomDoorRef.current.rotation.y = THREE.MathUtils.lerp(
        roomDoorRef.current.rotation.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
    }
  });

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floorTexture} color="#5a4a40" roughness={0.85} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#3a3535" roughness={0.95} />
      </mesh>

      {/* ── Left Wall ── */}
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3540" roughness={0.9} />
      </mesh>

      {/* ── Right Wall ── */}
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3540" roughness={0.9} />
      </mesh>

      {/* ── Back Wall ── */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3540" roughness={0.9} />
      </mesh>

      {/* ── Front Wall ── */}
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#3a3540" roughness={0.9} />
      </mesh>

      {/* ── Decorative props (LOD: standard+) ── */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
      {/* ── Shoe Rack (left wall, near entrance) ── */}
      <group position={[-W / 2 + 0.3, 0, 3.5]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.4]} />
          <meshStandardMaterial color="#4a3828" roughness={0.8} />
        </mesh>
        {/* Shelves */}
        {[0.2, 0.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0.01]}>
            <boxGeometry args={[0.48, 0.03, 0.38]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
      </group>

      {/* ── Radiator (right wall, middle) ── */}
      <group position={[W / 2 - 0.12, 0, -1.0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.6]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Ribs */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0.03, 0.1 + i * 0.12, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.55]} />
            <meshStandardMaterial color="#999" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
      </EnvironmentDetail>

      {/* ── Ceiling Lamp ── */}
      <group position={[0, H, -2.0]}>
        {/* Lamp fixture */}
        <mesh>
          <boxGeometry args={[0.15, 0.05, 0.15]} />
          <meshStandardMaterial color="#333" metalness={0.7} />
        </mesh>
        {/* Lamp shade */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.2, 0.15, 8]} />
          <meshStandardMaterial color="#ffe8a0" emissive="#ffdd80" emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>
        <pointLight
          position={[0, -0.2, 0]}
          color="#ffdd90"
          intensity={3.5}
          distance={12}
          castShadow
          shadow-mapSize-width={256}
          shadow-bias={-0.001}
        />
      </group>

      {/* ── Second ceiling lamp (flickering) ── */}
      <group position={[0, H, 3.0]}>
        <mesh>
          <boxGeometry args={[0.15, 0.05, 0.15]} />
          <meshStandardMaterial color="#333" metalness={0.7} />
        </mesh>
        <pointLight
          ref={flickerLightRef}
          position={[0, -0.2, 0]}
          color="#ffdd90"
          intensity={2.5}
          distance={10}
        />
      </group>

      {/* ── Door: Kitchen (right wall, z=-1) — animated ── */}
      <group position={[W / 2 - 0.02, 0, -1.0]}>
        {/* Door indent (wall cutout) */}
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.9, 2.2]} />
          <meshStandardMaterial color="#3a2820" roughness={0.85} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0.01, 1.1, 0]} rotation-y={-Math.PI / 2}>
          <boxGeometry args={[0.03, 2.2, 0.95]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        {/* Door frame top */}
        <mesh position={[0.01, 2.2, 0]} rotation-y={-Math.PI / 2}>
          <boxGeometry args={[0.03, 0.05, 0.95]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        {/* Animated door panel — pivot on left edge (when facing the door from corridor) */}
        <group position={[0.02, 0, 0.45]} ref={kitchenDoorRef}>
          <mesh position={[0, 1.1, -0.45]}>
            <boxGeometry args={[0.04, 2.15, 0.9]} />
            <meshStandardMaterial color="#5a4030" roughness={0.75} />
          </mesh>
          {/* Door handle */}
          <mesh position={[0, 1.05, -0.08]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Panel detail */}
          <mesh position={[0.025, 1.4, -0.45]}>
            <boxGeometry args={[0.005, 0.5, 0.5]} />
            <meshStandardMaterial color="#4a3525" roughness={0.85} />
          </mesh>
          <mesh position={[0.025, 0.7, -0.45]}>
            <boxGeometry args={[0.005, 0.5, 0.5]} />
            <meshStandardMaterial color="#4a3525" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* ── Door: Street (left wall, z=-1) — animated ── */}
      <group position={[-W / 2 + 0.02, 0, -1.0]}>
        {/* Door indent */}
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.9, 2.2]} />
          <meshStandardMaterial color="#2a2020" roughness={0.85} />
        </mesh>
        {/* Door frame */}
        <mesh position={[-0.01, 1.1, 0]} rotation-y={Math.PI / 2}>
          <boxGeometry args={[0.03, 2.2, 0.95]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        <mesh position={[-0.01, 2.2, 0]} rotation-y={Math.PI / 2}>
          <boxGeometry args={[0.03, 0.05, 0.95]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        {/* Animated door panel — pivot on right edge (when facing from corridor) */}
        <group position={[-0.02, 0, 0.45]} ref={streetDoorRef}>
          <mesh position={[0, 1.1, -0.45]}>
            <boxGeometry args={[0.04, 2.15, 0.9]} />
            <meshStandardMaterial color="#3a2520" roughness={0.8} />
          </mesh>
          {/* Door handle */}
          <mesh position={[0, 1.05, -0.08]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Metal detail — street door is heavier */}
          <mesh position={[-0.025, 1.4, -0.45]}>
            <boxGeometry args={[0.005, 0.5, 0.5]} />
            <meshStandardMaterial color="#2a1515" roughness={0.85} />
          </mesh>
          <mesh position={[-0.025, 0.7, -0.45]}>
            <boxGeometry args={[0.005, 0.5, 0.5]} />
            <meshStandardMaterial color="#2a1515" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* ── Door: Volodka's room (front wall) — animated ── */}
      <group position={[0, 0, D / 2 - 0.02]}>
        {/* Door indent */}
        <mesh rotation-y={Math.PI}>
          <planeGeometry args={[0.9, 2.2]} />
          <meshStandardMaterial color="#3a2820" roughness={0.85} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0, 1.1, 0.01]} rotation-y={Math.PI}>
          <boxGeometry args={[0.95, 2.2, 0.03]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        <mesh position={[0, 2.2, 0.01]} rotation-y={Math.PI}>
          <boxGeometry args={[0.95, 0.05, 0.03]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        {/* Animated door panel — pivot on left edge */}
        <group position={[-0.45, 0, 0.02]} ref={roomDoorRef}>
          <mesh position={[0.45, 1.1, 0]}>
            <boxGeometry args={[0.9, 2.15, 0.04]} />
            <meshStandardMaterial color="#5a4030" roughness={0.75} />
          </mesh>
          {/* Door handle */}
          <mesh position={[0.78, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Panel detail */}
          <mesh position={[0.45, 1.4, 0.025]}>
            <boxGeometry args={[0.5, 0.6, 0.005]} />
            <meshStandardMaterial color="#4a3525" roughness={0.85} />
          </mesh>
          <mesh position={[0.45, 0.7, 0.025]}>
            <boxGeometry args={[0.5, 0.6, 0.005]} />
            <meshStandardMaterial color="#4a3525" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Graffiti on left wall (colored rectangles) ── */}
      <mesh position={[-W / 2 + 0.02, 1.6, 0.5]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.2, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#ff2244" emissiveIntensity={0.35} roughness={0.95} />
      </mesh>
      <mesh position={[-W / 2 + 0.02, 1.2, 0.5]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#44aaff" emissiveIntensity={0.25} roughness={0.95} />
      </mesh>

      {/* ── Trash pile in corner (near front wall) ── */}
      <group position={[W / 2 - 0.4, 0, 4.5]}>
        {/* Crumpled paper */}
        <mesh position={[0, 0.06, 0]} rotation={[0.3, 0.5, 0.2]}>
          <sphereGeometry args={[0.08, 5, 5]} />
          <meshStandardMaterial color="#c8c0a8" roughness={0.95} />
        </mesh>
        <mesh position={[0.15, 0.04, 0.1]} rotation={[0.5, 1.2, 0.1]}>
          <sphereGeometry args={[0.06, 5, 5]} />
          <meshStandardMaterial color="#b0a890" roughness={0.95} />
        </mesh>
        {/* Old newspaper */}
        <mesh position={[-0.1, 0.01, -0.1]} rotation={[0, 0.8, 0]}>
          <planeGeometry args={[0.25, 0.18]} />
          <meshStandardMaterial color="#c8c0a0" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Missing ceiling tile ── */}
      <mesh position={[0.6, H + 0.02, 1.5]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
      {/* Exposed wiring from missing tile */}
      <mesh position={[0.6, H - 0.05, 1.5]} rotation={[0.4, 0.2, 0.5]}>
        <cylinderGeometry args={[0.006, 0.006, 0.3, 4]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>

      {/* ── Wet boot prints on floor ── */}
      {[
        [0, 0.003, 2.0], [0.15, 0.003, 1.5], [-0.05, 0.003, 1.0], [0.2, 0.003, 0.5],
      ].map((pos, i) => (
        <mesh key={`boot-${i}`} rotation-x={-Math.PI / 2} position={pos as [number, number, number]}>
          <planeGeometry args={[0.08, 0.14]} />
          <meshStandardMaterial color="#2a2520" roughness={0.6} transparent opacity={0.25} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL CORRIDOR DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Peeling wallpaper patches (left wall) ── */}
      {[
        { pos: [-W / 2 + 0.015, 1.5, -3.5] as [number, number, number], rot: 0.1 },
        { pos: [-W / 2 + 0.015, 1.2, 1.5] as [number, number, number], rot: -0.05 },
        { pos: [-W / 2 + 0.015, 1.8, 4.0] as [number, number, number], rot: 0.15 },
      ].map((patch, i) => (
        <group key={`peel-${i}`} position={patch.pos} rotation-y={Math.PI / 2}>
          {/* Exposed wall underneath */}
          <mesh>
            <planeGeometry args={[0.4, 0.3]} />
            <meshStandardMaterial color="#5a4a40" roughness={0.95} />
          </mesh>
          {/* Peeling wallpaper curling away */}
          <mesh position={[0, 0.08, 0.003]} rotation={[patch.rot, 0.1, 0.05]}>
            <planeGeometry args={[0.35, 0.22]} />
            <meshStandardMaterial color="#3a3540" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* ── Mailboxes near entrance ── */}
      <group position={[W / 2 - 0.15, 0, 4.5]} rotation-y={-Math.PI / 2}>
        {/* Mailbox panel */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.8, 1.2, 0.15]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Individual mailbox slots */}
        {[0.35, 0.1, -0.15, -0.4].map((y, i) => (
          <group key={`mbox-${i}`}>
            {/* Slot opening */}
            <mesh position={[0, y, 0.08]}>
              <boxGeometry args={[0.65, 0.18, 0.01]} />
              <meshStandardMaterial color="#333" metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Slot nameplate */}
            <mesh position={[0.2, y + 0.06, 0.086]}>
              <boxGeometry args={[0.2, 0.03, 0.003]} />
              <meshStandardMaterial color="#8a7a50" metalness={0.3} roughness={0.5} />
            </mesh>
            {/* Keyhole */}
            <mesh position={[-0.25, y, 0.086]}>
              <cylinderGeometry args={[0.005, 0.005, 0.003, 6]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Intercom panel near entrance ── */}
      <group position={[-W / 2 + 0.02, 1.5, 4.5]} rotation-y={Math.PI / 2}>
        <mesh>
          <boxGeometry args={[0.15, 0.25, 0.03]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Speaker grille */}
        <mesh position={[0, 0.06, 0.016]}>
          <boxGeometry args={[0.1, 0.08, 0.002]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Speaker grille lines */}
        {[-0.03, -0.01, 0.01, 0.03].map((y, i) => (
          <mesh key={`ispk-${i}`} position={[0, 0.06 + y, 0.018]}>
            <boxGeometry args={[0.09, 0.003, 0.001]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        ))}
        {/* Call button */}
        <mesh position={[0, -0.06, 0.018]}>
          <cylinderGeometry args={[0.015, 0.015, 0.005, 8]} />
          <meshStandardMaterial color="#cc2222" emissive="#cc2222" emissiveIntensity={0.8} />
        </mesh>
        {/* Camera lens */}
        <mesh position={[0.04, -0.06, 0.018]}>
          <cylinderGeometry args={[0.01, 0.01, 0.005, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>

      {/* ── Cracked floor tile ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0.8, 0.004, -2.0]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial color="#4a3a30" roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Crack line */}
      <mesh rotation-x={-Math.PI / 2} position={[0.8, 0.005, -2.0]}>
        <planeGeometry args={[0.25, 0.005]} />
        <meshStandardMaterial color="#2a2018" roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0.75, 0.005, -2.05]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[0.15, 0.004]} />
        <meshStandardMaterial color="#2a2018" roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ── Mirror on right wall ── */}
      <group position={[W / 2 - 0.02, 1.4, -4.0]} rotation-y={-Math.PI / 2}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.4, 0.6, 0.02]} />
          <meshStandardMaterial color="#5a4530" roughness={0.7} />
        </mesh>
        {/* Mirror surface */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.33, 0.52]} />
          <meshStandardMaterial color="#607080" metalness={0.8} roughness={0.1} />
        </mesh>
      </group>

      {/* ── Coat hooks on right wall ── */}
      {[-2.5, 0.0, 2.0].map((z, i) => (
        <group key={`whook-${i}`} position={[W / 2 - 0.03, 1.9, z]} rotation-y={-Math.PI / 2}>
          <mesh>
            <cylinderGeometry args={[0.005, 0.005, 0.06, 4]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.03, 4]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Scarf hanging from middle hook */}
      <mesh position={[W / 2 - 0.08, 1.5, 0.0]} rotation={[0.1, 0.2, 0.05]}>
        <boxGeometry args={[0.06, 0.5, 0.015]} />
        <meshStandardMaterial color="#6a3a3a" roughness={0.9} />
      </mesh>

      {/* ── Welcome mat at entrance ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, D / 2 - 0.3]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color="#4a4030" roughness={0.95} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>

      {/* ── Exposed pipe along ceiling (left wall side) ── */}
      <mesh position={[-W / 2 + 0.08, H - 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, D, 8]} />
        <meshStandardMaterial color="#5a5a5a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Pipe brackets */}
      {[-4.0, -1.0, 2.0, 5.0].map((z, i) => (
        <mesh key={`pbracket-${i}`} position={[-W / 2 + 0.08, H - 0.08, z]}>
          <boxGeometry args={[0.04, 0.06, 0.04]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* Pipe valve */}
      <group position={[-W / 2 + 0.08, H - 0.08, 0.0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 6]} />
          <meshStandardMaterial color="#8b2020" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.08, 0.01, 0.01]} />
          <meshStandardMaterial color="#8b2020" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>

      {/* ── Light switch plate on wall ── */}
      <group position={[-W / 2 + 0.02, 1.2, D / 2 - 0.5]} rotation-y={Math.PI / 2}>
        <mesh>
          <boxGeometry args={[0.06, 0.08, 0.01]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
        </mesh>
        {/* Switch toggle */}
        <mesh position={[0, 0.01, 0.006]}>
          <boxGeometry args={[0.03, 0.015, 0.005]} />
          <meshStandardMaterial color="#ccc" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Dust/debris in corners ── */}
      {[
        [W / 2 - 0.3, 0.01, -5.5] as [number, number, number],
        [-W / 2 + 0.3, 0.01, 5.5] as [number, number, number],
      ].map((pos, i) => (
        <mesh key={`dust-${i}`} position={pos} rotation={[0.2 * i, 0.5, 0]}>
          <sphereGeometry args={[0.05, 4, 3]} />
          <meshStandardMaterial color="#5a5040" roughness={0.95} />
        </mesh>
      ))}

      {/* ── Additional door: Bathroom (right wall, z=2) ── */}
      <group position={[W / 2 - 0.02, 0, 2.0]}>
        {/* Door indent */}
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.7, 2.0]} />
          <meshStandardMaterial color="#3a3030" roughness={0.85} />
        </mesh>
        {/* Door frame */}
        <mesh position={[0.01, 1.0, 0]} rotation-y={-Math.PI / 2}>
          <boxGeometry args={[0.03, 2.0, 0.75]} />
          <meshStandardMaterial color="#5a4838" />
        </mesh>
        {/* Door panel (closed) */}
        <mesh position={[0.02, 1.0, 0]} rotation-y={-Math.PI / 2}>
          <boxGeometry args={[0.04, 1.95, 0.7]} />
          <meshStandardMaterial color="#5a4030" roughness={0.75} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.02, 1.0, 0.28]}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Room number */}
        <mesh position={[0.02, 1.8, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshStandardMaterial color="#888" roughness={0.5} />
        </mesh>
      </group>

      {/* ── Corridor ambient fill — warm overhead ── */}
      <pointLight position={[0, 2.0, 1.5]} color="#ffcc88" intensity={2.0} distance={10} />

      {/* ── Dim ambient fill ── */}
      <pointLight position={[0, 1.5, 0]} color="#4a4050" intensity={1.2} distance={10} />
    </group>
  );
}

function createCorridorFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5a4a40';
  ctx.fillRect(0, 0, size, size);

  // Tile pattern
  ctx.strokeStyle = '#4a3a30';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 7);
  return tex;
}

function createCorridorWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a3540';
  ctx.fillRect(0, 0, size, size);

  // Subtle wear marks
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#4a4550' : '#2a2530';
    ctx.fillRect(x, y, Math.random() * 40 + 5, Math.random() * 20 + 5);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  return tex;
}
