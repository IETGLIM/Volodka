"use client";

import type { MutableRefObject, RefObject } from 'react';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { RigidBodyType } from '@dimforge/rapier3d-compat';
import { footstepSfxType, resolveFootstepMaterial, type FootstepMaterial } from '@/lib/footstepMaterials';
import { audioEngine } from '@/engine/AudioEngine';
import { PHYSICS_CONSTANTS } from '@/hooks/useGamePhysics';

const RAY_LEN = 2.8;
const MIN_STEP_INTERVAL = 0.14;
const MAX_STEP_INTERVAL = 0.52;

export interface UsePlayerFootstepsArgs {
  rigidBodyRef: RefObject<RapierRigidBody | null>;
  groundedRef: MutableRefObject<boolean>;
  horizVelXRef: MutableRefObject<number>;
  horizVelZRef: MutableRefObject<number>;
  isLockedRef: MutableRefObject<boolean>;
  /** Бег укорачивает интервал между шагами */
  isRunningRef: MutableRefObject<boolean>;
  enabled?: boolean;
}

/**
 * Шаги по материалу поверхности: короткий raycast вниз от тела игрока, `userData.footstepMaterial` на коллайдере.
 */
export function usePlayerFootsteps({
  rigidBodyRef,
  groundedRef,
  horizVelXRef,
  horizVelZRef,
  isLockedRef,
  isRunningRef,
  enabled = true,
}: UsePlayerFootstepsArgs) {
  const { world, rapier, colliderStates } = useRapier();
  const lastMatRef = useRef<FootstepMaterial>('default');
  const stepCooldownRef = useRef(0);

  useFrame((_, delta) => {
    if (!enabled) return;
    const rb = rigidBodyRef.current;
    if (!rb || isLockedRef.current) {
      stepCooldownRef.current = 0;
      return;
    }
    if (!groundedRef.current) {
      stepCooldownRef.current = 0;
      return;
    }

    const spd = Math.hypot(horizVelXRef.current, horizVelZRef.current);
    if (spd < 0.18) {
      stepCooldownRef.current = 0;
      return;
    }

    const walk = PHYSICS_CONSTANTS.WALK_SPEED;
    const speedNorm = Math.min(1.35, spd / walk);
    const base = isRunningRef.current ? 0.26 : 0.36;
    const interval = Math.min(MAX_STEP_INTERVAL, Math.max(MIN_STEP_INTERVAL, base / speedNorm));

    stepCooldownRef.current -= delta;
    if (stepCooldownRef.current > 0) return;

    const tr = rb.translation();
    const origin = new rapier.Vector3(tr.x, tr.y + 0.06, tr.z);
    const dir = new rapier.Vector3(0, -1, 0);
    const ray = new rapier.Ray(origin, dir);

    const hit = world.castRay(ray, RAY_LEN, true, undefined, undefined, undefined, rb, (c) => {
      const p = c.parent();
      return p ? p.bodyType() === RigidBodyType.Fixed : false;
    });

    let material: FootstepMaterial = 'default';
    if (hit) {
      const state = colliderStates.get(hit.collider.handle);
      material = resolveFootstepMaterial(state?.object);
      lastMatRef.current = material;
    } else {
      material = lastMatRef.current;
    }

    audioEngine.playSfx(footstepSfxType(material), isRunningRef.current ? 0.2 : 0.17);
    stepCooldownRef.current = interval;
  });
}
