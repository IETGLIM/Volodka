import { describe, expect, it, vi } from 'vitest';
import { resolveTravelQuestPin } from './worldMapTravelQuestPin';

vi.mock('@/data/gameDataLoader', () => ({
  getQuestDefinitions: () => [{ id: 'final_code', title: 'Последний Код' }],
}));

vi.mock('@/store/questStore', () => ({
  getQuestMarker: (questId: string) =>
    questId === 'final_code'
      ? { sceneId: 'office_day' as const, position: [1, 0, 2] as [number, number, number] }
      : null,
}));

describe('travelQuestPin', () => {
  it('resolves pin when active quest marker matches destination', () => {
    const pin = resolveTravelQuestPin('office_day', [
      { questId: 'final_code', status: 'active', objectives: {} },
    ] as never);
    expect(pin?.questId).toBe('final_code');
    expect(pin?.title).toBe('Последний Код');
  });

  it('returns null when no matching marker', () => {
    expect(
      resolveTravelQuestPin('street_night', [
        { questId: 'final_code', status: 'active', objectives: {} },
      ] as never),
    ).toBeNull();
  });
});
