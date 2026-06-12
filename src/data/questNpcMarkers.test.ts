import { describe, expect, it } from 'vitest';
import {
  getObjectiveNpcHint,
  getObjectiveSceneHint,
  QUEST_OBJECTIVE_NPC_HINTS,
} from '@/data/questNpcMarkers';
import { ACT1_SOLNYSH_QUEST_SPINE, GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';

describe('ACT1_SOLNYSH_QUEST_SPINE', () => {
  it('is included in GOLDEN_PATH_QUEST_SPINE after poetry_collection', () => {
    const idx = GOLDEN_PATH_QUEST_SPINE.indexOf('poetry_collection');
    expect(GOLDEN_PATH_QUEST_SPINE.slice(idx + 1, idx + 4)).toEqual(ACT1_SOLNYSH_QUEST_SPINE);
  });
});

describe('questNpcMarkers solnysh', () => {
  it('maps wine search to lyonya and comfort to vera', () => {
    expect(getObjectiveNpcHint('solnysh_roof_wine', 'find_wine')).toBe('lyonya');
    expect(getObjectiveNpcHint('solnysh_comfort', 'comfort_solnysh')).toBe('vera');
  });

  it('provides scene hints for corridor and room', () => {
    expect(getObjectiveSceneHint('solnysh_comfort', 'talk_solnysh')?.sceneId).toBe('volodka_corridor');
    expect(getObjectiveSceneHint('solnysh_roof_wine', 'find_wine')?.sceneId).toBe('solnysh_room');
    expect(getObjectiveSceneHint('solnysh_roof_wine', 'roof_toast')?.sceneId).toBe('rooftop_edge');
  });

  it('covers all solnysh quest objectives', () => {
    for (const questId of ACT1_SOLNYSH_QUEST_SPINE) {
      expect(QUEST_OBJECTIVE_NPC_HINTS[questId]).toBeDefined();
    }
  });
});
