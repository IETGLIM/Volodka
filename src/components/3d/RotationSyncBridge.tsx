import type { MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { sharedPlayerRotationRef } from '@/engine/PlayerRotationState';

/** Syncs live player rotation ref → module state for CompassHUD. */
export function RotationSyncBridge({
  livePlayerRotationRef,
}: {
  livePlayerRotationRef: MutableRefObject<number>;
}) {
  useFrameTick(
    'player',
    () => {
      sharedPlayerRotationRef.current = livePlayerRotationRef.current;
    },
    { label: 'RotationSync' },
  );
  return null;
}
