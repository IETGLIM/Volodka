import { describe, expect, it } from 'vitest';
import { GOLDEN_PATH_QUEST_SPINE, ACT_TRANSITIONS, GOLDEN_PATH_STORY_SPINE } from '@/data/goldenPath';
import { QUESTS_ACT1 } from './act1';
import { STORY_NODES_ACT1 } from '@/data/story/act1';
import { STORY_NODES_ACT1_EXTENDED } from '@/data/story/act1Extended';
import { STORY_NODES_ACT1_CAFE_OFFICE } from '@/data/story/act1ExtendedCafeOffice';

describe('chip_cafe_clearance quest arc', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'chip_cafe_clearance');

  it('exists as Act 1 main quest after maria_connection', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('main');
    expect(quest?.act).toBe(1);
    expect(quest?.requiresQuests).toEqual(['maria_connection']);
    expect(quest?.spineOrder).toBe(4);
  });

  it('tracks cafe return → barista echo → summons → lobby', () => {
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual([
      'return_cafe_with_chip',
      'barista_hears_echo',
      'receive_guild_summons',
      'reach_guild_lobby',
    ]);
    expect(quest?.objectives.find((o) => o.id === 'return_cafe_with_chip')?.target).toBe(
      'chip_cafe_returned',
    );
    expect(quest?.objectives.find((o) => o.id === 'barista_hears_echo')?.target).toBe(
      'barista_chip_resonance',
    );
    expect(quest?.objectives.find((o) => o.id === 'receive_guild_summons')?.target).toBe(
      'guild_summons_received',
    );
    expect(quest?.objectives.find((o) => o.id === 'reach_guild_lobby')?.target).toBe('office_day');
  });

  it('sits on golden path between maria_connection and incident_scroll_4729', () => {
    const spine = [...GOLDEN_PATH_QUEST_SPINE];
    expect(spine.indexOf('chip_cafe_clearance')).toBe(spine.indexOf('maria_connection') + 1);
    expect(spine.indexOf('incident_scroll_4729')).toBe(spine.indexOf('chip_cafe_clearance') + 1);

    const act1 = ACT_TRANSITIONS.find((t) => t.act === 1);
    expect(act1?.questSpineIds).toContain('chip_cafe_clearance');
  });

  it('story spine threads cafe resonance → clearance → lobby before Alexander', () => {
    const spine = GOLDEN_PATH_STORY_SPINE;
    const iBarista = spine.indexOf('cafe_barista');
    expect(spine[iBarista + 1]).toBe('cafe_chip_resonance');
    expect(spine[iBarista + 2]).toBe('cafe_guild_clearance');
    expect(spine[iBarista + 3]).toBe('office_lobby_arrival');
    expect(spine[iBarista + 4]).toBe('office_alexander');
    expect(spine).toContain('maria_chip_trust');
  });

  it('maria_chip_trust triggers clearance and marks cafe return on golden choice', () => {
    const node = STORY_NODES_ACT1_EXTENDED.maria_chip_trust;
    expect(node.effects?.some((e) => e.type === 'triggerQuest' && e.questId === 'chip_cafe_clearance')).toBe(
      true,
    );
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden[0]?.effects?.some((e) => e.type === 'setFlag' && e.flag === 'chip_cafe_returned')).toBe(
      true,
    );
  });

  it('cafe_barista golden path enters chip resonance', () => {
    const node = STORY_NODES_ACT1.cafe_barista;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('cafe_chip_resonance');
  });

  it('cafe → clearance → lobby golden chain reaches Alexander without soft-lock', () => {
    const resonance = STORY_NODES_ACT1_CAFE_OFFICE.cafe_chip_resonance;
    const clearance = STORY_NODES_ACT1_CAFE_OFFICE.cafe_guild_clearance;
    const lobby = STORY_NODES_ACT1_CAFE_OFFICE.office_lobby_arrival;

    expect(resonance.choices.find((c) => c.goldenPath)?.next).toBe('cafe_guild_clearance');
    expect(clearance.choices.find((c) => c.goldenPath)?.next).toBe('office_lobby_arrival');
    expect(lobby.choices.find((c) => c.goldenPath)?.next).toBe('office_alexander');

    expect(lobby.effects?.some((e) => e.type === 'setFlag' && e.flag === 'guild_summons_received')).toBe(
      true,
    );
    expect(lobby.effects?.some((e) => e.type === 'triggerQuest' && e.questId === 'incident_scroll_4729')).toBe(
      true,
    );
  });

  it('rewards mark chip_cafe_clearance_done and unlock incident', () => {
    expect(
      quest?.rewards?.some((r) => r.type === 'setFlag' && r.flag === 'chip_cafe_clearance_done'),
    ).toBe(true);
    expect(
      quest?.rewards?.some((r) => r.type === 'triggerQuest' && r.questId === 'incident_scroll_4729'),
    ).toBe(true);
  });
});

describe('office_lobby_watch side deepen', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'office_lobby_watch');

  it('exists as Act 1 side quest after maria_connection', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('side');
    expect(quest?.requiresQuests).toEqual(['maria_connection']);
  });

  it('tracks warmth → bulletin → colleague glance', () => {
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual(['feel_chip_warmth', 'read_incident_bulletin', 'notice_colleague_watch']);
  });

  it('is not on golden path quest spine', () => {
    expect(GOLDEN_PATH_QUEST_SPINE).not.toContain('office_lobby_watch');
  });

  it('incident requires clearance so spine stays ordered', () => {
    const incident = QUESTS_ACT1.find((q) => q.id === 'incident_scroll_4729');
    expect(incident?.requiresQuests).toEqual(['chip_cafe_clearance']);
    expect(incident?.spineOrder).toBe(5);
  });
});
