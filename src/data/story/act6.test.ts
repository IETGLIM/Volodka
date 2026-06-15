import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT6 } from '@/data/story/act6';
import { STORY_NODES_ACT7 } from '@/data/story/act7';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_ID_ALIASES } from '@/shared/npcIdAliases';

describe('Act 6 story presentation', () => {
  it('act6_dmitry_confession has karma variants, autosave and poem', () => {
    const node = STORY_NODES_ACT6.act6_dmitry_confession;
    expect(node.autoSave).toBe(true);
    expect(node.accessibilityAnnounce).toContain('Дмитрия');
    expect(node.textVariants?.highKarma).toBeTruthy();
    const ally = node.choices.find((c) => c.next === 'act6_alliance_formed');
    expect(ally?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_25' });
    expect(ally?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -10 });
  });

  it('act6_heist_execution has tension music and stress drain', () => {
    const node = STORY_NODES_ACT6.act6_heist_execution;
    expect(node.autoSave).toBe(true);
    expect(node.musicCue).toBe('tension');
    expect(node.ambientSound).toBeTruthy();
    expect(node.choices[0]?.effects).toContainEqual({ type: 'addStat', stat: 'energy', value: -15 });
  });

  it('act6_nadzor_battle has combat stress and danger music', () => {
    const node = STORY_NODES_ACT6.act6_nadzor_battle;
    expect(node.autoSave).toBe(true);
    expect(node.musicCue).toBe('danger');
    expect(node.accessibilityAnnounce).toContain('Хранител');
    const fight = node.choices[0];
    expect(fight?.effects).toContainEqual({ type: 'combat', enemyType: 'nexus_guardian' });
    expect(fight?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: 15 });
  });

  it('act6_core_choice collects poem_26 with autosave', () => {
    const node = STORY_NODES_ACT6.act6_core_choice;
    expect(node.autoSave).toBe(true);
    expect(node.textVariants?.neutralKarma).toBeTruthy();
    expect(node.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_26' });
  });

  it('act6_final_confrontation sets Act 7 path flags', () => {
    const node = STORY_NODES_ACT6.act6_final_confrontation;
    expect(node.autoSave).toBe(true);
    expect(node.musicCue).toBe('emotional');
    const guardian = node.choices.find((c) => c.effects?.some((e) => e.type === 'setFlag' && e.flag === 'chose_guardian_path'));
    const liberator = node.choices.find((c) => c.effects?.some((e) => e.type === 'setFlag' && e.flag === 'chose_liberator_path'));
    expect(guardian?.next).toBe('act7_bridge');
    expect(liberator?.next).toBe('act7_bridge');
    expect(guardian?.effects).toContainEqual({ type: 'setFlag', flag: 'rooftop_confrontation_done', flagValue: true });
  });

  it('act6_traitor_revealed sets traitor_revealed flag', () => {
    const node = STORY_NODES_ACT6.act6_traitor_revealed;
    expect(node.effects).toContainEqual({ type: 'setFlag', flag: 'traitor_revealed', flagValue: true });
    expect(node.contextNote).toBeTruthy();
    expect(GOLDEN_PATH_BRANCH_HINTS.act6_traitor_revealed).toBeTruthy();
  });

  it('office confrontation has dmitry_defected branch', () => {
    const node = STORY_NODES_ACT6.act6_office_confrontation;
    const defected = node.choices.find((c) => c.condition?.flag === 'dmitry_defected');
    expect(defected?.next).toBe('act6_dmitry_confession');
    expect(node.guidanceNpcId).toBe('npc_dmitry');
  });

  it('explore hubs have guidance labels', () => {
    expect(STORY_NODES_ACT6.act6_heist_execution.guidanceSceneLabel).toBe('офис IT-гильдии');
    expect(STORY_NODES_ACT6.act6_infiltration_prep.guidanceSceneLabel).toBe('бункер под заводом');
  });

  it('npc aliases resolve for act 6 NPCs', () => {
    expect(NPC_ID_ALIASES.npc_zheka).toBe('zeka');
    expect(NPC_ID_ALIASES.npc_maxim).toBe('maxim');
    expect(NPC_ID_ALIASES.npc_anya).toBe('anya');
    expect(NPC_ID_ALIASES.npc_dmitry).toBe('office_dmitry');
  });

  it('act7_bridge reads act6 aftermath', () => {
    const bridge = STORY_NODES_ACT7.act7_bridge;
    expect(bridge.contextNote).toBeTruthy();
    expect(bridge.textVariants?.highKarma).toBeTruthy();
    const future = STORY_NODES_ACT7.act7_maria_future;
    const guardianPath = future.choices.find((c) => c.condition?.flag === 'chose_guardian_path');
    expect(guardianPath?.next).toBe('act7_ending_guardian');
  });

  it('key act 6 nodes have golden path hints', () => {
    const ids = [
      'act6_dmitry_confession',
      'act6_heist_execution',
      'act6_nadzor_battle',
      'act6_final_confrontation',
    ] as const;
    for (const id of ids) {
      expect(GOLDEN_PATH_BRANCH_HINTS[id], id).toBeTruthy();
    }
  });
});
