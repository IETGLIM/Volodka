
/* ─── Volodka RPG – 3D Quest Waypoints ─── */
/* Floating octahedron arrows at scene exits pointing toward active quest objectives.
   Bobs vertically and rotates to face the player for easy navigation.
   Also renders a pulsing vertical beam of light at the quest target position
   when the target is in the current scene. */

import { useRef, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useQuestWaypointState } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { getQuestMarker } from '@/store/selectors/questSelectors';
import type { SceneId, SceneExit } from '@/shared/types/game';

interface QuestWaypointsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** 3D quest waypoint arrows pointing toward active quest target scenes */
export function QuestWaypoints({ livePlayerPositionRef }: QuestWaypointsProps) {
  const { quests, currentSceneId, playerFlags, playerKarma } = useQuestWaypointState();

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

  // Get the quest target marker if it's in the current scene
  const sameSceneMarker = useMemo<{ position: [number, number, number]; questId: string } | null>(() => {
    const activeQuests = quests.filter((q) => q.status === 'active');
    for (const aq of activeQuests) {
      const marker = getQuestMarker(aq.questId);
      if (marker && marker.sceneId === currentSceneId) {
        return { position: marker.position, questId: aq.questId };
      }
    }
    return null;
  }, [quests, currentSceneId]);

  // Don't render anything if no active quests or no exits and no same-scene marker
  if (!hasActiveQuests) return null;

  return (
    <group key={`quest-waypoints:${currentSceneId}`}>
      {/* Exit arrows — pointing toward quest target exits */}
      {exits.map((exit, i) => (
        <QuestArrow
          key={`quest-arrow-${exit.targetScene}-${i}`}
          position={exit.position}
          playerPosRef={livePlayerPositionRef}
          label={exit.label}
          targetScene={exit.targetScene}
        />
      ))}

      {/* Vertical waypoint beam at quest target position in current scene */}
      {sameSceneMarker && (
        <QuestTargetBeam
          position={sameSceneMarker.position}
          playerPosRef={livePlayerPositionRef}
        />
      )}
    </group>
  );
}

/* ─── Quest Arrow (exit indicator) ─── */

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
  const dirRef = useRef(new THREE.Vector3());

  // Get target scene name for display
  const _targetName = useMemo(() => {
    return SCENE_CONFIG[targetScene]?.name ?? label;
  }, [targetScene, label]);

  useFrameTick('interaction', ({ delta }) => {
    timeRef.current += delta;
    if (meshRef.current) {
      // Bob up and down
      meshRef.current.position.y = position[1] + 1.5 + Math.sin(timeRef.current * 2) * 0.15;
      // Rotate to face player horizontally
      dirRef.current.set(
        playerPosRef.current.x - position[0],
        0,
        playerPosRef.current.z - position[2],
      );
      if (dirRef.current.length() > 0.1) {
        meshRef.current.rotation.y = Math.atan2(dirRef.current.x, dirRef.current.z);
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
    </group>
  );
}

/* ─── Quest Target Beam ─── */
/* A vertical pulsing beam of light at the quest target position.
   Like a lighthouse beacon — thin, translucent, cyan pulsing.
   Height: 4 meters, subtle but visible. */

function QuestTargetBeam({
  position,
  playerPosRef: _playerPosRef,
}: {
  position: [number, number, number];
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const beamRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const baseGlowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const BEAM_HEIGHT = 2;
  const BEAM_RADIUS = 0.02;
  const GLOW_RADIUS = 0.06;

  useFrameTick('interaction', ({ delta }) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Pulse the emissive intensity
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + pulse * 0.7;
      mat.opacity = 0.15 + pulse * 0.15;
    }

    if (baseGlowRef.current) {
      const mat = baseGlowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + pulse * 0.6;
      mat.opacity = 0.2 + pulse * 0.15;
      // Gentle scale pulse
      const s = 1 + pulse * 0.2;
      baseGlowRef.current.scale.set(s, 0.3, s);
    }
  });

  return (
    <group
      ref={beamRef}
      position={[position[0], 0, position[2]]}
    >
      {/* Core beam — thin bright cylinder */}
      <mesh position={[0, BEAM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[BEAM_RADIUS, BEAM_RADIUS, BEAM_HEIGHT, 8]} />
        <meshStandardMaterial
          color="#00ffee"
          emissive="#00ffee"
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow — slightly wider, more translucent */}
      <mesh ref={glowRef} position={[0, BEAM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[GLOW_RADIUS, GLOW_RADIUS, BEAM_HEIGHT, 8]} />
        <meshStandardMaterial
          color="#00ffee"
          emissive="#00ffee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Base glow — disc on the ground */}
      <mesh
        ref={baseGlowRef}
        rotation-x={-Math.PI / 2}
        position={[0, 0.02, 0]}
      >
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial
          color="#00ffee"
          emissive="#00ffee"
          emissiveIntensity={0.35}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
