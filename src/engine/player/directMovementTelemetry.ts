import type { SceneId } from '@/shared/types/game';
import { devLog, devWarn } from '@/shared/utils/devLog';
import { eventBus } from '@/engine/EventBus';

export type DirectMovementTelemetryRefs = {
  useDirectRef: React.MutableRefObject<boolean>;
  loggedRef: React.MutableRefObject<boolean>;
  reasonRef: React.MutableRefObject<string | null>;
};

/** Dev-only telemetry when KCC is bypassed (collider missing / mobile stuck). */
export function activateDirectMovementMode(
  refs: DirectMovementTelemetryRefs,
  reason: string,
  meta: { sceneId: SceneId; failFrames?: number; stuckFrames?: number },
): void {
  refs.useDirectRef.current = true;
  if (refs.loggedRef.current && refs.reasonRef.current === reason) return;
  refs.loggedRef.current = true;
  refs.reasonRef.current = reason;
  devWarn('[PhysicsPlayer][direct-movement]', reason, meta);
  if (import.meta.env.DEV) {
    eventBus.emit('ui:exploration_message', { text: `[DEV] Direct movement: ${reason}` });
  }
}

export function restoreKccMovementMode(
  refs: DirectMovementTelemetryRefs,
  meta: { sceneId: SceneId },
): void {
  if (refs.loggedRef.current) {
    devLog('[PhysicsPlayer][direct-movement] restored KCC', {
      ...meta,
      previousReason: refs.reasonRef.current,
    });
  }
  refs.useDirectRef.current = false;
  refs.loggedRef.current = false;
  refs.reasonRef.current = null;
}
