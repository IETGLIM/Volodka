import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getArchiveOfForgottenHint,
  getBankingCrashHint,
  getBlindSpotHint,
  getDigitalGhostHint,
  getGuildInfiltrationHint,
  getLastPoemHint,
  getPoetryBroadcastHint,
  getRoofOfTheWorldHint,
  getSecretsOfOldCodeHint,
  getVoicesOfFactoryHint,
} from './act4QuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('act4QuestHints sides', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('digital_ghost — Lena first', () => {
    quests.push({ questId: 'digital_ghost', status: 'active', objectives: {} });
    expect(getDigitalGhostHint('street_night')).toContain('Лена');
  });

  it('voices_of_factory — Chrom-M', () => {
    quests.push({ questId: 'voices_of_factory', status: 'active', objectives: {} });
    expect(getVoicesOfFactoryHint('volodka_room')).toContain('Хром');
  });

  it('secrets_of_old_code — backroom', () => {
    quests.push({ questId: 'secrets_of_old_code', status: 'active', objectives: {} });
    expect(getSecretsOfOldCodeHint('street_night')).toContain('подсобке');
  });

  it('banking_crash — bash terminal', () => {
    quests.push({ questId: 'banking_crash', status: 'active', objectives: {} });
    expect(getBankingCrashHint('home_evening')).toContain('Bash');
  });

  it('keeps spine hints', () => {
    quests.push({ questId: 'guild_infiltration', status: 'active', objectives: {} });
    expect(getGuildInfiltrationHint('street_night')).toContain('офисе');
    quests.length = 0;
    quests.push({ questId: 'blind_spot', status: 'active', objectives: {} });
    expect(getBlindSpotHint('street_night')).toContain('офис');
    quests.length = 0;
    quests.push({ questId: 'archive_of_forgotten', status: 'active', objectives: {} });
    expect(getArchiveOfForgottenHint('street_night')).toContain('архив');
    quests.length = 0;
    quests.push({ questId: 'poetry_broadcast', status: 'active', objectives: {} });
    expect(getPoetryBroadcastHint('street_night')).toContain('эфир');
    quests.length = 0;
    quests.push({ questId: 'roof_of_the_world', status: 'active', objectives: {} });
    expect(getRoofOfTheWorldHint('street_night')).toContain('крыш');
    quests.length = 0;
    quests.push({ questId: 'last_poem', status: 'active', objectives: {} });
    expect(getLastPoemHint('street_night')).toContain('фразы');
  });
});
