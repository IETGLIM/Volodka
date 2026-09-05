import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { ACT5_DREAM_WORLD_STORY_NODES } from './act5DreamWorld';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import { STANDALONE_STORY_SATELLITE_ORDER } from '@/data/narrative/narrativePackRegistry';

/**
 * Контент-пак «Мир Снов» (v4.10.0) — закрывает последние два недостижимых
 * квеста: dreamworld_lost_child и void_echo_poem.
 *
 * Ключевые инварианты:
 *  - ГЕЙТЫ ПОСЛЕ АКТИВАЦИИ: каждая зона-сеттер целей гейтится requiredFlag,
 *    выставляемым одновременно с triggerQuest (dream_world_opened /
 *    void_echo_quest_started) — см. vladimir_secret_room_read.
 *  - Сеттеры целей: у каждой цели обоих квестов есть источник в данных
 *    (зона/узел/ретроактивный добор poem_32).
 *  - Регистрация: пак слит в buildStoryNodes() и объявлен сателлитом
 *    (STANDALONE_STORY_SATELLITE_ORDER) — иначе ensureStoryNode бросит
 *    «not found» в рантайме (урок v4.8.9).
 */
const DREAM_QUEST_ID = 'dreamworld_lost_child';
const VOID_QUEST_ID = 'void_echo_poem';
const NODE_IDS = Object.keys(ACT5_DREAM_WORLD_STORY_NODES);

const zoneById = (id: string) => TRIGGER_ZONES.find((z) => z.id === id);

function objectiveTarget(questId: string, objectiveId: string): { type: string; target: string } {
  const quest = QUEST_DEFINITIONS.find((q) => q.id === questId);
  expect(quest, `квест ${questId}`).toBeTruthy();
  const objective = quest!.objectives.find((o) => o.id === objectiveId);
  expect(objective, `${questId}: цель ${objectiveId}`).toBeTruthy();
  return { type: objective!.type, target: objective!.target ?? '' };
}

describe('act5DreamWorld — пак «Мир Снов» (v4.10.0)', () => {
  it('11 узлов пака существуют и зарегистрированы в STORY_NODES', () => {
    expect(NODE_IDS).toHaveLength(11);
    for (const id of NODE_IDS) {
      expect(STORY_NODES[id], `узел ${id} не слит в buildStoryNodes()`).toBeTruthy();
    }
  });

  it('пак объявлен сателлитом в реестре повествования (act5DreamWorld)', () => {
    expect(STANDALONE_STORY_SATELLITE_ORDER).toContain('act5DreamWorld');
  });

  it('узлы сцены валидны и текст русский', () => {
    const cyrillic = /[А-Яа-яЁё]/;
    for (const node of Object.values(ACT5_DREAM_WORLD_STORY_NODES)) {
      expect(SCENE_IDS).toContain(node.sceneId as never);
      expect(node.text.length, node.id).toBeGreaterThan(40);
      expect(cyrillic.test(node.text), `${node.id}: текст не русский`).toBe(true);
    }
  });

  it('хуки активации: triggerQuest + флаг-гейт в одном выборе (инвариант гейтов)', () => {
    const read = STORY_NODES['vladimir_secret_room_read'];
    expect(read, 'узел vladimir_secret_room_read').toBeTruthy();

    const dreamChoice = read.choices.find((c) =>
      (c.effects ?? []).some((fx) => fx.type === 'triggerQuest' && fx.questId === DREAM_QUEST_ID),
    );
    expect(dreamChoice, 'хук активации dreamworld_lost_child').toBeTruthy();
    expect(
      dreamChoice!.effects!.some((fx) => fx.type === 'setFlag' && fx.flag === 'dream_world_opened'),
      'dream_world_opened выставляется одновременно с активацией',
    ).toBe(true);

    const voidChoice = read.choices.find((c) =>
      (c.effects ?? []).some((fx) => fx.type === 'triggerQuest' && fx.questId === VOID_QUEST_ID),
    );
    expect(voidChoice, 'хук активации void_echo_poem').toBeTruthy();
    expect(
      voidChoice!.effects!.some((fx) => fx.type === 'setFlag' && fx.flag === 'void_echo_quest_started'),
      'void_echo_quest_started выставляется одновременно с активацией',
    ).toBe(true);
  });

  it('зоны сна: фонарь, три воспоминания, край сна — в sleep_dream с координатами', () => {
    const expected: Array<[string, number, number]> = [
      ['dream_lantern', 0, 3],
      ['dream_memory_mother', -3, 2],
      ['dream_memory_school', 3, 2],
      ['dream_memory_poems', 0, -3],
      ['dream_child_edge', 0, 5],
      ['void_poet_edge', -4.5, -6.5],
    ];
    for (const [id, x, z] of expected) {
      const zone = zoneById(id);
      expect(zone, `зона ${id}`).toBeTruthy();
      expect(zone!.sceneId, `${id}: сцена`).toBe('sleep_dream');
      expect(zone!.position[0], `${id}: x`).toBe(x);
      expect(zone!.position[2], `${id}: z`).toBe(z);
      expect(zone!.requiredFlag, `${id}: гейт`).toBeTruthy();
    }
  });

  it('все детские зоны гейтятся dream_world_opened — флаг после активации', () => {
    const dreamZones = TRIGGER_ZONES.filter(
      (z) => z.sceneId === 'sleep_dream' && z.linkedQuestId === DREAM_QUEST_ID,
    );
    expect(dreamZones.length).toBeGreaterThanOrEqual(5);
    for (const zone of dreamZones) {
      expect(zone.requiredFlag, `${zone.id}: requiredFlag`).toBe('dream_world_opened');
    }
  });

  it('зоны воспоминаний выдают точные предметы целей квеста', () => {
    for (const [zoneId, objectiveId] of [
      ['dream_memory_mother', 'recover_first_memory'],
      ['dream_memory_school', 'recover_second_memory'],
      ['dream_memory_poems', 'recover_third_memory'],
    ] as const) {
      const { type, target } = objectiveTarget(DREAM_QUEST_ID, objectiveId);
      expect(type).toBe('item_collected');
      const zone = zoneById(zoneId)!;
      expect(
        zone.effects!.some((fx) => fx.type === 'addItem' && fx.itemId === target),
        `${zoneId}: выдаёт ${target}`,
      ).toBe(true);
    }
  });

  it('зона поэта гейтится void_echo_quest_started; эха — в яви с кумулятивным гейтом', () => {
    const poet = zoneById('void_poet_edge')!;
    expect(poet.requiredFlag).toBe('void_echo_quest_started');
    expect(poet.linkedStoryNodeId).toBe('void_poet_gate');
    expect(poet.hiddenWhenFlag, 'поэт скрывается после встречи (void_poet_met)').toBe('void_poet_met');

    const echoes: Array<[string, string, string]> = [
      ['void_echo_river_pier', 'river_pier', 'void_echo_river'],
      ['void_echo_rooftop', 'rooftop_edge', 'void_echo_roof'],
      ['void_echo_library_shelf', 'library_day', 'void_echo_library'],
    ];
    for (const [zoneId, sceneId, flag] of echoes) {
      const zone = zoneById(zoneId);
      expect(zone, `зона ${zoneId}`).toBeTruthy();
      expect(zone!.sceneId).toBe(sceneId);
      expect(zone!.requiredFlag, `${zoneId}: гейт`).toBe('void_echo_quest_started');
      expect(
        zone!.effects!.some((fx) => fx.type === 'setFlag' && fx.flag === flag),
        `${zoneId}: setFlag ${flag}`,
      ).toBe(true);
    }
  });

  it('выбор «Ответить на эхо» требует кумулятивный флаг void_echo_all_heard', () => {
    const gate = STORY_NODES['void_poet_gate'];
    expect(gate).toBeTruthy();
    const answer = gate.choices.find((c) => c.next === 'void_poet_meet');
    expect(answer, 'выбор «Ответить на эхо»').toBeTruthy();
    expect(answer!.condition?.flag).toBe('void_echo_all_heard');
    // void_poet_met достижим только через «Ответить на эхо» — добор не нужен:
    // узел void_poet_meet выдаёт poem_32 (collectPoem) и флаг void_poet_met.
    const meet = STORY_NODES['void_poet_meet'];
    expect(meet.effects?.some((fx) => fx.type === 'collectPoem' && fx.poemId === 'poem_32')).toBe(true);
    expect(meet.effects?.some((fx) => fx.type === 'setFlag' && fx.flag === 'void_poet_met')).toBe(true);
  });

  it('повторная дверь в сон: тетрадь в библиотеке ведёт в сон и обратно', () => {
    const notebook = zoneById('library_dream_notebook');
    expect(notebook, 'зона library_dream_notebook').toBeTruthy();
    expect(notebook!.sceneId).toBe('library_day');
    expect(notebook!.linkedStoryNodeId).toBe('act5_dream_descent');
    expect(notebook!.requiredFlag).toBe('dream_world_opened');
    // Шаг в сон — transitionScene в sleep_dream; выход из сна — exit сцены в volodka_room.
    const descent = STORY_NODES['act5_dream_descent'];
    const intoDream = descent.choices.find((c) =>
      (c.effects ?? []).some((fx) => fx.type === 'transitionScene' && fx.sceneId === 'sleep_dream'),
    );
    expect(intoDream, 'act5_dream_descent уводит в sleep_dream').toBeTruthy();
    const guided = STORY_NODES['dream_child_guided'];
    const wake = guided.choices.find((c) =>
      (c.effects ?? []).some((fx) => fx.type === 'transitionScene' && fx.sceneId === 'volodka_room'),
    );
    expect(wake, 'выход из сна ведёт в volodka_room').toBeTruthy();
  });

  it('цели обоих квестов имеют сеттеры в данных (полная сверка)', () => {
    const setterFlags = new Set<string>();
    const setterItems = new Set<string>();
    for (const zone of TRIGGER_ZONES) {
      for (const fx of zone.effects ?? []) {
        if (fx.type === 'setFlag' && fx.flag) setterFlags.add(fx.flag);
        if (fx.type === 'addItem' && fx.itemId) setterItems.add(fx.itemId);
      }
    }
    for (const node of Object.values(STORY_NODES)) {
      const visit = node.effects ?? [];
      const choices = node.choices ?? [];
      for (const fx of [...visit, ...choices.flatMap((c) => c.effects ?? [])]) {
        if (fx.type === 'setFlag' && fx.flag) setterFlags.add(fx.flag);
        if (fx.type === 'addItem' && fx.itemId) setterItems.add(fx.itemId);
      }
    }

    const dream = QUEST_DEFINITIONS.find((q) => q.id === DREAM_QUEST_ID)!;
    for (const objective of dream.objectives) {
      if (objective.type === 'flag_set') {
        expect(setterFlags.has(objective.target!), `${objective.id}: сеттер ${objective.target}`).toBe(true);
      }
      if (objective.type === 'item_collected') {
        expect(setterItems.has(objective.target!), `${objective.id}: сеттер ${objective.target}`).toBe(true);
      }
    }

    const voidQuest = QUEST_DEFINITIONS.find((q) => q.id === VOID_QUEST_ID)!;
    for (const objective of voidQuest.objectives) {
      if (objective.type === 'flag_set') {
        expect(setterFlags.has(objective.target!), `${objective.id}: сеттер ${objective.target}`).toBe(true);
      }
      if (objective.type === 'poem_collected') {
        // poem_32 может быть собран в акте 1 — ретроактивный добор делает
        // QuestTracker.retroactiveCheck (подписан на quest:accepted).
        expect(setterFlags.has('void_poet_met'), `${objective.id}: узел void_poet_meet доступен`).toBe(true);
      }
    }
  });
});
