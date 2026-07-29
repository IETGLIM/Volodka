import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getBunkerCodePoemBreakHint,
  getChkNeonArchiveHint,
  getDefectorRescueExpandedHint,
  getParkCyberBloomHint,
  getPoetsMonumentInscriptionHint,
  getRooftopBroadcastSetupHint,
  getServerPoemHuntHint,
  getStreetSamizdatHint,
  getZaremaEvidenceRunHint,
  getZaryaMemoryRestoreHint,
} from './phase5SideQuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('phase5SideQuestHints', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('server poem hunt — office first', () => {
    quests.push({ questId: 'quest_act2_server_poem_hunt', status: 'active', objectives: {} });
    expect(getServerPoemHuntHint('volodka_room')).toContain('офисе');
  });

  it('neon archive — Based', () => {
    quests.push({ questId: 'quest_act2_chk_neon_archive', status: 'active', objectives: {} });
    expect(getChkNeonArchiveHint('street_night')).toContain('Басед');
  });

  it('park cyber bloom — park', () => {
    quests.push({ questId: 'quest_act3_park_cyber_bloom', status: 'active', objectives: {} });
    expect(getParkCyberBloomHint('street_night')).toContain('Парк');
  });

  it('zarema evidence — library', () => {
    quests.push({ questId: 'quest_act3_zarema_evidence_run', status: 'active', objectives: {} });
    expect(getZaremaEvidenceRunHint('street_night')).toContain('библиотек');
  });

  it('rooftop broadcast — roof', () => {
    quests.push({ questId: 'quest_act4_rooftop_broadcast_setup', status: 'active', objectives: {} });
    expect(getRooftopBroadcastSetupHint('street_night')).toContain('Крыша');
  });

  it('street samizdat — pier first', () => {
    quests.push({ questId: 'quest_act4_street_samizdat', status: 'active', objectives: {} });
    expect(getStreetSamizdatHint('street_winter')).toContain('пирс');
  });

  it('zarya memory restore — factory', () => {
    quests.push({
      questId: 'quest_act5_factory_zarya_memory_restore',
      status: 'active',
      objectives: {},
    });
    expect(getZaryaMemoryRestoreHint('street_night')).toContain('Зари');
  });

  it('bunker code poem — bunker', () => {
    quests.push({ questId: 'quest_act5_bunker_code_poem_break', status: 'active', objectives: {} });
    expect(getBunkerCodePoemBreakHint('street_night')).toContain('Бункер');
  });

  it('defector rescue expanded — bunker route', () => {
    quests.push({
      questId: 'quest_act6_defector_rescue_expanded',
      status: 'active',
      objectives: {},
    });
    expect(getDefectorRescueExpandedHint('street_night')).toContain('бункере');
  });

  it('poets monument — park', () => {
    quests.push({
      questId: 'quest_act7_poets_monument_inscription',
      status: 'active',
      objectives: {},
    });
    expect(getPoetsMonumentInscriptionHint('volodka_room')).toContain('Парк');
  });
});
