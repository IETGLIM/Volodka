
/* ─── SimplePlayer — Fallback player without Rapier physics ───
 *  Used when Rapier WASM fails to load (Vercel edge, slow connections, etc.)
 *  Direct position manipulation — no collision detection, but the player MOVES.
 *  This ensures the game is always playable even without physics.
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { usePlayerControls, type VirtualControls } from '@/hooks/useGamePhysics';
import {
  getSceneConfig,
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
} from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { isInteractionLocked } from './InteractionSystemBridge';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}

const WALK_SPEED = 4;
const RUN_SPEED = 7;
const ACCEL = 20;
const DAMPING = 10;
const FOOTSTEP_INTERVAL = 0.4;
const ROTATION_SPEED = 10; // frame-rate-independent rotation speed

interface SimplePlayerProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef?: React.MutableRefObject<VirtualControls>;
  onInteractPress?: () => void;
}

/** Fallback player without Rapier physics — direct position manipulation */
export function SimplePlayer({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
  onInteractPress,
}: SimplePlayerProps) {
  const controls = usePlayerControls(onInteractPress);
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const karma = useGameStore((s) => s.playerState.karma);

  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentAnimRef = useRef<string>('idle');
  const footstepTimerRef = useRef(0);
  const prevSceneIdRef = useRef(sceneId);

  const locomotionScale = getExplorationLocomotionScale(sceneId);
  const modelScale = getExplorationCharacterModelScale(sceneId);
  const config = getSceneConfig(sceneId);

  // Reset position on scene change
  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      const newConfig = getSceneConfig(sceneId);
      const spawn = newConfig.spawnPoint;
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);
      livePlayerRotationRef.current = newConfig.initialRotation ?? 0;
      velocityRef.current.set(0, 0, 0);
      if (groupRef.current) {
        groupRef.current.position.set(spawn[0], spawn[1], spawn[2]);
      }
    }
  }, [sceneId, livePlayerRotationRef, livePlayerPositionRef]);

  const tempCameraForward = useRef(new THREE.Vector3());
  const tempCameraRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3(0, 1, 0));
  const tempMoveDir = useRef(new THREE.Vector3());

  useFrameTick('player', ({ state, delta }) => {
    const dt = Math.min(delta, 0.05);
    const vel = velocityRef.current;
    const floorY = config.floorY;

    const currentMode = readGamePhase(useGameStore.getState());
    const showStoryOverlay = useGameStore.getState().showStoryOverlay;
    // ── World Director: lock movement during narrative overlay ──
    const isLocked = showStoryOverlay || currentMode === 'cutscene' || isInteractionLocked();

    if (isLocked) {
      vel.x = 0;
      vel.z = 0;
      currentAnimRef.current = 'idle';

      // ─── CRITICAL FIX: Floor enforcement even when locked ───
      // Without this, the player can drift below the floor during
      // cutscenes/dialogues (no physics in SimplePlayer mode).
      if (groupRef.current) {
        if (groupRef.current.position.y < floorY) {
          groupRef.current.position.y = floorY;
          livePlayerPositionRef.current.copy(groupRef.current.position);
        }
      }
      return;
    }

    // Camera-relative movement direction
    const camFwd = tempCameraForward.current;
    const camRight = tempCameraRight.current;
    const up = tempUp.current;
    const moveDir = tempMoveDir.current;

    state.camera.getWorldDirection(camFwd);
    camFwd.y = 0;
    if (camFwd.length() > 0.001) {
      camFwd.normalize();
    } else {
      camFwd.set(0, 0, -1);
    }
    camRight.crossVectors(camFwd, up).normalize();

    // Input reading
    const keys = controls.getKeys();
    const virtual = virtualControlsRef?.current;
    const fwd = (keys.forward ? 1 : 0) + (virtual?.forward ?? 0);
    const bwd = (keys.backward ? 1 : 0) + (virtual?.backward ?? 0);
    const lft = (keys.left ? 1 : 0) + (virtual?.left ?? 0);
    const rgt = (keys.right ? 1 : 0) + (virtual?.right ?? 0);
    const running = keys.run || (virtual?.run ?? 0) > 0;

    moveDir.set(0, 0, 0);
    moveDir.addScaledVector(camFwd, fwd - bwd);
    moveDir.addScaledVector(camRight, rgt - lft);

    const moveLen = moveDir.length();
    const isMoving = moveLen > 0.01;
    const speed = (running ? RUN_SPEED : WALK_SPEED) * locomotionScale;

    if (isMoving) {
      moveDir.normalize();
      const targetVx = moveDir.x * speed;
      const targetVz = moveDir.z * speed;

      vel.x = THREE.MathUtils.damp(vel.x, targetVx, ACCEL, dt);
      vel.z = THREE.MathUtils.damp(vel.z, targetVz, ACCEL, dt);

      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      // Frame-rate-independent rotation using exponential decay
      const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
      livePlayerRotationRef.current = lerpAngle(
        livePlayerRotationRef.current,
        targetYaw,
        rotT,
      );

      currentAnimRef.current = running ? 'run' : 'walk';

      footstepTimerRef.current += dt;
      if (footstepTimerRef.current >= FOOTSTEP_INTERVAL) {
        footstepTimerRef.current = 0;
        const pos = livePlayerPositionRef.current;
        eventBus.emit('exploration:footstep', {
          position: [pos.x, pos.y, pos.z],
          yaw: livePlayerRotationRef.current,
        });
        audioEngine.playFootstep('default');
      }
    } else {
      vel.x = THREE.MathUtils.damp(vel.x, 0, DAMPING, dt);
      vel.z = THREE.MathUtils.damp(vel.z, 0, DAMPING, dt);
      currentAnimRef.current = 'idle';
      footstepTimerRef.current = 0;
    }

    // Apply velocity to position directly
    if (groupRef.current) {
      groupRef.current.position.x += vel.x * dt;
      groupRef.current.position.z += vel.z * dt;
      groupRef.current.rotation.y = livePlayerRotationRef.current;

      // ─── Ground enforcement: keep player at floor level ───
      if (groupRef.current.position.y < floorY) {
        groupRef.current.position.y = floorY;
      }

      // ─── Boundary clamping: keep player within scene bounds ───
      // SimplePlayer has no collision detection — without this, the player
      // can walk off the map into the void when physics is unavailable.
      const [sceneW, sceneD] = config.size;
      const MARGIN = 0.3; // 30cm margin from boundary wall
      const halfW = sceneW / 2 - MARGIN;
      const halfD = sceneD / 2 - MARGIN;
      groupRef.current.position.x = Math.max(-halfW, Math.min(halfW, groupRef.current.position.x));
      groupRef.current.position.z = Math.max(-halfD, Math.min(halfD, groupRef.current.position.z));

      // Update ref for camera
      livePlayerPositionRef.current.copy(groupRef.current.position);
    }
  });

  const karmaGlow = useMemo(() => {
    if (karma >= 65) return '#00cccc';
    if (karma <= 35) return '#cc3333';
    return '#888888';
  }, [karma]);

  const spawnPoint = config.spawnPoint;

  return (
    <group
      ref={groupRef}
      position={[spawnPoint[0], spawnPoint[1], spawnPoint[2]]}
      rotation={[0, 0, 0]}
    >
      {/* Procedural model — default for cyberpunk aesthetic, no external GLB dependency */}
      <ProceduralPlayerModelAdaptive modelScale={modelScale} karmaGlow={karmaGlow} currentAnimRef={currentAnimRef} rotationRef={livePlayerRotationRef} />

      <pointLight
        position={[0, 1.0, 0]}
        color={karmaGlow}
        intensity={1.2}
        distance={4}
      />
      <pointLight
        position={[0, 1.2, -0.5]}
        color="#ffaa66"
        intensity={0.15}
        distance={2}
      />
    </group>
  );
}
