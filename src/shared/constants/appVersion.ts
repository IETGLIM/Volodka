import pkg from '../../../package.json';

/** Runtime app version — single source of truth from package.json. */
export const APP_VERSION = pkg.version;

/** v4.36.1: SHA коммита, вшитый в бандл на сборке (define __BUILD_SHA__ в
 *  vite.config). 'dev' — вне production-сборки (vitest/HSR). Чип версии в
 *  меню показывает «версия · sha»: пользователь без инструментов видит, какой
 *  коммит реально играет (прод застревал на 132 коммита позади незамеченным). */
declare const __BUILD_SHA__: string | undefined;
export const APP_BUILD_SHA: string =
  typeof __BUILD_SHA__ === 'string' && __BUILD_SHA__.length > 0 ? __BUILD_SHA__ : 'dev';

/** Полная билд-метка для UI: «4.36.1 · a1b2c3d». */
export const APP_BUILD = `${APP_VERSION} · ${APP_BUILD_SHA}`;
