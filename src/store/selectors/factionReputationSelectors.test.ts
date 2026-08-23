import { describe, expect, it } from 'vitest';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import {
  FACTION_ALIASES,
  FACTION_IDS,
  normalizeFactionId,
} from './factionReputationSelectors';

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
