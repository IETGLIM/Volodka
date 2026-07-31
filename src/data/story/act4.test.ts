import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT4 } from '@/data/story/act4';
import { STORY_NODES } from '@/data/story';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_ID_ALIASES } from '@/shared/npcIdAliases';

describe('Act 4 story presentation', () => {
  it('act4_core_server has karma variants, a11y and autosave', () => {
    const node = STORY_NODES_ACT4.act4_core_server;
    expect(node.autoSave).toBe(true);
    expect(node.accessibilityAnnounce).toContain('Протокол');
    expect(node.textVariants?.highKarma).toBeTruthy();
    expect(node.musicCue).toBe('danger');
  });

  it('act4_broadcast_execute has full a11y and karma text', () => {
    const node = STORY_NODES_ACT4.act4_broadcast_execute;
    expect(node.autoSave).toBe(true);
    expect(node.accessibilityAnnounce).toContain('Трансляция');
    expect(node.textVariants?.lowKarma).toBeTruthy();
    expect(node.ambientSound).toBeTruthy();
  });

  it('act4_peaceful_march has crowd sound and guidance', () => {
    const node = STORY_NODES_ACT4.act4_peaceful_march;
    expect(node.ambientSound).toContain('crowd');
    expect(node.guidanceNpcId).toBe('npc_maria');
    expect(node.textVariants?.highKarma).toBeTruthy();
  });

  it('act4_infiltration_prep golden path uses Dmitry with npc_ alias', () => {
    const prep = STORY_NODES_ACT4.act4_infiltration_prep;
    const golden = prep.choices.find((c) => c.goldenPath);
    expect(golden?.condition?.flag).toBe('dmitry_defected');
    expect(golden?.effects).toContainEqual({
      type: 'npcChange',
      npcId: 'npc_dmitry',
      npcChange: { relation: 5 },
    });
    expect(prep.autoSave).toBe(true);
  });

  it('act4_rooftop_broadcast aliases to broadcast prep', () => {
    const alias = STORY_NODES_ACT4.act4_rooftop_broadcast;
    expect(alias.choices[0]?.next).toBe('act4_broadcast_prep');
  });

  it('act4_final_choice autosaves with karma variants', () => {
    const node = STORY_NODES_ACT4.act4_final_choice;
    expect(node.autoSave).toBe(true);
    expect(node.guidanceHint).toBeTruthy();
    expect(node.karmaThresholds).toEqual({ high: 65, low: 30 });
  });

  it('act4_quiet_first_poem collects poem_1', () => {
    const node = STORY_NODES_ACT4.act4_quiet_first_poem;
    const choice = node.choices[0];
    expect(choice?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_1' });
  });

  it('combat nodes apply stress and energy drain', () => {
    const inside = STORY_NODES_ACT4.act4_infiltration_inside;
    const combat = inside.choices.find((c) => c.effects?.some((e) => e.type === 'combat'));
    expect(combat?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: 8 });
    expect(combat?.effects).toContainEqual({ type: 'addStat', stat: 'energy', value: -15 });

    const escape = STORY_NODES_ACT4.act4_escape;
    const fight = escape.choices.find((c) => c.effects?.some((e) => e.type === 'combat'));
    expect(fight?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: 15 });
  });

  it('stalker route sets tolpa_stalker_route flag', () => {
    const prep = STORY_NODES_ACT4.act4_infiltration_prep;
    const stalker = prep.choices.find((c) => c.condition?.flag === 'tolpa_honorary_chekist');
    expect(stalker?.effects).toContainEqual({
      type: 'setFlag',
      flag: 'tolpa_stalker_route',
      flagValue: true,
    });
    expect(stalker?.effects).toContainEqual({
      type: 'npcChange',
      npcId: 'npc_chk_stalker',
      npcChange: { relation: 5 },
    });
  });

  it('npc aliases resolve for act 4 NPCs', () => {
    expect(NPC_ID_ALIASES.npc_dmitry).toBe('office_dmitry');
    expect(NPC_ID_ALIASES.npc_colleague).toBe('office_colleague');
    expect(NPC_ID_ALIASES.npc_chk_stalker).toBe('chk_stalker');
  });

  it('key act 4 nodes have golden path hints', () => {
    const ids = [
      'act4_core_server',
      'act4_broadcast_execute',
      'act4_infiltration_prep',
      'act4_final_choice',
    ] as const;
    for (const id of ids) {
      expect(
        GOLDEN_PATH_BRANCH_HINTS[id] || STORY_NODES[id]?.guidanceHint,
        id,
      ).toBeTruthy();
    }
  });
});
