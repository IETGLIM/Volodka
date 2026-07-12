import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT3 } from '@/data/story/act3';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_ID_ALIASES } from '@/shared/npcIdAliases';

describe('Act 3 story presentation', () => {
  it('act3_zarema_arrest has karma variants and autosave', () => {
    const node = STORY_NODES_ACT3.act3_zarema_arrest;
    expect(node.autoSave).toBe(true);
    expect(node.accessibilityAnnounce).toContain('Арест');
    expect(node.textVariants?.highKarma).toBeTruthy();
  });

  it('act3_maria_revelation uses Victoria speaker and karma text', () => {
    const node = STORY_NODES_ACT3.act3_maria_revelation;
    expect(node.speaker).toBe('Виктория');
    expect(node.autoSave).toBe(true);
    expect(node.textVariants?.lowKarma).toContain('код');
  });

  it('left_zarema path goes through farewell node', () => {
    const rescue = STORY_NODES_ACT3.act3_zarema_rescue_choice;
    const left = rescue.choices.find((c) => c.next === 'act3_zarema_farewell');
    expect(left).toBeTruthy();
    expect(STORY_NODES_ACT3.act3_zarema_farewell.speaker).toBe('Зарема');
  });

  it('cafe rescue routes through barista safehouse', () => {
    const save = STORY_NODES_ACT3.act3_save_zarema;
    const cafe = save.choices.find((c) => c.next === 'act3_barista_safehouse');
    expect(cafe).toBeTruthy();
  });

  it('golden prepare path goes through dmitry briefing', () => {
    const prep = STORY_NODES_ACT3.act3_prepare_counter;
    const golden = prep.choices.find((c) => c.goldenPath);
    expect(golden?.next).toBe('act3_dmitry_briefing');
    expect(STORY_NODES_ACT3.act3_dmitry_briefing.choices[0]?.next).toBe('act3_decision_point');
  });

  it('act3_hide_network syncs CHK flags', () => {
    const node = STORY_NODES_ACT3.act3_hide_network;
    expect(node.effects).toContainEqual({
      type: 'setFlag',
      flag: 'tolpa_act3_hide_sync',
      flagValue: true,
    });
    const chk = node.choices.find((c) => c.condition?.flag === 'tolpa_member');
    expect(chk?.effects).toContainEqual({
      type: 'triggerQuest',
      questId: 'tolpa_act3_sanctuary',
    });
  });

  it('act3_decision_point autosaves with guidance', () => {
    const node = STORY_NODES_ACT3.act3_decision_point;
    expect(node.autoSave).toBe(true);
    expect(node.guidanceHint).toBeTruthy();
  });

  it('npc_zarema alias resolves', () => {
    expect(NPC_ID_ALIASES.npc_zarema).toBe('zarema');
  });

  it('new nodes have golden path hints', () => {
    const ids = [
      'act3_zarema_farewell',
      'act3_barista_safehouse',
      'act3_dmitry_briefing',
      'act3_hide_network',
    ] as const;
    for (const id of ids) {
      expect(GOLDEN_PATH_BRANCH_HINTS[id], id).toBeTruthy();
    }
  });
});
