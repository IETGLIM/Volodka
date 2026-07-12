import { describe, expect, it, vi } from 'vitest';
import { MINIGAME_HUB_GAMES } from '@/engine/minigame/hub/minigameHubConstants';
import {
  buildHubOpenAnnouncement,
  buildLaunchFailureMessage,
  getMinigameHubColumns,
  getHubCardStaggerDelay,
  isMinigameHubGameType,
  launchMinigameFromHub,
  moveHubGridFocus,
  shouldShowHubShimmer,
} from '@/engine/minigame/hub/minigameHubPresentation';

describe('minigameHubPresentation', () => {
  it('detects known game types', () => {
    expect(isMinigameHubGameType('memory')).toBe(true);
    expect(isMinigameHubGameType('unknown')).toBe(false);
  });

  it('computes responsive column counts', () => {
    expect(getMinigameHubColumns(500)).toBe(1);
    expect(getMinigameHubColumns(900)).toBe(2);
    expect(getMinigameHubColumns(1280)).toBe(3);
  });

  it('moves grid focus within bounds', () => {
    expect(moveHubGridFocus(0, 'left', 8, 3)).toBe(0);
    expect(moveHubGridFocus(0, 'right', 8, 3)).toBe(1);
    expect(moveHubGridFocus(1, 'down', 8, 3)).toBe(4);
    expect(moveHubGridFocus(7, 'down', 8, 3)).toBe(7);
  });

  it('builds open announcement', () => {
    expect(buildHubOpenAnnouncement()).toContain('Аркада');
  });

  it('maps launch failure reasons to messages', () => {
    expect(buildLaunchFailureMessage('no_handler')).toContain('недоступен');
    expect(buildLaunchFailureMessage('unknown_game')).toContain('Неизвестный');
  });

  it('respects reduced motion for shimmer and stagger', () => {
    expect(shouldShowHubShimmer(true)).toBe(false);
    expect(getHubCardStaggerDelay(2, true)).toBe(0);
    expect(getHubCardStaggerDelay(2, false)).toBeGreaterThan(0);
  });

  it('launches via deps when handler exists', () => {
    const emit = vi.fn();
    const result = launchMinigameFromHub(MINIGAME_HUB_GAMES[0]!.gameType, {
      emit,
      hasOpenHandler: () => true,
    });
    expect(result).toEqual({ ok: true });
    expect(emit).toHaveBeenCalledWith('minigame:open', {
      gameType: MINIGAME_HUB_GAMES[0]!.gameType,
    });
  });

  it('fails when no handler is registered', () => {
    const result = launchMinigameFromHub('memory', {
      emit: vi.fn(),
      hasOpenHandler: () => false,
    });
    expect(result).toEqual({ ok: false, reason: 'no_handler' });
  });

  it('fails for unknown game type', () => {
    const result = launchMinigameFromHub('not-a-game', {
      emit: vi.fn(),
      hasOpenHandler: () => true,
    });
    expect(result).toEqual({ ok: false, reason: 'unknown_game' });
  });
});
