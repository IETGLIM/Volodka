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

  it('ritka strings — promise then Elis then pier', () => {
    quests.push({ questId: 'pier_ritka_strings', status: 'active', objectives: {} });
    expect(getPierRitkaStringsHint('street_night')).toContain('Ритка');
    quests[0].objectives = { accept_ritka_strings: true };
    expect(getPierRitkaStringsHint('street_night')).toContain('Элис');
    quests[0].objectives = {
      accept_ritka_strings: true,
      ask_elis_strings: true,
      get_strings: true,
      elis_pack_ready: true,
    };
    expect(getPierRitkaStringsHint('street_night')).toContain('пирс');
  });

  it('library lost archive — fund then basement', () => {
    quests.push({ questId: 'library_lost_archive', status: 'active', objectives: {} });
    expect(getLibraryLostArchiveHint('street_night')).toContain('Катей');
    quests[0].objectives = { accept_archive: true };
    expect(getLibraryLostArchiveHint('library_day')).toContain('Фонд');
  });

  it('katya research — schema then printout', () => {
    quests.push({ questId: 'library_katya_research', status: 'active', objectives: {} });
    expect(getLibraryKatyaResearchHint('street_night')).toContain('Катя');
    quests[0].objectives = {
      accept_research: true,
      open_schema: true,
      crossref_firmware: true,
      night_pass: true,
      marat_node: true,
    };
    expect(getLibraryKatyaResearchHint('library_day')).toContain('распечатку');
  });

  it('factory zarya + tea multi-beat hints', () => {
    quests.push({ questId: 'factory_zarya_memory', status: 'active', objectives: {} });
    expect(getFactoryZaryaMemoryHint('street_night')).toContain('Зари');
    quests[0].objectives = { accept_restore: true, snowflake: true };
    expect(getFactoryZaryaMemoryHint('factory_basement')).toContain('гроз');
    quests.length = 0;
    quests.push({ questId: 'factory_baba_zina_tea', status: 'active', objectives: {} });
    expect(getFactoryBabaZinaTeaHint('street_night')).toContain('Зине');
    quests[0].objectives = {
      accept_tea: true,
      kettle_ready: true,
      mint_brew: true,
      share_hum: true,
      hear_history: true,
    };
    expect(getFactoryBabaZinaTeaHint('abandoned_factory')).toContain('Допей');
  });

  it('resistance sides', () => {
    quests.push({ questId: 'resistance_safehouse', status: 'active', objectives: {} });
    expect(getResistanceSafehouseHint('street_night')).toContain('бункер');
    quests[0].objectives = {
      accept_list: true,
      install_filters: true,
      tune_radio: true,
      poem_mesh: true,
    };
    expect(getResistanceSafehouseHint('underground_bunker')).toContain('матрасы');
    quests.length = 0;
    quests.push({ questId: 'resistance_defector_rescue', status: 'active', objectives: {} });
    expect(getResistanceDefectorRescueHint('street_night')).toContain('Максим');
    quests[0].objectives = { accept_rescue: true };
    expect(getResistanceDefectorRescueHint('street_night')).toContain('засаде');
    quests[0].objectives = { accept_rescue: true, tunnel_approach: true };
    expect(getResistanceDefectorRescueHint('street_night')).toContain('стих');
  });

  it('CHK delivery + strings', () => {
    quests.push({ questId: 'chk_portwine_delivery', status: 'active', objectives: {} });
    expect(getChkPortwineDeliveryHint('street_night')).toContain('Баседом');
    quests[0].objectives = { accept_portwine: true };
    expect(getChkPortwineDeliveryHint('street_night')).toContain('Альберта');
    quests.length = 0;
    quests.push({ questId: 'chk_guitar_strings', status: 'active', objectives: {} });
    expect(getChkGuitarStringsHint('street_night')).toContain('Элис');
    quests[0].objectives = { accept_elis_strings: true };
    expect(getChkGuitarStringsHint('street_night')).toContain('офисе');
    quests[0].objectives = {
      accept_elis_strings: true,
      reach_office: true,
      take_string: true,
    };
    expect(getChkGuitarStringsHint('street_night')).toContain('Элис');
  });
});
