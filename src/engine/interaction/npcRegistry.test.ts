import { describe, expect, it, beforeEach } from 'vitest';
import {
  getNpcBehaviorState,
  resetNpcBehaviorStatesForTests,
  setNpcBehaviorState,
  syncNpcBehaviorState,
} from '@/engine/interaction/npcRegistry';

describe('npcRegistry behavior state', () => {
  beforeEach(() => {
    resetNpcBehaviorStatesForTests();
  });

  it('syncNpcBehaviorState writes combat→talk without rejection', () => {
    syncNpcBehaviorState('zarema', 'combat');
    expect(getNpcBehaviorState('zarema')).toBe('combat');

    const changed = syncNpcBehaviorState('zarema', 'talk');
    expect(changed).toBe(true);
    expect(getNpcBehaviorState('zarema')).toBe('talk');
  });

  it('setNpcBehaviorState rejects invalid combat→talk transition', () => {
    syncNpcBehaviorState('zarema', 'combat');
    const changed = setNpcBehaviorState('zarema', 'talk');
    expect(changed).toBe(false);
    expect(getNpcBehaviorState('zarema')).toBe('combat');
  });

  it('syncNpcBehaviorState is no-op when state unchanged', () => {
    syncNpcBehaviorState('albert', 'idle');
    expect(syncNpcBehaviorState('albert', 'idle')).toBe(false);
  });
});
