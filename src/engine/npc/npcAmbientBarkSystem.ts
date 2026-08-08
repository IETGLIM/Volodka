/* ─── NPC Ambient Bark System — overheard mutterings from nearby NPCs ───
 *
 * Picks contextual one-liners from an NPC's `ambientBarks` config when the
 * player is within 4 m but NOT interacting with that NPC. Emitted via the
 * `npc:ambient_bark` event channel; the targeted NPC component listens and
 * surfaces the text via its existing speech-bubble machinery.
 *
 * Cooldown rules:
 *   - Min 25 s between ambient barks per NPC (Map<npcId, lastTs>).
 *   - Skipped entirely while the interaction FSM is locked (cutscene,
 *     combat, dialogue with any NPC).
 *   - Skipped for an NPC that is currently the interaction target.
 *   - Skipped if the NPC has no `ambientBarks` config.
 *
 * Band selection (resolveNpcAmbientBark):
 *   - Emotion-linked barks take priority when an NPC is in an emotional state.
 *   - 20 % chance → pensive (if defined, and emotion is neutral)
 *   - else, if NPC has `working`-class animations (pour_drink / play_guitar)
 *     → working band (if defined)
 *   - else → idle band
 *
 * Emotion-linked barks modify cooldown: annoyed NPCs bark more frequently
 * (cooldown halved), while contemplative NPCs bark less (cooldown doubled).
 *
 * Frame budget: runs in the 'npc' frame system, pre_render phase, so it
 * shares the NPC batch CPU budget and shows up in the per-system profiler.
 * The per-frame scan is O(N) where N = registered NPC count for the scene
 * (typically 1–8), and each iteration is a cheap distance check.
 */

import * as THREE from 'three';

import { eventBus } from '@/engine/EventBus';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { getNPCGroup, getRegisteredNPCIds } from '@/engine/interaction/npcRegistry';
import { getInteractionState, getInteractionTargetNPCId } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { getGameSnapshot } from '@/engine/StateDispatcher';
import { resolveNpcAmbientBark, resolveNpcAmbientBarkBand } from '@/shared/npcBark';
import { findNpcById } from '@/data/allNpcDefinitions';
import type { NPCDefinition } from '@/shared/types/game';
import { deriveSceneWeather } from '@/shared/weather/deriveSceneWeather';
import type { SceneWeatherType } from '@/shared/types/ambientSound';

import { getNpcEmotion } from '@/engine/npc/npcEmotionalReactions';
import { resolveEmotionBehavior } from '@/engine/npc/npcEmotionalReactions';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/** Min seconds between ambient barks for the same NPC (base). */
export const NPC_AMBIENT_BARK_COOLDOWN_S = 25;

/** Player distance (m) within which ambient barks may fire. */
export const NPC_AMBIENT_BARK_RADIUS_M = 4;

/** Frame throttle — only run the full scan every N frames to amortise cost. */
const FRAME_SCAN_INTERVAL = 6;

/** RNG hook (overridable for tests). */
type RngFn = () => number;

/** Mutable cooldown map — keyed by npcId, value is last bark timestamp (ms). */
type CooldownMap = Map<string, number>;

/** Module-level singleton cooldown map (one per game session). */
const _ambientBarkCooldowns: CooldownMap = new Map();

/** HMR-safe reset. */
registerHmrDispose(() => {
  _ambientBarkCooldowns.clear();
});

/**
 * Returns true if an NPC definition is currently in a "working" animation
 * state. We treat `pour_drink` and `play_guitar` as the working-class
 * animation families (cafe_barista, bards, etc.).
 */
function npcIsWorking(def: NPCDefinition): boolean {
  const anims = def.animations;
  if (!anims) return false;
  return Boolean(anims.pour_drink || anims.play_guitar);
}

/**
 * Resolve the effective cooldown for an NPC, adjusted by emotion.
 * Annoyed NPCs bark more frequently (cooldown halved).
 * Contemplative NPCs bark less (cooldown doubled).
 * Other emotions use normal cooldown scaled by barkProbabilityMultiplier.
 */
function resolveEffectiveCooldownMs(npcId: string, baseCooldownMs: number): number {
  const emotion = getNpcEmotion(npcId);
  const behavior = resolveEmotionBehavior(emotion);
  const multiplier = behavior.barkProbabilityMultiplier;

  // Higher probability multiplier = shorter cooldown (more barks)
  return Math.max(5000, Math.round(baseCooldownMs / multiplier));
}

/**
 * Pure tick function — call once per frame from the React hook.
 *
 * Mutates `cooldowns` (or the module singleton if omitted) to enforce the
 * per-NPC cooldown (emotion-adjusted).
 *
 * Emits `npc:ambient_bark` events for any NPC that qualifies this frame.
 * The band field now includes emotion-linked bands.
 */
export function tickNpcAmbientBarks(params: {
  playerPosition: THREE.Vector3;
  now: number;
  rng?: RngFn;
  cooldowns?: CooldownMap;
  getNpcGroup?: (npcId: string) => THREE.Group | undefined;
  getNpcDefinition?: (npcId: string) => NPCDefinition | undefined;
  registeredNpcIds?: readonly string[];
  interactionLocked?: boolean;
  interactionTargetNpcId?: string | null;
  /** Optional current scene weather — when non-clear, enables Priority-0 weather barks. */
  weatherType?: SceneWeatherType;
  /** Optional RNG override for the 30 % weather-bark gate (test-injectable). */
  weatherRng?: () => number;
}): void {
  const {
    playerPosition,
    now,
    rng = Math.random,
    cooldowns = _ambientBarkCooldowns,
    getNpcGroup: getNpcGroupFn = getNPCGroup,
    getNpcDefinition: getNpcDef = findNpcById,
    registeredNpcIds: registeredIds = getRegisteredNPCIds(),
    interactionLocked = getInteractionState() !== InteractionState.Idle,
    interactionTargetNpcId: interactionTargetNpcIdParam = getInteractionTargetNPCId(),
    weatherType,
    weatherRng = Math.random,
  } = params;

  // Hard gate: never emit ambient barks during active interaction (cutscene,
  // combat, dialogue, approach, lock, align). The interaction FSM owns the
  // player's attention; mutterings would be noise.
  if (interactionLocked) return;

  const radiusSq = NPC_AMBIENT_BARK_RADIUS_M * NPC_AMBIENT_BARK_RADIUS_M;
  const baseCooldownMs = NPC_AMBIENT_BARK_COOLDOWN_S * 1000;

  for (const npcId of registeredIds) {
    // Skip the NPC the player is currently walking up to / talking to.
    if (npcId === interactionTargetNpcIdParam) continue;

    // Per-NPC cooldown (emotion-adjusted).
    const effectiveCooldownMs = resolveEffectiveCooldownMs(npcId, baseCooldownMs);
    const lastTs = cooldowns.get(npcId) ?? 0;
    if (now - lastTs < effectiveCooldownMs) continue;

    const def = getNpcDef(npcId);
    if (!def) continue;

    // Get current NPC emotion for bark selection
    const emotion = getNpcEmotion(npcId);

    // Allow barks even if no ambientBarks config when emotion is active
    // (DEFAULT_EMOTION_BARKS provides fallback text)

    const group = getNpcGroupFn(npcId);
    if (!group) continue;

    // Distance check (squared — cheaper than sqrt).
    const pos = group.position;
    const dx = pos.x - playerPosition.x;
    const dy = pos.y - playerPosition.y;
    const dz = pos.z - playerPosition.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > radiusSq) continue;

    // Eligible: pick a band and a line (emotion-aware).
    const roll = rng();
    // Per-NPC weather-bark roll — separate RNG from `roll` so the pensive/idle
    // gate and the weather gate don't share entropy.
    const weatherRoll = weatherRng();
    const text = resolveNpcAmbientBark(
      def.ambientBarks,
      npcIsWorking(def),
      emotion,
      roll,
      weatherType,
      weatherRoll,
    );
    if (!text) continue;

    // Determine which band was selected for UI styling
    const band = resolveNpcAmbientBarkBand(
      def.ambientBarks,
      npcIsWorking(def),
      emotion,
      roll,
      weatherType,
      weatherRoll,
    );

    cooldowns.set(npcId, now);

    // Emit with band type compatible with NpcEvents
    const bandStr = band as 'idle' | 'working' | 'pensive' | 'curious' | 'alarmed' | 'contemplative' | 'annoyed' | 'respectful' | 'fearful' | 'weather';
    eventBus.emit('npc:ambient_bark', { npcId, text, band: bandStr });
  }
}

/** Test-only: reset the module-level cooldown map. */
export function resetNpcAmbientBarkCooldownsForTests(): void {
  _ambientBarkCooldowns.clear();
}

/* ─── React hook ─── */

/**
 * Mount the NPC ambient bark system. Subscribes to the NPC frame batch and
 * runs `tickNpcAmbientBarks` every Nth frame (to amortise the scan).
 *
 * The player position is read from the shared ref passed in by the canvas
 * (same ref used by NPCSystem / InteractionSystemBridge).
 */
export function useNpcAmbientBarkSystem(
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>,
  options: { enabled?: boolean } = {},
): void {
  const { enabled = true } = options;

  let frameCounter = 0;

  useFrameTick(
    'npc',
    () => {
      if (!enabled) return;
      frameCounter = (frameCounter + 1) % FRAME_SCAN_INTERVAL;
      if (frameCounter !== 0) return;

      // Read interaction state synchronously each scan. If the player is in
      // any non-Idle interaction phase, we skip without touching the bus.
      const interactionState = getInteractionState();
      if (interactionState !== InteractionState.Idle) return;

      // Skip during cutscene / combat phases (read from the live snapshot).
      const snap = getGameSnapshot();
      if (snap.mode !== 'exploration') return;

      // Derive current scene weather from the live snapshot so weather-linked
      // ambient barks (Priority 0) can fire when conditions warrant (rain /
      // snow / fog / storm). `deriveSceneWeather` is a pure function over the
      // scene id + time of day — same derivation used by the HUD/weather
      // indicator, so barks stay consistent with what the player sees.
      const sceneId = snap.exploration.currentSceneId;
      const timeOfDay = snap.exploration.timeOfDay;
      const weatherType: SceneWeatherType = deriveSceneWeather(sceneId, timeOfDay).type;

      tickNpcAmbientBarks({
        playerPosition: livePlayerPositionRef.current,
        now: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        interactionLocked: false,
        interactionTargetNpcId: getInteractionTargetNPCId(),
        weatherType,
      });
    },
    { label: 'NpcAmbientBarkSystem', phase: 'pre_render', enabled },
  );
}
