import { getSceneConfig, sanitizeExplorationPlayerPositionAgainstSpawn } from '@/config/scenes';
import type { ExplorationState, PlayerPosition, TriggerZone } from '@/data/rpgTypes';
import type { SceneId } from '@/data/types';
import { INTRO_OPENING_ZAREMA_SPAWN } from '@/lib/introVolodkaOpeningCutscene';

/**
 * Смена локации по триггеру `type: 'location'` (сон, выход из сна, прочие телепорты).
 * Вызывается из `RPGGameCanvas.handleTriggerEnter`, чтобы не тащить тяжёлую типизацию Zustand в JSX.
 */
export function applyExplorationLocationTrigger(
  ex: ExplorationState,
  trigger: TriggerZone,
  now: number,
): ExplorationState {
  const tid = trigger.targetSceneId;
  if (!tid) return ex;

  if (tid === 'dream') {
    const sp = getSceneConfig('dream').spawnPoint;
    const tp = trigger.targetPosition;
    return {
      ...ex,
      dreamWakeReturn: { sceneId: ex.currentSceneId, position: { ...ex.playerPosition } },
      currentSceneId: 'dream',
      playerPosition: {
        x: tp?.x ?? sp.x,
        y: tp?.y ?? sp.y,
        z: tp?.z ?? sp.z,
        rotation: ex.playerPosition.rotation,
      },
      lastSceneTransition: now,
    };
  }

  if (ex.currentSceneId === 'dream' && tid !== 'dream') {
    const ret = ex.dreamWakeReturn;
    const sceneId: SceneId = ret?.sceneId ?? 'zarema_albert_room';
    const rawPos: PlayerPosition = ret?.position ?? { ...INTRO_OPENING_ZAREMA_SPAWN };
    return {
      ...ex,
      dreamWakeReturn: undefined,
      currentSceneId: sceneId,
      playerPosition: sanitizeExplorationPlayerPositionAgainstSpawn(sceneId, {
        ...rawPos,
        rotation: rawPos.rotation ?? 0,
      }),
      lastSceneTransition: now,
    };
  }

  const dest: SceneId = tid;
  const cfg = getSceneConfig(dest);
  const tp = trigger.targetPosition;
  const pos = tp
    ? sanitizeExplorationPlayerPositionAgainstSpawn(dest, {
        x: tp.x,
        y: tp.y,
        z: tp.z,
        rotation: ex.playerPosition.rotation,
      })
    : sanitizeExplorationPlayerPositionAgainstSpawn(dest, { ...cfg.spawnPoint });

  return {
    ...ex,
    currentSceneId: dest,
    playerPosition: pos,
    lastSceneTransition: now,
  };
}
