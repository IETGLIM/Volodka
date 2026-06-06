
/* ─── Volodka RPG – Ambient / Background NPCs
     Lightweight, non-interactable background characters that make the world
     feel populated. They use InstancedMesh for minimal draw calls, have
     ghostly semi-transparent appearance, and simple wander AI driven by
     a single useFrame loop. ─── */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';
import { useGameStore } from '@/store/gameStore';

/* ─── Types ─── */

type AmbientNPCType = 'office_worker' | 'cafe_patron' | 'street_pedestrian' | 'library_reader' | 'park_walker' | 'corridor_neighbor' | 'winter_pedestrian';

interface AmbientNPCConfig {
  /** How many background NPCs to spawn */
  count: number;
  /** NPC visual type (determines color) */
  type: AmbientNPCType;
  /** Wander center positions — each NPC starts near one of these */
  spawnPositions: [number, number, number][];
  /** Maximum wander radius from spawn center */
  wanderRadius: number;
}

/* ─── Scene configs ─── */

const SCENE_CONFIGS: Partial<Record<SceneId, AmbientNPCConfig>> = {
  volodka_corridor: {
    count: 2,
    type: 'corridor_neighbor',
    spawnPositions: [[0, 0, -3], [0, 0, 3]],
    wanderRadius: 2.5,
  },
  office_day: {
    count: 4,
    type: 'office_worker',
    spawnPositions: [[-4.5, 0, -2], [1.5, 0, 0], [4.5, 0, -3], [-1.5, 0, 2]],
    wanderRadius: 2.0,
  },
  cafe_evening: {
    count: 3,
    type: 'cafe_patron',
    spawnPositions: [[3.0, 0, 0], [-3.0, 0, 1.5], [0, 0, -1]],
    wanderRadius: 1.5,
  },
  street_night: {
    count: 3,
    type: 'street_pedestrian',
    spawnPositions: [[0, 0, -5], [0, 0, 3], [0, 0, -12]],
    wanderRadius: 4.0,
  },
  street_winter: {
    count: 2,
    type: 'winter_pedestrian',
    spawnPositions: [[0, 0, -3], [0, 0, 5]],
    wanderRadius: 3.5,
  },
  library_day: {
    count: 2,
    type: 'library_reader',
    spawnPositions: [[0, 0, -2], [0, 0, 3]],
    wanderRadius: 2.0,
  },
  park_day: {
    count: 2,
    type: 'park_walker',
    spawnPositions: [[0, 0, -5], [0, 0, 5]],
    wanderRadius: 4.0,
  },
};

/* ─── Color palette per type ─── */

const TYPE_COLORS: Record<AmbientNPCType, { body: string; head: string; emissive: string }> = {
  office_worker:     { body: '#6a6a7a', head: '#8a8a9a', emissive: '#4a4a5a' },
  cafe_patron:       { body: '#7a5a3a', head: '#9a7a5a', emissive: '#5a3a1a' },
  street_pedestrian: { body: '#3a3a4a', head: '#5a5a6a', emissive: '#2a2a3a' },
  library_reader:    { body: '#5a5a6a', head: '#7a7a8a', emissive: '#3a3a4a' },
  park_walker:       { body: '#4a5a4a', head: '#6a7a6a', emissive: '#2a3a2a' },
  corridor_neighbor: { body: '#6a5a4a', head: '#8a7a6a', emissive: '#4a3a2a' },
  winter_pedestrian: { body: '#4a4a5a', head: '#6a6a7a', emissive: '#2a2a3a' },
};

/* ─── Constants ─── */

const MAX_INSTANCES = 4;
const NPC_SCALE = 0.85;     // Smaller than named NPCs
const BODY_OPACITY = 0.6;   // Ghostly semi-transparent
const WALK_SPEED = 0.5;     // Slow walk
const IDLE_CHANCE = 0.3;    // 30% chance to idle on waypoint reach
const IDLE_DURATION_MIN = 2; // seconds
const IDLE_DURATION_MAX = 6; // seconds
const DIRECTION_CHANGE_INTERVAL = 3; // seconds before changing facing

/* ─── Per-instance state (not React state — plain object mutated in useFrame) ─── */

interface InstanceState {
  /** Current position */
  px: number;
  py: number;
  pz: number;
  /** Current rotation (Y axis) */
  rotationY: number;
  /** Target position to walk toward */
  tx: number;
  ty: number;
  tz: number;
  /** Whether currently idling */
  isIdle: boolean;
  /** Time remaining in idle state */
  idleTimer: number;
  /** Time until next direction change */
  directionTimer: number;
  /** Which spawn index this instance is associated with */
  spawnIndex: number;
}

/* ─── Helper: random point within radius of center ─── */

function randomWanderTarget(cx: number, cz: number, radius: number): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius;
  return [cx + Math.cos(angle) * dist, 0, cz + Math.sin(angle) * dist];
}

/* ─── Helper: angle between two points on XZ plane ─── */

function angleXZ(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

/* ─── Component ─── */

export function AmbientNPCs() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);

  const config = SCENE_CONFIGS[sceneId] ?? null;
  const count = config?.count ?? 0;

  // Colors for current type
  const colors = config ? TYPE_COLORS[config.type] : TYPE_COLORS.office_worker;

  // InstancedMesh refs
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const headMeshRef = useRef<THREE.InstancedMesh>(null);

  // Shared geometries (created once)
  const bodyGeometry = useMemo(() => new THREE.CapsuleGeometry(0.2, 0.7, 2, 6), []);
  const headGeometry = useMemo(() => new THREE.SphereGeometry(0.14, 6, 5), []);

  useEffect(() => {
    const body = bodyGeometry;
    const head = headGeometry;
    return () => {
      body.dispose();
      head.dispose();
    };
  }, [bodyGeometry, headGeometry]);

  // Per-instance state — plain mutable array, no React state
  const instanceStates = useRef<InstanceState[]>([]);

  // Reusable Object3D for matrix computation
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instance states when scene/config changes
  useEffect(() => {
    if (!config || count === 0) {
      instanceStates.current = [];
      return;
    }

    const states: InstanceState[] = [];
    for (let i = 0; i < count; i++) {
      const spawnIdx = i % config.spawnPositions.length;
      const spawn = config.spawnPositions[spawnIdx];
      const [tx, ty, tz] = randomWanderTarget(spawn[0], spawn[2], config.wanderRadius);

      // Randomly idle or walking
      const isIdle = Math.random() < IDLE_CHANCE;

      states.push({
        px: spawn[0] + (Math.random() - 0.5) * 0.5,
        py: 0.75, // Capsule center height at 0.85 scale
        pz: spawn[2] + (Math.random() - 0.5) * 0.5,
        rotationY: Math.random() * Math.PI * 2,
        tx, ty, tz,
        isIdle,
        idleTimer: isIdle ? (IDLE_DURATION_MIN + Math.random() * (IDLE_DURATION_MAX - IDLE_DURATION_MIN)) : 0,
        directionTimer: Math.random() * DIRECTION_CHANGE_INTERVAL,
        spawnIndex: spawnIdx,
      });
    }
    instanceStates.current = states;

    // Immediately set all instance matrices to avoid first-frame flash
    // Hide unused instances by scaling to 0
    if (bodyMeshRef.current && headMeshRef.current) {
      for (let i = 0; i < MAX_INSTANCES; i++) {
        if (i < count) {
          const s = states[i];
          dummy.position.set(s.px, s.py, s.pz);
          dummy.rotation.set(0, s.rotationY, 0);
          dummy.scale.set(NPC_SCALE, NPC_SCALE, NPC_SCALE);
        } else {
          dummy.position.set(0, -100, 0); // Hide offscreen
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        bodyMeshRef.current.setMatrixAt(i, dummy.matrix);
        headMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      bodyMeshRef.current.instanceMatrix.needsUpdate = true;
      headMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [config, count, dummy]);

  // Set per-instance colors when type changes
  useEffect(() => {
    if (!bodyMeshRef.current || !headMeshRef.current) return;

    const bodyColor = new THREE.Color(colors.body);
    const headColor = new THREE.Color(colors.head);

    for (let i = 0; i < MAX_INSTANCES; i++) {
      bodyMeshRef.current.setColorAt(i, bodyColor);
      headMeshRef.current.setColorAt(i, headColor);
    }

    bodyMeshRef.current.instanceColor!.needsUpdate = true;
    headMeshRef.current.instanceColor!.needsUpdate = true;
  }, [colors]);

  // Single useFrame drives all instance positions
  useFrameTick('npc', ({ delta }) => {
    const bodyMesh = bodyMeshRef.current;
    const headMesh = headMeshRef.current;
    if (!bodyMesh || !headMesh) return;
    if (!config || count === 0) return;

    const states = instanceStates.current;
    if (states.length === 0) return;

    const dt = Math.min(delta, 0.05); // Clamp delta

    for (let i = 0; i < count && i < states.length; i++) {
      const s = states[i];

      if (s.isIdle) {
        // Decrement idle timer
        s.idleTimer -= dt;
        if (s.idleTimer <= 0) {
          // Start walking to a new target
          s.isIdle = false;
          const spawn = config.spawnPositions[s.spawnIndex % config.spawnPositions.length];
          const [tx, , tz] = randomWanderTarget(spawn[0], spawn[2], config.wanderRadius);
          s.tx = tx;
          s.tz = tz;
          // Face the target
          s.rotationY = angleXZ(s.px, s.pz, s.tx, s.tz);
        } else {
          // Slowly change direction while idle (looking around)
          s.directionTimer -= dt;
          if (s.directionTimer <= 0) {
            s.rotationY += (Math.random() - 0.5) * Math.PI * 0.5;
            s.directionTimer = DIRECTION_CHANGE_INTERVAL + Math.random() * 2;
          }
        }
      } else {
        // Walk toward target
        const dx = s.tx - s.px;
        const dz = s.tz - s.pz;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.3) {
          // Reached target — maybe idle, maybe pick new target
          if (Math.random() < IDLE_CHANCE) {
            s.isIdle = true;
            s.idleTimer = IDLE_DURATION_MIN + Math.random() * (IDLE_DURATION_MAX - IDLE_DURATION_MIN);
          } else {
            const spawn = config.spawnPositions[s.spawnIndex % config.spawnPositions.length];
            const [tx, , tz] = randomWanderTarget(spawn[0], spawn[2], config.wanderRadius);
            s.tx = tx;
            s.tz = tz;
            s.rotationY = angleXZ(s.px, s.pz, s.tx, s.tz);
          }
        } else {
          // Move toward target
          const speed = WALK_SPEED * dt;
          const moveX = (dx / dist) * speed;
          const moveZ = (dz / dist) * speed;
          s.px += moveX;
          s.pz += moveZ;

          // Smoothly rotate toward movement direction
          const targetRot = angleXZ(s.px, s.pz, s.tx, s.tz);
          let rotDiff = targetRot - s.rotationY;
          // Normalize to [-PI, PI]
          while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
          while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
          s.rotationY += rotDiff * Math.min(1, dt * 3);
        }
      }

      // Update instance matrices
      // Body
      dummy.position.set(s.px, s.py, s.pz);
      dummy.rotation.set(0, s.rotationY, 0);
      dummy.scale.set(NPC_SCALE, NPC_SCALE, NPC_SCALE);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);

      // Head — positioned above body
      dummy.position.set(s.px, s.py + 0.62, s.pz);
      dummy.rotation.set(0, s.rotationY, 0);
      dummy.scale.set(NPC_SCALE, NPC_SCALE, NPC_SCALE);
      dummy.updateMatrix();
      headMesh.setMatrixAt(i, dummy.matrix);
    }

    // Hide unused instances
    for (let i = count; i < MAX_INSTANCES; i++) {
      dummy.position.set(0, -100, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(i, dummy.matrix);
      headMesh.setMatrixAt(i, dummy.matrix);
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
  }, { label: 'AmbientNPCs' });

  // Don't render anything if no config for this scene
  if (!config || count === 0) return null;

  return (
    <group>
      {/* Body capsule instances */}
      <instancedMesh
        ref={bodyMeshRef}
        args={[bodyGeometry, undefined, MAX_INSTANCES]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color={colors.body}
          emissive={colors.emissive}
          emissiveIntensity={0.08}
          transparent
          opacity={BODY_OPACITY}
          roughness={0.9}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Head sphere instances */}
      <instancedMesh
        ref={headMeshRef}
        args={[headGeometry, undefined, MAX_INSTANCES]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color={colors.head}
          emissive={colors.emissive}
          emissiveIntensity={0.08}
          transparent
          opacity={BODY_OPACITY}
          roughness={0.8}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
