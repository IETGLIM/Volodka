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
import { Html } from '@react-three/drei';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';
import { isSceneTransitionInProgress } from '@/engine/core/SceneTransitionManager';
import { startCombat } from '@/engine/CombatSystem';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { getCreepsForScene, type CreepPatrolDef } from '@/data/creepPatrols';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

type CreepState = 'patrol' | 'chase' | 'engaged' | 'cooldown';

const CONTACT_DISTANCE = 1.15;
const LOSE_AGGRO_DISTANCE = 9.5;
const COOLDOWN_AFTER_ESCAPE_S = 8;
const HOVER_HEIGHT = 0.9;
/** Brief beat between contact and turn-based UI — sells the clash moment. */
const ENGAGE_DELAY_MS = 420;

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
      engagedCreepIdRef.current = null;
    });
    scope.on('combat:fled', () => {
      engagedCreepIdRef.current = null;
    });
    scope.on('combat:end', () => {
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
  const duelRingMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwaveMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const beamMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const engageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stateRef = useRef<CreepState>('patrol');
  const hitReactRef = useRef(0);
  const attackLungeRef = useRef(0);
  const contactBurstRef = useRef(0);
  const engageQueuedRef = useRef(false);
  const [dueling, setDueling] = useState(false);
  const [engaging, setEngaging] = useState(false);

  const enemyEmoji = ENEMY_TEMPLATES[def.enemyType]?.emoji ?? '👾';
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

  useEffect(() => {
    return () => {
      if (engageTimerRef.current) clearTimeout(engageTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const scope = eventBus.createScope();
    const endDuel = () => {
      setDueling(false);
      setEngaging(false);
      engageQueuedRef.current = false;
      if (engageTimerRef.current) {
        clearTimeout(engageTimerRef.current);
        engageTimerRef.current = null;
      }
    };
    scope.on('combat:start', () => {
      if (engagedCreepIdRef.current === def.id) {
        setEngaging(false);
        setDueling(true);
      }
    });
    scope.on('combat:end', endDuel);
    scope.on('combat:victory', endDuel);
    scope.on('combat:defeat', endDuel);
    scope.on('combat:fled', endDuel);
    scope.on('combat:hit', (payload) => {
      if (engagedCreepIdRef.current !== def.id) return;
      if (payload.isPlayerHit) {
        attackLungeRef.current = 1;
      } else {
        hitReactRef.current = 1;
      }
    });
    return () => scope.dispose();
  }, [def.id, engagedCreepIdRef]);

  useFrameTick('npc', ({ delta }) => {
    const group = groupRef.current;
    if (!group || !spawned) return;

    timeRef.current += delta;
    const t = timeRef.current;
    const pos = positionRef.current;
    const state = stateRef.current;

    const storeState = useGameStore.getState();
    const phase = readGamePhase(storeState);
    // Story overlay / cutscene — suppress patrol aggro so office daemon cannot block VN beats.
    const exploring =
      phase === 'exploration' && !storeState.showStoryOverlay && !storeState.activeCutsceneId;
    const inCombat = phase === 'combat' && engagedCreepIdRef.current === def.id;
    const inArena = inCombat || engaging;

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

    // During engage / combat, face the player at duel distance.
    if (inArena) {
      const duelDist = 2.4;
      const faceYaw = Math.atan2(dx, dz);
      pos.x = player.x + Math.sin(faceYaw) * duelDist;
      pos.z = player.z + Math.cos(faceYaw) * duelDist;
      headingRef.current = faceYaw + Math.PI;
    }

    if (contactBurstRef.current > 0) {
      contactBurstRef.current = Math.max(0, contactBurstRef.current - delta * 1.8);
    }
    const burst = contactBurstRef.current;
    if (shockwaveRef.current) {
      const scale = 1 + (1 - burst) * 2.8;
      shockwaveRef.current.scale.set(scale, scale, 1);
      shockwaveRef.current.visible = burst > 0.02;
    }
    if (shockwaveMatRef.current) {
      shockwaveMatRef.current.opacity = burst * 0.55;
    }

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
        } else if (
          playerDist < CONTACT_DISTANCE &&
          !engageQueuedRef.current &&
          !isSceneTransitionInProgress()
        ) {
          engageQueuedRef.current = true;
          stateRef.current = 'engaged';
          engagedCreepIdRef.current = def.id;
          setEngaging(true);
          contactBurstRef.current = 1;

          const faceYaw = Math.atan2(dx, dz);
          pos.x = player.x + Math.sin(faceYaw) * 2.4;
          pos.z = player.z + Math.cos(faceYaw) * 2.4;
          headingRef.current = faceYaw + Math.PI;

          audioEngine.playSfx('combat_engage');
          eventBus.emit('fx:glitch', { intensity: 0.62, duration: 480 });
          eventBus.emit('camera:combat_impact', { intensity: 0.58 });

          engageTimerRef.current = setTimeout(() => {
            engageTimerRef.current = null;
            startCombat(def.enemyType, { encounterName: def.name });
          }, ENGAGE_DELAY_MS);
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
    const dormant = !inArena && (stateRef.current === 'engaged' || stateRef.current === 'cooldown');
    const combatPulse = inArena ? 0.5 + Math.sin(t * 8) * 0.5 : 0;

    if (hitReactRef.current > 0) {
      hitReactRef.current = Math.max(0, hitReactRef.current - delta * 5);
    }
    if (attackLungeRef.current > 0) {
      attackLungeRef.current = Math.max(0, attackLungeRef.current - delta * 4.5);
    }
    const hitKick = hitReactRef.current;
    const atkLunge = attackLungeRef.current;

    group.position.set(
      pos.x + Math.sin(headingRef.current) * atkLunge * 0.35,
      pos.y + Math.sin(t * 2.2) * 0.12,
      pos.z + Math.cos(headingRef.current) * atkLunge * 0.35,
    );
    group.rotation.y = headingRef.current;
    group.visible = true;
    group.scale.setScalar(
      (inArena ? 1 + combatPulse * 0.12 + burst * 0.25 : 1) * (1 - hitKick * 0.22),
    );

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = inArena
        ? 2.8 + combatPulse * 2.2
        : dormant
          ? 0.5
          : chasing
            ? 3.2
            : 1.6 + Math.sin(t * 3) * 0.4;
    }
    if (lightRef.current) {
      lightRef.current.intensity = inArena ? 3.6 + combatPulse * 1.6 + burst * 2 : dormant ? 0.3 : chasing ? 2.6 : 1.2;
    }
    if (coneMatRef.current) {
      coneMatRef.current.color.set(inArena || chasing ? '#ff2222' : def.color);
      coneMatRef.current.opacity = inArena ? 0.24 : dormant ? 0 : chasing ? 0.16 : 0.07;
    }
    if (beamMatRef.current) {
      beamMatRef.current.opacity = inArena ? 0.1 + combatPulse * 0.14 + burst * 0.2 : 0;
    }
    if (coneGroupRef.current) {
      // Visibly shrink the cone while «Путеводная Звезда» is active
      const s = getPoemVisionScale();
      coneGroupRef.current.scale.set(s, 1, s);
    }
    if (shardsRef.current) {
      shardsRef.current.rotation.y = t * (inArena ? 7 : chasing ? 4 : 1.2);
    }
    if (duelRingMatRef.current && inArena) {
      duelRingMatRef.current.opacity = 0.22 + combatPulse * 0.28 + burst * 0.35;
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

      {(engaging || dueling) && (
        <>
          <mesh
            ref={shockwaveRef}
            rotation-x={-Math.PI / 2}
            position={[0, -HOVER_HEIGHT + 0.03, 0]}
            visible={false}
          >
            <ringGeometry args={[0.9, 1.05, 48]} />
            <meshBasicMaterial
              ref={shockwaveMatRef}
              color="#ff4466"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, -HOVER_HEIGHT + 0.04, 0]}>
            <ringGeometry args={[1.1, 1.55, 48]} />
            <meshBasicMaterial
              ref={duelRingMatRef}
              color={def.color}
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, -HOVER_HEIGHT + 0.035, 0]}>
            <ringGeometry args={[1.65, 1.72, 64]} />
            <meshBasicMaterial
              color={def.color}
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.03, 0.42, 1.8, 20, 1, true]} />
            <meshBasicMaterial
              ref={beamMatRef}
              color={def.color}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <Html position={[0, 0.95, 0]} center distanceFactor={8} style={{ pointerEvents: 'none', zIndex: UI_LAYERS.HUD }}>
            <div
              className="text-center font-mono select-none whitespace-nowrap px-3 py-1.5 rounded enemy-hologram"
              style={{
                background: 'linear-gradient(180deg, rgba(20,0,8,0.75) 0%, rgba(0,0,0,0.65) 100%)',
                border: `1px solid ${def.color}66`,
                boxShadow: `0 0 20px ${def.color}44, inset 0 0 12px ${def.color}22`,
                textShadow: `0 0 10px ${def.color}`,
              }}
            >
              <div className="text-[9px] text-red-400/80 tracking-[0.25em] uppercase mb-0.5">
                {engaging ? 'Контакт' : 'Противник'}
              </div>
              <div className="text-2xl leading-none">{enemyEmoji}</div>
              <div className="text-[11px] text-red-100 mt-0.5 tracking-wide font-semibold">{def.name}</div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
