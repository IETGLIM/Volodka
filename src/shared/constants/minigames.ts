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
  quiz: 'quiz_game_complete',
};

/** Returns true when `id` matches a registered, implemented minigame. */
export function isKnownMinigameId(id: string): id is MinigameType {
  return IMPLEMENTED_SET.has(id);
}

/* ─── Panel open state (useInteractionOrchestrator local React state) ─── */

/** Boolean open flags exposed by useInteractionOrchestrator. */
export type MinigamePanelState = {
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
};

/** Setter functions paired with MinigamePanelState. */
export type MinigamePanelSetters = {
  setCodebreakerOpen: (open: boolean) => void;
  setOpenstackTerminalOpen: (open: boolean) => void;
  setBashTerminalOpen: (open: boolean) => void;
  setPoetryGameOpen: (open: boolean) => void;
  setHackingGameOpen: (open: boolean) => void;
  setMemoryGameOpen: (open: boolean) => void;
  setQuizGameOpen: (open: boolean) => void;
  setRhythmGameOpen: (open: boolean) => void;
};

export interface MinigameStateBinding {
  getOpen: (state: MinigamePanelState) => boolean;
  setOpen: (setters: MinigamePanelSetters, open: boolean) => void;
}

/**
 * Central map: minigame type → panel open getter/setter pair.
 * Add a new minigame here (+ component in GameOrchestrator) — no if/else chains elsewhere.
 */
export const MINIGAME_STATE_MAP = {
  codebreaker: {
    getOpen: (s) => s.codebreakerOpen,
    setOpen: (setters, open) => setters.setCodebreakerOpen(open),
  },
  openstack_terminal: {
    getOpen: (s) => s.openstackTerminalOpen,
    setOpen: (setters, open) => setters.setOpenstackTerminalOpen(open),
  },
  bash_terminal: {
    getOpen: (s) => s.bashTerminalOpen,
    setOpen: (setters, open) => setters.setBashTerminalOpen(open),
  },
  poetry: {
    getOpen: (s) => s.poetryGameOpen,
    setOpen: (setters, open) => setters.setPoetryGameOpen(open),
  },
  hacking: {
    getOpen: (s) => s.hackingGameOpen,
    setOpen: (setters, open) => setters.setHackingGameOpen(open),
  },
  memory: {
    getOpen: (s) => s.memoryGameOpen,
    setOpen: (setters, open) => setters.setMemoryGameOpen(open),
  },
  quiz: {
    getOpen: (s) => s.quizGameOpen,
    setOpen: (setters, open) => setters.setQuizGameOpen(open),
  },
  rhythm: {
    getOpen: (s) => s.rhythmGameOpen,
    setOpen: (setters, open) => setters.setRhythmGameOpen(open),
  },
} as const satisfies Record<MinigameType, MinigameStateBinding>;

export function isMinigameOpen(type: MinigameType, state: MinigamePanelState): boolean {
  return MINIGAME_STATE_MAP[type].getOpen(state);
}

export function openMinigame(type: MinigameType, setters: MinigamePanelSetters): void {
  MINIGAME_STATE_MAP[type].setOpen(setters, true);
}

export function closeMinigame(type: MinigameType, setters: MinigamePanelSetters): void {
  MINIGAME_STATE_MAP[type].setOpen(setters, false);
}

export function closeAllMinigames(setters: MinigamePanelSetters): void {
  for (const type of MINIGAME_TYPES) {
    closeMinigame(type, setters);
  }
}

/** Returns the first open minigame type, or null if none are open. */
export function findOpenMinigame(state: MinigamePanelState): MinigameType | null {
  for (const type of MINIGAME_TYPES) {
    if (isMinigameOpen(type, state)) return type;
  }
  return null;
}

/** Close the first open minigame; returns its type, or null if none were open. */
export function closeOpenMinigame(
  state: MinigamePanelState,
  setters: MinigamePanelSetters,
): MinigameType | null {
  const openType = findOpenMinigame(state);
  if (openType) closeMinigame(openType, setters);
  return openType;
}
