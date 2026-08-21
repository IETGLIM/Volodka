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
import { audioEngine } from '@/engine/audio/AudioEngine';
import { isActiveTTLFlagLive } from '@/shared/activeTTLFlags';
import { getCreepsForScene, type CreepPatrolDef } from '@/data/creepPatrols';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  CreepBody,
  type CreepBodyAnimState,
} from '@/components/3d/proceduralEnemy/enemyArchetypes';

type CreepState = 'patrol' | 'chase' | 'engaged' | 'cooldown';

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
}: {
  def: CreepPatrolDef;
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  engagedCreepIdRef: React.MutableRefObject<string | null>;
  frameCtxRef: React.MutableRefObject<CreepFrameContext>;
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

  // Spawn gating re-checked on mount only (flags rarely flip mid-scene)
  const [spawned, setSpawned] = useState(() => creepSpawnAllowed(def));
  useEffect(() => {
    setSpawned(creepSpawnAllowed(def));
  }, [def]);

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
    if (exploring && (state === 'patrol' || state === 'chase')) {
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

        // Vision check: distance + cone around heading.
        // «Путеводная Звезда» dims the creep's senses while its TTL flag runs.
        if (playerDist < def.visionRange * poemVisionScale) {
          const angleToPlayer = Math.atan2(dx, dz);
          let diff = angleToPlayer - headingRef.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          inVisionCone = Math.abs(diff) < def.visionHalfAngle * poemVisionScale;
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
            chaseFootstepTimerRef.current = 0;
            audioEngine.playSfx('error');
            eventBus.emit('ui:exploration_message', { text: `⚠ ${def.name} заметил тебя!` });
          }
        } else {
          alertTimerRef.current = 0;
          alertToastSentRef.current = false;
        }
      } else {
        // CHASE
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

        if (playerDist > LOSE_AGGRO_DISTANCE) {
          stateRef.current = 'patrol';
          alertTimerRef.current = 0;
          alertToastSentRef.current = false;
          chaseFootstepTimerRef.current = 0;
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

          startEncounter({
            source: 'creep',
            enemyType: def.enemyType,
            encounterName: def.name,
            creepId: def.id,
          });
        } else {
          bodyWalking = true;
          const step = def.chaseSpeed * delta;
          pos.x += (dx / playerDist) * step;
          pos.z += (dz / playerDist) * step;
          headingRef.current = Math.atan2(dx, dz);
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
