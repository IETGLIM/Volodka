import { describe, expect, it } from 'vitest';
import { isExplorationPlayerDebugPrimitiveEnabled } from './explorationPlayerDebugPrimitive';

describe('explorationPlayerDebugPrimitive', () => {
  it('returns boolean (off unless env set at build time)', () => {
    expect(typeof isExplorationPlayerDebugPrimitiveEnabled()).toBe('boolean');
  });
});
