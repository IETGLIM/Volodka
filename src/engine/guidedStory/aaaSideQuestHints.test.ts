import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getChkGuitarStringsHint,
  getChkPortwineDeliveryHint,
  getFactoryBabaZinaTeaHint,
  getFactoryZaryaMemoryHint,
  getLibraryKatyaResearchHint,
  getLibraryLostArchiveHint,
  getPierMidnightFishingHint,
  getPierRitkaStringsHint,
  getResistanceDefectorRescueHint,
  getResistanceSafehouseHint,
} from './aaaSideQuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('aaaSideQuestHints', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('pier fishing — Trofim', () => {
    quests.push({ questId: 'pier_midnight_fishing', status: 'active', objectives: {} });
    expect(getPierMidnightFishingHint('street_night')).toContain('Трофим');
  });

  it('ritka strings — Elis then pier', () => {
    quests.push({ questId: 'pier_ritka_strings', status: 'active', objectives: {} });
    expect(getPierRitkaStringsHint('street_night')).toContain('Элис');
    quests[0].objectives = { get_strings: true };
    expect(getPierRitkaStringsHint('street_night')).toContain('пирс');
  });

  it('library lost archive — basement', () => {
    quests.push({ questId: 'library_lost_archive', status: 'active', objectives: {} });
    expect(getLibraryLostArchiveHint('street_night')).toContain('Катей');
  });

  it('katya research — library', () => {
    quests.push({ questId: 'library_katya_research', status: 'active', objectives: {} });
    expect(getLibraryKatyaResearchHint('street_night')).toContain('Катя');
  });

  it('factory zarya + tea', () => {
    quests.push({ questId: 'factory_zarya_memory', status: 'active', objectives: {} });
    expect(getFactoryZaryaMemoryHint('street_night')).toContain('Зари');
    quests.length = 0;
    quests.push({ questId: 'factory_baba_zina_tea', status: 'active', objectives: {} });
    expect(getFactoryBabaZinaTeaHint('street_night')).toContain('Зине');
  });

  it('resistance sides', () => {
    quests.push({ questId: 'resistance_safehouse', status: 'active', objectives: {} });
    expect(getResistanceSafehouseHint('street_night')).toContain('бункер');
    quests.length = 0;
    quests.push({ questId: 'resistance_defector_rescue', status: 'active', objectives: {} });
    expect(getResistanceDefectorRescueHint('street_night')).toContain('Максим');
  });

  it('CHK delivery + strings', () => {
    quests.push({ questId: 'chk_portwine_delivery', status: 'active', objectives: {} });
    expect(getChkPortwineDeliveryHint('street_night')).toContain('Баседом');
    quests.length = 0;
    quests.push({ questId: 'chk_guitar_strings', status: 'active', objectives: {} });
    expect(getChkGuitarStringsHint('street_night')).toContain('Элис');
  });
});
