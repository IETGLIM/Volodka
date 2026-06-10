/* ─── Volodka RPG – patrolling creeps (visible roaming enemies) ───
 *  Replaces the invisible autoTrigger combat zones with stealth gameplay:
 *  PATROL → (player in vision cone) → CHASE → (contact) → turn-based combat.
 *
 *  - Chase speed < player run speed, so fleeing is always possible.
 *  - combat:victory removes the creep until the scene remounts.
 *  - combat:defeat / fleeing puts the creep on a grace cooldown.
 *  - No physics: creeps are kinematic visuals driven by useFrameTick('npc').
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';
import { startCombat } from '@/engine/CombatSystem';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { getCreepsForScene, type CreepPatrolDef } from '@/data/creepPatrols';

type CreepState = 'patrol' | 'chase' | 'engaged' | 'cooldown';

const CONTACT_DISTANCE = 1.15;
const LOSE_AGGRO_DISTANCE = 9.5;
const COOLDOWN_AFTER_ESCAPE_S = 8;
const HOVER_HEIGHT = 0.9;

/** Poem power «Путеводная Звезда» (poem_3) — TTL flag that guides the player
 *  past dangers: creep vision shrinks to this fraction while active. */
const GUIDING_STAR_FLAG = 'guiding_star_active';
const GUIDING_STAR_VISION_SCALE = 0.45;

function getPoemVisionScale(): number {
  const flag = useGameStore.getState().activeTTLFlags[GUIDING_STAR_FLAG];
  if (!flag) return 1;
  return flag.expiryTimestamp > Date.now() ? GUIDING_STAR_VISION_SCALE : 1;
}

interface PatrollingCreepsProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export function PatrollingCreeps({ livePlayerPositionRef }: PatrollingCreepsProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const creeps = useMemo(() => getCreepsForScene(sceneId), [sceneId]);
  // Creeps defeated this visit — removed until the scene remounts
  const [defeated, setDefeated] = useState<ReadonlySet<string>>(() => new Set());
  const engagedCreepIdRef = useRef<string | null>(null);

  useEffect(() => {
    setDefeated(new Set());
    engagedCreepIdRef.current = null;
  }, [sceneId]);

  useEffect(() => {
    const scope = eventBus.createScope();
    scope.on('combat:victory', () => {
      const engaged = engagedCreepIdRef.current;
      if (engaged) {
        engagedCreepIdRef.current = null;
        setDefeated((prev) => new Set(prev).add(engaged));
      }
    });
    scope.on('combat:defeat', () => {
      // Creep stays — its FSM transitions to cooldown when exploration resumes
      engagedCreepIdRef.current = null;
    });
    return () => scope.dispose();
  }, []);

  if (creeps.length === 0) return null;

  return (
    <group key={`creeps:${sceneId}`}>
      {creeps.map((def) =>
        defeated.has(def.id) ? null : (
          <Creep
            key={def.id}
            def={def}
            livePlayerPositionRef={livePlayerPositionRef}
            engagedCreepIdRef={engagedCreepIdRef}
          />
        ),
      )}
    </group>
  );
}

function creepSpawnAllowed(def: CreepPatrolDef): boolean {
  const state = useGameStore.getState();
  if (def.requiredFlag && !state.playerState.flags[def.requiredFlag]) return false;
  if (def.requiredAct && state.playerState.progression.currentAct < def.requiredAct) return false;
  return true;
}

function Creep({
  def,
  livePlayerPositionRef,
  engagedCreepIdRef,
}: {
  def: CreepPatrolDef;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  engagedCreepIdRef: React.MutableRefObject<string | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const coneMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shardsRef = useRef<THREE.Group>(null);

  const stateRef = useRef<CreepState>('patrol');
  const coneGroupRef = useRef<THREE.Group>(null);
  const waypointIndexRef = useRef(0);
  const headingRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(0);
  const positionRef = useRef(
    new THREE.Vector3(def.waypoints[0][0], HOVER_HEIGHT, def.waypoints[0][1]),
  );

  // Spawn gating re-checked on mount only (flags rarely flip mid-scene)
  const [spawned, setSpawned] = useState(() => creepSpawnAllowed(def));
  useEffect(() => {
    setSpawned(creepSpawnAllowed(def));
  }, [def]);

  useFrameTick('npc', ({ delta }) => {
    const group = groupRef.current;
    if (!group || !spawned) return;

    timeRef.current += delta;
    const t = timeRef.current;
    const pos = positionRef.current;
    const state = stateRef.current;

    const storeState = useGameStore.getState();
    const phase = readGamePhase(storeState);
    const exploring = phase === 'exploration';

    // Returned from combat without victory (defeat or flee) → grace period
    if (state === 'engaged' && exploring && engagedCreepIdRef.current !== def.id) {
      stateRef.current = 'cooldown';
      cooldownRef.current = COOLDOWN_AFTER_ESCAPE_S;
    }

    if (state === 'cooldown') {
      cooldownRef.current -= delta;
      if (cooldownRef.current <= 0) stateRef.current = 'patrol';
    }

    const player = livePlayerPositionRef.current;
    const dx = player.x - pos.x;
    const dz = player.z - pos.z;
    const playerDist = Math.sqrt(dx * dx + dz * dz);

    // ── Movement ──
    if (exploring && (state === 'patrol' || state === 'chase')) {
      if (state === 'patrol') {
        const [wx, wz] = def.waypoints[waypointIndexRef.current];
        const wdx = wx - pos.x;
        const wdz = wz - pos.z;
        const wDist = Math.sqrt(wdx * wdx + wdz * wdz);
        if (wDist < 0.3) {
          waypointIndexRef.current = (waypointIndexRef.current + 1) % def.waypoints.length;
        } else {
          const step = Math.min(def.patrolSpeed * delta, wDist);
          pos.x += (wdx / wDist) * step;
          pos.z += (wdz / wDist) * step;
          headingRef.current = Math.atan2(wdx, wdz);
        }

        // Vision check: distance + cone around heading.
        // «Путеводная Звезда» dims the creep's senses while its TTL flag runs.
        const visionScale = getPoemVisionScale();
        if (playerDist < def.visionRange * visionScale) {
          const angleToPlayer = Math.atan2(dx, dz);
          let diff = angleToPlayer - headingRef.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < def.visionHalfAngle * visionScale) {
            stateRef.current = 'chase';
            audioEngine.playSfx('error');
            eventBus.emit('ui:exploration_message', { text: `⚠ ${def.name} заметил тебя!` });
          }
        }
      } else {
        // CHASE
        if (playerDist > LOSE_AGGRO_DISTANCE) {
          stateRef.current = 'patrol';
        } else if (playerDist < CONTACT_DISTANCE) {
          stateRef.current = 'engaged';
          engagedCreepIdRef.current = def.id;
          startCombat(def.enemyType);
        } else {
          const step = def.chaseSpeed * delta;
          pos.x += (dx / playerDist) * step;
          pos.z += (dz / playerDist) * step;
          headingRef.current = Math.atan2(dx, dz);
        }
      }
    }

    // ── Presentation ──
    const chasing = stateRef.current === 'chase';
    const dormant = stateRef.current === 'engaged' || stateRef.current === 'cooldown';

    group.position.set(pos.x, pos.y + Math.sin(t * 2.2) * 0.12, pos.z);
    group.rotation.y = headingRef.current;
    group.visible = true;

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = dormant ? 0.5 : chasing ? 3.2 : 1.6 + Math.sin(t * 3) * 0.4;
    }
    if (lightRef.current) {
      lightRef.current.intensity = dormant ? 0.3 : chasing ? 2.6 : 1.2;
    }
    if (coneMatRef.current) {
      coneMatRef.current.color.set(chasing ? '#ff2222' : def.color);
      coneMatRef.current.opacity = dormant ? 0 : chasing ? 0.16 : 0.07;
    }
    if (coneGroupRef.current) {
      // Visibly shrink the cone while «Путеводная Звезда» is active
      const s = getPoemVisionScale();
      coneGroupRef.current.scale.set(s, 1, s);
    }
    if (shardsRef.current) {
      shardsRef.current.rotation.y = t * (chasing ? 4 : 1.2);
    }
  });

  if (!spawned) return null;

  const visionLength = def.visionRange * 0.85;
  const visionWidth = Math.tan(def.visionHalfAngle) * visionLength * 2;

  return (
    <group ref={groupRef} position={[def.waypoints[0][0], HOVER_HEIGHT, def.waypoints[0][1]]}>
      {/* Core */}
      <mesh ref={coreRef} castShadow>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#0a0a12"
          emissive={def.color}
          emissiveIntensity={1.6}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Orbiting shards */}
      <group ref={shardsRef}>
        {[0, 2.09, 4.19].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.5, Math.sin(a * 2) * 0.1, Math.sin(a) * 0.5]}>
            <tetrahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial
              color="#111118"
              emissive={def.color}
              emissiveIntensity={0.9}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Vision cone projected on the ground (reads as stealth UI).
          Wrapped in a group so poem effects can scale it around the creep. */}
      <group ref={coneGroupRef}>
        <mesh position={[0, -HOVER_HEIGHT + 0.03, visionLength / 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[visionWidth, visionLength]} />
          <meshBasicMaterial
            ref={coneMatRef}
            color={def.color}
            transparent
            opacity={0.07}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      <pointLight ref={lightRef} color={def.color} intensity={1.2} distance={5} decay={2} />
    </group>
  );
}
