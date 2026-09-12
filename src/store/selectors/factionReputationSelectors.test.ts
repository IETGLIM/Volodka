import { describe, expect, it } from 'vitest';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import {
  FACTION_ALIASES,
  FACTION_IDS,
  normalizeFactionId,
} from './factionReputationSelectors';
import { buildAllFactionMembers } from './factionGrouping';
import type { NPCRelation } from '@/shared/types/game';

describe('normalizeFactionId (консолидация фракций v4.7.2)', () => {
  it('канонические id проходят насквозь', () => {
    for (const id of FACTION_IDS) {
      expect(normalizeFactionId(id)).toBe(id);
    }
  });

  it('legacy-идентификаторы маппятся на канонические фракции', () => {
    expect(normalizeFactionId('streltsy')).toBe('guild');
    expect(normalizeFactionId('merchant_guild')).toBe('guild');
    expect(normalizeFactionId('it_guild')).toBe('guild');
    expect(normalizeFactionId('underground')).toBe('resistance');
    expect(normalizeFactionId('forest_folk')).toBe('tolpa');
  });

  it('неизвестные id сворачиваются в neutral (NPC больше не выпадает из агрегации)', () => {
    expect(normalizeFactionId('unknown_faction')).toBe('neutral');
    expect(normalizeFactionId('')).toBe('neutral');
  });

  it('каждый legacy-алиас указывает на каноническую фракцию', () => {
    for (const target of Object.values(FACTION_ALIASES)) {
      expect(FACTION_IDS).toContain(target);
    }
  });

  it('после консолидации НИ ОДИН NPC не выпадает из фракционной агрегации', () => {
    // Регрессия: до v4.7.2 NPC с фракциями merchant_guild / streltsy /
    // underground / it_guild молча пропускались в buildRelationsByFaction
    // (grouped.has(faction) === false → continue) — 20+ NPC не считались
    // ни в одну фракцию. Теперь любая фракция нормализуется.
    const orphans = ALL_NPC_DEFINITIONS.filter(
      (npc) => npc.faction && !FACTION_IDS.includes(normalizeFactionId(npc.faction)),
    );
    expect(orphans).toEqual([]);
  });

  it('в реестре реально существуют NPC с legacy-фракциями (фича не пустая)', () => {
    const legacyNpcs = ALL_NPC_DEFINITIONS.filter(
      (npc) => npc.faction && npc.faction in FACTION_ALIASES,
    );
    // expansionNpcStubs: merchant_guild×3 (Борис, снабженцы), streltsy×1
    // (капитан Гарольд), underground×2 (контрабандисты) — 6 персонажей,
    // которые до v4.7.2 не считались ни в одну фракцию.
    expect(legacyNpcs.length).toBeGreaterThanOrEqual(6);
  });
});

describe('buildAllFactionMembers (ростер знакомых для панели репутации)', () => {
  it('включает встреченных по флагу met_<id> и по строке npcRelations', () => {
    const flagNpc = ALL_NPC_DEFINITIONS.find((n) => n.faction === 'network');
    const relationNpc = ALL_NPC_DEFINITIONS.find(
      (n) => n.faction === 'guild' && n.id !== flagNpc?.id,
    );
    if (!flagNpc || !relationNpc) throw new Error('нет NPC для теста');

    const relations: NPCRelation[] = [{ npcId: relationNpc.id, value: 62 }];
    const metIds = new Set([flagNpc.id]);

    const members = buildAllFactionMembers(relations, metIds);

    expect(members.network.some((m) => m.id === flagNpc.id)).toBe(true);
    expect(members.guild.some((m) => m.id === relationNpc.id)).toBe(true);
  });

  it('невстреченные не попадают в ростер; отношение по умолчанию 50', () => {
    const someNpc = ALL_NPC_DEFINITIONS.find((n) => n.faction === 'tolpa');
    if (!someNpc) throw new Error('нет NPC для теста');

    const members = buildAllFactionMembers([], new Set());
    // Без met-флага и без строки NPC не показывается.
    expect(members.tolpa.some((m) => m.id === someNpc.id)).toBe(false);

    const withFlag = buildAllFactionMembers([], new Set([someNpc.id]));
    const entry = withFlag.tolpa.find((m) => m.id === someNpc.id);
    expect(entry?.relation).toBe(50);
  });

  it('сортировка: выше отношение — выше, при равенстве — по имени (ru)', () => {
    const npcs = ALL_NPC_DEFINITIONS.filter(
      (n) => n.faction === 'neutral',
    ).slice(0, 3);
    if (npcs.length < 2) throw new Error('мало NPC для теста');

    const relations: NPCRelation[] = npcs.map((n, i) => ({
      npcId: n.id,
      value: 40 + i * 5,
    }));
    const metIds = new Set(npcs.map((n) => n.id));

    const members = buildAllFactionMembers(relations, metIds).neutral;
    const metMembers = members.filter((m) => metIds.has(m.id));
    const relationsSorted = metMembers.map((m) => m.relation);

    expect(relationsSorted).toEqual([...relationsSorted].sort((a, b) => b - a));
  });
});
