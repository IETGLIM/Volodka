import { describe, it, expect } from 'vitest';

import { getExplorationSceneObjectiveLines } from './explorationSceneQuestObjectives';

describe('getExplorationSceneObjectiveLines', () => {
  it('returns main_goal write_poems for volodka_room when that step is active', () => {
    const lines = getExplorationSceneObjectiveLines(['main_goal'], { main_goal: {} }, 'volodka_room');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(lines[0].questId).toBe('main_goal');
    expect(lines[0].objectiveId).toBe('write_poems');
  });

  it('sorts main-line quests before side quests for the same scene', () => {
    const lines = getExplorationSceneObjectiveLines(
      ['exploration_volodka_rack', 'main_goal'],
      {
        main_goal: {},
        exploration_volodka_rack: {},
      },
      'volodka_room',
    );
    const mainIdx = lines.findIndex((l) => l.questId === 'main_goal');
    const sideIdx = lines.findIndex((l) => l.questId === 'exploration_volodka_rack');
    expect(mainIdx).toBeGreaterThanOrEqual(0);
    expect(sideIdx).toBeGreaterThanOrEqual(0);
    expect(mainIdx).toBeLessThan(sideIdx);
  });

  it('returns empty when no active objectives target the scene', () => {
    expect(getExplorationSceneObjectiveLines(['main_goal'], { main_goal: {} }, 'office_morning')).toEqual([]);
  });
});
