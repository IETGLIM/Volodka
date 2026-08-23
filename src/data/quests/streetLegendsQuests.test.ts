import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { STREET_LEGENDS_QUESTS } from './streetLegendsQuests';
import { STREET_LEGENDS_STORY_NODES } from '@/data/story/streetLegendsStory';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { getAllItemDefinitions } from '@/data/items';
import { SCENE_IDS } from '@/config/sceneDefinitions';

const PACK_IDS = STREET_LEGENDS_QUESTS.map((q) => q.id);

describe('streetLegendsQuests pack — structure', () => {
  it('contains exactly 5 quests with unique ids across the whole registry', () => {
    expect(STREET_LEGENDS_QUESTS).toHaveLength(5);

    const registryIds = QUEST_DEFINITIONS.map((q) => q.id);
    const dupes = registryIds.filter((id, i) => registryIds.indexOf(id) !== i);
    expect(dupes, 'duplicate quest ids in QUEST_DEFINITIONS').toEqual([]);

    for (const id of PACK_IDS) {
      expect(QUEST_DEFINITIONS.filter((q) => q.id === id), id).toHaveLength(1);
    }
  });

  it('every objective has required fields and a valid type/target pair', () => {
    const npcIds = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
    const itemIds = new Set(getAllItemDefinitions().map((i) => i.id));
    const sceneIds = new Set(SCENE_IDS);

    for (const quest of STREET_LEGENDS_QUESTS) {
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
    for (const quest of STREET_LEGENDS_QUESTS) {
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

    for (const quest of STREET_LEGENDS_QUESTS) {
      expect(quest.questGiverNpcId, quest.id).toBeTruthy();
      expect(npcIds.has(quest.questGiverNpcId!), quest.id).toBe(true);
      for (const req of quest.requiresQuests ?? []) {
        expect(questIds.has(req), `${quest.id} requiresQuests "${req}"`).toBe(true);
      }
    }

    // Лёгкая цепочка внутри пака: свет → курьер → крысиные бега → водосток.
    const byId = (id: string) => QUEST_DEFINITIONS.find((q) => q.id === id)!;
    expect(byId('sl_reluctant_courier').requiresQuests).toContain('sl_window_light');
    expect(byId('sl_rat_race').requiresQuests).toContain('sl_reluctant_courier');
    expect(byId('sl_drainpipe_voice').requiresQuests).toContain('sl_rat_race');
  });

  it('packs five distinct quest mechanics', () => {
    const byId = (id: string) => STREET_LEGENDS_QUESTS.find((q) => q.id === id)!;

    // 1 — наблюдение: flag_set + location_visited, без item/npc-целей
    const windowLight = byId('sl_window_light');
    expect(windowLight.objectives.filter((o) => o.type === 'flag_set').length).toBeGreaterThanOrEqual(3);
    expect(windowLight.objectives.some((o) => o.type === 'location_visited')).toBe(true);

    // 2 — доставка: item_collected + два разных npc_talked
    const courier = byId('sl_reluctant_courier');
    expect(courier.objectives.some((o) => o.type === 'item_collected')).toBe(true);
    const courierNpcs = courier.objectives
      .filter((o) => o.type === 'npc_talked')
      .map((o) => o.target);
    expect(new Set(courierNpcs).size).toBe(2);

    // 3 — боевой: два крип-патруля + король + трофей
    const ratRace = byId('sl_rat_race');
    expect(ratRace.objectives.filter((o) => o.type === 'flag_set').length).toBe(3);
    expect(ratRace.objectives.some((o) => o.type === 'item_collected' && o.target === 'rat_king_crown')).toBe(true);

    // 4 — сбор предметов: item_collected ×3
    const quietHour = byId('sl_quiet_hour');
    expect(quietHour.objectives.filter((o) => o.type === 'item_collected').length).toBe(3);

    // 5 — расследование: серия npc_talked + flag_set финал
    const drainpipe = byId('sl_drainpipe_voice');
    expect(drainpipe.objectives.filter((o) => o.type === 'npc_talked').length).toBe(2);
    expect(drainpipe.objectives.filter((o) => o.type === 'flag_set').length).toBe(3);
  });

  it('rewards are sane and at least two quests grant items', () => {
    const questsWithRewardItems = STREET_LEGENDS_QUESTS.filter((q) => q.rewardItems?.length);
    expect(questsWithRewardItems.length).toBeGreaterThanOrEqual(2);

    const itemIds = new Set(getAllItemDefinitions().map((i) => i.id));
    for (const quest of STREET_LEGENDS_QUESTS) {
      const xp = quest.rewards?.find((r) => r.type === 'addXp')?.value ?? 0;
      expect(xp, `${quest.id} xp reward`).toBeGreaterThanOrEqual(80);
      expect(xp, `${quest.id} xp reward`).toBeLessThanOrEqual(220);

      for (const rewardItem of quest.rewardItems ?? []) {
        expect(itemIds.has(rewardItem.itemId), `${quest.id} reward item "${rewardItem.itemId}"`).toBe(true);
      }
    }
  });

  it('each quest has at least one moral karma choice in its story chain', () => {
    for (const quest of STREET_LEGENDS_QUESTS) {
      const chain = (quest.linkedStoryNodeIds ?? []).map((id) => STREET_LEGENDS_STORY_NODES[id]);
      const karmaEffects = chain.flatMap((node) => [
        ...(node?.effects ?? []).filter((e) => e.type === 'addKarma'),
        ...(node?.choices ?? []).flatMap((c) => (c.effects ?? []).filter((e) => e.type === 'addKarma')),
      ]);
      expect(karmaEffects.length, `${quest.id} moral karma choice`).toBeGreaterThan(0);
    }
  });
});

describe('streetLegendsStory pack — story graph', () => {
  it('record keys match node ids and every choice next resolves', () => {
    const knownNodes = new Set([...Object.keys(STORY_NODES)]);
    for (const [key, node] of Object.entries(STREET_LEGENDS_STORY_NODES)) {
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
    const packEffects = Object.values(STREET_LEGENDS_STORY_NODES).flatMap((node) => [
      ...(node.effects ?? []),
      ...(node.choices ?? []).flatMap((c) => c.effects ?? []),
    ]);
    const setFlags = new Set(
      packEffects.filter((e) => e.type === 'setFlag').map((e) => e.flag!),
    );

    for (const quest of STREET_LEGENDS_QUESTS) {
      for (const objective of quest.objectives.filter((o) => o.type === 'flag_set')) {
        expect(setFlags.has(objective.target!), `${quest.id} → flag "${objective.target}"`).toBe(true);
      }
      // стартовая нода триггерит квест
      const startEffects = STREET_LEGENDS_STORY_NODES[quest.linkedStoryNodeId!].choices.flatMap(
        (c) => c.effects ?? [],
      );
      expect(
        startEffects.some((e) => e.type === 'triggerQuest' && e.questId === quest.id),
        `${quest.id} triggerQuest on start node`,
      ).toBe(true);
    }
  });

  it('combat objectives are wired to combat effects against valid enemy templates', async () => {
    const { ENEMY_TEMPLATES } = await import('@/engine/combat/enemies');
    const ratRace = STREET_LEGENDS_QUESTS.find((q) => q.id === 'sl_rat_race')!;

    const packCombatEffects = Object.values(STREET_LEGENDS_STORY_NODES)
      .filter((node) => ratRace.linkedStoryNodeIds!.includes(node.id))
      .flatMap((node) => node.choices.flatMap((c) => c.effects ?? []))
      .filter((e) => e.type === 'combat');

    expect(packCombatEffects.length).toBeGreaterThanOrEqual(3);
    const enemyTypes = new Set(packCombatEffects.map((e) => e.enemyType!));
    // два крип-патруля + «крысиный король»
    expect(enemyTypes.size).toBe(3);
    for (const effect of packCombatEffects) {
      expect(effect.enemyType, 'combat enemyType').toBeTruthy();
      expect(
        ENEMY_TEMPLATES[effect.enemyType as keyof typeof ENEMY_TEMPLATES],
        `enemy template "${effect.enemyType}"`,
      ).toBeTruthy();
    }
  });

  it('window light observation uses a time-of-day gated choice', () => {
    const watch = STREET_LEGENDS_STORY_NODES.sl_window_light_watch;
    const timeGated = watch.choices.find(
      (c) => c.condition?.minTimeOfDay !== undefined && c.condition?.maxTimeOfDay !== undefined,
    );
    expect(timeGated).toBeTruthy();
    expect(timeGated?.condition?.minTimeOfDay).toBe(22);
    expect(timeGated?.condition?.maxTimeOfDay).toBe(24);
    expect(
      timeGated?.effects?.some((e) => e.type === 'setFlag' && e.flag === 'sl_window_light_night_watch'),
    ).toBe(true);
  });
});
