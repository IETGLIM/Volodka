import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT5 } from '@/data/story/act5';
import { STORY_NODES_ACT3 } from '@/data/story/act3';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_ID_ALIASES } from '@/shared/npcIdAliases';

describe('Act 5 story presentation', () => {
  it('machine_confession_scene has karma variants, a11y and autosave', () => {
    const node = STORY_NODES_ACT5.machine_confession_scene;
    expect(node.autoSave).toBe(true);
    expect(node.accessibilityAnnounce).toContain('Зари-М');
    expect(node.textVariants?.highKarma).toBeTruthy();
    expect(node.ambientSound).toContain('basement');
    const free = node.choices.find((c) => c.effects?.some((e) => e.type === 'setFlag' && e.flag === 'zarya_freed'));
    expect(free?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -15 });
  });

  it('ending_poet has wind ambient and poem_23', () => {
    const node = STORY_NODES_ACT5.ending_poet;
    expect(node.autoSave).toBe(true);
    expect(node.ambientSound).toContain('rooftop');
    expect(node.textVariants?.highKarma).toContain('Тишина');
    const epilogue = node.choices.find((c) => c.next === 'act5_ending_epilogue');
    expect(epilogue?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_23' });
  });

  it('Act 5 path endings leave to scene explore hubs — not null soft-lock', () => {
    const expected: Array<[keyof typeof STORY_NODES_ACT5, string]> = [
      ['ending_reconciliation', 'cafe_explore_mode'],
      ['ending_creator', 'library_explore_mode'],
      ['ending_rebel', 'street_bench_view'],
      ['ending_exile', 'street_winter_explore_mode'],
      ['ending_machine', 'dream_explore_mode'],
      ['ending_poet', 'rooftop_explore_mode'],
    ];
    for (const [id, hub] of expected) {
      const node = STORY_NODES_ACT5[id];
      expect(
        node.choices.some((c) => c.next === hub),
        `${id} → ${hub}`,
      ).toBe(true);
      expect(node.choices.every((c) => c.next !== null), id).toBe(true);
    }
  });

  it('act5_peaceful_path has jazz ambient and karma text', () => {
    const node = STORY_NODES_ACT5.act5_peaceful_path;
    expect(node.autoSave).toBe(true);
    expect(node.musicCue).toBe('emotional');
    expect(node.guidanceHint).toBeTruthy();
  });

  it('mirror nodes have guidance for quiet-hour memories', () => {
    const mirror = STORY_NODES_ACT5.ending_reconciliation_mirror;
    expect(mirror.guidanceHint).toContain('пути');
    expect(mirror.contextNote).toBeTruthy();
    expect(mirror.autoSave).toBe(true);
    const memory = mirror.choices.find((c) => c.condition?.flag === 'quiet_tea_zarema');
    expect(memory?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -3 });
  });

  it('act5_ending_epilogue syncs Act 6 bridge flags and quests', () => {
    const node = STORY_NODES_ACT5.act5_ending_epilogue;
    expect(node.effects).toContainEqual({
      type: 'setFlag',
      flag: 'zarya_confession_requested',
      flagValue: true,
    });
    expect(node.effects).toContainEqual({
      type: 'setFlag',
      flag: 'vladimir_echo_started',
      flagValue: true,
    });
    expect(node.effects).toContainEqual({ type: 'triggerQuest', questId: 'traitor_in_the_guild' });
    expect(node.autoSave).toBe(true);
  });

  it('npc aliases resolve for act 5 NPCs', () => {
    expect(NPC_ID_ALIASES.npc_trofim).toBe('fisherman_trofim');
    expect(NPC_ID_ALIASES.npc_baba_zina).toBe('baba_zina');
    expect(NPC_ID_ALIASES.npc_maria).toBe('maria');
  });

  it('poem_virus_truth lives in Act 3', () => {
    expect(STORY_NODES_ACT3.poem_virus_truth).toBeTruthy();
    expect(STORY_NODES_ACT3.poem_virus_truth.autoSave).toBe(true);
    expect(STORY_NODES_ACT3.poem_virus_truth.choices[0]?.next).toBe('act3_prepare_counter');
    expect(STORY_NODES_ACT5.poem_virus_truth).toBeUndefined();
  });

  it('explore hubs have guidance for navigation', () => {
    expect(STORY_NODES_ACT5.basement_explore_mode.guidanceSceneLabel).toBe('подвал завода');
    expect(STORY_NODES_ACT5.factory_explore_mode.guidanceHint).toBeTruthy();
    expect(STORY_NODES_ACT5.library_entrance.guidanceSceneLabel).toBe('библиотеку');
  });

  it('key act 5 nodes have golden path hints', () => {
    const ids = [
      'machine_confession_scene',
      'act5_ending_epilogue',
      'ending_poet',
    ] as const;
    for (const id of ids) {
      expect(
        STORY_NODES_ACT5[id]?.guidanceHint || GOLDEN_PATH_BRANCH_HINTS[id],
        id,
      ).toBeTruthy();
    }
  });
});
