
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
import { createFrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import { setSharedVirtualControlsWritable } from '@/engine/VirtualControlsState';
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
  ROTATION_SPEED_REVERSAL,
  ROTATION_REVERSAL_THRESHOLD,
  RUN_SPEED,
  WALK_SPEED,
  MAX_HORIZONTAL_SPEED,
} from '@/engine/player/playerConstants';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import {
  getInteractionState,
  isInteractionLocked,
} from '@/engine/interaction/interactionSession';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { devWarn } from '@/shared/utils/devLog';
import { getPlayerExternalVelocity } from '@/engine/PlayerRigidBodyState';
import {
  resolveLockedLocomotionPresentation,
} from '@/engine/player/playerLocomotionPresentation';
import {
  addPlayerMovementLockReasons,
  createPlayerMovementFrameContract,
  shouldConsumeExternalVelocity,
  SIMPLE_PLAYER_FINALIZE_FRAME_CONTRACT,
} from '@/engine/player/playerMovementContract';
import {
  createIdleMovementScratch,
  syncMovementScratchFields,
} from '@/engine/player/playerScratchSync';
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
  const movementScratchRef = useRef(createIdleMovementScratch());

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

    const game = createFrameGameSnapshot(getGameSnapshot());
    const currentMode = game.gamePhase;
    const interactionState = getInteractionState();
    const interactionLocked = isInteractionLocked();
    const lockContract = addPlayerMovementLockReasons(
      game.movementLock,
      interactionLocked ? ['interaction_lock'] : [],
      { interactionState },
    );
    const frameContract = createPlayerMovementFrameContract(lockContract, {
      finalizeFrame: SIMPLE_PLAYER_FINALIZE_FRAME_CONTRACT,
      externalVelocityConsumers: ['simple_locked_movement'],
    });
    const isLocked = frameContract.lock.locked;

    if (isLocked) {
      if (frameContract.lock.shouldResetInputOnEnter && !prevLocomotionLockedRef.current) {
        vel.set(0, 0, 0);
        resetKeyboardInputState();
      }
      setSharedVirtualControlsWritable(false);
    } else if (prevLocomotionLockedRef.current) {
      setSharedVirtualControlsWritable(true);
    }
    prevLocomotionLockedRef.current = isLocked;

    const shouldWatchStuckLock = currentMode === 'exploration' && frameContract.lock.shouldWatchStuckInteraction;

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
      const consumeExternal = shouldConsumeExternalVelocity(
        frameContract.lock,
        'simple_locked_movement',
        external.active,
      );

      if (consumeExternal) {
        vel.x = Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, external.vx));
        vel.z = Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, external.vz));

        const presentation = resolveLockedLocomotionPresentation({
          externalActive: true,
          vx: vel.x,
          vz: vel.z,
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
            audioEngine.playFootstep(config.floorMaterial);
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
        syncMovementScratchFields(movementScratchRef.current, {
          isGroundedNow: true,
          onFlatGround: true,
          airborneIntent: false,
          isMoving: presentation.hSpeed > 0.12,
          running: false,
          keyboardDrivesMove: false,
          blockedByWall: false,
          prevVelY: vel.y,
        });
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
      syncMovementScratchFields(movementScratchRef.current, {
        isGroundedNow: true,
        onFlatGround: true,
        airborneIntent: false,
        isMoving: false,
        running: false,
        keyboardDrivesMove: false,
        blockedByWall: false,
        prevVelY: vel.y,
      });
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

      // FIX 1.6: Use damped velocity even for keyboard to avoid hard-snap
      // "kicks" that the camera spring then has to chase (visible as a
      // micro-twitch on every keypress). High stiffness (25) keeps it
      // responsive while smoothing the edges.
      if (keyboardDrivesMove) {
        const k = 25;
        vel.x = THREE.MathUtils.damp(vel.x, targetVx, k, dt);
        vel.z = THREE.MathUtils.damp(vel.z, targetVz, k, dt);
      } else {
        vel.x = THREE.MathUtils.damp(vel.x, targetVx, moveAccel, dt);
        vel.z = THREE.MathUtils.damp(vel.z, targetVz, moveAccel, dt);
      }

      // Max Payne OTS: body faces camera look while moving (incl. strafe).
      const targetYaw = Math.atan2(camFwd.x, camFwd.z);
      let yawDiff = targetYaw - livePlayerRotationRef.current;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      const effectiveRotSpeed = Math.abs(yawDiff) > ROTATION_REVERSAL_THRESHOLD
        ? ROTATION_SPEED_REVERSAL
        : ROTATION_SPEED;
      const rotT = 1 - Math.exp(-effectiveRotSpeed * dt);
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
        audioEngine.playFootstep(config.floorMaterial);
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
    const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    syncMovementScratchFields(movementScratchRef.current, {
      isGroundedNow: true,
      onFlatGround: true,
      airborneIntent: false,
      isMoving: isMoving || horizontalSpeed > 0.15,
      running,
      keyboardDrivesMove,
      blockedByWall: false,
      prevVelY: vel.y,
    });
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
