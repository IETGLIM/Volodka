export const NPC_PORTRAIT_SIZE = 256;
export const NPC_PORTRAIT_CACHE_MAX = 128;

export type NpcPortraitSize = 'sm' | 'md';

export const NPC_PORTRAIT_SIZE_CLASSES: Record<NpcPortraitSize, string> = {
  sm: 'w-9 h-9 rounded-md',
  md: 'w-14 h-14 sm:w-16 sm:h-16 rounded-lg',
};

/** Visual tuning for the noir-terminal portrait renderer. */
export const NOIR_TERMINAL_PORTRAIT_STYLE = {
  id: 'noir-terminal',
  backgroundBottom: '#04060a',
  scanlineOpacity: 0.22,
  vignetteOuter: 0.55,
  frameInset: 4.5,
} as const;

export const SHOULDER_HALF_WIDTH: Record<'slim' | 'average' | 'heavy', number> = {
  slim: 74,
  average: 86,
  heavy: 100,
};
