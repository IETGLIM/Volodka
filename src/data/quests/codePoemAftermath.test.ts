import { describe, expect, it } from 'vitest';
import { ACT_TRANSITIONS, GOLDEN_PATH_QUEST_SPINE, GOLDEN_PATH_STORY_SPINE } from '@/data/goldenPath';
import { QUESTS_ACT1 } from './act1';
import { STORY_NODES_ACT1 } from '@/data/story/act1';
import { STORY_NODES_ACT1_OFFICE_AFTERMATH } from '@/data/story/act1ExtendedOfficeAftermath';

describe('code_poem_aftermath quest arc', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'code_poem_aftermath');

  it('exists as Act 1 main quest after incident_scroll_4729', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('main');
    expect(quest?.act).toBe(1);
    expect(quest?.spineOrder).toBe(6);
  });

  it('has poem pressure → colleague → vault rumor objectives', () => {
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual([
      'absorb_decoded_poem',
      'feel_guild_pressure',
      'ask_colleague_politics',
      'hear_vault_lead',
    ]);
    expect(quest?.objectives.find((o) => o.id === 'absorb_decoded_poem')?.target).toBe(
      'found_first_poem',
    );
    expect(quest?.objectives.find((o) => o.id === 'feel_guild_pressure')?.target).toBe(
      'guild_poem_pressure',
    );
    expect(quest?.objectives.find((o) => o.id === 'ask_colleague_politics')?.target).toBe(
      'office_colleague',
    );
    expect(quest?.objectives.find((o) => o.id === 'hear_vault_lead')?.target).toBe(
      'vault_rumor_heard',
    );
  });

  it('sits on golden path between incident_scroll_4729 and vault_backup_trial', () => {
    const spine = [...GOLDEN_PATH_QUEST_SPINE];
    expect(spine.indexOf('code_poem_aftermath')).toBe(spine.indexOf('incident_scroll_4729') + 1);
    expect(spine.indexOf('vault_backup_trial')).toBe(spine.indexOf('code_poem_aftermath') + 1);

    const act1 = ACT_TRANSITIONS.find((t) => t.act === 1);
    expect(act1?.questSpineIds).toContain('code_poem_aftermath');
    const actIds = act1?.questSpineIds ?? [];
    expect(actIds.indexOf('code_poem_aftermath')).toBe(actIds.indexOf('incident_scroll_4729') + 1);
  });

  it('story spine threads fix_success → aftermath → colleague → vault whisper', () => {
    const spine = GOLDEN_PATH_STORY_SPINE;
    const iFix = spine.indexOf('fix_success');
    expect(spine[iFix + 1]).toBe('office_poem_aftermath');
    expect(spine[iFix + 2]).toBe('office_colleague');
    expect(spine[iFix + 3]).toBe('office_colleague_vault_whisper');
  });

  it('fix_success golden path enters office_poem_aftermath without soft-lock', () => {
    const node = STORY_NODES_ACT1.fix_success;
    const golden = node.choices.filter((c) => c.goldenPath);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('office_poem_aftermath');
    expect(golden[0]?.condition?.minSkill).toBeUndefined();
    expect(
      golden[0]?.effects?.some((e) => e.type === 'triggerQuest' && e.questId === 'code_poem_aftermath'),
    ).toBe(true);
  });

  it('office_colleague golden path is ungated and leads to vault whisper', () => {
    const node = STORY_NODES_ACT1.office_colleague;
    const golden = node.choices.filter((c) => c.goldenPath);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('office_colleague_vault_whisper');
    expect(golden[0]?.condition?.minSkill).toBeUndefined();
  });

  it('office_poem_aftermath golden chain reaches colleague without soft-lock', () => {
    const node = STORY_NODES_ACT1_OFFICE_AFTERMATH.office_poem_aftermath;
    expect(node.effects?.some((e) => e.type === 'setFlag' && e.flag === 'guild_poem_pressure')).toBe(
      true,
    );
    expect(node.choices.find((c) => c.goldenPath)?.next).toBe('office_colleague');
  });

  it('rewards mark code_poem_aftermath_done and unlock vault trial', () => {
    expect(
      quest?.rewards?.some((r) => r.type === 'setFlag' && r.flag === 'code_poem_aftermath_done'),
    ).toBe(true);
    expect(
      quest?.rewards?.some((r) => r.type === 'triggerQuest' && r.questId === 'vault_backup_trial'),
    ).toBe(true);
  });

  it('incident rewards trigger code_poem_aftermath', () => {
    const incident = QUESTS_ACT1.find((q) => q.id === 'incident_scroll_4729');
    expect(
      incident?.rewards?.some((r) => r.type === 'triggerQuest' && r.questId === 'code_poem_aftermath'),
    ).toBe(true);
  });
});

describe('friday_spleen side deepen', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'friday_spleen');

  it('exists as Act 1 side quest bridging home → Albert → Act 2', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('side');
    expect(quest?.act).toBe(1);
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual([
      'leave_office_dusk',
      'stand_on_balcony',
      'write_friday_poem',
      'hear_albert_bridge',
    ]);
  });

  it('is not on main quest spine (side deepen)', () => {
    expect(GOLDEN_PATH_QUEST_SPINE).not.toContain('friday_spleen');
  });

  it('friday_arrives golden path enters friday_spleen_night toward Act 2', () => {
    const node = STORY_NODES_ACT1.friday_arrives;
    const golden = node.choices.filter((c) => c.goldenPath);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('friday_spleen_night');
    expect(
      golden[0]?.effects?.some((e) => e.type === 'triggerQuest' && e.questId === 'friday_spleen'),
    ).toBe(true);
  });

  it('friday_spleen_night golden path goes to Albert bridge then Act 2', () => {
    const night = STORY_NODES_ACT1_OFFICE_AFTERMATH.friday_spleen_night;
    expect(night.choices.find((c) => c.goldenPath)?.next).toBe('cafe_albert_friday_bridge');
    const albert = STORY_NODES_ACT1_OFFICE_AFTERMATH.cafe_albert_friday_bridge;
    expect(albert.choices.find((c) => c.goldenPath)?.next).toBe('act2_transition');
    expect(
      albert.effects?.some((e) => e.type === 'setFlag' && e.flag === 'friday_albert_bridge_heard'),
    ).toBe(true);
  });

  it('story spine includes friday bridge before act2_transition', () => {
    const spine = GOLDEN_PATH_STORY_SPINE;
    const iFri = spine.indexOf('friday_arrives');
    expect(spine[iFri + 1]).toBe('friday_spleen_night');
    expect(spine[iFri + 2]).toBe('cafe_albert_friday_bridge');
    expect(spine[iFri + 3]).toBe('act2_transition');
  });
});
