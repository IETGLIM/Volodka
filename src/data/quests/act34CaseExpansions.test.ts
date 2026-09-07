import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { ACT34_CASE_EXPANSION_STORY_NODES } from '@/data/story/act34CaseExpansions';
import { STORY_NODES } from '@/data/story';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import type { StoryNode } from '@/shared/types/game';

/**
 * Инварианты многобитовых кейсов Acts 3–4 (v4.17.0).
 *
 * Канон — act1ThinStubs.test.ts: кейс-квест получает 6+ объективов,
 * бит-цепочку (choices[].next сшиты), contextNote на каждом узле (a11y
 * бейзлайн актов 3–4), сеттеры для всех флаг-объективов и входы из хабов.
 */

const CASE_QUEST_IDS = ['roof_of_the_world', 'vault_defense', 'maria_truth', 'thread_of_18_lines'] as const;

const CASE_NODE_IDS: ReadonlySet<string> = new Set(Object.keys(ACT34_CASE_EXPANSION_STORY_NODES));

function getQuest(id: string) {
  return QUEST_DEFINITIONS.find((q) => q.id === id);
}

describe('act34CaseExpansions — многобитовые кейсы Acts 3–4 (v4.17.0)', () => {
  it('четыре кейса получили плотность: ≥7 объективов у каждого', () => {
    for (const id of CASE_QUEST_IDS) {
      const quest = getQuest(id);
      expect(quest, `квест ${id}`).toBeDefined();
      expect(
        quest!.objectives.length,
        `${id}: минимум 7 объективов (было 3–4)`,
      ).toBeGreaterThanOrEqual(7);
    }
  });

  it('все новые флаг-объективы кейсов имеют сеттеры в паке', () => {
    const packSetters = new Set<string>();
    for (const node of Object.values(ACT34_CASE_EXPANSION_STORY_NODES)) {
      for (const fx of node.effects ?? []) {
        if (fx.type === 'setFlag' && fx.flag) packSetters.add(fx.flag);
      }
      for (const choice of node.choices ?? []) {
        for (const fx of choice.effects ?? []) {
          if (fx.type === 'setFlag' && fx.flag) packSetters.add(fx.flag);
        }
      }
    }
    for (const id of CASE_QUEST_IDS) {
      const quest = getQuest(id)!;
      const newFlags = quest.objectives
        .filter((o) => o.type === 'flag_set')
        .map((o) => o.target as string)
        .filter((f) => packSetters.has(f));
      expect(newFlags.length, `${id}: новые флаг-объективы из пака`).toBeGreaterThanOrEqual(3);
    }
  });

  it('ключ записи == node.id; каждый узел реестров и с contextNote', () => {
    for (const [key, node] of Object.entries(ACT34_CASE_EXPANSION_STORY_NODES)) {
      expect(node.id, `ключ ${key}`).toBe(key);
      expect(node.contextNote, `${key}: contextNote обязателен (a11y актов 3–4)`).toBeTruthy();
      expect(node.accessibilityAnnounce, `${key}: accessibilityAnnounce`).toBeTruthy();
      expect(node.choices.length, `${key}: минимум один выбор`).toBeGreaterThan(0);
    }
  });

  it('choice.next узлов пака резолвится в глобальном реестре STORY_NODES', () => {
    for (const [key, node] of Object.entries(ACT34_CASE_EXPANSION_STORY_NODES)) {
      for (const choice of node.choices) {
        if (!choice.next) continue;
        expect(
          STORY_NODES[choice.next],
          `${key}.choices → «${choice.next}» должен существовать в STORY_NODES`,
        ).toBeDefined();
      }
    }
  });

  it('бит-цепочки сшиты: прямые (roof/vault) ведут узел N → узел N+1', () => {
    const chains: Record<string, string[]> = {
      roof: [
        'roof_stairwell_watch',
        'roof_guard_parley',
        'roof_antenna_field',
        'roof_alexander_silence',
        'roof_alexander_past',
      ],
      vault: [
        'vault_war_council',
        'vault_defenders_briefing',
        'vault_firewall_weave',
        'vault_breach_wave',
        'vault_last_wave_hymn',
      ],
    };
    for (const [chainName, ids] of Object.entries(chains)) {
      for (let i = 0; i + 1 < ids.length; i += 1) {
        const node = ACT34_CASE_EXPANSION_STORY_NODES[ids[i]];
        const nexts = (node.choices ?? []).map((c) => c.next);
        expect(
          nexts,
          `${chainName}: «${ids[i]}» должен вести в «${ids[i + 1]}»`,
        ).toContain(ids[i + 1]);
      }
    }
  });

  it('все узлы пака достижимы из хабов (BFS: STORY_NODES + trigger-зоны)', () => {
    // Хабы — точки, в которые игрок возвращается постоянно; если узел достижим
    // из хаба по цепочке choices[].next или через linkedStoryNodeId зоны,
    // он найдётся и вживую.
    const hubRoots = [
      'cafe_explore_mode',
      'library_explore_mode',
      'park_explore_mode',
      'office_explore_mode',
      'rooftop_explore_mode',
      'factory_explore_mode',
    ];
    const zoneEdges = new Map<string, string[]>();
    for (const zone of TRIGGER_ZONES) {
      if (!zone.linkedStoryNodeId) continue;
      const list = zoneEdges.get(zone.sceneId) ?? [];
      list.push(zone.linkedStoryNodeId);
      zoneEdges.set(zone.sceneId, list);
    }
    const hubScenes = new Map(
      hubRoots.map((root) => {
        const node = STORY_NODES[root] as StoryNode | undefined;
        return [node?.sceneId ?? root, root] as const;
      }),
    );
    const reachable = new Set<string>();
    const queue = [...hubRoots, ...[...zoneEdges.values()].flat()];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      const node = STORY_NODES[id] as StoryNode | undefined;
      if (!node) continue;
      // Узел сцены открывает и зоны этой сцены (игрок их видит в мире).
      for (const target of zoneEdges.get(node.sceneId) ?? []) {
        if (!reachable.has(target)) queue.push(target);
      }
      for (const choice of node.choices ?? []) {
        if (choice.next && !reachable.has(choice.next)) queue.push(choice.next);
      }
      // Хабовые сцены стартуют из хаба.
      const hub = hubScenes.get(node.sceneId);
      if (hub && !reachable.has(hub)) queue.push(hub);
    }
    const packOnly = [...CASE_NODE_IDS].filter((id) => !hubRoots.includes(id));
    const lost = packOnly.filter((id) => !reachable.has(id));
    expect(lost, 'узлы пака, недостижимые из хабов: ' + lost.join(', ')).toEqual([]);
    // Контроль полноты BFS: все 19 узлов учтены (roof 5 + vault 5 + maria 4 + thread 5).
    expect(packOnly.length).toBe(19);
  });

  it('узлы пака зарегистрированы в глобальном STORY_NODES (buildStoryNodes)', () => {
    for (const id of CASE_NODE_IDS) {
      expect(STORY_NODES[id], `узел ${id} должен попасть в реестр`).toBeDefined();
    }
  });

  it('финалы цепочек стыкуются с существующими узлами квестов', () => {
    // Прелюдия крыши → финальная конфронтация (act4SideQuestStory).
    const roofPast = ACT34_CASE_EXPANSION_STORY_NODES.roof_alexander_past;
    expect(roofPast.choices.map((c) => c.next)).toContain('roof_of_the_world_approach');
    expect(STORY_NODES.roof_of_the_world_approach).toBeDefined();
    // Последняя волна → хаб завода (путь к укрытию Сети).
    const lastWave = ACT34_CASE_EXPANSION_STORY_NODES.vault_last_wave_hymn;
    expect(lastWave.choices.map((c) => c.next)).toContain('factory_explore_mode');
  });

  it('linkedStoryNodeIds кейсов включает новые узлы пака', () => {
    for (const id of CASE_QUEST_IDS) {
      const quest = getQuest(id)!;
      const linked = quest.linkedStoryNodeIds ?? [];
      const fromPack = linked.filter((n) => CASE_NODE_IDS.has(n));
      expect(fromPack.length, `${id}: linkedStoryNodeIds должен включать узлы пака`).toBeGreaterThanOrEqual(4);
    }
  });

  it('текст пака — русский, без CJK-символов и латинских вставок', () => {
    const cjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
    for (const [key, node] of Object.entries(ACT34_CASE_EXPANSION_STORY_NODES)) {
      expect(cjk.test(node.text), `${key}: CJK-символы в тексте запрещены`).toBe(false);
      for (const choice of node.choices) {
        expect(cjk.test(choice.text), `${key}: CJK в тексте выбора`).toBe(false);
      }
    }
  });

  it('мульти-выбор в битах: совет/фаервол/первое слово дают 2–3 реплики', () => {
    const multi = [
      'roof_stairwell_watch',
      'roof_alexander_silence',
      'vault_war_council',
      'vault_firewall_weave',
    ];
    for (const id of multi) {
      expect(
        ACT34_CASE_EXPANSION_STORY_NODES[id].choices.length,
        `${id}: минимум два выбора`,
      ).toBeGreaterThanOrEqual(2);
    }
  });
});
