import type { MutableRefObject } from 'react';
import type * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  sharedPlayerPositionRef,
  sharedPlayerRotationRef,
} from '@/engine/PlayerRotationState';

/** Syncs live player pose → module mirrors for CompassHUD / MiniMap (post-player). */
export function RotationSyncBridge({
  livePlayerRotationRef,
  livePlayerPositionRef,
}: {
  livePlayerRotationRef: MutableRefObject<number>;
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}) {
  useFrameTick(
    'player',
    () => {
      sharedPlayerRotationRef.current = livePlayerRotationRef.current;
      if (livePlayerPositionRef) {
        const p = livePlayerPositionRef.current;
        sharedPlayerPositionRef.current.x = p.x;
        sharedPlayerPositionRef.current.y = p.y;
        sharedPlayerPositionRef.current.z = p.z;
      }
    },
    { label: 'RotationSync', phase: 'post_physics' },
  );
  return null;
}
