import { describe, expect, it } from 'vitest';
import { STORY_NODES } from '@/data/storyNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { POEMS } from '@/data/poems';

/**
 * Интерлокинг «сюжет ↔ квест ↔ стих»: часть выдач завязана на `useGameRuntime` / вход в узел
 * без `poemId` в `STORY_NODES` (см. `poem_6` + `stranger_approach` в CHANGELOG), поэтому здесь
 * не сканируем все `POEMS.unlocksAt` — это остаётся в `narrativePoetryIntegrity.test.ts` (валидный id узла).
 */
describe('Story → Quest → Skill → Item → Poem chain', () => {
  it('volunteer_read_result unlocks poem_12, completes poetry_collection, bumps main_goal write_poems', () => {
    const node = STORY_NODES.volunteer_read_result;
    expect(node, 'volunteer_read_result missing').toBeDefined();
    const eff = node!.effect;
    expect(eff?.poemId).toBe('poem_12');
    expect(eff?.questComplete).toBe('poetry_collection');
    expect(eff?.questObjective).toEqual({
      questId: 'main_goal',
      objectiveId: 'write_poems',
      value: 10,
    });

    const quest = QUEST_DEFINITIONS.poetry_collection;
    expect(quest, 'poetry_collection quest').toBeDefined();
    const writeObj = quest!.objectives.find((o) => o.id === 'write_poems');
    expect(writeObj, 'write_poems objective').toBeDefined();

    const poem = POEMS.find((p) => p.id === 'poem_12');
    expect(poem, 'poem_12').toBeDefined();
    expect(poem!.unlocksAt.trim().length, 'poem_12 should declare catalog unlock node').toBeGreaterThan(0);
    const unlockNode = STORY_NODES[poem!.unlocksAt];
    expect(unlockNode?.effect?.poemId, 'POEMS catalog node for poem_12 should grant the same id').toBe('poem_12');
  });
});
