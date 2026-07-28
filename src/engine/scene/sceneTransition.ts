/* ─── Scene transition coordinator ───
 * Commanders emit scene:request_transition; the binder calls
 * requestSceneTransition (dedupe) which emits scene:transition.
 * SceneTransitionHandler owns store updates, audio, scene:enter,
 * and cinematic side effects.
 *
 * Prevents races where orchestrator + StoryRenderer both mutate the store
 * and emit scene:transition in the same React commit.
 */

import { SCENE_CONFIG } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
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

/** Transition to the scene declared on a story node (if any). */
export function requestSceneTransitionForStoryNode(
  storyNodeId: string,
  sceneId: string | undefined,
): boolean {
  if (!sceneId) return false;
  return requestSceneTransition(sceneId as SceneId);
}

let unsubRequest: (() => void) | null = null;

/**
 * Commanders (store/UI/engine) emit scene:request_transition;
 * this forwards to requestSceneTransition (dedupe + scene:transition).
 * Idempotent. Call from reviveGameEngine (and tests).
 */
export function bindSceneTransitionRequestListener(): void {
  if (unsubRequest) return;
  unsubRequest = eventBus.on('scene:request_transition', ({ targetScene, spawnAt }) => {
    requestSceneTransition(targetScene, spawnAt);
  });
}

export function unbindSceneTransitionRequestListener(): void {
  unsubRequest?.();
  unsubRequest = null;
}
