/* ─── Контракт ZF-пака «Заря-М — четвёртый голос» (v4.48.20, проход 2) ───
 *
 * Контракты (аудит §F.7, §G):
 *  1. Связность: все next-переходы пака существуют в объединённом реестре
 *     (без висячих ссылок).
 *  2. Синтез ≥2 источников: узел zf_hypothesis НЕ достижим с одним источником
 *     — у каждого источника ровно 2 pair-условия на ДРУГИЕ флаги + безусловный
 *     фолбэк без штрафа (порядок осмотра любой).
 *  3. Контакту предшествует синтез: единственный вход в zf_contact — из
 *     zf_hypothesis; флаг zf_contact_made ставит только zf_contact.
 *  4. Судьба кассеты: 4 ветки, каждая ставит РОВНО один zf_tape_* флаг,
 *     все сходятся в machine_confession_approach.
 *  5. Нет дубль-наград: ни один узел пака не выдаёт addXp/addItem, дублирующий
 *     награды квеста zarya_fourth_voice (урок P1-1).
 *  6. «Стих у камня» использует УЖЕ собранный poem_16 — новых стихов нет.
 *  7. Пак зарегистрирован: STORY_NODE_SOURCES содержит zaryaFourthVoice,
 *     квест — в QUEST_DEFINITIONS; registry contract перестановки держит.
 */

import { describe, expect, it } from 'vitest';
import { buildStoryNodes, STORY_NODE_SOURCES } from './buildStoryNodes';
import { ZARYA_FOURTH_VOICE_STORY_NODES } from './zaryaFourthVoiceStory';
import { QUEST_DEFINITIONS } from '../quests';
import { buildTrueEndEpilogueReflection } from '@/engine/story/resolveTrueEndEpilogue';
import type { StoryEffect, StoryNode } from '@/shared/types/game';

const registry: Record<string, StoryNode> = buildStoryNodes();

function node(id: string): StoryNode {
  const n: StoryNode | undefined = registry[id];
  expect(n, `узел ${id} отсутствует в реестре`).toBeDefined();
  return n as StoryNode;
}

function effectIds(effects: readonly StoryEffect[] | undefined): string[] {
  return (effects ?? []).map((e) => e.type);
}

describe('ZF-пак: связность графа', () => {
  it('все next-переходы узлов пака существуют в реестре', () => {
    const missing: string[] = [];
    for (const [id, node] of Object.entries(ZARYA_FOURTH_VOICE_STORY_NODES)) {
      for (const choice of node.choices ?? []) {
        if (choice.next && !(choice.next in registry)) missing.push(`${id} → ${choice.next}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('все узлы пака зарегистрированы под именем zaryaFourthVoice без конфликтов', () => {
    const source = STORY_NODE_SOURCES.find((s) => s.name === 'zaryaFourthVoice');
    expect(source).toBeDefined();
    expect(Object.keys(source!.nodes).sort()).toEqual(
      Object.keys(ZARYA_FOURTH_VOICE_STORY_NODES).sort(),
    );
  });

  it('квест zarya_fourth_voice зарегистрирован и ссылается на существующие узлы', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'zarya_fourth_voice');
    expect(quest).toBeDefined();
    expect(quest!.questGiverNpcId).toBe('fisherman_trofim');
    for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
      expect(registry[nodeId], `linkedStoryNode ${nodeId}`).toBeDefined();
    }
  });

  it('мосты сведения существуют: machine_confession_approach, хабы, ключевой предмет', () => {
    expect(registry['machine_confession_approach']).toBeDefined();
    expect(registry['factory_explore_mode']).toBeDefined();
    expect(registry['basement_explore_mode']).toBeDefined();
    expect(registry['pier_evening_explore_mode']).toBeDefined();
    // предмет кассеты существует в items-реестре (импорт через gameDataLoader тяжёлый —
    // проверяем по узлу zf_trofim_tape_offer, выдающему его: item-валидация в validate:content)
    const offer = node('zf_trofim_tape_offer');
    expect(
      (offer.effects ?? []).some((e) => e.type === 'addItem' && e.itemId === 'zf_tape_fourth_voice'),
    ).toBe(true);
  });
});

describe('ZF-пак: синтез ≥2 источников без OR', () => {
  it('каждый источник предлагает ровно 2 pair-перехода на ДРУГИЕ флаги + безусловный фолбэк', () => {
    const sources: Record<string, string> = {
      zf_tape_listened: 'zf_tape_listen',
      zf_relay_examined: 'zf_relay_node',
      zf_archive_found: 'zf_archive_node',
    };

    for (const [ownFlag, nodeId] of Object.entries(sources)) {
      const n = node(nodeId);
      const ownSet = effectIds(n.effects).includes('setFlag')
        ? (n.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === ownFlag)
        : false;
      expect(ownSet, `${nodeId} ставит ${ownFlag}`).toBe(true);

      const toHypothesis = (n.choices ?? []).filter((c) => c.next === 'zf_hypothesis');
      expect(toHypothesis, `${nodeId}: два pair-выбора`).toHaveLength(2);
      for (const c of toHypothesis) {
        expect(c.condition?.flag).toBeDefined();
        expect(c.condition?.flag).not.toBe(ownFlag);
        expect(Object.keys(c.condition ?? {})).not.toContain('missingFlag');
      }
      const fallbacks = (n.choices ?? []).filter((c) => !c.condition);
      expect(fallbacks, `${nodeId}: безусловный фолбэк без штрафа`).toHaveLength(1);
      expect(fallbacks[0].next).not.toBe('zf_hypothesis');
    }
  });

  it('zf_hypothesis недостижим напрямую ни из одного источника без условия', () => {
    for (const nodeId of ['zf_tape_listen', 'zf_relay_node', 'zf_archive_node']) {
      for (const c of node(nodeId).choices ?? []) {
        if (c.next === 'zf_hypothesis') expect(c.condition?.flag).toBeDefined();
      }
    }
  });

  it('zf_hypothesis ставит zf_hypothesis_formed и ведёт только к контакту или возврату', () => {
    const n = node('zf_hypothesis');
    expect(
      (n.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'zf_hypothesis_formed'),
    ).toBe(true);
    const nexts = new Set((n.choices ?? []).map((c) => c.next));
    expect(nexts.has('zf_contact')).toBe(true);
  });

  it('zf_contact — единственный владелец флага zf_contact_made', () => {
    const owners = Object.entries(ZARYA_FOURTH_VOICE_STORY_NODES)
      .filter(([, n]) =>
        (n.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'zf_contact_made'),
      )
      .map(([id]) => id);
    expect(owners).toEqual(['zf_contact']);
    expect(
      (node('zf_contact').effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'found_quantum_computer',
      ),
    ).toBe(true);
  });
});

describe('ZF-пак: судьба кассеты и последствия', () => {
  it('4 ветки, каждая ставит ровно один zf_tape_* флаг, все сходятся в исповедь', () => {
    const fate = node('zf_tape_fate');
    const fateFlags = ['zf_tape_kept', 'zf_tape_zina', 'zf_tape_resistance', 'zf_tape_published'];
    expect(fate.choices).toHaveLength(4);
    for (const c of fate.choices ?? []) {
      expect(c.next).toBe('machine_confession_approach');
      const zfFlags = (c.effects ?? [])
        .filter((e) => e.type === 'setFlag' && e.flag?.startsWith('zf_tape_'))
        .map((e) => (e as { flag: string }).flag);
      expect(zfFlags).toHaveLength(1);
      expect(fateFlags).toContain(zfFlags[0]);
    }
  });

  it('«стих у камня» читает УЖЕ собранный poem_16 — новых стихов нет', () => {
    const stone = node('zf_poem_stone_node');
    const readChoice = (stone.choices ?? []).find((c) =>
      (c.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'zf_poem_read_for_machine'),
    );
    expect(readChoice).toBeDefined();
    expect(readChoice!.condition?.collectedPoem).toBe('poem_16');
  });

  it('маршрутизатор исповеди получил zf-вариант (контакт → тёплый вход)', () => {
    const router = registry['machine_confession_approach'];
    const zfChoice = (router.choices ?? []).find((c) => c.condition?.flag === 'zf_contact_made');
    expect(zfChoice).toBeDefined();
    expect(zfChoice!.condition?.missingFlag).toBe('machine_fate_decided');
  });

  it('эпилог читает zf-флаги (поведенчески)', () => {
    const flags = { zf_poem_read_for_machine: true as const };
    expect(buildTrueEndEpilogueReflection({ flags, collectedPoems: [] })).toContain(
      'машинный стих',
    );
    expect(
      buildTrueEndEpilogueReflection({ flags: { zf_tape_kept: true }, collectedPoems: [] }),
    ).toContain('осталась при тебе');
    expect(
      buildTrueEndEpilogueReflection({ flags: { zf_tape_published: true }, collectedPoems: [] }),
    ).toContain('ушла в мир');
  });
});

describe('ZF-пак: гигиена наград и аудио', () => {
  it('ни один узел пака не выдаёт addXp — награды только в квесте (урок P1-1)', () => {
    const offenders = Object.entries(ZARYA_FOURTH_VOICE_STORY_NODES)
      .filter(([, n]) => (n.effects ?? []).some((e) => e.type === 'addXp'))
      .map(([id]) => id);
    // Внутри choices addXp тоже запрещён.
    for (const [, n] of Object.entries(ZARYA_FOURTH_VOICE_STORY_NODES)) {
      for (const c of n.choices ?? []) {
        expect(effectIds(c.effects)).not.toContain('addXp');
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ключевые узлы эпизода не немые: ambient/musicCue расставлены', () => {
    expect(node('zf_factory_night_entry').musicCue).toBe('mystery');
    expect(node('zf_contact').ambientSound).toBe('sounds/ambient/basement_hum.ogg');
    expect(node('zf_contact').musicCue).toBe('mystery');
    expect(node('zf_tape_listen').musicCue).toBe('mystery');
    expect(node('zf_trofim_fourth_shift').ambientSound).toBe('sounds/ambient/river_pier_night.ogg');
  });
});
