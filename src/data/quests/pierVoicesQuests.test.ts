import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { PIER_VOICES_QUESTS } from './pierVoicesQuests';
import { PIER_VOICES_STORY_NODES } from '@/data/story/pierVoicesStory';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { SCENE_IDS } from '@/config/sceneDefinitions';

const PACK_IDS = PIER_VOICES_QUESTS.map((q) => q.id);
const NPC_IDS = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
const SCENE_ID_SET = new Set(SCENE_IDS);
const KNOWN_ENEMY_FLAGS = ['pv_river_creeps_cleared'];

describe('pierVoicesQuests pack — structure (v4.8.0)', () => {
  it('ровно 5 квестов с уникальными id во всём реестре', () => {
    expect(PIER_VOICES_QUESTS).toHaveLength(5);

    const registryIds = QUEST_DEFINITIONS.map((q) => q.id);
    const dupes = registryIds.filter((id, i) => registryIds.indexOf(id) !== i);
    expect(dupes, 'дубликаты id в QUEST_DEFINITIONS').toEqual([]);

    for (const id of PACK_IDS) {
      expect(QUEST_DEFINITIONS.filter((q) => q.id === id), id).toHaveLength(1);
    }
  });

  it('у каждого объективы валидны: тип/таргет согласованы', () => {
    for (const quest of PIER_VOICES_QUESTS) {
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

  it('linkedStoryNodeId каждого квеста резолвится в STORY_NODES', () => {
    for (const quest of PIER_VOICES_QUESTS) {
      const nodeId = quest.linkedStoryNodeId;
      expect(nodeId, `${quest.id}: нет linkedStoryNodeId`).toBeTruthy();
      expect(STORY_NODES[nodeId!], `${quest.id}: нода ${nodeId} не найдена`).toBeDefined();
    }
  });

  it('все ноды пака с уникальными id и русским текстом', () => {
    const nodeIds = Object.keys(PIER_VOICES_STORY_NODES);
    expect(nodeIds.length).toBeGreaterThanOrEqual(19); // 5 цепочек: 4+5+4+3+3 = 19 нод

    const registryNodeIds = Object.keys(STORY_NODES);
    const dupes = nodeIds.filter((id) => registryNodeIds.filter((n) => n === id).length > 1);
    expect(dupes).toEqual([]);

    const cyrillic = /[А-Яа-яЁё]/;
    for (const node of Object.values(PIER_VOICES_STORY_NODES)) {
      expect(node.text.length).toBeGreaterThan(40);
      expect(cyrillic.test(node.text)).toBe(true);
      expect(SCENE_ID_SET.has(node.sceneId as never), `сцена ${node.sceneId}`).toBe(true);
    }
  });

  it('цепочка requiresQuests ссылается на квесты пака или реестра', () => {
    const registryIds = new Set(QUEST_DEFINITIONS.map((q) => q.id));
    for (const quest of PIER_VOICES_QUESTS) {
      for (const req of quest.requiresQuests ?? []) {
        expect(registryIds.has(req), `${quest.id}: requiresQuests ${req}`).toBe(true);
      }
    }
  });

  it('боковые ноды-развилки: у pv_fourth_voice_sides есть 3 моральных выбора', () => {
    const sides = PIER_VOICES_STORY_NODES['pv_fourth_voice_sides'];
    expect(sides).toBeDefined();
    expect(sides!.choices.length).toBe(3);
    const karmaEffects = sides!.choices.flatMap((c) =>
      (c.effects ?? []).filter((e) => e.type === 'addKarma'),
    );
    expect(karmaEffects.length).toBeGreaterThanOrEqual(3);
  });

  it('questGiverNpcId — существующие NPC', () => {
    for (const quest of PIER_VOICES_QUESTS) {
      expect(NPC_IDS.has(quest.questGiverNpcId!), `${quest.id}: квестгивер ${quest.questGiverNpcId}`).toBe(true);
    }
  });

  it('боевой флаг зачистки крипов — в списке известных', () => {
    // pv_river_creeps_cleared ставится через выбор в pv_drowned_server_fight
    const fightNode = PIER_VOICES_STORY_NODES['pv_drowned_server_fight'];
    expect(fightNode).toBeDefined();
    const clears = (fightNode!.choices ?? []).flatMap((c) =>
      (c.effects ?? []).filter((e) => e.type === 'setFlag' && e.flag === KNOWN_ENEMY_FLAGS[0]),
    );
    expect(clears.length).toBeGreaterThan(0);
  });
});
