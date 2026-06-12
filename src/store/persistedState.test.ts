import { describe, expect, it } from 'vitest';
import { BOOT_PHASE_FLAGS } from '@/shared/gamePhase';
import {
  createDefaultPersistedState,
  createDefaultResetState,
} from './persistedState';

describe('persistedState boot/reset parity', () => {
  it('reset defaults match cold-boot phase flags', () => {
    const persisted = createDefaultPersistedState();
    expect(persisted.mainMenuOpen).toBe(BOOT_PHASE_FLAGS.mainMenuOpen);
    expect(persisted.introActive).toBe(BOOT_PHASE_FLAGS.introActive);
    expect(persisted.combatActive).toBe(BOOT_PHASE_FLAGS.combatActive);
  });

  it('createDefaultResetState includes boot phase flags', () => {
    const reset = createDefaultResetState();
    expect(reset.mainMenuOpen).toBe(BOOT_PHASE_FLAGS.mainMenuOpen);
    expect(reset.introActive).toBe(BOOT_PHASE_FLAGS.introActive);
    expect(reset.combatActive).toBe(BOOT_PHASE_FLAGS.combatActive);
    expect(reset.collectedPoems).toEqual([]);
  });
});
