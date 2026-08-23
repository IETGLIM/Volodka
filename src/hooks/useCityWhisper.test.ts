import { describe, expect, it } from 'vitest';
import {
  WHISPER_COOLDOWN_MS,
  WHISPER_STRESS_RESET,
  WHISPER_STRESS_THRESHOLD,
  isWhisperEpisodeOver,
  shouldRequestWhisper,
} from './useCityWhisper';

describe('shouldRequestWhisper (гейтинг «Шёпота города»)', () => {
  const NOW = 1_000_000;

  it('не шепчет при стрессе ниже порога', () => {
    expect(shouldRequestWhisper(69, false, 0, NOW)).toBe(false);
    expect(shouldRequestWhisper(0, false, 0, NOW)).toBe(false);
  });

  it('шепчет при первом пересечении порога', () => {
    expect(shouldRequestWhisper(WHISPER_STRESS_THRESHOLD, false, 0, NOW)).toBe(true);
    expect(shouldRequestWhisper(100, false, 0, NOW)).toBe(true);
  });

  it('не шепчет дважды за один эпизод стресса', () => {
    expect(shouldRequestWhisper(80, true, 0, NOW)).toBe(false);
  });

  it('уважает глобальный кулдаун между шёпотами', () => {
    const last = NOW - (WHISPER_COOLDOWN_MS - 1);
    expect(shouldRequestWhisper(80, false, last, NOW)).toBe(false);
    // Кулдаун истёк — можно снова.
    expect(shouldRequestWhisper(80, false, NOW - WHISPER_COOLDOWN_MS, NOW)).toBe(true);
  });

  it('кулдаун отсчитывается даже если последнее значение 0 (первая сессия)', () => {
    // lastWhisperAt=0 → now-0 >= cooldown при любом реальном now.
    expect(shouldRequestWhisper(75, false, 0, NOW)).toBe(true);
  });
});

describe('isWhisperEpisodeOver (гистерезис эпизода)', () => {
  it('эпизод активен, пока стресс выше порога сброса', () => {
    expect(isWhisperEpisodeOver(61)).toBe(false);
    expect(isWhisperEpisodeOver(WHISPER_STRESS_THRESHOLD)).toBe(false);
  });

  it('эпизод заканчивается только ниже порога сброса (не на границе 70)', () => {
    // Стресс 65 — уже ниже 70, но выше 60: эпизод ещё жив (анти-дребезг).
    expect(isWhisperEpisodeOver(65)).toBe(false);
    expect(isWhisperEpisodeOver(WHISPER_STRESS_RESET)).toBe(true);
    expect(isWhisperEpisodeOver(10)).toBe(true);
  });
});
