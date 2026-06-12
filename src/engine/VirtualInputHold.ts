/* ─── Brief hold on virtual movement axes — smooths touch input glitches ─── */

import type { VirtualControls } from '@/hooks/useGamePhysics';

const MOVEMENT_AXES: (keyof VirtualControls)[] = [
  'forward',
  'backward',
  'left',
  'right',
  'jump',
];

const HOLD_SEC = 0.1;

export type VirtualHoldTimes = Partial<Record<keyof VirtualControls, number>>;

/** Keep movement axes active briefly after release to absorb 1–2 frame touch drops. */
export function sampleHeldVirtualControls(
  virtual: VirtualControls | undefined,
  clockTime: number,
  lastActive: VirtualHoldTimes,
): VirtualControls | undefined {
  if (!virtual) return undefined;

  const sampled = { ...virtual };
  for (const key of MOVEMENT_AXES) {
    if (virtual[key] > 0) {
      lastActive[key] = clockTime;
    } else {
      const activeAt = lastActive[key] ?? 0;
      sampled[key] = clockTime - activeAt < HOLD_SEC ? 1 : 0;
    }
  }
  return sampled;
}
