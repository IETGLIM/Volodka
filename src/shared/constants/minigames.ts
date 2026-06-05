/* ─── Volodka RPG – minigame registry (single source of truth) ─── */

/** All minigame ids that have a playable component and emit `minigame:complete`. */
export const MINIGAME_TYPES = [
  'codebreaker',
  'openstack_terminal',
  'bash_terminal',
  'poetry',
  'hacking',
  'memory',
  'quiz',
  'rhythm',
] as const;

export type MinigameType = (typeof MINIGAME_TYPES)[number];

const IMPLEMENTED_SET: ReadonlySet<string> = new Set(MINIGAME_TYPES);

/** Player flags set when a minigame is successfully completed (for retroactive quest checks). */
export const MINIGAME_COMPLETION_FLAGS: Partial<Record<MinigameType, string>> = {
  poetry: 'poetry_composition_complete',
  codebreaker: 'codebreaker_solved',
  bash_terminal: 'bash_terminal_solved',
  openstack_terminal: 'openstack_terminal_solved',
  hacking: 'hacking_complete',
  memory: 'memory_puzzle_complete',
  rhythm: 'rhythm_game_complete',
};

/** Returns true when `id` matches a registered, implemented minigame. */
export function isKnownMinigameId(id: string): id is MinigameType {
  return IMPLEMENTED_SET.has(id);
}
