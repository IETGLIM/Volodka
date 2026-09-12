import { RU_MESSAGES } from './messages/ru';

export type GameLocale = 'ru';

const MESSAGES: Readonly<Record<GameLocale, Readonly<Record<string, string>>>> = {
  ru: RU_MESSAGES,
};

let activeLocale: GameLocale = 'ru';

export function getLocale(): GameLocale {
  return activeLocale;
}

/* Плейсхолдеры (этап 115, волна 2): шаблоны вида «Карма {delta}».
 * Имя токена — ASCII-идентификатор; одиночные фигурные скобки без валидного
 * имени (например, «{» или «{}») интерполяцией не считаются и остаются как есть. */
const PLACEHOLDER_PATTERN = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * Resolve a message key with Russian fallback from data definitions.
 *
 * Третий аргумент — необязательные параметры для шаблона каталога:
 * t('hud.toast.karma', 'Карма {delta}', { delta: '+5' }). Если ключа нет в
 * каталоге, интерполируется фолбэк; неизвестные параметры остаются в шаблоне
 * как «{имя}». Вызовы без params ведут себя ровно как раньше (волна 1).
 */
export function t(
  key: string,
  fallback: string,
  params?: Readonly<Record<string, string | number>>,
): string {
  const template = MESSAGES[activeLocale][key] ?? fallback;
  if (params === undefined) return template;
  return template.replace(PLACEHOLDER_PATTERN, (token: string, name: string) => {
    const value = params[name];
    return value === undefined ? token : String(value);
  });
}

/** Test-only locale switch. */
export function setLocaleForTests(locale: GameLocale): void {
  activeLocale = locale;
}
