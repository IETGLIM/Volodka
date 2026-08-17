import { describe, expect, it } from 'vitest';
import { GOLDEN_PATH_QUEST_SPINE, ACT_TRANSITIONS } from '@/data/goldenPath';
import { QUESTS_ACT1 } from './act1';

describe('night_city_call quest arc', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'night_city_call');

  it('exists as Act 1 main quest after first_reading', () => {
    expect(quest).toBeDefined();
    expect(quest?.questType).toBe('main');
    expect(quest?.act).toBe(1);
    expect(quest?.requiresQuests).toEqual(['first_reading']);
  });

  it('has readable location + pulse objectives', () => {
    const ids = quest?.objectives.map((o) => o.id) ?? [];
    expect(ids).toEqual(['leave_home', 'reach_street', 'enter_cafe', 'feel_city_pulse']);
    expect(quest?.objectives.find((o) => o.id === 'leave_home')?.target).toBe('volodka_corridor');
    expect(quest?.objectives.find((o) => o.id === 'reach_street')?.target).toBe('street_night');
    expect(quest?.objectives.find((o) => o.id === 'enter_cafe')?.target).toBe('cafe_evening');
    expect(quest?.objectives.find((o) => o.id === 'feel_city_pulse')?.target).toBe(
      'night_city_pulse_felt',
    );
  });

  it('sits on golden path between first_reading and maria_connection', () => {
    const spine = [...GOLDEN_PATH_QUEST_SPINE];
    const iFirst = spine.indexOf('first_reading');
    const iNight = spine.indexOf('night_city_call');
    const iMaria = spine.indexOf('maria_connection');
    expect(iNight).toBe(iFirst + 1);
    expect(iMaria).toBe(iNight + 1);

    const act1 = ACT_TRANSITIONS.find((t) => t.act === 1);
    expect(act1?.questSpineIds).toContain('night_city_call');
    const actIds = act1?.questSpineIds ?? [];
    expect(actIds.indexOf('night_city_call')).toBe(actIds.indexOf('first_reading') + 1);
  });

  it('links to street/cafe spine story nodes', () => {
    const linked = [quest?.linkedStoryNodeId, ...(quest?.linkedStoryNodeIds ?? [])].filter(Boolean);
    expect(linked).toContain('go_to_cafe');
    expect(linked).toContain('street_bench');
  });
});
