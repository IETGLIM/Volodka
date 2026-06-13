import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EXPLORATION_DIALOGUE_STORY_STEP, recordExplorationStoryStep } from './explorationStoryBridge';

const dispatchMock = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: (...args: unknown[]) => dispatchMock(...args),
}));

describe('explorationStoryBridge', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
  });

  it('maps exploration dialogue ids to story spine ids', () => {
    expect(EXPLORATION_DIALOGUE_STORY_STEP.explore_room_table).toBe('room_table');
    expect(EXPLORATION_DIALOGUE_STORY_STEP.explore_corridor_door).toBe('corridor_door');
    expect(EXPLORATION_DIALOGUE_STORY_STEP.explore_kitchen_table).toBe('kitchen_table');
  });

  it('does not auto-advance street bench before player choice', () => {
    expect(EXPLORATION_DIALOGUE_STORY_STEP.explore_street_entry).toBeUndefined();
    expect(EXPLORATION_DIALOGUE_STORY_STEP.explore_street_bench_view).toBeUndefined();
  });

  it('dispatches visitNode for mapped exploration dialogue', () => {
    recordExplorationStoryStep('explore_room_table');
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'story/visitNode',
      nodeId: 'room_table',
    });
  });

  it('ignores unmapped dialogue ids', () => {
    recordExplorationStoryStep('unknown_dialogue');
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
