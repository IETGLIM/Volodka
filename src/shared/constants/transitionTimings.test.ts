import { describe, expect, it } from 'vitest';
import {
  CUTSCENE_TIMINGS,
  EXPLORATION_HUD_HANDOFF,
} from './transitionTimings';

describe('EXPLORATION_HUD_HANDOFF', () => {
  it('aligns guidance reveal with warm canvas fade', () => {
    expect(EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS).toBe(
      CUTSCENE_TIMINGS.CANVAS_FADE_OUT_WARM_MS,
    );
  });

  it('defers hub toast one beat after guidance reveal', () => {
    expect(EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS).toBe(
      EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS + 60,
    );
  });
});
