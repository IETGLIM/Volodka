import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT1_OFFICE_AFTERMATH } from '@/data/story/act1ExtendedOfficeAftermath';

describe('Act 1 office aftermath story nodes', () => {
  it('office_poem_aftermath sets guild pressure and triggers aftermath quest', () => {
    const node = STORY_NODES_ACT1_OFFICE_AFTERMATH.office_poem_aftermath;
    expect(node.sceneId).toBe('office_day');
    expect(node.effects?.some((e) => e.type === 'setFlag' && e.flag === 'guild_poem_pressure')).toBe(
      true,
    );
    expect(
      node.effects?.some((e) => e.type === 'triggerQuest' && e.questId === 'code_poem_aftermath'),
    ).toBe(true);
    expect(node.choices.find((c) => c.goldenPath)?.next).toBe('office_colleague');
  });

  it('office_colleague_vault_whisper grants vault rumor and trial', () => {
    const node = STORY_NODES_ACT1_OFFICE_AFTERMATH.office_colleague_vault_whisper;
    expect(node.effects?.some((e) => e.type === 'setFlag' && e.flag === 'vault_rumor_heard')).toBe(
      true,
    );
    expect(
      node.effects?.some((e) => e.type === 'triggerQuest' && e.questId === 'vault_backup_trial'),
    ).toBe(true);
    expect(node.choices.find((c) => c.goldenPath)?.next).toBe('balcony_thought');
  });

  it('friday_spleen_night grants poem_4 and routes through Albert', () => {
    const node = STORY_NODES_ACT1_OFFICE_AFTERMATH.friday_spleen_night;
    expect(node.effects?.some((e) => e.type === 'collectPoem' && e.poemId === 'poem_4')).toBe(true);
    expect(node.choices.find((c) => c.goldenPath)?.next).toBe('cafe_albert_friday_bridge');
  });

  it('cafe_albert_friday_bridge golden path reaches act2_transition', () => {
    const node = STORY_NODES_ACT1_OFFICE_AFTERMATH.cafe_albert_friday_bridge;
    expect(
      node.effects?.some((e) => e.type === 'setFlag' && e.flag === 'friday_albert_bridge_heard'),
    ).toBe(true);
    expect(node.choices.find((c) => c.goldenPath)?.next).toBe('act2_transition');
  });
});
