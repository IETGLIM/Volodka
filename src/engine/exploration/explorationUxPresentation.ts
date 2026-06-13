export type InteractionHintType = 'npc' | 'object' | 'exit' | 'item';

export interface InteractionHintVisual {
  color: string;
  glow: string;
  border: string;
  bg: string;
}

export type SceneTransitionStyle = 'wipe' | 'flash' | 'darken' | 'ripple' | 'dissolve';

export interface TransitionProgressVisual {
  primary: string;
  glow: string;
}

const INTERACTION_HINT_VISUAL: Record<InteractionHintType, InteractionHintVisual> = {
  npc: {
    color: 'var(--cyber-cyan)',
    glow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.4), 0 0 16px rgb(var(--cyber-cyan-rgb) / 0.2)',
    border: 'rgb(var(--cyber-cyan-rgb) / 0.35)',
    bg: 'rgb(var(--cyber-cyan-rgb) / 0.08)',
  },
  object: {
    color: '#fbbf24',
    glow: '0 0 8px rgba(251,191,36,0.4), 0 0 16px rgba(251,191,36,0.2)',
    border: 'rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.08)',
  },
  exit: {
    color: '#34d399',
    glow: '0 0 8px rgba(52,211,153,0.4), 0 0 16px rgba(52,211,153,0.2)',
    border: 'rgba(52,211,153,0.35)',
    bg: 'rgba(52,211,153,0.08)',
  },
  item: {
    color: '#a78bfa',
    glow: '0 0 8px rgba(167,139,250,0.4), 0 0 16px rgba(167,139,250,0.2)',
    border: 'rgba(167,139,250,0.35)',
    bg: 'rgba(167,139,250,0.08)',
  },
};

const TRANSITION_ACCENT: Record<SceneTransitionStyle, string> = {
  flash: 'rgba(255, 200, 100, 1)',
  darken: 'rgba(100, 130, 180, 1)',
  ripple: 'rgba(180, 100, 255, 1)',
  dissolve: 'rgba(200, 180, 255, 1)',
  wipe: 'rgba(0, 255, 255, 1)',
};

const PROGRESS_ACTIVE: TransitionProgressVisual = {
  primary: 'var(--cyber-cyan)',
  glow: 'rgb(var(--cyber-cyan-rgb) / 0.35)',
};

const PROGRESS_COMPLETE: TransitionProgressVisual = {
  primary: '#34d399',
  glow: 'rgba(52, 211, 153, 0.35)',
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
  return isComplete ? `✓ Загрузка: ${sceneName}` : `Загрузка: ${sceneName}`;
}

export function formatInteractionHintAria(label: string, key: string, description?: string): string {
  const base = `${label}, клавиша ${key}`;
  return description ? `${base}. ${description}` : base;
}
