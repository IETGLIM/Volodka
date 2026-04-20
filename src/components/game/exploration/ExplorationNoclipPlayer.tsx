'use client';

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { PHYSICS_CONSTANTS, usePlayerControls } from '@/hooks/useGamePhysics';
import { clampPhysicsTimestep } from '@/core/physics/CharacterController';
import type { PhysicsPlayerProps, PhysicsPlayerRef } from '@/components/game/PhysicsPlayer';

/**
 * Диагностика: без Rapier-тела — только `group` и интеграция позиции в `useFrame`.
 * Включение: **`NEXT_PUBLIC_EXPLORATION_NOCLIP=1`**. Визуал — упрощённый «пилон» (без GLB), чтобы не путать с мерцанием модели.
 */
export const ExplorationNoclipPlayer = memo(
  forwardRef<PhysicsPlayerRef, PhysicsPlayerProps>(function ExplorationNoclipPlayer(
    {
      position = [0, 0.06, 3],
      visualModelScale = 1,
      locomotionScale = 1,
      onPositionChange,
      onInteraction,
      isLocked = false,
      initialRotation = 0,
      virtualControlsRef,
      spawnSyncKey,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null);
    const posRef = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const yawRef = useRef(initialRotation);

    useLayoutEffect(() => {
      const g = groupRef.current;
      if (!g) return;
      g.position.copy(posRef.current);
      g.rotation.y = yawRef.current;
    }, []);

    useLayoutEffect(() => {
      if (spawnSyncKey === undefined) return;
      posRef.current.set(position[0], position[1], position[2]);
      yawRef.current = initialRotation;
      const g = groupRef.current;
      if (g) {
        g.position.copy(posRef.current);
        g.rotation.y = yawRef.current;
      }
    }, [spawnSyncKey, position[0], position[1], position[2], initialRotation]);
    const isLockedRef = useRef(isLocked);
    const locomotionScaleRef = useRef(locomotionScale);
    const onInteractionRef = useRef(onInteraction);
    const [isMoving, setIsMoving] = useState(false);
    const isMovingSyncRef = useRef(false);

    useLayoutEffect(() => {
      locomotionScaleRef.current = locomotionScale;
    }, [locomotionScale]);

    useEffect(() => {
      isLockedRef.current = isLocked;
    }, [isLocked]);

    useEffect(() => {
      onInteractionRef.current = onInteraction;
    }, [onInteraction]);

    useEffect(() => {
      yawRef.current = initialRotation;
    }, [initialRotation]);

    const handleInteractPress = useCallback(() => {
      if (onInteractionRef.current && !isLockedRef.current) {
        onInteractionRef.current();
      }
    }, []);

    const { getControls } = usePlayerControls({
      onInteractPress: handleInteractPress,
      virtualControlsRef,
    });
    const getControlsRef = useRef(getControls);
    useLayoutEffect(() => {
      getControlsRef.current = getControls;
    }, [getControls]);

    const roomScale = Math.max(0.28, Math.min(1.25, visualModelScale));
    const capsule = useMemo(() => {
      const s = roomScale;
      const r0 = PHYSICS_CONSTANTS.PLAYER_RADIUS;
      const h0 = PHYSICS_CONSTANTS.PLAYER_HEIGHT;
      const r = r0 * s;
      const halfH = (h0 / 2 - r0) * s;
      const capCenterY = halfH + r;
      return { halfH, r, capCenterY };
    }, [roomScale]);

    useImperativeHandle(
      ref,
      () => ({
        getPosition: () => {
          const p = posRef.current;
          return { x: p.x, y: p.y, z: p.z };
        },
        getRotation: () => yawRef.current,
        teleport: (x: number, y: number, z: number) => {
          posRef.current.set(x, y, z);
          if (groupRef.current) {
            groupRef.current.position.copy(posRef.current);
          }
        },
        getRigidBody: (): RapierRigidBody | null => null,
      }),
      []
    );

    useFrame((_, delta) => {
      const g = groupRef.current;
      if (!g) return;
      const dt = clampPhysicsTimestep(delta);

      if (isLockedRef.current) {
        g.position.copy(posRef.current);
        g.rotation.y = yawRef.current;
        if (isMovingSyncRef.current) {
          isMovingSyncRef.current = false;
          setIsMoving(false);
        }
        if (onPositionChange) {
          const p = posRef.current;
          onPositionChange({ x: p.x, y: p.y, z: p.z, rotation: yawRef.current });
        }
        return;
      }

      const controls = getControlsRef.current();
      const loc = locomotionScaleRef.current;
      const speed =
        (controls.run ? PHYSICS_CONSTANTS.RUN_SPEED : PHYSICS_CONSTANTS.WALK_SPEED) * loc;

      let moveX = 0;
      let moveZ = 0;
      if (controls.forward) moveZ -= 1;
      if (controls.backward) moveZ += 1;
      if (controls.left) moveX -= 1;
      if (controls.right) moveX += 1;
      const len = Math.hypot(moveX, moveZ);
      if (len > 1e-6) {
        moveX /= len;
        moveZ /= len;
      }

      // Мировые оси, как у `PhysicsPlayer` с `horizontalWorldSpace` (не от yaw камеры/игрока).
      const wx = moveX * speed * dt;
      const wz = moveZ * speed * dt;

      const moving = Math.hypot(wx / Math.max(dt, 1e-6), wz / Math.max(dt, 1e-6)) > 0.08;
      if (moving !== isMovingSyncRef.current) {
        isMovingSyncRef.current = moving;
        setIsMoving(moving);
      }

      if (moving) {
        const targetRotation = Math.atan2(moveX, moveZ);
        let prev = yawRef.current;
        let diff = targetRotation - prev;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        yawRef.current = prev + diff * 0.12;
      }

      posRef.current.x += wx;
      posRef.current.z += wz;

      g.position.copy(posRef.current);
      g.rotation.y = yawRef.current;

      if (onPositionChange) {
        const p = posRef.current;
        onPositionChange({ x: p.x, y: p.y, z: p.z, rotation: yawRef.current });
      }
    });

    return (
      <group ref={groupRef} name="ExplorationNoclipPlayer" userData={{ isPlayer: true, noclip: true }}>
        <mesh
          position={[0, capsule.capCenterY, 0]}
          castShadow
          receiveShadow
          userData={{ isPlayer: true }}
        >
          <boxGeometry args={[capsule.r * 2, 2 * capsule.halfH + 2 * capsule.r, capsule.r * 2]} />
          <meshStandardMaterial color="#22aa66" roughness={0.5} metalness={0.05} emissive="#003311" emissiveIntensity={isMoving ? 0.12 : 0.04} />
        </mesh>
      </group>
    );
  })
);
