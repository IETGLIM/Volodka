
/* ─── Volodka RPG – Ambient / Background NPCs
     Lightweight, non-interactable background characters that make the world
     feel populated. Humanoid billboard impostors (not capsules) + wander AI
     in a single useFrame loop. ─── */

import { useRef, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { scratchColor } from '@/engine/three/frameScratch';
import { seededRand } from '@/shared/utils/seededRand';
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';
import { useGameStore } from '@/store/gameStore';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import { DEFAULT_NPC_LOD, scaleNpcLodThresholds } from '@/engine/lod/distanceLod';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getAmbientCrowdImpostorTexture } from '@/engine/graphics/ambientCrowdImpostorTexture';
import {
  MAX_AMBIENT_NPC_INSTANCES,
  resolveAmbientNpcCount,
  resolveAmbientNpcOpacity,
} from '@/engine/world/resolveAmbientNpcBudget';
import {
  AmbientSkinnedMidLod,
  MAX_AMBIENT_SKINNED,
  type AmbientCrowdLiveSlot,
} from './AmbientSkinnedMidLod';

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
    count: 1,
    type: 'corridor_neighbor',
    spawnPositions: [[0, 0, 3.5]],
    wanderRadius: 1.0,
  },
  home_evening: {
    count: 1,
    type: 'corridor_neighbor',
    spawnPositions: [[-1.2, 0, 0.5], [1.0, 0, -0.8]],
    wanderRadius: 1.2,
  },
  street_night: {
    count: 5,
    type: 'street_pedestrian',
    spawnPositions: [[-2.2, 0, -6], [1.6, 0, 2], [-1.8, 0, 7], [3.2, 0, -3], [-3.5, 0, 4]],
    wanderRadius: 3.0,
  },
  street_winter: {
    count: 3,
    type: 'winter_pedestrian',
    spawnPositions: [[-1.5, 0, -4], [2, 0, 5], [0.5, 0, 1]],
    wanderRadius: 2.8,
  },
  library_day: {
    count: 3,
    type: 'library_reader',
    spawnPositions: [[0, 0, -2], [0, 0, 3], [-1.5, 0, 0.5]],
    wanderRadius: 2.0,
  },
  park_day: {
    count: 4,
    type: 'park_walker',
    spawnPositions: [[0, 0, -5], [0, 0, 5], [-4, 0, 0], [4, 0, -2]],
    wanderRadius: 4.5,
  },
  city_square: {
    count: 5,
    type: 'street_pedestrian',
    spawnPositions: [[-3, 0, -4], [3, 0, -2], [0, 0, 5], [-5, 0, 2], [4, 0, 3]],
    wanderRadius: 4.0,
  },
  cafe_evening: {
    count: 4,
    type: 'cafe_patron',
    spawnPositions: [[3.0, 0, 0], [-3.0, 0, 1.5], [0, 0, -1], [2.0, 0, 2]],
    wanderRadius: 1.8,
  },
  office_day: {
    count: 5,
    type: 'office_worker',
    spawnPositions: [[-4.5, 0, -2], [1.5, 0, 0], [4.5, 0, -3], [-1.5, 0, 2], [0, 0, -4]],
    wanderRadius: 2.2,
  },
  pier_evening: {
    count: 3,
    type: 'street_pedestrian',
    spawnPositions: [[-2, 0, 2], [2.5, 0, -1], [0, 0, 4]],
    wanderRadius: 2.5,
  },
  river_pier: {
    count: 3,
    type: 'street_pedestrian',
    spawnPositions: [[-1.5, 0, 1], [2, 0, -2], [0.5, 0, 3]],
    wanderRadius: 2.4,
  },
  rooftop_edge: {
    count: 2,
    type: 'street_pedestrian',
    spawnPositions: [[-2, 0, -1], [2, 0, 1]],
    wanderRadius: 1.8,
  },
  factory_roof: {
    count: 2,
    type: 'street_pedestrian',
    spawnPositions: [[-2.5, 0, 0], [2, 0, -1.5]],
    wanderRadius: 2.0,
  },
  abandoned_factory: {
    count: 3,
    type: 'street_pedestrian',
    spawnPositions: [[-3, 0, -2], [2, 0, 3], [0, 0, -5]],
    wanderRadius: 3.5,
  },
  factory_basement: {
    count: 1,
    type: 'corridor_neighbor',
    spawnPositions: [[0, 0, 2]],
    wanderRadius: 1.2,
  },
  chk_campfire_night: {
    count: 2,
    type: 'park_walker',
    spawnPositions: [[-1.5, 0, 1], [1.8, 0, -1]],
    wanderRadius: 2.0,
  },
};

/* ─── Color palette per type ─── */

const TYPE_COLORS: Record<AmbientNPCType, { body: string; emissive: string }> = {
  office_worker:     { body: '#6a6a7a', emissive: '#4a4a5a' },
  cafe_patron:       { body: '#7a5a3a', emissive: '#5a3a1a' },
  street_pedestrian: { body: '#3a3a4a', emissive: '#2a2a3a' },
  library_reader:    { body: '#5a5a6a', emissive: '#3a3a4a' },
  park_walker:       { body: '#4a5a4a', emissive: '#2a3a2a' },
  corridor_neighbor: { body: '#6a5a4a', emissive: '#4a3a2a' },
  winter_pedestrian: { body: '#4a4a5a', emissive: '#2a2a3a' },
};

/* ─── Constants ─── */

const MAX_INSTANCES = MAX_AMBIENT_NPC_INSTANCES;
const NPC_HEIGHT = 1.72;
const NPC_WIDTH = 0.72;
const BODY_OPACITY = 0.78;
const WALK_SPEED = 0.5;
const IDLE_CHANCE = 0.3;
const IDLE_DURATION_MIN = 2;
const IDLE_DURATION_MAX = 6;
const DIRECTION_CHANGE_INTERVAL = 3;

/* ─── Per-instance state ─── */

interface InstanceState {
  px: number;
  py: number;
  pz: number;
  /** Facing for wander (not billboard — billboard tracks camera). */
  rotationY: number;
  tx: number;
  ty: number;
  tz: number;
  isIdle: boolean;
  idleTimer: number;
  directionTimer: number;
  timerResetCount: number;
  spawnIndex: number;
}

function seededWanderTarget(cx: number, cz: number, radius: number, seed: number): [number, number, number] {
  const angle = seededRand(seed) * Math.PI * 2;
  const dist = seededRand(seed + 1) * radius;
  return [cx + Math.cos(angle) * dist, 0, cz + Math.sin(angle) * dist];
}

function angleXZ(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

/* ─── Component ─── */

interface AmbientNPCsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export function AmbientNPCs({ livePlayerPositionRef }: AmbientNPCsProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const { preset } = useGraphicsQuality();
  const camera = useThree((s) => s.camera);
  const cullDistance = useMemo(
    () => scaleNpcLodThresholds(DEFAULT_NPC_LOD, preset.lodBias).cullOut,
    [preset.lodBias],
  );
  const maxSkinned = preset.visualLite
    ? 0
    : preset.id === 'low'
      ? 3
      : preset.id === 'medium'
        ? 5
        : MAX_AMBIENT_SKINNED;

  const config = SCENE_CONFIGS[sceneId] ?? SCENE_CONFIGS[resolveDerivedSceneId(sceneId)] ?? null;
  const baseCount = config?.count ?? 0;
  const count = resolveAmbientNpcCount(sceneId, baseCount, preset.id);
  const bodyOpacity = resolveAmbientNpcOpacity(sceneId, BODY_OPACITY);

  const colors = config ? TYPE_COLORS[config.type] : TYPE_COLORS.office_worker;

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shadowRef = useRef<THREE.InstancedMesh>(null);
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(NPC_WIDTH, NPC_HEIGHT), []);
  const shadowGeometry = useMemo(() => new THREE.CircleGeometry(0.22, 10), []);
  const impostorMap = useMemo(() => getAmbientCrowdImpostorTexture(), []);

  useEffect(() => {
    const plane = planeGeometry;
    const shadow = shadowGeometry;
    return () => {
      plane.dispose();
      shadow.dispose();
    };
  }, [planeGeometry, shadowGeometry]);

  const instanceStates = useRef<InstanceState[]>([]);
  const liveSlotsRef = useRef<AmbientCrowdLiveSlot[]>(
    Array.from({ length: MAX_AMBIENT_SKINNED }, () => ({
      px: 0,
      pz: 0,
      rotationY: 0,
      walking: false,
      active: false,
    })),
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const camPos = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!config || count === 0) {
      instanceStates.current = [];
      return;
    }

    const states: InstanceState[] = [];
    for (let i = 0; i < count; i++) {
      const spawnIdx = i % config.spawnPositions.length;
      const spawn = config.spawnPositions[spawnIdx]!;
      const [tx, ty, tz] = seededWanderTarget(spawn[0], spawn[2], config.wanderRadius, i * 17);
      const isIdle = seededRand(i + 100) < IDLE_CHANCE;

      states.push({
        px: spawn[0] + (seededRand(i + 200) - 0.5) * 0.5,
        py: NPC_HEIGHT * 0.5,
        pz: spawn[2] + (seededRand(i + 300) - 0.5) * 0.5,
        rotationY: seededRand(i + 400) * Math.PI * 2,
        tx, ty, tz,
        isIdle,
        idleTimer: isIdle ? (IDLE_DURATION_MIN + seededRand(i + 500) * (IDLE_DURATION_MAX - IDLE_DURATION_MIN)) : 0,
        directionTimer: seededRand(i + 600) * DIRECTION_CHANGE_INTERVAL,
        timerResetCount: 0,
        spawnIndex: spawnIdx,
      });
    }
    instanceStates.current = states;

    if (meshRef.current) {
      for (let i = 0; i < MAX_INSTANCES; i++) {
        if (i < count) {
          const s = states[i]!;
          dummy.position.set(s.px, s.py, s.pz);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        shadowRef.current?.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (shadowRef.current) shadowRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [config, count, dummy]);

  useEffect(() => {
    if (!meshRef.current) return;
    scratchColor.set(colors.body);
    for (let i = 0; i < MAX_INSTANCES; i++) {
      meshRef.current.setColorAt(i, scratchColor);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [colors]);

  useFrameTick('npc', ({ delta }) => {
    const mesh = meshRef.current;
    const shadows = shadowRef.current;
    if (!mesh) return;
    if (!config || count === 0) return;

    const states = instanceStates.current;
    if (states.length === 0) return;

    const dt = Math.min(delta, 0.05);
    const playerX = livePlayerPositionRef.current.x;
    const playerZ = livePlayerPositionRef.current.z;
    camera.getWorldPosition(camPos);

    for (let i = 0; i < count && i < states.length; i++) {
      const s = states[i]!;

      const npcDist = Math.hypot(s.px - playerX, s.pz - playerZ);
      if (npcDist > cullDistance) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        shadows?.setMatrixAt(i, dummy.matrix);
        continue;
      }

      if (s.isIdle) {
        s.idleTimer -= dt;
        if (s.idleTimer <= 0) {
          s.isIdle = false;
          s.timerResetCount++;
          const spawn = config.spawnPositions[s.spawnIndex % config.spawnPositions.length]!;
          const seed = i * 1000 + s.timerResetCount;
          const [tx, , tz] = seededWanderTarget(spawn[0], spawn[2], config.wanderRadius, seed);
          s.tx = tx;
          s.tz = tz;
          s.rotationY = angleXZ(s.px, s.pz, s.tx, s.tz);
        } else {
          s.directionTimer -= dt;
          if (s.directionTimer <= 0) {
            s.timerResetCount++;
            const steerSeed = i * 1000 + s.timerResetCount;
            s.rotationY += (seededRand(steerSeed) - 0.5) * Math.PI * 0.5;
            s.directionTimer = DIRECTION_CHANGE_INTERVAL + seededRand(steerSeed + 1) * 2;
          }
        }
      } else {
        const dx = s.tx - s.px;
        const dz = s.tz - s.pz;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.3) {
          s.timerResetCount++;
          const decisionSeed = i * 1000 + s.timerResetCount;
          if (seededRand(decisionSeed) < IDLE_CHANCE) {
            s.isIdle = true;
            s.idleTimer = IDLE_DURATION_MIN + seededRand(decisionSeed + 1) * (IDLE_DURATION_MAX - IDLE_DURATION_MIN);
          } else {
            const spawn = config.spawnPositions[s.spawnIndex % config.spawnPositions.length]!;
            const [tx, , tz] = seededWanderTarget(spawn[0], spawn[2], config.wanderRadius, decisionSeed + 10);
            s.tx = tx;
            s.tz = tz;
            s.rotationY = angleXZ(s.px, s.pz, s.tx, s.tz);
          }
        } else {
          const speed = WALK_SPEED * dt;
          s.px += (dx / dist) * speed;
          s.pz += (dz / dist) * speed;

          const targetRot = angleXZ(s.px, s.pz, s.tx, s.tz);
          let rotDiff = targetRot - s.rotationY;
          while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
          while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
          s.rotationY += rotDiff * Math.min(1, dt * 3);
        }
      }

      // Skinned mid-LOD owns slots 0..maxSkinned-1 until cull — no cardboard until overflow.
      const useSkinned = i < maxSkinned;

      if (i < maxSkinned) {
        const slot = liveSlotsRef.current[i];
        if (slot) {
          slot.px = s.px;
          slot.pz = s.pz;
          slot.rotationY = s.rotationY;
          slot.walking = !s.isIdle;
          slot.active = true;
        }
      }

      if (useSkinned) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (shadows) {
          dummy.position.set(s.px, 0.02, s.pz);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          shadows.setMatrixAt(i, dummy.matrix);
        }
        continue;
      }

      const faceY = Math.atan2(camPos.x - s.px, camPos.z - s.pz);
      dummy.position.set(s.px, s.py, s.pz);
      dummy.rotation.set(0, faceY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (shadows) {
        dummy.position.set(s.px, 0.02, s.pz);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        shadows.setMatrixAt(i, dummy.matrix);
      }
    }

    for (let i = count; i < MAX_AMBIENT_SKINNED; i++) {
      const slot = liveSlotsRef.current[i];
      if (slot) slot.active = false;
    }

    for (let i = count; i < MAX_INSTANCES; i++) {
      dummy.position.set(0, -100, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      shadows?.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (shadows) shadows.instanceMatrix.needsUpdate = true;
  }, { label: 'AmbientNPCs', visibilityRef: meshRef });

  if (!config || count === 0) return null;

  return (
    <group>
      <AmbientSkinnedMidLod
        slotsRef={liveSlotsRef}
        livePlayerPositionRef={livePlayerPositionRef}
        tintHex={colors.body}
        maxSkinned={maxSkinned}
      />
      <instancedMesh
        ref={meshRef}
        args={[planeGeometry, undefined, MAX_INSTANCES]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          map={impostorMap}
          alphaMap={impostorMap}
          color={colors.body}
          emissive={colors.emissive}
          emissiveIntensity={0.06}
          transparent
          opacity={bodyOpacity}
          roughness={0.92}
          metalness={0.05}
          alphaTest={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      <instancedMesh
        ref={shadowRef}
        args={[shadowGeometry, undefined, MAX_INSTANCES]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={Math.min(0.35, bodyOpacity * 0.4)}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
