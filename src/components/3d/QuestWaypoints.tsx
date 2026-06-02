'use client';

/* ─── Volodka RPG – 3D Quest Waypoints ─── */
/* Floating octahedron arrows at scene exits pointing toward active quest objectives.
   Bobs vertically and rotates to face the player for easy navigation. */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId, SceneExit } from '@/shared/types/game';

interface QuestWaypointsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** 3D quest waypoint arrows pointing toward active quest target scenes */
export function QuestWaypoints({ livePlayerPositionRef }: QuestWaypointsProps) {
  // P3-FIX: useShallow for object/array selectors. Without it, quests (array)
  // and playerFlags (object) return new references on every store update,
  // causing unnecessary re-renders of this component and its children.
  const { quests, currentSceneId, playerFlags, playerKarma } = useGameStore(
    useShallow((s) => ({
      quests: s.quests,
      currentSceneId: s.exploration.currentSceneId,
      playerFlags: s.playerState.flags,
      playerKarma: s.playerState.karma,
    })),
  );

  // Determine if there are any active quests
  const hasActiveQuests = useMemo(() => {
    return quests.some((q) => q.status === 'active');
  }, [quests]);

  // Get available exits for current scene, filtered by flags/karma
  const exits = useMemo<SceneExit[]>(() => {
    const config = SCENE_CONFIG[currentSceneId];
    if (!config?.exits) return [];
    return config.exits.filter((exit) => {
      if (exit.requiredFlag && !playerFlags[exit.requiredFlag]) return false;
      if (exit.minKarma !== undefined && playerKarma < exit.minKarma) return false;
      if (exit.maxKarma !== undefined && playerKarma > exit.maxKarma) return false;
      return true;
    });
  }, [currentSceneId, playerFlags, playerKarma]);

  // Don't render anything if no active quests or no exits
  if (!hasActiveQuests || exits.length === 0) return null;

  return (
    <group>
      {exits.map((exit, i) => (
        <QuestArrow
          key={`quest-arrow-${exit.targetScene}-${i}`}
          position={exit.position}
          playerPosRef={livePlayerPositionRef}
          label={exit.label}
          targetScene={exit.targetScene}
        />
      ))}
    </group>
  );
}

function QuestArrow({
  position,
  playerPosRef,
  label,
  targetScene,
}: {
  position: [number, number, number];
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  label: string;
  targetScene: SceneId;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Get target scene name for display
  const targetName = useMemo(() => {
    return SCENE_CONFIG[targetScene]?.name ?? label;
  }, [targetScene, label]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      // Bob up and down
      meshRef.current.position.y = position[1] + 1.5 + Math.sin(timeRef.current * 2) * 0.15;
      // Rotate to face player horizontally
      const dir = new THREE.Vector3(
        playerPosRef.current.x - position[0],
        0,
        playerPosRef.current.z - position[2],
      );
      if (dir.length() > 0.1) {
        meshRef.current.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={meshRef} position={[0, position[1] + 1.5, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color="#00ffcc"
          emissive="#00ffcc"
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Label using Html from drei would be nice, but keeping it simple
          with just the 3D arrow for perf. The exit label is already shown
          by SceneExitIndicator. */}
    </group>
  );
}
