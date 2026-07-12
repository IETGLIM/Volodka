import { describe, expect, it } from 'vitest';
import { resolveNarrativeTypewriterSpeed } from '@/hooks/narrativePresentation';

describe('narrativePresentation', () => {
  it('returns 0 ms when reduced motion is enabled', () => {
    expect(resolveNarrativeTypewriterSpeed(true, 1)).toBe(0);
  });

  it('speeds up typewriter when subtitle scale is larger', () => {
    const normal = resolveNarrativeTypewriterSpeed(false, 1, 28);
    const large = resolveNarrativeTypewriterSpeed(false, 1.5, 28);
    expect(large).toBeLessThan(normal);
  });

  it('speeds up typewriter when text speed is higher', () => {
    const normal = resolveNarrativeTypewriterSpeed(false, 1, 28, 1);
    const fast = resolveNarrativeTypewriterSpeed(false, 1, 28, 1.5);
    expect(fast).toBeLessThan(normal);
  });

  it('slows typewriter when subtitle scale is smaller', () => {
    const normal = resolveNarrativeTypewriterSpeed(false, 1, 28);
    const small = resolveNarrativeTypewriterSpeed(false, 0.8, 28);
    expect(small).toBeGreaterThan(normal);
  });
});
