/* ─── Scene transition coordinator ───
 * Single entry point for all scene changes. Callers emit ONLY through
 * requestSceneTransition — SceneTransitionHandler owns store updates,
 * audio, scene:enter, and cinematic side effects.
 *
 * Prevents races where orchestrator + StoryRenderer both mutate the store
 * and emit scene:transition in the same React commit.
 */

import { SCENE_CONFIG } from '@/config/scenes';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { eventBus } from '@/engine/EventBus';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { resetSceneTransitionGuard } from '@/engine/core/SceneTransitionManager';
import { devWarn } from '@/shared/utils/devLog';;
import type { SceneId } from '@/shared/types/game';

type SpawnTuple = [number, number, number];

const DEDUPE_WINDOW_MS = 48;

let lastDedupeKey = '';
let lastDedupeAt = 0;

function spawnKey(spawn: SpawnTuple): string {
  return spawn.map((v) => v.toFixed(3)).join(',');
}

function sameSpawn(a: SpawnTuple, b: SpawnTuple, eps = 0.001): boolean {
  return (
    Math.abs(a[0] - b[0]) < eps &&
    Math.abs(a[1] - b[1]) < eps &&
    Math.abs(a[2] - b[2]) < eps
  );
}

/** Resolve spawn for a target scene (explicit spawn or scene default). */
export function resolveSceneSpawn(
  targetScene: SceneId,
  spawnAt?: SpawnTuple,
): SpawnTuple {
  if (spawnAt) return spawnAt;
  const defaultSpawn = SCENE_CONFIG[targetScene]?.spawnPoint;
  return defaultSpawn ? ([...defaultSpawn] as SpawnTuple) : ([0, 0.01, 0] as SpawnTuple);
}

/**
 * Request a scene transition. Returns false if the request was coalesced
 * (duplicate within DEDUPE_WINDOW_MS or already at target + spawn).
 */
export function requestSceneTransition(
  targetScene: SceneId,
  spawnAt?: SpawnTuple,
): boolean {
  // Hard gate: never allow scene transitions during cutscene/cinematic.
  // The player's E-key / LMB / gamepad-A input is supposed to be blocked by
  // isOverlayBlocking in InteractiveTriggers, but during the intro wake-up
  // cinematic there is a race condition where the cutscene flag is set in
  // the store but the ref-sync effect has not yet propagated, allowing a
  // trigger-zone hit (e.g. room_door -> corridor_door) to slip through and
  // transition the scene mid-cinematic. This gate is the last line of
  // defence — even if the upstream gate misses, the transition is refused.
  try {
    const snapshot = getGameSnapshot();
    if (snapshot.activeCutsceneId) {
      return false;
    }
    // Hard gate: block transitions while a cinematic timeline is active.
    // activeCutsceneId covers cutscene-overlays, but cinematic timelines run
    // independently and set their own module-level flag. Without this check a
    // trigger-zone hit during a timeline can slip through and transition the
    // scene mid-cinematic.
    if (isCinematicTimelineActive()) {
      devWarn('[sceneTransition] Rejected: cinematic timeline is active');
      return false;
    }
  } catch {
    /* store not ready — fail closed: block transition to prevent mid-cinematic scene changes */
    return false;
  }

  const spawn = resolveSceneSpawn(targetScene, spawnAt);
  const dedupeKey = `${targetScene}|${spawnKey(spawn)}`;
  const now = performance.now();

  if (dedupeKey === lastDedupeKey && now - lastDedupeAt < DEDUPE_WINDOW_MS) {
    return false;
  }

  const { currentSceneId, playerPosition } = getGameSnapshot().exploration;
  if (currentSceneId === targetScene && sameSpawn(playerPosition, spawn)) {
    lastDedupeKey = dedupeKey;
    lastDedupeAt = now;
    return false;
  }

  lastDedupeKey = dedupeKey;
  lastDedupeAt = now;

  eventBus.emit('scene:transition', { targetScene, spawnAt: spawn });
  return true;
}

/** Reset dedupe state on engine dispose / new game. */
export function resetSceneTransitionDedupe(): void {
  lastDedupeKey = '';
  lastDedupeAt = 0;
}

/**
 * Force reload the active scene at the current spawn (recovery path).
 * Bypasses same-scene coalesce in requestSceneTransition.
 */
export function forceReloadCurrentScene(spawnAt?: SpawnTuple): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const { currentSceneId, playerPosition } = getGameSnapshot().exploration;
    resetSceneTransitionDedupe();
    resetSceneTransitionGuard();
    const spawn = resolveSceneSpawn(currentSceneId, spawnAt ?? playerPosition);
    eventBus.emit('scene:transition', { targetScene: currentSceneId, spawnAt: spawn });
    return true;
  } catch (error) {
    devWarn('[sceneTransition] forceReloadCurrentScene failed:', error);
    return false;
  }
}

/** Restart the active scene at its default spawn point. */
export function restartCurrentSceneAtDefaultSpawn(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const { currentSceneId } = getGameSnapshot().exploration;
    resetSceneTransitionDedupe();
    resetSceneTransitionGuard();
    const spawn = resolveSceneSpawn(currentSceneId);
    eventBus.emit('scene:transition', { targetScene: currentSceneId, spawnAt: spawn });
    return true;
  } catch (error) {
    devWarn('[sceneTransition] restartCurrentSceneAtDefaultSpawn failed:', error);
    return false;
  }
}

/** Transition to the scene declared on a story node (if any). */
export function requestSceneTransitionForStoryNode(
  _storyNodeId: string,
  sceneId: string | undefined,
): boolean {
  // _storyNodeId is accepted for API symmetry with other story-node hooks but
  // is not used here — the transition only needs the target sceneId.
  if (!sceneId) return false;
  return requestSceneTransition(sceneId as SceneId);
}
