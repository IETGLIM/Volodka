import { describe, expect, it } from 'vitest';
import { planExplorationGlbLocomotionClip } from './explorationGlbAnimation';

describe('planExplorationGlbLocomotionClip', () => {
  it('picks idle when not moving', () => {
    const plan = planExplorationGlbLocomotionClip(['Idle', 'Walk', 'Run'], false, false);
    expect(plan?.targetAnim).toBe('Idle');
    expect(plan?.singleClipMode).toBe(false);
  });

  it('picks run when moving and running with multiple clips', () => {
    const plan = planExplorationGlbLocomotionClip(['Idle', 'Walk', 'Run'], true, true);
    expect(plan?.targetAnim).toBe('Run');
  });

  it('single clip uses idle key for pseudo-walk', () => {
    const plan = planExplorationGlbLocomotionClip(['Mixamo|Idle'], true, true);
    expect(plan?.singleClipMode).toBe(true);
    expect(plan?.targetAnim).toBe('Mixamo|Idle');
  });
});
