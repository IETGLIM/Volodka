
/* ─── SimplePlayer — Fallback player without Rapier physics ───
 *  Used when Rapier WASM fails to load (Vercel edge, slow connections, etc.)
 *  Direct position manipulation — no collision detection, but the player MOVES.
 *  This ensures the game is always playable even without physics.
 */

import { useRef, useEffect, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

import { getGameStore } from '@/store/gameStore';
import { getGameSnapshot } from '@/engine/StateDispatcher';
import { useCurrentSceneId, usePlayerKarma } from '@/store/selectors';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { createFrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import { clearSharedVirtualControls } from '@/engine/VirtualControlsState';
import { resetKeyboardInputState } from '@/engine/keyboardInputState';
import { usePlayerControls, type VirtualControls } from '@/hooks/useGamePhysics';
import {
  getSceneConfig,
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  getExplorationMovementTuning,
  getExplorationWalkableBounds,
  getTouchLocomotionFactor,
} from '@/config/scenes';
import { sampleHeldVirtualControls, type VirtualHoldTimes } from '@/engine/VirtualInputHold';
import { setPlayerMovementMode, getPlayerMovementMode } from '@/engine/player/playerMovementMode';
import {
  getAccessibilityLocomotionScale,
  resolveMovementIntent,
} from '@/engine/player/playerLocomotionPresentation';
import {
  FOOTSTEP_INTERVAL,
  KEYBOARD_ACCEL,
  ROTATION_SPEED,
  RUN_SPEED,
  WALK_SPEED,
} from '@/engine/player/playerConstants';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import {
  getInteractionState,
  isInteractionLocked,
} from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { devWarn } from '@/shared/utils/devLog';
import { getPlayerExternalVelocity } from '@/engine/PlayerRigidBodyState';
import {
  resolveLockedLocomotionPresentation,
} from '@/engine/player/playerLocomotionPresentation';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}

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
  const controls = usePlayerControls(onInteractPress, virtualControlsRef);
  const sceneId = useCurrentSceneId();
  const karma = usePlayerKarma();

  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentAnimRef = useRef<string>('idle');
  const footstepTimerRef = useRef(0);
  const virtualHoldTimesRef = useRef<VirtualHoldTimes>({});
  const prevSceneIdRef = useRef(sceneId);

  useEffect(() => {
    setPlayerMovementMode('simple');
    return () => {
      if (getPlayerMovementMode() === 'simple') {
        setPlayerMovementMode('kcc');
      }
    };
  }, []);

  const locomotionScale = getExplorationLocomotionScale(sceneId);
  const movementTuning = getExplorationMovementTuning(sceneId);
  const modelScale = getExplorationCharacterModelScale(sceneId);
  const config = getSceneConfig(sceneId);
  const walkableBounds = useMemo(() => getExplorationWalkableBounds(sceneId), [sceneId]);

  const stuckLockTimerRef = useRef(0);
  const prevLocomotionLockedRef = useRef(false);

  // Teleport on scene change — store spawn (SceneTransitionHandler), same as PhysicsPlayer
  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      const newConfig = getSceneConfig(sceneId);
      const storeSpawn = getGameStore().exploration.playerPosition;
      const spawn = storeSpawn ?? newConfig.spawnPoint;
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);
      livePlayerRotationRef.current = newConfig.initialRotation ?? 0;
      velocityRef.current.set(0, 0, 0);
      if (groupRef.current) {
        groupRef.current.position.set(spawn[0], spawn[1], spawn[2]);
      }
    }
  }, [sceneId, livePlayerRotationRef, livePlayerPositionRef]);

  // Immediate teleport on scene:enter — before React re-renders sceneId
  useEffect(() => {
    const unsub = eventBus.on('scene:enter', ({ sceneId: enteredScene }) => {
      const spawn = getGameStore().exploration.playerPosition;
      prevSceneIdRef.current = enteredScene;
      velocityRef.current.set(0, 0, 0);

      const enteredConfig = getSceneConfig(enteredScene);
      livePlayerRotationRef.current = enteredConfig.initialRotation ?? 0;
      livePlayerPositionRef.current.set(spawn[0], spawn[1], spawn[2]);

      if (groupRef.current) {
        groupRef.current.position.set(spawn[0], spawn[1], spawn[2]);
      }
    });
    return unsub;
  }, [livePlayerPositionRef, livePlayerRotationRef]);

  const tempCameraForward = useRef(new THREE.Vector3());
  const tempCameraRight = useRef(new THREE.Vector3());
  const tempUp = useRef(new THREE.Vector3(0, 1, 0));
  const tempMoveDir = useRef(new THREE.Vector3());

  useFrameTick('player', ({ state, delta }) => {
    const dt = Math.min(delta, 0.05);
    const vel = velocityRef.current;
    const floorY = config.floorY;

    const lockState = getGameStore();
    const game = createFrameGameSnapshot(getGameSnapshot());
    const currentMode = game.gamePhase;
    const showStoryOverlay = lockState.showStoryOverlay;
    const currentNodeId = lockState.currentNodeId;
    const narrativeLocked = isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '');
    const interactionLocked = isInteractionLocked();
    const isLocked = game.movementLocked || interactionLocked;

    if (isLocked && !prevLocomotionLockedRef.current) {
      vel.set(0, 0, 0);
      resetKeyboardInputState();
      clearSharedVirtualControls();
    }
    prevLocomotionLockedRef.current = isLocked;

    const interactionState = getInteractionState();
    const inExpectedLongInteractionPhase =
      interactionState === InteractionState.Approach ||
      interactionState === InteractionState.Cutscene;
    const shouldWatchStuckLock =
      interactionLocked &&
      currentMode === 'exploration' &&
      !narrativeLocked &&
      !inExpectedLongInteractionPhase;

    if (shouldWatchStuckLock) {
      stuckLockTimerRef.current += dt;
      if (stuckLockTimerRef.current > 2.0) {
        devWarn('[SimplePlayer] Interaction lock stuck for 2s — force-unlocking');
        forceEmitInteractionEnd();
        eventBus.emit('player:stand_up', {});
        stuckLockTimerRef.current = 0;
      }
    } else if (!isLocked) {
      stuckLockTimerRef.current = 0;
    }

    if (isLocked) {
      const external = getPlayerExternalVelocity();
      const approachViaExternal =
        interactionLocked &&
        !narrativeLocked &&
        currentMode !== 'cutscene' &&
        currentMode !== 'intro' &&
        external.active;

      if (approachViaExternal) {
        vel.x = external.vx;
        vel.z = external.vz;

        const presentation = resolveLockedLocomotionPresentation({
          externalActive: true,
          vx: external.vx,
          vz: external.vz,
          gamePhase: currentMode,
        });
        currentAnimRef.current = presentation.anim;

        if (presentation.hSpeed > 0.1) {
          const targetYaw = Math.atan2(vel.x, vel.z);
          const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
          livePlayerRotationRef.current = lerpAngle(
            livePlayerRotationRef.current,
            targetYaw,
            rotT,
          );
        }

        if (presentation.hSpeed > 0.5) {
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
          footstepTimerRef.current = 0;
        }

        if (groupRef.current) {
          groupRef.current.position.x += vel.x * dt;
          groupRef.current.position.z += vel.z * dt;
          groupRef.current.rotation.y = livePlayerRotationRef.current;

          const approachEffectiveFloorY = Math.max(floorY, 0);
          if (groupRef.current.position.y < approachEffectiveFloorY) {
            groupRef.current.position.y = approachEffectiveFloorY;
          }

          const bounds = walkableBounds;
          groupRef.current.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, groupRef.current.position.x));
          groupRef.current.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, groupRef.current.position.z));

          livePlayerPositionRef.current.copy(groupRef.current.position);
        }
        return;
      }

      vel.x = 0;
      vel.z = 0;
      currentAnimRef.current = 'idle';

      // ─── CRITICAL FIX: Floor enforcement even when locked ───
      // Without this, the player can drift below the floor during
      // cutscenes/dialogues (no physics in SimplePlayer mode).
      // Use max(floorY, 0) to prevent negative Y values
      if (groupRef.current) {
        const lockedEffectiveFloorY = Math.max(floorY, 0);
        if (groupRef.current.position.y < lockedEffectiveFloorY) {
          groupRef.current.position.y = lockedEffectiveFloorY;
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
    const virtual = sampleHeldVirtualControls(
      virtualControlsRef?.current,
      state.clock.elapsedTime,
      virtualHoldTimesRef.current,
    );
    const {
      fwd,
      bwd,
      lft,
      rgt,
      running,
      keyboardDrivesMove,
      analogSpeedScale,
      isMoving,
    } = resolveMovementIntent({ keys, virtual });

    moveDir.set(0, 0, 0);
    moveDir.addScaledVector(camFwd, fwd - bwd);
    moveDir.addScaledVector(camRight, rgt - lft);

    const touchScale = keyboardDrivesMove ? 1 : getTouchLocomotionFactor();
    const speed = (running ? RUN_SPEED : WALK_SPEED)
      * locomotionScale
      * touchScale
      * getAccessibilityLocomotionScale()
      * analogSpeedScale;
    const moveAccel = keyboardDrivesMove ? KEYBOARD_ACCEL : movementTuning.accel;
    const stopDamping = keyboardDrivesMove ? movementTuning.damping * 0.55 : movementTuning.damping;

    if (isMoving) {
      moveDir.normalize();
      const targetVx = moveDir.x * speed;
      const targetVz = moveDir.z * speed;

      if (keyboardDrivesMove) {
        vel.x = targetVx;
        vel.z = targetVz;
      } else {
        vel.x = THREE.MathUtils.damp(vel.x, targetVx, moveAccel, dt);
        vel.z = THREE.MathUtils.damp(vel.z, targetVz, moveAccel, dt);
      }

      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      // Frame-rate-independent rotation using exponential decay
      const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
      livePlayerRotationRef.current = lerpAngle(
        livePlayerRotationRef.current,
        targetYaw,
        rotT,
      );

      const newAnim = running ? 'run' : 'walk';
      if (currentAnimRef.current !== newAnim) {
        currentAnimRef.current = newAnim;
      }

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
      vel.x = THREE.MathUtils.damp(vel.x, 0, stopDamping, dt);
      vel.z = THREE.MathUtils.damp(vel.z, 0, stopDamping, dt);
      if (currentAnimRef.current !== 'idle') {
        currentAnimRef.current = 'idle';
      }
      footstepTimerRef.current = 0;
    }

    // Apply velocity to position directly
    if (groupRef.current) {
      groupRef.current.position.x += vel.x * dt;
      groupRef.current.position.z += vel.z * dt;
      groupRef.current.rotation.y = livePlayerRotationRef.current;

      // ─── Ground enforcement: keep player at floor level ───
      // Use max(floorY, 0) to prevent negative Y values
      const effectiveFloorY = Math.max(floorY, 0);
      if (groupRef.current.position.y < effectiveFloorY) {
        groupRef.current.position.y = effectiveFloorY;
      }

      // ─── Boundary clamping: keep player within scene bounds ───
      // SimplePlayer has no collision detection — without this, the player
      // can walk off the map into the void when physics is unavailable.
      const bounds = walkableBounds;
      groupRef.current.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, groupRef.current.position.x));
      groupRef.current.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, groupRef.current.position.z));

      // Update ref for camera
      livePlayerPositionRef.current.copy(groupRef.current.position);
    }
  });

  const karmaGlow = useMemo(() => {
    if (karma >= 65) return '#00cccc';
    if (karma <= 35) return '#cc3333';
    return '#888888';
  }, [karma]);

  const initialSpawn = getGameStore().exploration.playerPosition ?? config.spawnPoint;

  return (
    <group
      ref={groupRef}
      position={[initialSpawn[0], initialSpawn[1], initialSpawn[2]]}
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
