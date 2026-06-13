import type { SceneId } from '@/shared/types/game';
import { devLog, devWarn } from '@/shared/utils/devLog';
import { eventBus } from '@/engine/EventBus';

export type DirectMovementTelemetryRefs = {
  controlsDegradedRef: React.MutableRefObject<boolean>;
  degradedLoggedRef: React.MutableRefObject<boolean>;
  degradedReasonRef: React.MutableRefObject<string | null>;
  recreateAttemptsRef: React.MutableRefObject<number>;
};

const CONTROLS_DEGRADED_USER_MESSAGE =
  'Движение временно ограничено. Попробуйте сменить сцену или перезагрузить игру.';

export function logKccRecreateAttempt(
  refs: DirectMovementTelemetryRefs,
  reason: string,
  meta: { sceneId: SceneId; failFrames?: number; stuckFrames?: number },
): void {
  refs.recreateAttemptsRef.current += 1;
  devLog('[PhysicsPlayer][KCC-recreate]', reason, {
    ...meta,
    attempt: refs.recreateAttemptsRef.current,
  });
}

export function notifyControlsDegraded(
  refs: DirectMovementTelemetryRefs,
  reason: string,
  meta: { sceneId: SceneId; failFrames?: number; stuckFrames?: number },
): void {
  refs.controlsDegradedRef.current = true;
  if (refs.degradedLoggedRef.current && refs.degradedReasonRef.current === reason) return;
  refs.degradedLoggedRef.current = true;
  refs.degradedReasonRef.current = reason;
  devWarn('[PhysicsPlayer][controls-degraded]', reason, meta);
  const text = import.meta.env.DEV
    ? `[DEV] Controls degraded: ${reason}`
    : CONTROLS_DEGRADED_USER_MESSAGE;
  eventBus.emit('ui:exploration_message', { text });
}

export function restoreKccMovementMode(
  refs: DirectMovementTelemetryRefs,
  meta: { sceneId: SceneId },
): void {
  if (refs.degradedLoggedRef.current || refs.recreateAttemptsRef.current > 0) {
    devLog('[PhysicsPlayer][KCC] restored', {
      ...meta,
      previousReason: refs.degradedReasonRef.current,
      recreateAttempts: refs.recreateAttemptsRef.current,
    });
  }
  refs.controlsDegradedRef.current = false;
  refs.degradedLoggedRef.current = false;
  refs.degradedReasonRef.current = null;
  refs.recreateAttemptsRef.current = 0;
}
