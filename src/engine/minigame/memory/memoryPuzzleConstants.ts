export const ACCENT_RGB = '52, 211, 153';
export const ACCENT_COLOR = `rgba(${ACCENT_RGB}, 0.9)`;
export const ACCENT_GLOW = `rgba(${ACCENT_RGB}, 0.3)`;
export const RED_RGB = '239, 68, 68';
export const CYAN_RGB = '0, 229, 255';

export type MemoryDifficulty = 'novice' | 'hacker' | 'master';
export type MemoryGamePhase = 'setup' | 'showing' | 'input' | 'correct' | 'wrong' | 'results';

export const GRID_SIZE = 4;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
export const MAX_LIVES = 3;

export const START_DELAY_MS = 500;
export const WRONG_REPLAY_DELAY_MS = 1000;
export const GAME_OVER_DELAY_MS = 800;
export const CORRECT_ROUND_DELAY_MS = 1200;
export const CELL_INPUT_HIGHLIGHT_MS = 200;
export const SIMPLIFIED_SHOW_PAUSE_MS = 300;

export const DIFFICULTY_CONFIG: Record<
  MemoryDifficulty,
  {
    label: string;
    startingLength: number;
    showDelay: number;
    showDuration: number;
    multiplier: number;
    description: string;
  }
> = {
  novice: {
    label: 'Новичок',
    startingLength: 3,
    showDelay: 700,
    showDuration: 500,
    multiplier: 1,
    description: 'Медленный показ, короткий старт',
  },
  hacker: {
    label: 'Хакер',
    startingLength: 4,
    showDelay: 500,
    showDuration: 350,
    multiplier: 1.5,
    description: 'Средняя скорость, средний старт',
  },
  master: {
    label: 'Мастер',
    startingLength: 5,
    showDelay: 350,
    showDuration: 250,
    multiplier: 2,
    description: 'Быстрый показ, длинный старт',
  },
};
