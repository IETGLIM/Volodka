import { describe, expect, it } from 'vitest';
import { GOLDEN_PATH_QUEST_SPINE, ACT_TRANSITIONS } from '@/data/goldenPath';
import { QUESTS_ACT1 } from './act1';
import { STORY_NODES_ACT1 } from '@/data/story/act1';
import { STORY_NODES_ACT1_EXTENDED } from '@/data/story/act1Extended';

describe('maria_connection quest arc', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'maria_connection');

  it('exists as Act 1 main quest after night_city_call', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('main');
    expect(quest?.act).toBe(1);
    expect(quest?.requiresQuests).toEqual(['night_city_call']);
    expect(quest?.spineOrder).toBe(3);
  });

  it('tracks meet → chip → poem with reliable flags/items', () => {
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual(['meet_maria', 'accept_chip', 'read_maria_poem']);
    expect(quest?.objectives.find((o) => o.id === 'meet_maria')?.type).toBe('flag_set');
    expect(quest?.objectives.find((o) => o.id === 'meet_maria')?.target).toBe('met_maria');
    expect(quest?.objectives.find((o) => o.id === 'accept_chip')?.target).toBe('maria_data_chip');
    expect(quest?.objectives.find((o) => o.id === 'read_maria_poem')?.target).toBe('poem_6');
  });

  it('sits on golden path between night_city_call and incident_scroll_4729', () => {
    const spine = [...GOLDEN_PATH_QUEST_SPINE];
    const iNight = spine.indexOf('night_city_call');
    const iMaria = spine.indexOf('maria_connection');
    const iIncident = spine.indexOf('incident_scroll_4729');
    expect(iMaria).toBe(iNight + 1);
    expect(iIncident).toBe(iMaria + 1);

    const act1 = ACT_TRANSITIONS.find((t) => t.act === 1);
    expect(act1?.questSpineIds).toContain('maria_connection');
  });

  it('golden path takes the chip without jumping to Act 2', () => {
    const node = STORY_NODES_ACT1.maria_curious;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('maria_chip_trust');
    expect(golden[0]?.effects?.some((e) => e.type === 'addItem' && e.itemId === 'maria_data_chip')).toBe(
      true,
    );
    expect(golden[0]?.next).not.toBe('maria_introduction');
  });

  it('chip trust beat grants poem_6 and returns to cafe spine', () => {
    const node = STORY_NODES_ACT1_EXTENDED.maria_chip_trust;
    expect(node).toBeDefined();
    expect(node.effects?.some((e) => e.type === 'collectPoem' && e.poemId === 'poem_6')).toBe(true);
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('cafe_enter');
  });

  it('rewards mark maria_connection_done for spine reconcile', () => {
    expect(
      quest?.rewards?.some((r) => r.type === 'setFlag' && r.flag === 'maria_connection_done'),
    ).toBe(true);
  });
});

describe('cafe_street_whisper side bridge', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'cafe_street_whisper');

  it('exists as Act 1 side quest after first_reading', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('side');
    expect(quest?.requiresQuests).toEqual(['first_reading']);
  });

  it('tracks barista tip then alley silhouette', () => {
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual(['ask_barista_tip', 'spot_alley_silhouette']);
    expect(quest?.objectives.find((o) => o.id === 'ask_barista_tip')?.target).toBe(
      'barista_maria_hint',
    );
    expect(quest?.objectives.find((o) => o.id === 'spot_alley_silhouette')?.target).toBe(
      'spotted_maria',
    );
  });

  it('is not on golden path quest spine (HUD stays on main)', () => {
    expect(GOLDEN_PATH_QUEST_SPINE).not.toContain('cafe_street_whisper');
  });
});
