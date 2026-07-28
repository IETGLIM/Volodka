import { describe, expect, it, vi, beforeEach } from 'vitest';
import { focusQuestOnMap } from './focusQuestOnMap';

const emit = vi.fn();
const getQuestMarker = vi.fn();

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: (...args: unknown[]) => emit(...args) },
}));

vi.mock('@/store/questStore', () => ({
  getQuestMarker: (questId: string) => getQuestMarker(questId),
}));

describe('focusQuestOnMap', () => {
  beforeEach(() => {
    emit.mockClear();
    getQuestMarker.mockReset();
  });

  it('opens world map when marker is off-scene', () => {
    getQuestMarker.mockReturnValue({ sceneId: 'library_day', position: [0, 0, 0] });
    expect(focusQuestOnMap('corridor_letter', 'volodka_room')).toBe('map');
    expect(emit).toHaveBeenCalledWith('quest:pulse_marker', {
      questId: 'corridor_letter',
      sceneId: 'library_day',
    });
    expect(emit).toHaveBeenCalledWith('ui:open_panel', {
      panel: 'worldMap',
      sceneId: 'library_day',
      questId: 'corridor_letter',
    });
  });

  it('pulses only when already on marker scene', () => {
    getQuestMarker.mockReturnValue({ sceneId: 'volodka_corridor', position: [1, 0, 1] });
    expect(focusQuestOnMap('corridor_letter', 'volodka_corridor')).toBe('pulse_only');
    expect(emit).toHaveBeenCalledWith('quest:pulse_marker', {
      questId: 'corridor_letter',
      sceneId: 'volodka_corridor',
    });
    expect(emit).not.toHaveBeenCalledWith(
      'ui:open_panel',
      expect.anything(),
    );
  });

  it('pulses without scene when no marker', () => {
    getQuestMarker.mockReturnValue(null);
    expect(focusQuestOnMap('unknown', 'volodka_room')).toBe('none');
    expect(emit).toHaveBeenCalledWith('quest:pulse_marker', { questId: 'unknown' });
  });
});
