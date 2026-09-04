/* ─── Volodka RPG – patrolling creeps (visible roaming enemies) ───
 *  Replaces the invisible autoTrigger combat zones with stealth gameplay:
 *  PATROL → (player in vision cone + line of sight) → CHASE → (contact or
 *  ranged firing band) → turn-based combat.
 *
 *  - Vision cone is gated by wall-aware line-of-sight (engine/npc/creepTactics.ts)
 *    — creeps no longer see the player through walls and tall props.
 *  - WoW-style chase rules (engine/combat/enemyAiBehaviors.ts): leash range
 *    from the chase origin, contact-loss grace, ranged kiting (hold the
 *    preferred distance, retreat when crowded) and stuck detection. Chases
 *    follow the scene nav mesh around walls; a wall-blocked creep gives up
 *    and returns to its patrol instead of clipping through geometry.
 *  - Chase speed < player run speed, so fleeing is always possible.
 *  - combat:victory removes the creep until the scene remounts.
 *  - combat:defeat / fleeing puts the creep on a grace cooldown.
 *  - No physics: creeps are kinematic visuals driven by useFrameTick('npc').
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AdditiveBlending, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PointLight, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { getGameSnapshot } from "@/engine/GameActionDispatcher";
import {
  useActiveCutsceneId,
  useGamePhase,
  useShowStoryOverlay,
} from '@/store/selectors';
import type { GamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';
import { isSceneTransitionInProgress } from '@/engine/core/SceneTransitionManager';
import { startEncounter } from '@/engine/combat/encounterPresentation';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';
import { getEnemyAiConfig } from '@/engine/combat/enemyAiBehaviors';
import {
  MELEE_STRIKE_INTRO_ENEMY_HP_PCT,
  registerMeleeStrikeTarget,
  reportMeleeStrikeCandidate,
} from '@/engine/combat/realtime/meleeStrike';
import { MELEE_STRIKE_REACH_M } from '@/engine/combat/realtime/meleeSweep';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { isActiveTTLFlagLive } from '@/shared/activeTTLFlags';
import { getCreepsForScene, type CreepPatrolDef } from '@/data/creepPatrols';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import type { ColliderDef } from '@/shared/types/sceneDefinition';
import {
  buildNpcAvoidanceObstacles,
  resolveNpcObstacleAvoidance,
  type NpcObstacleAabb,
} from '@/engine/npc/npcObstacleAvoidance';
import type { NavMeshGraph } from '@/engine/npc/navMeshBuilder';
import {
  CREEP_CHASE_REPATH_MOVE,
  CREEP_CHASE_REPATH_S,
  CREEP_CONTACT_LOST_S,
  CREEP_LOS_CHECK_INTERVAL_S,
  CREEP_PATH_WAYPOINT_RADIUS,
  CREEP_RETURN_ARRIVE_DISTANCE,
  computeCreepNavPath,
  createCreepStuckTracker,
  filterVisionBlockers,
  hasCreepLineOfSight,
  isPlayerBeyondLeash,
  isWithinRangedEngageBand,
  nearestWaypointIndex,
  resolveCreepNavMesh,
  resolveKiteMove,
  resolveRetreatDirection,
  updateCreepStuckTracker,
  type CreepStuckTracker,
} from '@/engine/npc/creepTactics';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  CreepBody,
  type CreepBodyAnimState,
} from '@/components/3d/proceduralEnemy/enemyArchetypes';

type CreepState = 'patrol' | 'chase' | 'engaged' | 'cooldown' | 'return';

const CONTACT_DISTANCE = 1.15;
const LOSE_AGGRO_DISTANCE = 9.5;
const COOLDOWN_AFTER_ESCAPE_S = 8;
const HOVER_HEIGHT = 0.9;
const CREEP_ALERT_S = 0.55;
const CREEP_CHASE_FOOTSTEP_S = 0.48;

/** Poem power «Путеводная Звезда» (poem_3) — TTL flag that guides the player
 *  past dangers: creep vision shrinks to this fraction while active. */
const GUIDING_STAR_FLAG = 'guiding_star_active';
const GUIDING_STAR_VISION_SCALE = 0.45;

interface CreepFrameContext {
  exploring: boolean;
  phase: GamePhase;
  poemVisionScale: number;
}

interface PatrollingCreepsProps {
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
}

export function PatrollingCreeps({ livePlayerPositionRef }: PatrollingCreepsProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const creeps = useMemo(() => getCreepsForScene(sceneId), [sceneId]);

  // ── Scene colliders → tactical AI inputs (Task 3.3-b2) ──
  // Vision blockers gate the stealth cone by line of sight; avoidance AABBs
  // steer kinematic chases around walls. Both recompute only per scene.
  const sceneColliders = useMemo(() => {
    const def = (
      SCENE_DEFINITIONS as Record<string, { walls?: ColliderDef[]; obstacles?: ColliderDef[] }>
    )[sceneId];
    return def ?? null;
  }, [sceneId]);
  const visionBlockers = useMemo<NpcObstacleAabb[]>(
    () => (sceneColliders ? filterVisionBlockers(sceneColliders) : []),
    [sceneColliders],
  );
  const avoidanceObstacles = useMemo<NpcObstacleAabb[]>(
    () => (sceneColliders ? buildNpcAvoidanceObstacles(sceneColliders) : []),
    [sceneColliders],
  );
  const phase = useGamePhase();
  const showStoryOverlay = useShowStoryOverlay();
  const activeCutsceneId = useActiveCutsceneId();
  const guidingStarFlag = useGameStore((s) => s.activeTTLFlags[GUIDING_STAR_FLAG]);

  const phaseRef = useRef(phase);
  const showStoryOverlayRef = useRef(showStoryOverlay);
  const activeCutsceneIdRef = useRef(activeCutsceneId);
  const guidingStarFlagRef = useRef(guidingStarFlag);
  phaseRef.current = phase;
  showStoryOverlayRef.current = showStoryOverlay;
  activeCutsceneIdRef.current = activeCutsceneId;
  guidingStarFlagRef.current = guidingStarFlag;

  const frameCtxRef = useRef<CreepFrameContext>({
    exploring: false,
    phase: 'exploration',
    poemVisionScale: 1,
  });

  useFrameTick(
    'npc',
    () => {
      const currentPhase = phaseRef.current;
      const flag = guidingStarFlagRef.current;
      frameCtxRef.current = {
        phase: currentPhase,
        exploring:
          currentPhase === 'exploration'
          && !showStoryOverlayRef.current
          && !activeCutsceneIdRef.current,
        poemVisionScale:
          flag && isActiveTTLFlagLive({ [flag.key]: flag }, flag.key)
            ? GUIDING_STAR_VISION_SCALE
            : 1,
      };
    },
    { label: 'PatrollingCreepsCtx', priority: -1 },
  );

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
            frameCtxRef={frameCtxRef}
            visionBlockers={visionBlockers}
            avoidanceObstacles={avoidanceObstacles}
          />
        ),
      )}
    </group>
  );
}

function creepSpawnAllowed(def: CreepPatrolDef): boolean {
  const state = getGameSnapshot();
  if (def.requiredFlag && !state.playerState.flags[def.requiredFlag]) return false;
  if (def.requiredAct && state.playerState.progression.currentAct < def.requiredAct) return false;
  return true;
}

function Creep({
  def,
  livePlayerPositionRef,
  engagedCreepIdRef,
  frameCtxRef,
  visionBlockers,
  avoidanceObstacles,
}: {
  def: CreepPatrolDef;
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  engagedCreepIdRef: React.MutableRefObject<string | null>;
  frameCtxRef: React.MutableRefObject<CreepFrameContext>;
  visionBlockers: readonly NpcObstacleAabb[];
  avoidanceObstacles: readonly NpcObstacleAabb[];
}) {
  const groupRef = useRef<Group>(null);
  // WS16-A: ref type upgraded to MeshPhysicalMaterial (enemy bodies now use sheen for organic look).
  // MeshPhysicalMaterial extends MeshStandardMaterial, so the .emissiveIntensity writes below still work.
  const bodyMatRef = useRef<MeshPhysicalMaterial | null>(null);
  const bodyAnimRef = useRef<CreepBodyAnimState>('idle');
  const lightRef = useRef<PointLight>(null);
  const coneMatRef = useRef<MeshBasicMaterial>(null);
  const duelRingMatRef = useRef<MeshBasicMaterial>(null);
  const shockwaveRef = useRef<Mesh>(null);
  const shockwaveMatRef = useRef<MeshBasicMaterial>(null);
  const beamMatRef = useRef<MeshBasicMaterial>(null);

  const stateRef = useRef<CreepState>('patrol');
  const hitReactRef = useRef(0);
  const attackLungeRef = useRef(0);
  const contactBurstRef = useRef(0);
  const engageQueuedRef = useRef(false);
  const [dueling, setDueling] = useState(false);
  const [engaging, setEngaging] = useState(false);

  // ── Tactical AI state (Task 3.3-b2) ──
  // Per-type WoW-style config (aggro/leash/kiting) from enemyAiBehaviors.ts.
  const aiConfig = useMemo(() => getEnemyAiConfig(def.enemyType), [def.enemyType]);
  // Throttled LOS cache for the vision cone (~5 Hz, see creepTactics.ts).
  const losTimerRef = useRef(0);
  const losClearRef = useRef(true);
  // Leash bookkeeping: where the chase began + contact-loss grace timer.
  const chaseOriginRef = useRef({ x: def.waypoints[0][0], z: def.waypoints[0][1] });
  const lostContactTimerRef = useRef(0);
  // Stuck detection for wall-blocked pursuits (no teleports — give up).
  const stuckTrackerRef = useRef<CreepStuckTracker>(
    createCreepStuckTracker(def.waypoints[0][0], def.waypoints[0][1]),
  );
  // Return state: home waypoint after giving up + its nav path.
  const returnWaypointRef = useRef(0);
  const returnPathRef = useRef<Array<[number, number]> | null>(null);
  // Nav-mesh path following for wall-aware chases.
  const navMeshRef = useRef<NavMeshGraph | null>(null);
  const navMeshResolvedRef = useRef(false);
  const chasePathRef = useRef<Array<[number, number]> | null>(null);
  const chaseRepathTimerRef = useRef(0);
  const lastChaseTargetRef = useRef({ x: 0, z: 0 });

  const enemyEmoji = ENEMY_TEMPLATES[def.enemyType]?.emoji ?? '👾';
  const coneGroupRef = useRef<Group>(null);
  const waypointIndexRef = useRef(0);
  const headingRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(0);
  const alertTimerRef = useRef(0);
  const alertToastSentRef = useRef(false);
  const chaseFootstepTimerRef = useRef(0);
  const positionRef = useRef(
    new Vector3(def.waypoints[0][0], HOVER_HEIGHT, def.waypoints[0][1]),
  );

  /** Lazily resolve the scene nav mesh (built once per scene, then cached). */
  function resolveNavMesh(): NavMeshGraph | null {
    if (!navMeshResolvedRef.current) {
      navMeshResolvedRef.current = true;
      navMeshRef.current = resolveCreepNavMesh(def.sceneId);
    }
    return navMeshRef.current;
  }

  /** Give up the pursuit and walk home to the nearest patrol waypoint. */
  function enterReturnState(fromX: number, fromZ: number): void {
    stateRef.current = 'return';
    alertTimerRef.current = 0;
    alertToastSentRef.current = false;
    lostContactTimerRef.current = 0;
    chasePathRef.current = null;
    stuckTrackerRef.current = createCreepStuckTracker(fromX, fromZ);
    returnWaypointRef.current = nearestWaypointIndex(def.waypoints, fromX, fromZ);
    const [wx, wz] = def.waypoints[returnWaypointRef.current];
    returnPathRef.current = computeCreepNavPath(fromX, fromZ, wx, wz, resolveNavMesh());
  }

  // Spawn gating re-checked on mount only (flags rarely flip mid-scene)
  const [spawned, setSpawned] = useState(() => creepSpawnAllowed(def));
  // Ref-зеркало spawned — регистрация замаха читает его без перерегистрации.
  const spawnedRef = useRef(spawned);
  useEffect(() => {
    setSpawned(creepSpawnAllowed(def));
  }, [def]);
  useEffect(() => {
    spawnedRef.current = spawned;
  }, [spawned]);

  // ── Реал-тайм «Опережающий удар» (v4.8.7) ──
  // Крип регистрируется как цель замаха: живая позиция (positionRef),
  // LOS по vision-блокерам сцены и вовлечение в бой с ослабленным врагом.
  // Вовлечение — точная копия контактной ветки CHASE (см. useFrameTick),
  // чтобы презентация/победа/побег работали как раньше.
  useEffect(() => {
    const unregister = registerMeleeStrikeTarget({
      id: def.id,
      name: def.name,
      getPosition: () => positionRef.current,
      canStrike: () =>
        spawnedRef.current
        && frameCtxRef.current.exploring
        && !engageQueuedRef.current
        && (stateRef.current === 'patrol'
          || stateRef.current === 'chase'
          || stateRef.current === 'return'),
      hasLineOfSight: () => {
        const pos = positionRef.current;
        const player = livePlayerPositionRef.current;
        return hasCreepLineOfSight(pos.x, pos.z, player.x, player.z, visionBlockers);
      },
      applyStrike: () => {
        if (engageQueuedRef.current) return;
        engageQueuedRef.current = true;
        stateRef.current = 'engaged';
        engagedCreepIdRef.current = def.id;
        setEngaging(true);
        contactBurstRef.current = 1;

        const pos = positionRef.current;
        const player = livePlayerPositionRef.current;
        const faceYaw = Math.atan2(player.x - pos.x, player.z - pos.z);
        pos.x = player.x + Math.sin(faceYaw) * 2.4;
        pos.z = player.z + Math.cos(faceYaw) * 2.4;
        headingRef.current = faceYaw + Math.PI;

        startEncounter({
          source: 'creep',
          enemyType: def.enemyType,
          encounterName: def.name,
          creepId: def.id,
          introHpPct: MELEE_STRIKE_INTRO_ENEMY_HP_PCT });
      },
    });
    return unregister;
  }, [def, engagedCreepIdRef, frameCtxRef, livePlayerPositionRef, visionBlockers]);

  useEffect(() => {
    const scope = eventBus.createScope();
    const endDuel = () => {
      setDueling(false);
      setEngaging(false);
      engageQueuedRef.current = false;
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

    const { exploring, phase, poemVisionScale } = frameCtxRef.current;
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

    // ── HUD-подсказка «враг в зоне удара» (v4.8.7) ──
    // Отчёт в реал-тайм слой каждый кадр (дешёвый map.set). LOS считаем
    // только когда крип в зоне удара — обычно не больше одного такого.
    const strikeEligible =
      exploring
      && spawned
      && !engageQueuedRef.current
      && (stateRef.current === 'patrol'
        || stateRef.current === 'chase'
        || stateRef.current === 'return');
    if (strikeEligible && playerDist <= MELEE_STRIKE_REACH_M) {
      const clear = hasCreepLineOfSight(pos.x, pos.z, player.x, player.z, visionBlockers);
      reportMeleeStrikeCandidate(def.id, def.name, playerDist, clear);
    } else {
      reportMeleeStrikeCandidate(def.id, def.name, playerDist, false);
    }

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
    let bodyWalking = false;
    let inVisionCone = false;
    if (exploring && (state === 'patrol' || state === 'chase' || state === 'return')) {
      /** Step toward an XZ target; `steer` enables obstacle avoidance so the
       *  kinematic creep slides along walls instead of clipping through. */
      const stepToward = (targetX: number, targetZ: number, speed: number, steer: boolean) => {
        const mdx = targetX - pos.x;
        const mdz = targetZ - pos.z;
        const mDist = Math.hypot(mdx, mdz);
        if (mDist < 1e-4) return;
        let dirX = mdx / mDist;
        let dirZ = mdz / mDist;
        let speedScale = 1;
        if (steer && avoidanceObstacles.length > 0) {
          const avoidance = resolveNpcObstacleAvoidance(pos.x, pos.z, dirX, dirZ, avoidanceObstacles);
          dirX = avoidance.dirX;
          dirZ = avoidance.dirZ;
          speedScale = avoidance.speedScale;
        }
        const step = Math.min(speed * speedScale * delta, mDist);
        pos.x += dirX * step;
        pos.z += dirZ * step;
        headingRef.current = Math.atan2(dirX, dirZ);
      };

      if (state === 'patrol') {
        const [wx, wz] = def.waypoints[waypointIndexRef.current];
        const wdx = wx - pos.x;
        const wdz = wz - pos.z;
        const wDist = Math.sqrt(wdx * wdx + wdz * wdz);
        if (wDist < 0.3) {
          waypointIndexRef.current = (waypointIndexRef.current + 1) % def.waypoints.length;
        } else {
          bodyWalking = true;
          const step = Math.min(def.patrolSpeed * delta, wDist);
          pos.x += (wdx / wDist) * step;
          pos.z += (wdz / wDist) * step;
          headingRef.current = Math.atan2(wdx, wdz);
        }

        // Vision check: distance + cone around heading, gated by line of
        // sight — walls and tall props hide the player from the creep.
        // «Путеводная Звезда» dims the creep's senses while its TTL flag runs.
        let coneCandidate = false;
        if (playerDist < def.visionRange * poemVisionScale) {
          const angleToPlayer = Math.atan2(dx, dz);
          let diff = angleToPlayer - headingRef.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          coneCandidate = Math.abs(diff) < def.visionHalfAngle * poemVisionScale;
        }
        if (coneCandidate) {
          // Throttled LOS re-check (~5 Hz) — the cached result is reused
          // between checks so the slab test doesn't run every frame.
          losTimerRef.current -= delta;
          if (losTimerRef.current <= 0) {
            losTimerRef.current = CREEP_LOS_CHECK_INTERVAL_S;
            losClearRef.current = hasCreepLineOfSight(
              pos.x,
              pos.z,
              player.x,
              player.z,
              visionBlockers,
            );
          }
          inVisionCone = losClearRef.current;
        } else {
          // Player left the cone — force a fresh LOS check on re-entry.
          losTimerRef.current = 0;
        }

        if (inVisionCone) {
          headingRef.current = Math.atan2(dx, dz);
          if (alertTimerRef.current <= 0) {
            alertTimerRef.current = CREEP_ALERT_S;
            audioEngine.playStinger('tension');
            if (!alertToastSentRef.current) {
              alertToastSentRef.current = true;
              eventBus.emit('ui:exploration_message', {
                text: `👁 ${def.name} что-то замечает…`,
              });
            }
          }
          alertTimerRef.current -= delta;
          if (alertTimerRef.current <= 0) {
            stateRef.current = 'chase';
            // WoW-style chase bookkeeping: leash origin + fresh stuck window.
            chaseOriginRef.current.x = pos.x;
            chaseOriginRef.current.z = pos.z;
            lostContactTimerRef.current = 0;
            stuckTrackerRef.current = createCreepStuckTracker(pos.x, pos.z);
            chasePathRef.current = null;
            chaseRepathTimerRef.current = 0;
            chaseFootstepTimerRef.current = 0;
            audioEngine.playSfx('error');
            eventBus.emit('ui:exploration_message', { text: `⚠ ${def.name} заметил тебя!` });
          }
        } else {
          alertTimerRef.current = 0;
          alertToastSentRef.current = false;
        }
      } else if (state === 'return') {
        // RETURN — walk home to the nearest patrol waypoint after the chase
        // was given up (leash / lost contact / stuck). Slow pace on purpose.
        const [wx, wz] = def.waypoints[returnWaypointRef.current];
        if (Math.hypot(wx - pos.x, wz - pos.z) < CREEP_RETURN_ARRIVE_DISTANCE) {
          waypointIndexRef.current = returnWaypointRef.current;
          returnPathRef.current = null;
          stateRef.current = 'patrol';
          alertTimerRef.current = 0;
          alertToastSentRef.current = false;
        } else {
          bodyWalking = true;
          const path = returnPathRef.current;
          let targetX = wx;
          let targetZ = wz;
          let followPath = false;
          if (path && path.length > 0) {
            while (
              path.length > 1 &&
              Math.hypot(pos.x - path[0][0], pos.z - path[0][1]) < CREEP_PATH_WAYPOINT_RADIUS
            ) {
              path.shift();
            }
            targetX = path[0][0];
            targetZ = path[0][1];
            followPath = true;
          }
          stepToward(targetX, targetZ, def.patrolSpeed, !followPath);
          if (updateCreepStuckTracker(stuckTrackerRef.current, pos.x, pos.z, delta)) {
            // Wedged on the way home — resume patrol from wherever it stands.
            waypointIndexRef.current = nearestWaypointIndex(def.waypoints, pos.x, pos.z);
            returnPathRef.current = null;
            stateRef.current = 'patrol';
            alertTimerRef.current = 0;
            alertToastSentRef.current = false;
          }
        }
      } else {
        // CHASE — WoW-style: leash range, contact-loss grace, ranged kiting,
        // nav-mesh paths around walls and stuck detection (creepTactics.ts).
        chaseFootstepTimerRef.current -= delta;
        if (chaseFootstepTimerRef.current <= 0) {
          chaseFootstepTimerRef.current = CREEP_CHASE_FOOTSTEP_S;
          // Spatial chase footstep — anchor at the creep's current position so
          // the player hears directional pursuit. Replaces the previous
          // non-spatial playFootstep('metal') call. Cadence throttle
          // (CREEP_CHASE_FOOTSTEP_S = 0.48s) prevents voice spam; the old
          // sourceId-based overlap prevention is no longer needed.
          audioEngine.playSpatialSfx('metal', [pos.x, pos.y, pos.z]);
        }

        let gaveUp = false;
        if (
          isPlayerBeyondLeash(
            chaseOriginRef.current.x,
            chaseOriginRef.current.z,
            player.x,
            player.z,
            aiConfig.leashRange,
          )
        ) {
          // Leash: the player fled too far from where the chase began.
          gaveUp = true;
        } else if (playerDist > LOSE_AGGRO_DISTANCE) {
          // Contact lost — a short grace window before giving up for good.
          lostContactTimerRef.current += delta;
          if (lostContactTimerRef.current >= CREEP_CONTACT_LOST_S) gaveUp = true;
        } else {
          lostContactTimerRef.current = 0;
        }
        if (gaveUp) {
          enterReturnState(pos.x, pos.z);
          eventBus.emit('ui:exploration_message', {
            text: `💨 ${def.name} теряет след и отступает`,
          });
        }

        if (stateRef.current === 'chase') {
          // Ranged creeps (ranged_strelkov, censor_drone) open the encounter
          // from their preferred firing band instead of melee contact.
          const rangedEngage = isWithinRangedEngageBand(playerDist, aiConfig);
          if (
            (playerDist < CONTACT_DISTANCE || rangedEngage) &&
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

            startEncounter({
              source: 'creep',
              enemyType: def.enemyType,
              encounterName: def.name,
              creepId: def.id,
            });
          } else {
            const kiteMove = resolveKiteMove(playerDist, aiConfig);
            if (kiteMove === 'retreat') {
              // Kite: back away from the player, heading for the patrol post.
              bodyWalking = true;
              const [homeX, homeZ] = def.waypoints[returnWaypointRef.current];
              const retreat = resolveRetreatDirection(
                pos.x,
                pos.z,
                player.x,
                player.z,
                homeX,
                homeZ,
              );
              stepToward(pos.x + retreat.dirX, pos.z + retreat.dirZ, def.chaseSpeed, true);
            } else if (kiteMove === 'approach') {
              // Wall-aware pursuit: follow a nav-mesh path to the player,
              // recomputed on a fixed cadence or when the player strays.
              bodyWalking = true;
              chaseRepathTimerRef.current -= delta;
              const driftSq =
                (player.x - lastChaseTargetRef.current.x) ** 2 +
                (player.z - lastChaseTargetRef.current.z) ** 2;
              if (
                chaseRepathTimerRef.current <= 0 ||
                driftSq > CREEP_CHASE_REPATH_MOVE * CREEP_CHASE_REPATH_MOVE
              ) {
                chaseRepathTimerRef.current = CREEP_CHASE_REPATH_S;
                lastChaseTargetRef.current.x = player.x;
                lastChaseTargetRef.current.z = player.z;
                chasePathRef.current = computeCreepNavPath(
                  pos.x,
                  pos.z,
                  player.x,
                  player.z,
                  resolveNavMesh(),
                );
              }
              const path = chasePathRef.current;
              let targetX = player.x;
              let targetZ = player.z;
              let followPath = false;
              if (path && path.length > 0) {
                while (
                  path.length > 1 &&
                  Math.hypot(pos.x - path[0][0], pos.z - path[0][1]) <
                    CREEP_PATH_WAYPOINT_RADIUS
                ) {
                  path.shift();
                }
                targetX = path[0][0];
                targetZ = path[0][1];
                followPath = true;
              }
              stepToward(targetX, targetZ, def.chaseSpeed, !followPath);
            }
            // kiteMove === 'hold' — inside the firing band: stand ground
            // (the encounter itself starts from this distance).

            // Stuck detect: barely moved while trying to chase → the pursuit
            // is wall-blocked; give up as lost (no teleports).
            if (
              kiteMove !== 'hold' &&
              updateCreepStuckTracker(stuckTrackerRef.current, pos.x, pos.z, delta)
            ) {
              enterReturnState(pos.x, pos.z);
              eventBus.emit('ui:exploration_message', {
                text: `💨 ${def.name} теряет след и отступает`,
              });
            }
          }
        }
      }
    }

    // ── Presentation ──
    const chasing = stateRef.current === 'chase';
    const alerting =
      stateRef.current === 'patrol' && alertTimerRef.current > 0 && inVisionCone;
    const dormant = !inArena && (stateRef.current === 'engaged' || stateRef.current === 'cooldown');
    const combatPulse = inArena ? 0.5 + Math.sin(t * 8) * 0.5 : 0;
    const alertPulse = alerting ? 0.5 + Math.sin(t * 14) * 0.5 : 0;
    bodyAnimRef.current = alerting ? 'idle' : bodyWalking || chasing ? 'walk' : 'idle';

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

    if (bodyMatRef.current) {
      // Task 4b-C4: White hit flash — blend emissive toward white during hitReact
      const baseEmissiveIntensity = inArena
        ? 2.8 + combatPulse * 2.2
        : dormant
          ? 0.5
          : chasing
            ? 3.2
            : alerting
              ? 2.2 + alertPulse * 1.4
              : 1.6 + Math.sin(t * 3) * 0.4;
      bodyMatRef.current.emissiveIntensity = hitKick > 0.5
        ? baseEmissiveIntensity + hitKick * 6
        : baseEmissiveIntensity;
      if (hitKick > 0.5) {
        bodyMatRef.current.emissive.set('#ffffff');
      }
    }
    if (lightRef.current) {
      lightRef.current.intensity = inArena
        ? 3.6 + combatPulse * 1.6 + burst * 2
        : dormant
          ? 0.3
          : chasing
            ? 2.6
            : alerting
              ? 1.8 + alertPulse * 0.8
              : 1.2;
    }
    if (coneMatRef.current) {
      coneMatRef.current.color.set(
        inArena || chasing ? '#ff2222' : alerting ? '#ffaa33' : def.color,
      );
      coneMatRef.current.opacity = inArena
        ? 0.24
        : dormant
          ? 0
          : chasing
            ? 0.16
            : alerting
              ? 0.1 + alertPulse * 0.14
              : 0.07;
    }
    if (beamMatRef.current) {
      beamMatRef.current.opacity = inArena ? 0.1 + combatPulse * 0.14 + burst * 0.2 : 0;
    }
    if (coneGroupRef.current) {
      // Visibly shrink the cone while «Путеводная Звезда» is active
      coneGroupRef.current.scale.set(poemVisionScale, 1, poemVisionScale);
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
      <CreepBody
        enemyType={def.enemyType}
        color={def.color}
        animStateRef={bodyAnimRef}
        bodyMatRef={bodyMatRef}
      />

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
            blending={AdditiveBlending}
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
              blending={AdditiveBlending}
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
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, -HOVER_HEIGHT + 0.035, 0]}>
            <ringGeometry args={[1.65, 1.72, 64]} />
            <meshBasicMaterial
              color={def.color}
              transparent
              opacity={0.12}
              blending={AdditiveBlending}
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
              blending={AdditiveBlending}
              side={DoubleSide}
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
