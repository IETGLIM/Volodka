export type InteractionHintType = 'npc' | 'object' | 'exit' | 'item';

export interface InteractionHintVisual {
  color: string;
  glow: string;
  border: string;
  bg: string;
}

export type SceneTransitionStyle = 'wipe' | 'flash' | 'darken' | 'ripple' | 'dissolve' | 'film_burn' | 'glitch_cut' | 'breathe' | 'crossfade' | 'breathe_zoom' | 'data_stream' | 'glitch_reveal' | 'poem_dissolve';

export interface TransitionProgressVisual {
  primary: string;
  glow: string;
}

const INTERACTION_HINT_VISUAL: Record<InteractionHintType, InteractionHintVisual> = {
  npc: {
    color: 'var(--cyber-cyan)',
    glow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.22)',
    border: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
    bg: 'rgb(var(--cyber-cyan-rgb) / 0.07)',
  },
  object: {
    color: '#e2a84b',
    glow: '0 0 6px rgba(226,168,75,0.22)',
    border: 'rgba(226,168,75,0.3)',
    bg: 'rgba(226,168,75,0.07)',
  },
  exit: {
    color: '#57a874',
    glow: '0 0 6px rgba(70,185,110,0.22)',
    border: 'rgba(70,185,110,0.3)',
    bg: 'rgba(70,185,110,0.07)',
  },
  item: {
    color: '#8d7fb5',
    glow: '0 0 6px rgba(141,127,181,0.22)',
    border: 'rgba(141,127,181,0.3)',
    bg: 'rgba(141,127,181,0.07)',
  },
};

const TRANSITION_ACCENT: Record<SceneTransitionStyle, string> = {
  flash: 'rgba(226, 168, 75, 1)',
  darken: 'rgba(100, 130, 180, 1)',
  ripple: 'rgba(141, 127, 181, 1)',
  dissolve: 'rgba(200, 180, 255, 1)',
  wipe: 'rgba(157, 179, 200, 1)',
  film_burn: 'rgba(226, 168, 75, 1)',
  glitch_cut: 'rgba(70, 185, 110, 1)',
  breathe: 'rgba(140, 200, 255, 1)',
  // Session 9: crossfade — the smooth, no-cut transition. Soft warm-neutral accent.
  crossfade: 'rgba(180, 190, 210, 1)',
  // Breathe zoom — organic, dreamy. Cool blue-white.
  breathe_zoom: 'rgba(157, 179, 200, 1)',
  // Data stream — matrix cascade. Bright cyan.
  data_stream: 'rgba(157, 179, 200, 1)',
  // Glitch reveal — cyberpunk digital corruption. Neon magenta.
  glitch_reveal: 'rgba(141, 127, 181, 1)',
  // Poem dissolve — ethereal text fade. Soft lavender.
  poem_dissolve: 'rgba(200, 180, 255, 1)',
};

const PROGRESS_ACTIVE: TransitionProgressVisual = {
  primary: 'var(--cyber-cyan)',
  glow: 'rgb(var(--cyber-cyan-rgb) / 0.35)',
};

const PROGRESS_COMPLETE: TransitionProgressVisual = {
  primary: '#57a874',
  glow: 'rgba(70, 185, 110, 0.35)',
};

export function getInteractionHintVisual(type: InteractionHintType): InteractionHintVisual {
  return INTERACTION_HINT_VISUAL[type];
}

export function getSceneTransitionAccent(style: SceneTransitionStyle): string {
  return TRANSITION_ACCENT[style];
}

export function getTransitionProgressVisual(isComplete: boolean): TransitionProgressVisual {
  return isComplete ? PROGRESS_COMPLETE : PROGRESS_ACTIVE;
}

export function formatTransitionProgressLabel(sceneName: string, isComplete: boolean): string {
  return isComplete ? `Готово: ${sceneName}` : `Переход: ${sceneName}`;
}

export const GAMEPAD_INTERACT_BUTTON = 'A';

export type InteractionInputMode = 'keyboard' | 'gamepad' | 'touch';

export interface InteractionHintInputOptions {
  gamepadConnected?: boolean;
  touchDevice?: boolean;
}

export function resolveInteractionInputMode(
  options: InteractionHintInputOptions,
): InteractionInputMode {
  if (options.touchDevice) return 'touch';
  if (options.gamepadConnected) return 'gamepad';
  return 'keyboard';
}

/** Keyboard key, gamepad face button, or touch sentinel for hint badges. */
export function formatInteractionHintKey(
  keyboardKey: string,
  options: InteractionHintInputOptions,
): string {
  const mode = resolveInteractionInputMode(options);
  switch (mode) {
    case 'touch':
      return 'касание';
    case 'gamepad':
      return GAMEPAD_INTERACT_BUTTON;
    case 'keyboard':
      return keyboardKey;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function formatInteractionHintBadge(
  keyboardKey: string,
  options: InteractionHintInputOptions,
): string {
  const key = formatInteractionHintKey(keyboardKey, options);
  if (key === 'касание') return '';
  return `[${key}]`;
}

/** Bottom diegetic dialogue — keyboard/mouse affordances (RPG dialogue UX). */
export function formatNarrativeControlHint(options: {
  done: boolean;
  choiceCount: number;
}): string {
  if (!options.done) return 'Пробел, Enter или клик — показать полностью';
  if (options.choiceCount > 0) return '1–9 — выбор · Esc — закрыть';
  return 'Пробел, Enter или клик — закрыть · Esc — закрыть';
}

export function formatInteractionHintAria(
  label: string,
  key: string,
  description?: string,
  options?: InteractionHintInputOptions,
): string {
  const mode = options ? resolveInteractionInputMode(options) : 'keyboard';
  const binding =
    mode === 'gamepad'
      ? `кнопка ${GAMEPAD_INTERACT_BUTTON}`
      : mode === 'touch'
        ? 'коснитесь экрана'
        : `клавиша ${key}`;
  const base = `${label}, ${binding}`;
  return description ? `${base}. ${description}` : base;
}
