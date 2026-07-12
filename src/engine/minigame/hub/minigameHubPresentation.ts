import {
  MINIGAME_HUB_GAMES,
  MINIGAME_HUB_LABELS,
  type MinigameHubGameDef,
  type MinigameHubGameType,
} from '@/engine/minigame/hub/minigameHubConstants';

export type HubGridDirection = 'up' | 'down' | 'left' | 'right';

export type LaunchMinigameResult =
  | { ok: true }
  | { ok: false; reason: 'unknown_game' | 'no_handler' | 'emit_failed' };

export type LaunchMinigameDeps = {
  emit: (event: 'minigame:open', payload: { gameType: string }) => void;
  hasOpenHandler: () => boolean;
};

const GAME_TYPE_SET = new Set<string>(MINIGAME_HUB_GAMES.map((g) => g.gameType));

export function isMinigameHubGameType(value: string): value is MinigameHubGameType {
  return GAME_TYPE_SET.has(value);
}

export function getMinigameHubGame(gameType: MinigameHubGameType): MinigameHubGameDef | undefined {
  return MINIGAME_HUB_GAMES.find((game) => game.gameType === gameType);
}

export function getMinigameHubColumns(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 3;
  if (viewportWidth >= 768) return 2;
  return 1;
}

export function moveHubGridFocus(
  current: number,
  direction: HubGridDirection,
  total: number,
  columns: number,
): number {
  const row = Math.floor(current / columns);
  const col = current % columns;
  const maxRow = Math.floor((total - 1) / columns);

  switch (direction) {
    case 'up':
      return row > 0 ? current - columns : current;
    case 'down':
      return row < maxRow ? Math.min(current + columns, total - 1) : current;
    case 'left':
      return col > 0 ? current - 1 : current;
    case 'right':
      return col < columns - 1 && current + 1 < total ? current + 1 : current;
    default: {
      const _exhaustive: never = direction;
      return _exhaustive;
    }
  }
}

export function keyToHubGridDirection(key: string): HubGridDirection | null {
  switch (key) {
    case 'ArrowUp':
    case 'KeyW':
      return 'up';
    case 'ArrowDown':
    case 'KeyS':
      return 'down';
    case 'ArrowLeft':
    case 'KeyA':
      return 'left';
    case 'ArrowRight':
    case 'KeyD':
      return 'right';
    default:
      return null;
  }
}

export function buildHubOpenAnnouncement(): string {
  return MINIGAME_HUB_LABELS.openAnnouncement;
}

export function buildHubCloseAnnouncement(): string {
  return MINIGAME_HUB_LABELS.closeAnnouncement;
}

export function buildLaunchFailureMessage(
  reason: Extract<LaunchMinigameResult, { ok: false }>['reason'],
): string {
  switch (reason) {
    case 'no_handler':
      return MINIGAME_HUB_LABELS.unavailableNoHandler;
    case 'unknown_game':
      return MINIGAME_HUB_LABELS.unavailableUnknown;
    case 'emit_failed':
      return MINIGAME_HUB_LABELS.unavailableNoHandler;
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}

export function getHubCardStaggerDelay(index: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : 0.15 + index * 0.08;
}

export function shouldShowHubShimmer(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

export function safePlayHubSfx(
  play: (name: 'click' | 'ui_open' | 'ui_close' | 'confirm') => void,
  name: 'click' | 'ui_open' | 'ui_close' | 'confirm',
): void {
  try {
    play(name);
  } catch {
    // AudioEngine may be unavailable in tests or restricted contexts.
  }
}

export function launchMinigameFromHub(
  gameType: string,
  deps: LaunchMinigameDeps,
): LaunchMinigameResult {
  if (!isMinigameHubGameType(gameType)) {
    return { ok: false, reason: 'unknown_game' };
  }

  if (!deps.hasOpenHandler()) {
    return { ok: false, reason: 'no_handler' };
  }

  try {
    deps.emit('minigame:open', { gameType });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'emit_failed' };
  }
}
