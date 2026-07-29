import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getArchiveOfForgottenHint,
  getBankTransferHint,
  getBankingCrashHint,
  getBlindSpotHint,
  getBrokenTerminalHint,
  getDigitalGhostHint,
  getGuildInfiltrationHint,
  getLastPoemHint,
  getNightWatchHint,
  getOpenstackCrisisHint,
  getPoemUndercoverHint,
  getPoetryBroadcastHint,
  getRoofOfTheWorldHint,
  getSecretsOfOldCodeHint,
  getVoiceOfThePastHint,
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

  it('bank_transfer — Zarema laptop', () => {
    quests.push({ questId: 'bank_transfer', status: 'active', objectives: {} });
    expect(getBankTransferHint('street_night')).toContain('Зарема');
  });

  it('night_watch — winter street', () => {
    quests.push({ questId: 'night_watch', status: 'active', objectives: {} });
    expect(getNightWatchHint('volodka_room')).toContain('патрулирование');
  });

  it('poem_undercover — cafe', () => {
    quests.push({ questId: 'poem_undercover', status: 'active', objectives: {} });
    expect(getPoemUndercoverHint('street_night')).toContain('кафе');
  });

  it('broken_terminal — office', () => {
    quests.push({ questId: 'broken_terminal', status: 'active', objectives: {} });
    expect(getBrokenTerminalHint('street_night')).toContain('терминала');
  });

  it('voice_of_the_past — factory', () => {
    quests.push({ questId: 'voice_of_the_past', status: 'active', objectives: {} });
    expect(getVoiceOfThePastHint('street_night')).toContain('Владимира');
  });

  it('openstack_crisis — terminal', () => {
    quests.push({ questId: 'openstack_crisis', status: 'active', objectives: {} });
    expect(getOpenstackCrisisHint('street_night')).toContain('OpenStack');
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
