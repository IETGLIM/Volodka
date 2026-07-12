import { APP_VERSION } from '@/shared/constants/appVersion';

export { APP_VERSION };

export const MENU_TITLE = 'ВОЛОДЬКА';
export const MENU_SUBTITLE = 'сказка между сменами';
export const MENU_TAGLINE = 'История уставшего инженера';
export const MENU_POET_CREDIT = 'Стихи Владимира Лебедева';
export const MENU_DEDICATION = 'Памяти Владимира Лебедева';

export const SAVE_KEY = 'volodka_save';

export const SCENE_LABELS: Record<string, string> = {
  volodka_room: 'Комната',
  volodka_corridor: 'Коридор',
  street_night: 'Улица',
  cafe_evening: 'Кафе',
  office_day: 'Офис',
  park_day: 'Парк',
  library_day: 'Библиотека',
};

export const SYSTEM_MESSAGES = ['SYS:ONLINE', 'MEM:OK', 'NET:READY', 'SCENE:ACTIVE'] as const;

export const MENU_PARTICLE_COUNTS = {
  low: { drift: 8, stream: 4, ember: 12, sparkle: 6 },
  medium: { drift: 14, stream: 6, ember: 24, sparkle: 12 },
  high: { drift: 20, stream: 10, ember: 40, sparkle: 20 },
} as const;

export const NEW_GAME_FADE_MS = 800;
