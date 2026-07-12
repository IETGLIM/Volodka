import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  COMBAT_DIFFICULTY_LS_KEY,
  getFleeChanceBonus,
  readCombatDifficulty,
  scaleEnemyDamageByDifficulty,
  writeCombatDifficulty,
} from '@/engine/combat/combatDifficulty';

function mockLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    key() {
      return null;
    },
  } as Storage;
}

describe('combatDifficulty', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
  });

  it('defaults to normal difficulty', () => {
    expect(readCombatDifficulty()).toBe('normal');
    expect(scaleEnemyDamageByDifficulty(100)).toBe(100);
    expect(getFleeChanceBonus()).toBe(0);
  });

  it('story mode softens enemy damage and improves flee', () => {
    writeCombatDifficulty('story');
    expect(scaleEnemyDamageByDifficulty(100)).toBe(65);
    expect(getFleeChanceBonus()).toBe(0.2);
  });

  it('hard mode increases enemy damage', () => {
    writeCombatDifficulty('hard');
    expect(scaleEnemyDamageByDifficulty(100)).toBe(125);
    expect(getFleeChanceBonus()).toBe(-0.05);
  });

  it('persists selection in localStorage', () => {
    writeCombatDifficulty('story');
    expect(localStorage.getItem(COMBAT_DIFFICULTY_LS_KEY)).toBe('story');
    expect(readCombatDifficulty()).toBe('story');
  });
});
