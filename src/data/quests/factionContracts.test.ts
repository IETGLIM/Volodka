import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { FACTION_CONTRACTS_QUESTS } from './factionContracts';
import { FACTION_CONTRACTS_STORY_NODES } from '@/data/story/factionContractsStory';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { getAllItemDefinitions } from '@/data/items';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import { DIALOGUE_NODES } from '@/data/dialogue';

const PACK_IDS = FACTION_CONTRACTS_QUESTS.map((q) => q.id);

describe('factionContracts pack — structure', () => {
  it('contains exactly 5 quests with unique ids across the whole registry', () => {
    expect(FACTION_CONTRACTS_QUESTS).toHaveLength(5);

    const registryIds = QUEST_DEFINITIONS.map((q) => q.id);
    const dupes = registryIds.filter((id, i) => registryIds.indexOf(id) !== i);
    expect(dupes, 'duplicate quest ids in QUEST_DEFINITIONS').toEqual([]);

    for (const id of PACK_IDS) {
      expect(QUEST_DEFINITIONS.filter((q) => q.id === id), id).toHaveLength(1);
    }
  });

  it('covers all five faction flavours: network, guild, resistance, tolpa + cross', () => {
    const factions = FACTION_CONTRACTS_QUESTS.map((q) => q.faction).sort();
    expect(factions).toEqual(['guild', 'network', 'neutral', 'resistance', 'tolpa']);
  });

  it('every objective has required fields and a valid type/target pair', () => {
    const npcIds = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
    const itemIds = new Set(getAllItemDefinitions().map((i) => i.id));
    const sceneIds = new Set(SCENE_IDS);

    for (const quest of FACTION_CONTRACTS_QUESTS) {
      expect(quest.objectives.length, quest.id).toBeGreaterThanOrEqual(5);
      expect(quest.title, quest.id).toBeTruthy();
      expect(quest.description.length, quest.id).toBeGreaterThan(80);
      expect(quest.questType, quest.id).toBe('side');

      const objectiveIds = quest.objectives.map((o) => o.id);
      expect(
        objectiveIds.filter((id, i) => objectiveIds.indexOf(id) !== i),
        `${quest.id} duplicate objective ids`,
      ).toEqual([]);

      for (const objective of quest.objectives) {
        const label = `${quest.id}.objective:${objective.id}`;
        expect(objective.id, label).toBeTruthy();
        expect(objective.description, label).toBeTruthy();
        expect(objective.completed, label).toBe(false);

        switch (objective.type) {
          case 'npc_talked':
            expect(objective.target, label).toBeTruthy();
            expect(npcIds.has(objective.target!), label).toBe(true);
            break;
          case 'item_collected':
            expect(objective.target, label).toBeTruthy();
            expect(itemIds.has(objective.target!), label).toBe(true);
            break;
          case 'location_visited':
            expect(objective.target, label).toBeTruthy();
            expect(sceneIds.has(objective.target as never), label).toBe(true);
            break;
          case 'flag_set':
          case 'minigame_completed':
            expect(objective.target, label).toBeTruthy();
            break;
          default:
            throw new Error(`${label}: unexpected objective type ${objective.type}`);
        }
      }

      // flag_set targets are unique per quest (validator warns on duplicates)
      const flagTargets = quest.objectives
        .filter((o) => o.type === 'flag_set')
        .map((o) => o.target!);
      expect(
        flagTargets.filter((f, i) => flagTargets.indexOf(f) !== i),
        `${quest.id} duplicate flag_set targets`,
      ).toEqual([]);
    }
  });

  it('linkedStoryNodeId(s) all resolve to existing story nodes', () => {
    for (const quest of FACTION_CONTRACTS_QUESTS) {
      expect(quest.linkedStoryNodeId, quest.id).toBeTruthy();
      expect(STORY_NODES[quest.linkedStoryNodeId!], quest.id).toBeTruthy();
      expect(quest.linkedStoryNodeIds?.length, quest.id).toBeGreaterThanOrEqual(4);
      for (const nodeId of quest.linkedStoryNodeIds ?? []) {
        expect(STORY_NODES[nodeId], `${quest.id} → ${nodeId}`).toBeTruthy();
      }
    }
  });

  it('quest givers and requiresQuests chains resolve', () => {
    const questIds = new Set(QUEST_DEFINITIONS.map((q) => q.id));
    const npcIds = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));

    for (const quest of FACTION_CONTRACTS_QUESTS) {
      expect(quest.questGiverNpcId, quest.id).toBeTruthy();
      expect(npcIds.has(quest.questGiverNpcId!), quest.id).toBe(true);
      for (const req of quest.requiresQuests ?? []) {
        expect(questIds.has(req), `${quest.id} requiresQuests "${req}"`).toBe(true);
      }
    }

    // Кросс-фракционный финал требует доверия Зины (её фабричный квест).
    const byId = (id: string) => QUEST_DEFINITIONS.find((q) => q.id === id)!;
    expect(byId('fc_neutral_hands').requiresQuests).toContain('factory_zarya_memory');
  });

  it('packs five distinct quest mechanics', () => {
    const byId = (id: string) => FACTION_CONTRACTS_QUESTS.find((q) => q.id === id)!;

    // 1 — сбор: три item_collected + location_visited + моральный финал
    const echo = byId('fc_network_echo');
    expect(echo.objectives.filter((o) => o.type === 'item_collected').length).toBe(3);
    expect(echo.objectives.some((o) => o.type === 'location_visited')).toBe(true);

    // 2 — курьер под слепой зоной: item + две локации
    const blindSpot = byId('fc_guild_blind_spot');
    expect(blindSpot.objectives.some((o) => o.type === 'item_collected')).toBe(true);
    expect(blindSpot.objectives.filter((o) => o.type === 'location_visited').length).toBe(2);

    // 3 — ремонт: две запчасти + крыша + тест-эфир + выбор частоты
    const zarya = byId('fc_resistance_zarya');
    expect(zarya.objectives.filter((o) => o.type === 'item_collected').length).toBe(2);
    expect(zarya.objectives.filter((o) => o.type === 'flag_set').length).toBe(2);

    // 4 — расследование: два npc_talked + локация + предмет + финал
    const embers = byId('fc_tolpa_embers');
    expect(embers.objectives.filter((o) => o.type === 'npc_talked').length).toBe(2);
    expect(embers.objectives.some((o) => o.type === 'item_collected')).toBe(true);

    // 5 — тройная доставка: три item + три npc + моральный финал
    const hands = byId('fc_neutral_hands');
    expect(hands.objectives.filter((o) => o.type === 'item_collected').length).toBe(3);
    const handsNpcs = hands.objectives.filter((o) => o.type === 'npc_talked');
    expect(new Set(handsNpcs.map((o) => o.target)).size).toBe(4);
  });

  it('rewards are sane and at least two quests grant items', () => {
    const questsWithRewardItems = FACTION_CONTRACTS_QUESTS.filter((q) => q.rewardItems?.length);
    expect(questsWithRewardItems.length).toBeGreaterThanOrEqual(2);

    const itemIds = new Set(getAllItemDefinitions().map((i) => i.id));
    for (const quest of FACTION_CONTRACTS_QUESTS) {
      const xp = quest.rewards?.find((r) => r.type === 'addXp')?.value ?? 0;
      expect(xp, `${quest.id} xp reward`).toBeGreaterThanOrEqual(80);
      expect(xp, `${quest.id} xp reward`).toBeLessThanOrEqual(220);

      for (const rewardItem of quest.rewardItems ?? []) {
        expect(itemIds.has(rewardItem.itemId), `${quest.id} reward item "${rewardItem.itemId}"`).toBe(true);
      }
    }
  });

  it('each quest has at least one moral karma choice in its story chain', () => {
    for (const quest of FACTION_CONTRACTS_QUESTS) {
      const chain = (quest.linkedStoryNodeIds ?? []).map((id) => FACTION_CONTRACTS_STORY_NODES[id]);
      const karmaEffects = chain.flatMap((node) => [
        ...(node?.effects ?? []).filter((e) => e.type === 'addKarma'),
        ...(node?.choices ?? []).flatMap((c) => (c.effects ?? []).filter((e) => e.type === 'addKarma')),
      ]);
      expect(karmaEffects.length, `${quest.id} moral karma choice`).toBeGreaterThan(0);
    }
  });
});

describe('factionContractsStory pack — story graph', () => {
  it('record keys match node ids and every choice next resolves', () => {
    const knownNodes = new Set([...Object.keys(STORY_NODES)]);
    for (const [key, node] of Object.entries(FACTION_CONTRACTS_STORY_NODES)) {
      expect(node.id, key).toBe(key);
      expect(node.text.length, key).toBeGreaterThan(120);
      expect(node.choices.length, key).toBeGreaterThanOrEqual(2);
      expect(node.speaker, key).toBeTruthy();
      for (const choice of node.choices) {
        expect(choice.text.length, `${key} choice text`).toBeGreaterThan(3);
        if (choice.next !== null) {
          expect(knownNodes.has(choice.next), `${key} → "${choice.next}"`).toBe(true);
        }
      }
    }
  });

  it('every quest objective flag is actually set by a story effect in the pack', () => {
    const packEffects = Object.values(FACTION_CONTRACTS_STORY_NODES).flatMap((node) => [
      ...(node.effects ?? []),
      ...(node.choices ?? []).flatMap((c) => c.effects ?? []),
    ]);
    const setFlags = new Set(
      packEffects.filter((e) => e.type === 'setFlag').map((e) => e.flag!),
    );

    for (const quest of FACTION_CONTRACTS_QUESTS) {
      for (const objective of quest.objectives.filter((o) => o.type === 'flag_set')) {
        expect(setFlags.has(objective.target!), `${quest.id} → flag "${objective.target}"`).toBe(true);
      }
      // стартовая нода триггерит квест
      const startNode = FACTION_CONTRACTS_STORY_NODES[quest.linkedStoryNodeId!];
      const startEffects = [
        ...(startNode?.effects ?? []),
        ...(startNode?.choices ?? []).flatMap((c) => c.effects ?? []),
      ];
      expect(
        startEffects.some((e) => e.type === 'triggerQuest' && e.questId === quest.id),
        `${quest.id} triggerQuest on start node`,
      ).toBe(true);
    }
  });

  it('every item_collected objective item is granted by an addItem effect in the pack', () => {
    const packEffects = Object.values(FACTION_CONTRACTS_STORY_NODES).flatMap((node) => [
      ...(node.effects ?? []),
      ...(node.choices ?? []).flatMap((c) => c.effects ?? []),
    ]);
    const grantedItems = new Set(
      packEffects.filter((e) => e.type === 'addItem').map((e) => e.itemId!),
    );

    for (const quest of FACTION_CONTRACTS_QUESTS) {
      for (const objective of quest.objectives.filter((o) => o.type === 'item_collected')) {
        expect(
          grantedItems.has(objective.target!),
          `${quest.id} → item "${objective.target}" has no addItem effect`,
        ).toBe(true);
      }
    }
  });

  it('no pack story node id collides with the global story registry', () => {
    // Пак добавлен в buildStoryNodes() последним: коллизии он не может
    // «выиграть» тихо — dev-варнинг включён, здесь фиксируем инвариант.
    const packIds = Object.keys(FACTION_CONTRACTS_STORY_NODES);
    const registryIds = Object.keys(STORY_NODES);
    expect(new Set(packIds).size).toBe(packIds.length);
    for (const id of packIds) {
      expect(registryIds.includes(id), `node "${id}" missing from STORY_NODES`).toBe(true);
    }
  });

  it('dialogue bridges to the five quest start nodes exist', () => {
    // Мосты в greeting-узлах квестгиверов — единственная «дверь» в пак.
    const bridgeTargets = [
      'fc_echo_start',
      'fc_blindspot_start',
      'fc_zarya_start',
      'fc_embers_start',
      'fc_hands_start',
    ];
    const nexts = new Set(
      Object.values(DIALOGUE_NODES).flatMap((node) =>
        node.choices.map((c) => c.next),
      ),
    );
    for (const target of bridgeTargets) {
      expect(nexts.has(target), `dialogue bridge → "${target}"`).toBe(true);
    }
  });
});
