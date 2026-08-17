import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';
import {
  HIGH_PRESET_BUDGET,
  averageFps,
  classifyHighPresetFps,
} from './highPresetBudget';

describe('highPresetBudget', () => {
  it('locks High preset knobs to the mid-laptop envelope', () => {
    const high = QUALITY_PRESETS.high;
    expect(high.dpr[1]).toBeLessThanOrEqual(HIGH_PRESET_BUDGET.maxDpr);
    expect(high.effectsScale).toBeCloseTo(HIGH_PRESET_BUDGET.effectsScale);
    expect(high.maxDrawDistance).toBeLessThanOrEqual(HIGH_PRESET_BUDGET.maxDrawDistanceM);
    expect(high.postProcessing).toBe(true);
  });

  it('classifies fps bands for judge evidence', () => {
    expect(classifyHighPresetFps(60).band).toBe('target');
    expect(classifyHighPresetFps(54).band).toBe('warn');
    expect(classifyHighPresetFps(40).band).toBe('critical');
    expect(averageFps([60, 58, 62])).toBeCloseTo(60);
  });
});
