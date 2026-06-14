export const POEM_POWER_EFFECT_LABELS = {
  act1: 'АКТ 1',
  act2: 'АКТ 2',
  act3: 'АКТ 3',
  powerActivated: 'Способность активирована',
  activatedAnnouncement: (powerName: string) => `Способность ${powerName} активирована`,
} as const;

export const POEM_POWER_EFFECT_DURATION_MS = 2500;
export const POEM_POWER_EFFECT_PARTICLE_COUNT = 32;
export const POEM_POWER_EFFECT_MATRIX_COLUMN_COUNT = 50;

export const POEM_POWER_EFFECT_CYRILLIC_CHARS =
  'абвгдежзийклмнопрстуфхцчшщъыьэюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789{}[]<>/\\|#$@!';

export const POEM_POWER_COLOR_THEMES = {
  act1: '#00ffee',
  act2: '#00ff66',
  act3: '#ffcc00',
  combat: '#ff4444',
  defense: '#4488ff',
} as const;

export type PoemPowerColorTheme = keyof typeof POEM_POWER_COLOR_THEMES;
export type PoemPowerAct = 1 | 2 | 3;
