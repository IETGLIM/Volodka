/* ─── Volodka RPG – procedural enemy silhouettes for patrolling creeps ─── */

import { useEffect, useId, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { EnemyType } from '@/shared/types/game';
import {
  getEnemyVisualArchetype,
  resolveEnemyVisualSpec,
  type EnemyVisualArchetype,
} from '@/config/enemyVisualRegistry';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';

export type CreepBodyAnimState = 'idle' | 'walk';

export interface CreepBodyProps {
  enemyType: EnemyType;
  color: string;
  animStateRef: React.MutableRefObject<CreepBodyAnimState>;
  bodyMatRef: React.MutableRefObject<THREE.MeshStandardMaterial | null>;
}

function useCreepBodyAnimation(
  groupRef: React.RefObject<THREE.Group | null>,
  animStateRef: React.MutableRefObject<CreepBodyAnimState>,
) {
  const tickOwner = useId();
  const animTimeRef = useRef(0);

  useRegisterNpcFrame(tickOwner, 'procedural', ({ delta }) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    animTimeRef.current += dt;
    const t = animTimeRef.current;
    const body = groupRef.current;
    const anim = animStateRef.current;

    const torso = body.getObjectByName('creepTorso') as THREE.Group | null;
    const leftLeg = body.getObjectByName('creepLeftLeg') as THREE.Group | null;
    const rightLeg = body.getObjectByName('creepRightLeg') as THREE.Group | null;
    const ring = body.getObjectByName('creepRing') as THREE.Group | null;

    if (anim === 'walk') {
      const speed = 9;
      if (torso) {
        torso.position.y = 0.05 + Math.abs(Math.sin(t * speed)) * 0.06;
        torso.rotation.x = Math.sin(t * speed * 0.5) * 0.04;
      }
      if (leftLeg) leftLeg.rotation.x = Math.sin(t * speed) * 0.35;
      if (rightLeg) rightLeg.rotation.x = -Math.sin(t * speed) * 0.35;
      if (ring) ring.rotation.y = t * 2.5;
    } else {
      if (torso) {
        torso.position.y = 0.05 + Math.sin(t * 2) * 0.02;
        torso.rotation.x = Math.sin(t * 1.2) * 0.02;
      }
      if (leftLeg) leftLeg.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      if (ring) ring.rotation.y = t * 0.8;
    }
  });
}

function EtherealCreepBody({ color, bodyMatRef }: { color: string; bodyMatRef: CreepBodyProps['bodyMatRef'] }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a12',
        emissive: color,
        emissiveIntensity: 1.6,
        roughness: 0.3,
        metalness: 0.5,
      }),
    [color],
  );

  useEffect(() => {
    bodyMatRef.current = mat;
    return () => {
      if (bodyMatRef.current === mat) bodyMatRef.current = null;
    };
  }, [bodyMatRef, mat]);

  return (
    <group name="creepTorso" position={[0, 0.05, 0]}>
      <mesh castShadow rotation={[0.4, 0.6, 0]}>
        <octahedronGeometry args={[0.32, 0]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <group name="creepRing" position={[0, -0.05, 0]}>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.42, 0.02, 6, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.55} />
        </mesh>
      </group>
    </group>
  );
}

function GolemCreepBody({ color, bodyMatRef }: { color: string; bodyMatRef: CreepBodyProps['bodyMatRef'] }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#14141c',
        emissive: color,
        emissiveIntensity: 1.4,
        roughness: 0.85,
        metalness: 0.2,
      }),
    [color],
  );

  useEffect(() => {
    bodyMatRef.current = mat;
    return () => {
      if (bodyMatRef.current === mat) bodyMatRef.current = null;
    };
  }, [bodyMatRef, mat]);

  return (
    <>
      <group name="creepTorso" position={[0, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.5, 0.3]} />
          <primitive object={mat} attach="material" />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.28, 0.18, 0.22]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </group>
      <group name="creepLeftLeg" position={[0.12, 0.12, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.28, 0.16]} />
          <meshStandardMaterial color="#101018" emissive={color} emissiveIntensity={0.4} roughness={0.9} />
        </mesh>
      </group>
      <group name="creepRightLeg" position={[-0.12, 0.12, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.28, 0.16]} />
          <meshStandardMaterial color="#101018" emissive={color} emissiveIntensity={0.4} roughness={0.9} />
        </mesh>
      </group>
    </>
  );
}

function AgentCreepBody({ color, bodyMatRef }: { color: string; bodyMatRef: CreepBodyProps['bodyMatRef'] }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0c0c14',
        emissive: color,
        emissiveIntensity: 1.5,
        roughness: 0.35,
        metalness: 0.55,
      }),
    [color],
  );

  useEffect(() => {
    bodyMatRef.current = mat;
    return () => {
      if (bodyMatRef.current === mat) bodyMatRef.current = null;
    };
  }, [bodyMatRef, mat]);

  return (
    <>
      <group name="creepTorso" position={[0, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.38, 0.18]} />
          <primitive object={mat} attach="material" />
        </mesh>
        <mesh position={[0, 0.32, 0.02]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <primitive object={mat} attach="material" />
        </mesh>
      </group>
      <group name="creepLeftLeg" position={[0.09, 0.14, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.32, 0.1]} />
          <meshStandardMaterial color="#101018" emissive={color} emissiveIntensity={0.35} />
        </mesh>
      </group>
      <group name="creepRightLeg" position={[-0.09, 0.14, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.32, 0.1]} />
          <meshStandardMaterial color="#101018" emissive={color} emissiveIntensity={0.35} />
        </mesh>
      </group>
    </>
  );
}

function CensorCreepBody({ color, bodyMatRef }: { color: string; bodyMatRef: CreepBodyProps['bodyMatRef'] }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#080810',
        emissive: color,
        emissiveIntensity: 1.7,
        roughness: 0.25,
        metalness: 0.6,
      }),
    [color],
  );

  useEffect(() => {
    bodyMatRef.current = mat;
    return () => {
      if (bodyMatRef.current === mat) bodyMatRef.current = null;
    };
  }, [bodyMatRef, mat]);

  return (
    <group name="creepTorso" position={[0, 0.45, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.75, 6]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <coneGeometry args={[0.1, 0.22, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      <group name="creepRing" position={[0, 0.62, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}

function CreepArchetypeMesh({
  archetype,
  color,
  bodyMatRef,
}: {
  archetype: EnemyVisualArchetype;
  color: string;
  bodyMatRef: CreepBodyProps['bodyMatRef'];
}) {
  switch (archetype) {
    case 'ethereal':
      return <EtherealCreepBody color={color} bodyMatRef={bodyMatRef} />;
    case 'golem':
      return <GolemCreepBody color={color} bodyMatRef={bodyMatRef} />;
    case 'agent':
      return <AgentCreepBody color={color} bodyMatRef={bodyMatRef} />;
    case 'censor':
      return <CensorCreepBody color={color} bodyMatRef={bodyMatRef} />;
    default: {
      const _exhaustive: never = archetype;
      return _exhaustive;
    }
  }
}

export function CreepBody({ enemyType, color, animStateRef, bodyMatRef }: CreepBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spec = resolveEnemyVisualSpec(enemyType);
  const archetype = getEnemyVisualArchetype(enemyType);

  useCreepBodyAnimation(groupRef, animStateRef);

  return (
    <group ref={groupRef} scale={spec.scale}>
      <CreepArchetypeMesh archetype={archetype} color={color} bodyMatRef={bodyMatRef} />
    </group>
  );
}
