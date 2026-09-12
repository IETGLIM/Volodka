import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { PIER_ECHO_QUESTS } from './pierEchoQuest';
import { PIER_ECHO_STORY_NODES } from '@/data/story/pierEchoStory';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { getAllItemDefinitions } from '@/data/items';

const PACK_IDS = PIER_ECHO_QUESTS.map((q) => q.id);
const NPC_IDS = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
const SCENE_ID_SET = new Set(SCENE_IDS);
const LORE_IDS = new Set(INITIAL_LORE_ENTRIES.map((l) => l.id));
const ITEM_IDS = new Set(getAllItemDefinitions().map((i) => i.id));

describe('pierEchoQuest pack «Эхо пирса» — структура (v4.25.0, №155)', () => {
  it('ровно 1 квест с уникальным id во всём реестре', () => {
    expect(PIER_ECHO_QUESTS).toHaveLength(1);

    const registryIds = QUEST_DEFINITIONS.map((q) => q.id);
    const dupes = registryIds.filter((id, i) => registryIds.indexOf(id) !== i);
    expect(dupes, 'дубликаты id в QUEST_DEFINITIONS').toEqual([]);

    for (const id of PACK_IDS) {
      expect(QUEST_DEFINITIONS.filter((q) => q.id === id), id).toHaveLength(1);
    }
  });

  it('квест-исследование: объективы валидны и согласованы с реестрами', () => {
    for (const quest of PIER_ECHO_QUESTS) {
      expect(quest.objectives.length).toBeGreaterThanOrEqual(3);
      for (const obj of quest.objectives) {
        expect(obj.id).toBeTruthy();
        expect(obj.description).toBeTruthy();
        expect(obj.completed).toBe(false);

        switch (obj.type) {
          case 'npc_talked':
            expect(NPC_IDS.has(obj.target!), `${quest.id}: NPC ${obj.target}`).toBe(true);
            break;
          case 'location_visited':
            expect(SCENE_ID_SET.has(obj.target as never), `${quest.id}: сцена ${obj.target}`).toBe(true);
            break;
          case 'flag_set':
            expect(obj.target, `${quest.id}: флаг ${obj.target}`).toBeTruthy();
            break;
          default:
            expect.fail(`неожиданный тип объективы: ${obj.type}`);
        }
      }
    }
  });

  it('linkedStoryNodeId резолвится в STORY_NODES, гивер существует и имеет расписание', () => {
    for (const quest of PIER_ECHO_QUESTS) {
      expect(STORY_NODES[quest.linkedStoryNodeId!], `${quest.id}: нода`).toBeDefined();
      expect(NPC_IDS.has(quest.questGiverNpcId!), `${quest.id}: гивер`).toBe(true);
    }
  });

  it('все ноды пака с уникальными id, русским текстом и валидными сценами', () => {
    const nodeIds = Object.keys(PIER_ECHO_STORY_NODES);
    expect(nodeIds.length).toBeGreaterThanOrEqual(6); // старт + why + route + listen + 2 финала = 6

    const registryNodeIds = Object.keys(STORY_NODES);
    for (const id of nodeIds) {
      expect(registryNodeIds.filter((n) => n === id).length, id).toBe(1);
    }

    const cyrillic = /[А-Яа-яЁё]/;
    for (const node of Object.values(PIER_ECHO_STORY_NODES)) {
      expect(node.text.length).toBeGreaterThan(40);
      expect(cyrillic.test(node.text)).toBe(true);
      expect(SCENE_ID_SET.has(node.sceneId as never), `сцена ${node.sceneId}`).toBe(true);
    }
  });

  it('стартовый выбор цепочки активирует квест и флаг принятия', () => {
    const start = PIER_ECHO_STORY_NODES['ep_pier_echo_start'];
    expect(start).toBeDefined();

    const acceptChoice = start!.choices[0];
    const effects = acceptChoice.effects ?? [];
    expect(effects).toContainEqual({ type: 'triggerQuest', questId: 'ep_pier_echo' });
    expect(effects).toContainEqual({ type: 'setFlag', flag: 'ep_pier_echo_accepted', flagValue: true });

    // Узел прослушивания ставит флаг цели listen_to_echo и выдаёт кассету.
    const listen = PIER_ECHO_STORY_NODES['ep_pier_echo_listen'];
    const listenEffects = listen!.effects ?? [];
    expect(listenEffects).toContainEqual({ type: 'setFlag', flag: 'ep_echo_listened', flagValue: true });
    expect(listenEffects).toContainEqual({ type: 'addItem', itemId: 'ep_tape_echo' });
  });

  it('лор пака существует, связан перекрёстными ссылками и открывается эффектами discoverLore', () => {
    const packLoreIds = ['lore_pier_echo', 'lore_trofim_watchman', 'lore_glass_floats', 'lore_pier_nineteenth'];
    for (const id of packLoreIds) {
      expect(LORE_IDS.has(id), `лор ${id} в кодексе`).toBe(true);
    }

    // Каждая запись пака имеет relatedEntries (этап 117).
    for (const entry of INITIAL_LORE_ENTRIES.filter((l) => packLoreIds.includes(l.id))) {
      expect(entry.relatedEntries?.length ?? 0, `${entry.id}: перекрёстные ссылки`).toBeGreaterThan(0);
      for (const rel of entry.relatedEntries ?? []) {
        expect(LORE_IDS.has(rel), `${entry.id} → ${rel}`).toBe(true);
      }
    }

    // Все discoverLore-эффекты нод ссылаются на существующий лор.
    for (const node of Object.values(PIER_ECHO_STORY_NODES)) {
      const effects = [
        ...(node.effects ?? []),
        ...(node.choices ?? []).flatMap((c) => c.effects ?? []),
      ];
      for (const fx of effects) {
        if (fx.type === 'discoverLore' && typeof (fx as { loreId?: string }).loreId === 'string') {
          expect(LORE_IDS.has((fx as { loreId: string }).loreId)).toBe(true);
        }
      }
    }
  });

  it('предметы пака существуют в каталоге и выдаются/используются согласованно', () => {
    const packItemIds = ['ep_tape_echo', 'ep_glass_float', 'ep_pier_postcard', 'ep_lantern_battery'];
    for (const id of packItemIds) {
      expect(ITEM_IDS.has(id), `предмет ${id} в каталоге`).toBe(true);
    }

    // addItem-эффекты нод ссылаются на существующие предметы.
    for (const node of Object.values(PIER_ECHO_STORY_NODES)) {
      const effects = [
        ...(node.effects ?? []),
        ...(node.choices ?? []).flatMap((c) => c.effects ?? []),
      ];
      for (const fx of effects) {
        if (fx.type === 'addItem' && typeof (fx as { itemId?: string }).itemId === 'string') {
          expect(ITEM_IDS.has((fx as { itemId: string }).itemId)).toBe(true);
        }
      }
    }
  });

  it('баланс наград соответствует тиру акта 2 (этап 118)', () => {
    for (const quest of PIER_ECHO_QUESTS) {
      const rewards = quest.rewards ?? [];
      const credits = rewards.find((r) => r.type === 'addCredits')?.value ?? 0;
      const karma = rewards.find((r) => r.type === 'addKarma')?.value ?? 0;
      const xp = rewards.find((r) => r.type === 'addXp')?.value ?? 0;
      // Коридор тира 2 пак-ов: 40–60 кредитов, 3–5 кармы, 0–50 XP.
      expect(credits).toBeGreaterThanOrEqual(40);
      expect(credits).toBeLessThanOrEqual(60);
      expect(karma).toBeGreaterThanOrEqual(3);
      expect(karma).toBeLessThanOrEqual(5);
      expect(xp).toBeGreaterThanOrEqual(0);
      expect(xp).toBeLessThanOrEqual(50);
    }
  });
});
