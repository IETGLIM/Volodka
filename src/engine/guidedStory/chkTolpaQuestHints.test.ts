import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getTolpaAct3SanctuaryHint,
  getTolpaAct4ExfiltrationHint,
  getTolpaAct4ServerHeistHint,
  getTolpaBondHint,
  getTolpaFirstFireHint,
  getTolpaForestGuideHint,
  getTolpaGuitarNightHint,
  getTolpaPoemFireHint,
  getTolpaPortwineOathHint,
  getTolpaQuantumFireHint,
  getTolpaWhisperHint,
} from './chkTolpaQuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('chkTolpaQuestHints', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('tolpa_whisper — office', () => {
    quests.push({ questId: 'tolpa_whisper', status: 'active', objectives: {} });
    expect(getTolpaWhisperHint('volodka_room')).toContain('офисе');
  });

  it('tolpa_first_fire — forest path', () => {
    quests.push({ questId: 'tolpa_first_fire', status: 'active', objectives: {} });
    expect(getTolpaFirstFireHint('park_day')).toContain('костру');
  });

  it('tolpa_portwine_oath — Based', () => {
    quests.push({ questId: 'tolpa_portwine_oath', status: 'active', objectives: {} });
    expect(getTolpaPortwineOathHint('street_night')).toContain('Басед');
  });

  it('tolpa_quantum_fire — Smert', () => {
    quests.push({ questId: 'tolpa_quantum_fire', status: 'active', objectives: {} });
    expect(getTolpaQuantumFireHint('volodka_room')).toContain('Смерть');
  });

  it('tolpa_forest_guide — Stalker', () => {
    quests.push({ questId: 'tolpa_forest_guide', status: 'active', objectives: {} });
    expect(getTolpaForestGuideHint('cafe_evening')).toContain('Сталкер');
  });

  it('tolpa_guitar_night — Elis', () => {
    quests.push({ questId: 'tolpa_guitar_night', status: 'active', objectives: {} });
    expect(getTolpaGuitarNightHint('street_night')).toContain('Элис');
  });

  it('tolpa_bond — rituals', () => {
    quests.push({ questId: 'tolpa_bond', status: 'active', objectives: {} });
    expect(getTolpaBondHint('street_night')).toContain('ТОЛПА');
  });

  it('tolpa_poem_fire — poem', () => {
    quests.push({ questId: 'tolpa_poem_fire', status: 'active', objectives: {} });
    expect(getTolpaPoemFireHint('street_night')).toContain('костру');
  });

  it('tolpa_act3_sanctuary — Ru', () => {
    quests.push({ questId: 'tolpa_act3_sanctuary', status: 'active', objectives: {} });
    expect(getTolpaAct3SanctuaryHint('volodka_room')).toContain('Ру');
  });

  it('tolpa_act4_exfiltration — route', () => {
    quests.push({ questId: 'tolpa_act4_exfiltration', status: 'active', objectives: {} });
    expect(getTolpaAct4ExfiltrationHint('office_day')).toContain('Сталкера');
  });

  it('tolpa_act4_server_heist — datacenter', () => {
    quests.push({ questId: 'tolpa_act4_server_heist', status: 'active', objectives: {} });
    expect(getTolpaAct4ServerHeistHint('street_night')).toContain('дата-центр');
  });

  it('returns null when inactive', () => {
    expect(getTolpaWhisperHint('office_day')).toBeNull();
  });
});
