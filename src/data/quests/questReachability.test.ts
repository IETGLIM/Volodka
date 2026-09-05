import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { DIALOGUE_NODES } from '@/data/dialogue';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';
import { NPC_SCHEDULES_MAP } from '@/data/npcSchedules';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { computeQuestReachability } from '@/shared/validation/questReachability';

/**
 * Регрессионный тест достижимости квестов (v4.8.9).
 *
 * До фикса 15 квестов из пак-ов «Уличные легенды», «Голоса Пирса» и
 * связанные с ними цепочки (night_shift, rusty_keys, watchers_shadow,
 * dying_poet_last_letter, act1_albert_alliance, act2_archive_seven) не
 * имели НИ ОДНОГО пути активации: triggerQuest существовал только внутри
 * их собственных story-нод, в которые нельзя было попасть из игры.
 *
 * Аналогичный CLI: scripts/analyze-quest-reachability.ts
 */
function computeUnreachable(): readonly string[] {
  return computeQuestReachability({
    quests: QUEST_DEFINITIONS,
    storyNodes: STORY_NODES as never,
    dialogueNodes: DIALOGUE_NODES as never,
    zones: TRIGGER_ZONES,
    hubIds: SCENE_EXPLORE_HUB_DEFS.map((d) => d.hubId),
    npcDefinitions: ALL_NPC_DEFINITIONS,
    scheduledNpcIds: new Set(Object.keys(NPC_SCHEDULES_MAP)),
    prologueNodeId: 'start',
    cinematicQuestIds: ['first_reading', 'morning_sync'],
  }).unreachableIds;
}

describe('questReachability — квесты должны быть запускаемыми из игры (v4.8.9)', () => {
  it('пак «Уличные легенды» (sl_*) достижим целиком', () => {
    const unreachable = computeUnreachable();
    const sl = QUEST_DEFINITIONS.filter((q) => q.id.startsWith('sl_')).map((q) => q.id);
    expect(sl.length).toBeGreaterThanOrEqual(5);
    const dead = sl.filter((id) => unreachable.includes(id));
    expect(dead, 'недостижимые квесты «Уличных легенд»').toEqual([]);
  });

  it('пак «Голоса Пирса» (pv_*) достижим целиком', () => {
    const unreachable = computeUnreachable();
    const pv = QUEST_DEFINITIONS.filter((q) => q.id.startsWith('pv_')).map((q) => q.id);
    expect(pv.length).toBeGreaterThanOrEqual(5);
    const dead = pv.filter((id) => unreachable.includes(id));
    expect(dead, 'недостижимые квесты «Голосов Пирса»').toEqual([]);
  });

  it('цепочки, зависящие от новых расписаний NPC, достижимы', () => {
    const unreachable = computeUnreachable();
    for (const id of ['night_shift', 'rusty_keys', 'dying_poet_last_letter']) {
      expect(unreachable, `${id} не должен быть недостижим`).not.toContain(id);
    }
    // FIX (v4.9.0): surveillance_contact получил greeting-узел + расписание —
    // watchers_shadow больше не в бэклоге.
    expect(unreachable).not.toContain('watchers_shadow');
  });

  it('AAA-пак (aaa_*) достижим целиком (v4.9.0)', () => {
    const unreachable = computeUnreachable();
    const aaa = QUEST_DEFINITIONS.filter((q) => q.id.startsWith('aaa_')).map((q) => q.id);
    expect(aaa.length).toBeGreaterThanOrEqual(8);
    const dead = aaa.filter((id) => unreachable.includes(id));
    expect(dead, 'недостижимые квесты AAA-пака').toEqual([]);
  });

  it('одиночные квесты актов 3–4 достижимы через гиверов-заглушек (v4.9.0)', () => {
    const unreachable = computeUnreachable();
    for (const id of [
      'lost_shipment',
      'blacksmith_special',
      'guard_bribe_evidence',
      'last_wish',
      'poetry_duelist',
      'forgotten_archive',
      'bunker_signal',
      'trade_route',
      'catacombs_shadows',
      'whisper_of_walls',
      'factory_secret_blueprint',
      'catastrophe_echo',
      'factory_lost_engineer',
      'library_banned_book',
      'poetry_broadcast',
      'solnysh_roof_wine',
      'solnysh_relocation',
      'quest_act4_rooftop_broadcast_setup',
      'quest_act4_street_samizdat',
    ]) {
      expect(unreachable, `${id} не должен быть недостижим`).not.toContain(id);
    }
  });

  it('гиверы пак-ов присутствуют в сценах (есть расписание)', () => {
    for (const npcId of ['marina', 'factory_foreman', 'marat_echo']) {
      expect(NPC_SCHEDULES_MAP[npcId], `расписание ${npcId}`).toBeDefined();
    }
  });

  it('цели npc_talked пак-ов присутствуют в реестре NPC', () => {
    const npcIds = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
    for (const npcId of ['marina', 'factory_foreman', 'marat_echo', 'baba_zina', 'fisherman_trofim', 'chk_ritka']) {
      expect(npcIds.has(npcId), `NPC ${npcId}`).toBe(true);
    }
  });

  it('общее число недостижимых квестов равно нулю — все 147 квестов достижимы (v4.10.0)', () => {
    const unreachable = computeUnreachable();
    // FIX (v4.10.0): бейзлайн 2 → 0. Последние два квеста (dreamworld_lost_child,
    // void_echo_poem) получил контент-пак «Мир Снов» — хуки активации в
    // vladimir_secret_room_read (triggerQuest + флаги-гейты dream_world_opened /
    // void_echo_quest_started), зоны-сеттеры целей в triggerZones.ts.
    expect(
      unreachable,
      `недостижимые квесты (${unreachable.length}) — новый квест без пути активации: ${unreachable.join(', ')}`,
    ).toEqual([]);
  });

  it('каждый квест реестра активируем (полный перебор, v4.10.0)', () => {
    const unreachable = new Set(computeUnreachable());
    const total = QUEST_DEFINITIONS.length;
    expect(total).toBeGreaterThanOrEqual(147);
    const dead = QUEST_DEFINITIONS.filter((q) => unreachable.has(q.id)).map((q) => q.id);
    expect(dead, `недостижимо ${dead.length} из ${total}`).toEqual([]);
  });
});
