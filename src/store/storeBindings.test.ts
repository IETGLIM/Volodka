import { describe, it, expect, beforeEach } from 'vitest';
import '@/store/gameStore';
import { getCombinedGameState, resetCombinedGameStateCacheForTests } from './storeBindings';
import { useUIStore } from './stores/uiStore';

describe('getCombinedGameState', () => {
  beforeEach(() => {
    resetCombinedGameStateCacheForTests();
  });

  it('returns the same object reference when slice stores are unchanged', () => {
    const first = getCombinedGameState();
    const second = getCombinedGameState();
    expect(second).toBe(first);
  });

  it('returns a new object reference when a slice store updates', () => {
    const before = getCombinedGameState();
    const menuOpen = useUIStore.getState().mainMenuOpen;
    useUIStore.setState({ mainMenuOpen: !menuOpen });
    const after = getCombinedGameState();
    expect(after).not.toBe(before);
    expect(after.mainMenuOpen).toBe(!menuOpen);
    useUIStore.setState({ mainMenuOpen: menuOpen });
  });
});
