import { RU_MESSAGES } from './messages/ru';

export type GameLocale = 'ru';

const MESSAGES: Readonly<Record<GameLocale, Readonly<Record<string, string>>>> = {
  ru: RU_MESSAGES,
};

let activeLocale: GameLocale = 'ru';

export function getLocale(): GameLocale {
  return activeLocale;
}

/** Resolve a message key with Russian fallback from data definitions. */
export function t(key: string, fallback: string): string {
  return MESSAGES[activeLocale][key] ?? fallback;
}

/** Test-only locale switch. */
export function setLocaleForTests(locale: GameLocale): void {
  activeLocale = locale;
}
