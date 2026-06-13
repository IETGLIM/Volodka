/**
 * Умка — small bichon companion orbiting Солныш (vera) in corridor and her room.
 */

import { useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useCurrentSceneId } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { buildScheduleContext } from '@/shared/scheduleContext';
import type { MutableRefObject } from 'react';

const UMKA_SCENES = new Set(['volodka_corridor', 'solnysh_room']);
const CORRIDOR_VERA_ANCHOR: [number, number, number] = [0, 0, 1.5];
const ORBIT_RADIUS = 0.55;
const ORBIT_SPEED = 1.6;
/** Feet on walkable floor (matches scene floorY ≈ 0.01). */
const FLOOR_Y = 0.01;
const BOB_HEIGHT = FLOOR_Y + 0.11;

interface UmkaDogProps {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
}

function UmkaMesh() {
  return (
    <group>
      {/* Body — fluffy bichon / bolonka */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.95} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.26, 0.06]} castShadow>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#faf8f4" roughness={0.92} />
      </mesh>
      {/* Snout */}
      <mesh position={[0, 0.22, 0.14]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.9} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.22, 0.18]}>
        <sphereGeometry args={[0.018, 4, 4]} />
        <meshStandardMaterial color="#2a2020" roughness={0.5} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.07, 0.28, 0.02]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ece4dc" roughness={0.95} />
      </mesh>
      <mesh position={[0.07, 0.28, 0.02]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#ece4dc" roughness={0.95} />
      </mesh>
      {/* Tail puff */}
      <mesh position={[0, 0.18, -0.14]} rotation={[0.5, 0, 0]}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#f0ebe4" roughness={0.95} />
      </mesh>
    </group>
  );
}

export function UmkaDog({ livePlayerPositionRef }: UmkaDogProps) {
  const sceneId = useCurrentSceneId();
  const veraState = useGameStore((s) => s.exploration.npcStates.vera);
  const activeCutsceneId = useGameStore((s) => s.activeCutsceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const labelRef = useRef<HTMLDivElement>(null);

  useFrameTick('misc', ({ delta }) => {
    const group = groupRef.current;
    if (!group || !UMKA_SCENES.has(sceneId)) return;

    const inCorridorCutscene =
      sceneId === 'volodka_corridor' && activeCutsceneId === 'act1_corridor_solnysh';

    let anchor: [number, number, number] | null = null;
    if (veraState?.sceneId === sceneId) {
      anchor = veraState.position;
    } else if (inCorridorCutscene) {
      anchor = CORRIDOR_VERA_ANCHOR;
    } else if (sceneId === 'volodka_corridor') {
      const scheduleCtx = buildScheduleContext(useGameStore.getState());
      const entry = getCurrentScheduleEntry('vera', timeOfDay, scheduleCtx);
      if (entry?.sceneId === 'volodka_corridor') {
        anchor = entry.position;
      }
    }

    if (!anchor) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const ax = anchor[0];
    const az = anchor[2];

    phaseRef.current += delta * ORBIT_SPEED;
    const t = phaseRef.current;
    const px = ax + Math.cos(t) * ORBIT_RADIUS;
    const pz = az + Math.sin(t) * ORBIT_RADIUS;
    const py = BOB_HEIGHT + Math.sin(t * 2.4) * 0.03;

    group.position.set(px, py, pz);
    group.rotation.y = -t + Math.PI;

    const player = livePlayerPositionRef.current;
    const dist = player.distanceTo(group.position);
    if (labelRef.current) {
      labelRef.current.style.opacity = dist < 4.5 ? '1' : '0';
    }
  });

  if (!UMKA_SCENES.has(sceneId)) return null;

  return (
    <group ref={groupRef}>
      <UmkaMesh />
      <Html
        center
        distanceFactor={6}
        position={[0, 0.42, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          ref={labelRef}
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#ffe8c0',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          Умка
        </div>
      </Html>
    </group>
  );
}
