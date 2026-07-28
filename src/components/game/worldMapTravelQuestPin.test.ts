import { describe, expect, it, vi } from 'vitest';
import { resolveTravelQuestPin } from './worldMapTravelQuestPin';

vi.mock('@/data/gameDataLoader', () => ({
  getQuestDefinitions: () => [
    { id: 'side_errand', title: 'Побочная', questType: 'side' },
    { id: 'final_code', title: 'Последний Код', questType: 'main' },
  ],
}));

vi.mock('@/store/questStore', () => ({
  getQuestMarker: (questId: string) =>
    questId === 'final_code' || questId === 'side_errand'
      ? { sceneId: 'office_day' as const, position: [1, 0, 2] as [number, number, number] }
      : null,
  getNextTrackedObjective: (questId: string) =>
    questId === 'final_code'
      ? { objectiveId: 'meet', description: 'Встреть Сергея в офисе' }
      : questId === 'side_errand'
        ? { objectiveId: 'fetch', description: 'Забери дискету' }
        : null,
}));

describe('travelQuestPin', () => {
  it('resolves pin when active quest marker matches destination', () => {
    const pin = resolveTravelQuestPin('office_day', [
      { questId: 'final_code', status: 'active', objectives: {} },
    ] as never);
    expect(pin?.questId).toBe('final_code');
    expect(pin?.title).toBe('Последний Код');
    expect(pin?.objectiveText).toContain('Сергея');
  });

  it('prefers main quest over side when both match destination', () => {
    const pin = resolveTravelQuestPin('office_day', [
      { questId: 'side_errand', status: 'active', objectives: {} },
      { questId: 'final_code', status: 'active', objectives: {} },
    ] as never);
    expect(pin?.questId).toBe('final_code');
    expect(pin?.priority).toBe(0);
  });

  it('returns null when no matching marker', () => {
    expect(
      resolveTravelQuestPin('street_night', [
        { questId: 'final_code', status: 'active', objectives: {} },
      ] as never),
    ).toBeNull();
  });
});
