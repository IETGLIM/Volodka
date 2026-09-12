import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { FACTION_CONTRACTS_DUNGEON_QUESTS } from './factionContracts';
import { FACTION_CONTRACTS_STORY_NODES } from '@/data/story/factionContractsStory';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { getAllItemDefinitions } from '@/data/items';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import { DIALOGUE_NODES } from '@/data/dialogue';
import { NARRATIVE_EXPANSION_TRIGGER_ZONES } from '@/data/narrativeExpansionTriggerZones';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';
import { isBossEnemyType } from '@/engine/combat/types';
import { getBossPhases } from '@/engine/combat/bossPhases';
import { resolveEnemyVisualSpec } from '@/config/enemyVisualRegistry';

const QUEST = FACTION_CONTRACTS_DUNGEON_QUESTS[0];

describe('silentWardenDungeon — quest pack', () => {
  it('contains exactly one dungeon quest registered without duplicates', () => {
    expect(FACTION_CONTRACTS_DUNGEON_QUESTS).toHaveLength(1);
    expect(QUEST.id).toBe('fc_silent_warden');

    const registryIds = QUEST_DEFINITIONS.map((q) => q.id);
    const dupes = registryIds.filter((id, i) => registryIds.indexOf(id) !== i);
    expect(dupes, 'duplicate quest ids in QUEST_DEFINITIONS').toEqual([]);
    expect(QUEST_DEFINITIONS.filter((q) => q.id === 'fc_silent_warden')).toHaveLength(1);
  });

  it('objectives are valid and every flag_set target has a setter in the pack', () => {
    const npcIds = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
    const sceneIds = new Set(SCENE_IDS);

    expect(QUEST.objectives.length).toBeGreaterThanOrEqual(5);
    for (const objective of QUEST.objectives) {
      expect(objective.description, objective.id).toBeTruthy();
      expect(objective.completed).toBe(false);
      if (objective.type === 'npc_talked') {
        expect(npcIds.has(objective.target!), objective.id).toBe(true);
      }
      if (objective.type === 'location_visited') {
        expect(sceneIds.has(objective.target as never), objective.id).toBe(true);
      }
    }

    // Сеттеры всех flag_set-объективов живут в story-нодах пака
    // (fc_warden_lair_found — descent; fc_warden_defeated/archive_claimed — aftermath).
    const packEffects = Object.values(FACTION_CONTRACTS_STORY_NODES).flatMap((node) => [
      ...(node.effects ?? []),
      ...(node.choices ?? []).flatMap((c) => c.effects ?? []),
    ]);
    const setFlags = new Set(packEffects.filter((e) => e.type === 'setFlag').map((e) => e.flag!));
    for (const objective of QUEST.objectives.filter((o) => o.type === 'flag_set')) {
      expect(setFlags.has(objective.target!), `${objective.id} → setter`).toBe(true);
    }

    // Квестовые флаги не пересекаются с 5 основными фракционными квестами
    const mainPackFlags = new Set(
      ['fc_echo_fate_decided', 'fc_blindspot_fate_decided', 'fc_zarya_test_done', 'fc_zarya_frequency_decided', 'fc_embers_fate_decided', 'fc_hands_promise_decided'],
    );
    for (const objective of QUEST.objectives.filter((o) => o.type === 'flag_set')) {
      expect(mainPackFlags.has(objective.target!), `dungeon flag "${objective.target}" must be own`).toBe(false);
    }
  });

  it('story chain resolves: linked nodes exist, start node triggers the quest', () => {
    expect(QUEST.linkedStoryNodeIds?.length).toBeGreaterThanOrEqual(4);
    for (const nodeId of QUEST.linkedStoryNodeIds ?? []) {
      expect(STORY_NODES[nodeId], `story node "${nodeId}"`).toBeTruthy();
      expect(FACTION_CONTRACTS_STORY_NODES[nodeId], `pack node "${nodeId}"`).toBeTruthy();
    }

    const startNode = FACTION_CONTRACTS_STORY_NODES[QUEST.linkedStoryNodeId!];
    const startEffects = [
      ...(startNode?.effects ?? []),
      ...(startNode?.choices ?? []).flatMap((c) => c.effects ?? []),
    ];
    expect(startEffects.some((e) => e.type === 'triggerQuest' && e.questId === QUEST.id)).toBe(true);

    // Моральный выбор в цепочке (архив: правда vs тишина)
    const chain = (QUEST.linkedStoryNodeIds ?? []).map((id) => FACTION_CONTRACTS_STORY_NODES[id]);
    const karmaEffects = chain.flatMap((node) => [
      ...(node?.effects ?? []).filter((e) => e.type === 'addKarma'),
      ...(node?.choices ?? []).flatMap((c) => (c.effects ?? []).filter((e) => e.type === 'addKarma')),
    ]);
    expect(karmaEffects.length).toBeGreaterThan(0);

    // requiresQuests: продолжение линии Сопротивления
    const questIds = new Set(QUEST_DEFINITIONS.map((q) => q.id));
    for (const req of QUEST.requiresQuests ?? []) {
      expect(questIds.has(req), `requires "${req}"`).toBe(true);
    }
    expect(QUEST.requiresQuests).toContain('fc_resistance_zarya');
  });

  it('reward items and boss loot table reference existing items', () => {
    const itemIds = new Set(getAllItemDefinitions().map((i) => i.id));
    for (const rewardItem of QUEST.rewardItems ?? []) {
      expect(itemIds.has(rewardItem.itemId), `reward "${rewardItem.itemId}"`).toBe(true);
    }
    const boss = ENEMY_TEMPLATES.boss_silent_warden;
    expect(boss).toBeTruthy();
    for (const lootId of boss.lootTable) {
      expect(itemIds.has(lootId), `boss loot "${lootId}"`).toBe(true);
    }
    const xp = QUEST.rewards?.find((r) => r.type === 'addXp')?.value ?? 0;
    expect(xp).toBeGreaterThanOrEqual(150);
  });
});

describe('silentWardenDungeon — boss registration', () => {
  it('enemy template is complete and russian-only in visible text', () => {
    const boss = ENEMY_TEMPLATES.boss_silent_warden;
    expect(boss.name).toBe('Тихий Хранитель');
    expect(boss.baseHp).toBeGreaterThanOrEqual(500);
    expect(boss.specialAttacks.length).toBe(3);
    expect(boss.attackBarks.length).toBeGreaterThanOrEqual(3);
    expect(boss.defeatBarks.length).toBeGreaterThanOrEqual(3);

    // Все спец-атаки имеют уникальные id и разумные шансы/кулдауны
    const attackIds = boss.specialAttacks.map((a) => a.id);
    expect(new Set(attackIds).size).toBe(attackIds.length);
    for (const attack of boss.specialAttacks) {
      expect(attack.chance).toBeGreaterThan(0);
      expect(attack.chance).toBeLessThanOrEqual(0.5);
      expect(attack.cooldown).toBeGreaterThanOrEqual(3);
      expect(attack.name.length).toBeGreaterThan(3);
    }
  });

  it('is a boss: BOSS_ENEMY_TYPES + phases + visual + UI data', () => {
    expect(isBossEnemyType('boss_silent_warden')).toBe(true);

    const phases = getBossPhases('boss_silent_warden');
    expect(phases).toBeTruthy();
    expect(phases!).toHaveLength(3);
    // Пороги фаз: 100–60 / 60–30 / 30–0 без разрывов
    expect(phases![0].hpUpperBound).toBe(1.0);
    expect(phases![0].hpLowerBound).toBe(0.6);
    expect(phases![1].hpLowerBound).toBe(0.3);
    expect(phases![2].hpLowerBound).toBe(0.0);
    expect(phases![2].damageMultiplier).toBeGreaterThan(phases![0].damageMultiplier);

    const visual = resolveEnemyVisualSpec('boss_silent_warden');
    expect(visual.scale).toBeGreaterThanOrEqual(1.3);
    expect(visual.archetype).toBeTruthy();
  });

  it('boss phase flash colors and descriptions are present', () => {
    const phases = getBossPhases('boss_silent_warden')!;
    for (const phase of phases) {
      expect(phase.flashColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(phase.description.length).toBeGreaterThan(5);
    }
  });
});

describe('silentWardenDungeon — trigger zones and dialogue bridge', () => {
  const zones = NARRATIVE_EXPANSION_TRIGGER_ZONES.filter((z) => z.id.startsWith('fc_warden_'));

  it('has three zones in the bunker: gate, ambush, archive', () => {
    expect(zones.map((z) => z.id)).toEqual([
      'fc_warden_gate',
      'fc_warden_lair_ambush',
      'fc_warden_archive',
    ]);
    for (const zone of zones) {
      expect(zone.sceneId).toBe('underground_bunker');
    }
  });

  it('ambush zone auto-triggers the boss combat only while quest is accepted', () => {
    const ambush = zones.find((z) => z.id === 'fc_warden_lair_ambush')!;
    expect(ambush.autoTrigger).toBe(true);
    expect(ambush.requiredFlag).toBe('fc_silent_warden_accepted');
    expect(ambush.hiddenWhenFlag).toBe('boss_silent_warden_defeated');
    expect(ambush.effects?.some((e) => e.type === 'combat' && e.enemyType === 'boss_silent_warden')).toBe(true);
  });

  it('gate zone opens the descent story node; archive zone opens aftermath after victory', () => {
    const gate = zones.find((z) => z.id === 'fc_warden_gate')!;
    expect(gate.linkedStoryNodeId).toBe('fc_warden_descent');
    expect(gate.requiredFlag).toBe('fc_silent_warden_accepted');
    expect(gate.interactionType).toBe('examine');

    const archive = zones.find((z) => z.id === 'fc_warden_archive')!;
    expect(archive.linkedStoryNodeId).toBe('fc_warden_aftermath');
    expect(archive.requiredFlag).toBe('boss_silent_warden_defeated');
    expect(archive.hiddenWhenFlag).toBe('fc_warden_archive_claimed');
  });

  it('zones are ordered by depth: gate → ambush → archive', () => {
    const gate = zones.find((z) => z.id === 'fc_warden_gate')!;
    const ambush = zones.find((z) => z.id === 'fc_warden_lair_ambush')!;
    const archive = zones.find((z) => z.id === 'fc_warden_archive')!;
    expect(ambush.position[2]).toBeLessThan(gate.position[2]);
    expect(archive.position[2]).toBeLessThan(ambush.position[2]);
  });

  it('zeka greeting bridges to the dungeon start node after fc_resistance_zarya', () => {
    const greeting = DIALOGUE_NODES['zeka_greeting'];
    expect(greeting).toBeTruthy();
    const bridge = greeting.choices.find((c) => c.next === 'fc_warden_start');
    expect(bridge, 'zeka_greeting → fc_warden_start bridge').toBeTruthy();
    expect(bridge!.condition?.flag).toBe('fc_resistance_zarya_done');
    expect(bridge!.condition?.missingFlag).toBe('fc_silent_warden_accepted');
  });
});
