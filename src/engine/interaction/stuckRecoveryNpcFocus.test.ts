import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveNearestNpcForRingFocus } from './stuckRecoveryNpcFocus';

const groups = new Map<string, { getWorldPosition: (v: { set: (x: number, y: number, z: number) => void }) => void }>();

vi.mock('@/engine/interaction/npcRegistry', () => ({
  getNPCGroup: (id: string) => groups.get(id),
  getRegisteredNPCIds: () => [...groups.keys()],
}));

vi.mock('@/engine/StateDispatcher', () => ({
  getGameSnapshot: () => ({
    exploration: { playerPosition: [0, 0, 0] as [number, number, number] },
  }),
}));

vi.mock('@/data/gameDataLoader', () => ({
  findNpcById: (id: string) => ({ id, name: id === 'maria' ? 'Мария' : id }),
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: vi.fn() },
}));

describe('stuckRecoveryNpcFocus', () => {
  beforeEach(() => {
    groups.clear();
  });

  it('prefers recovered target when registered', () => {
    groups.set('albert', {
      getWorldPosition: (v) => { v.set(2, 0, 0); },
    });
    groups.set('maria', {
      getWorldPosition: (v) => { v.set(1, 0, 0); },
    });
    const focus = resolveNearestNpcForRingFocus('albert');
    expect(focus?.npcId).toBe('albert');
    expect(focus?.distance).toBeCloseTo(2);
  });

  it('falls back to nearest registered npc', () => {
    groups.set('albert', {
      getWorldPosition: (v) => { v.set(5, 0, 0); },
    });
    groups.set('maria', {
      getWorldPosition: (v) => { v.set(1, 0, 0); },
    });
    const focus = resolveNearestNpcForRingFocus(null);
    expect(focus?.npcId).toBe('maria');
    expect(focus?.label).toBe('Мария');
  });

  it('returns null when no npcs', () => {
    expect(resolveNearestNpcForRingFocus(null)).toBeNull();
  });
});
