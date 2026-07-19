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
 *   - 20 % chance → pensive (if defined)
 *   - else, if NPC has `working`-class animations (pour_drink / play_guitar)
 *     → working band (if defined)
 *   - else → idle band
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
import { resolveNpcAmbientBark } from '@/shared/npcBark';
import { findNpcById } from '@/data/allNpcDefinitions';
import type { NPCDefinition } from '@/shared/types/game';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/** Min seconds between ambient barks for the same NPC. */
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
 * Pure tick function — call once per frame from the React hook.
 *
 * Mutates `cooldowns` (or the module singleton if omitted) to enforce the
 * per-NPC 25 s cooldown.
 *
 * Emits `npc:ambient_bark` events for any NPC that qualifies this frame.
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
  } = params;

  // Hard gate: never emit ambient barks during active interaction (cutscene,
  // combat, dialogue, approach, lock, align). The interaction FSM owns the
  // player's attention; mutterings would be noise.
  if (interactionLocked) return;

  const radiusSq = NPC_AMBIENT_BARK_RADIUS_M * NPC_AMBIENT_BARK_RADIUS_M;
  const cooldownMs = NPC_AMBIENT_BARK_COOLDOWN_S * 1000;

  for (const npcId of registeredIds) {
    // Skip the NPC the player is currently walking up to / talking to.
    if (npcId === interactionTargetNpcIdParam) continue;

    // Per-NPC cooldown.
    const lastTs = cooldowns.get(npcId) ?? 0;
    if (now - lastTs < cooldownMs) continue;

    const def = getNpcDef(npcId);
    if (!def?.ambientBarks) continue;

    const group = getNpcGroupFn(npcId);
    if (!group) continue;

    // Distance check (squared — cheaper than sqrt).
    const pos = group.position;
    const dx = pos.x - playerPosition.x;
    const dy = pos.y - playerPosition.y;
    const dz = pos.z - playerPosition.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > radiusSq) continue;

    // Eligible: pick a band and a line.
    const roll = rng();
    const text = resolveNpcAmbientBark(def.ambientBarks, npcIsWorking(def), roll);
    if (!text) continue;

    // Determine which band was selected so the consumer (NPC component)
    // can theme the bubble if it wants to.
    const band = roll < 0.2 && def.ambientBarks.pensive
      ? 'pensive'
      : (npcIsWorking(def) && def.ambientBarks.working)
        ? 'working'
        : 'idle';

    cooldowns.set(npcId, now);
    eventBus.emit('npc:ambient_bark', { npcId, text, band });
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

      tickNpcAmbientBarks({
        playerPosition: livePlayerPositionRef.current,
        now: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        interactionLocked: false,
        interactionTargetNpcId: getInteractionTargetNPCId(),
      });
    },
    { label: 'NpcAmbientBarkSystem', phase: 'pre_render', enabled },
  );
}
