import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RU_MESSAGES } from './ru';

/* ─── Контракт i18n-покрытия HUD (этап 115) ───
 *
 * Сканируем все .ts/.tsx под src/ (без node_modules/dist), собираем регэкспом
 * каждый первый строковый аргумент t('...')-вызовов, фильтруем ключи hud.* и
 * проверяем, что каждый из них присутствует в RU_MESSAGES с непустым значением.
 *
 * Примечание: ключи ДИНАМИЧЕСКИХ (составных) HUD-строк передаются в t() через
 * константы и сознательно не лежат в каталоге — статичная запись
 * RU_MESSAGES[key] перебила бы интерполяцию значений внутри fallback
 * (t() вернул бы шаблон вместо подставленных чисел). Такой вызов вида
 * t(SOME_KEY, `шаблон ${x}`) регэксп не собирает — контракт на них не распространяется.
 */

const SRC_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const HUD_KEY_RE = /\bt\(\s*'([^']+)'/g;

function walkTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectHudKeys(): string[] {
  const keys = new Set<string>();
  for (const file of walkTsFiles(SRC_ROOT)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(HUD_KEY_RE)) {
      const key = match[1];
      if (key.startsWith('hud.')) keys.add(key);
    }
  }
  return [...keys].sort();
}

describe('i18n: покрытие HUD-строк (этап 115)', () => {
  const hudKeys = collectHudKeys();

  it('находит не менее 60 hud.* ключей в t()-вызовах по src/', () => {
    expect(hudKeys.length).toBeGreaterThanOrEqual(60);
  });

  it('каждый найденный hud.* ключ есть в RU_MESSAGES с непустым значением', () => {
    const missing = hudKeys.filter((key) => {
      const value = RU_MESSAGES[key];
      return typeof value !== 'string' || value.length === 0;
    });
    expect(missing).toEqual([]);
  });

  it('значения каталога для hud.* ключей совпадают с fallback-литералами потребителей', () => {
    /* Контракт этапа 115: t(key, fallback) должен возвращать байт-в-байт тот же
     * текст, что и прежний литерал. Проверяем это на представительных ключах
     * (полная сверка пар «ключ → литерал» живёт в самих потребителях). */
    expect(RU_MESSAGES['hud.playerStatus.aria']).toBe('Состояние героя: энергия, стресс, карма');
    expect(RU_MESSAGES['hud.karmaTier.neutral']).toBe('Нейтральная');
    expect(RU_MESSAGES['hud.questCard.type.main']).toBe('ОСНОВНОЙ');
    expect(RU_MESSAGES['hud.questCard.collapse']).toBe('Свернуть ▲');
    expect(RU_MESSAGES['hud.toolbar.journal']).toBe('Журнал');
    expect(RU_MESSAGES['hud.save.toast']).toBe('Запись сохранена');
    expect(RU_MESSAGES['hud.stamina.initialAria']).toBe('Выносливость: 100%');
    expect(RU_MESSAGES['hud.emergency.more']).toBe('…и другие');
    /* Волна 3 (v4.28.0): WeatherIndicator / DayNight / Compass / Minimap /
     * QuickUse / MobileActions / AaaImmersiveGuide */
    expect(RU_MESSAGES['hud.weather.title']).toBe('Погода');
    expect(RU_MESSAGES['hud.dayNight.aria']).toBe('Время суток: {phase}, {time}');
    expect(RU_MESSAGES['hud.compass.heading.north']).toBe('Север');
    expect(RU_MESSAGES['hud.minimap.expand']).toBe('Развернуть миникарту');
    expect(RU_MESSAGES['hud.quickUse.useAria']).toBe('Использовать {item} [{slot}] (ПКМ — назначить)');
    expect(RU_MESSAGES['hud.mobileActions.noStamina']).toBe('Не хватает выносливости для удара');
    expect(RU_MESSAGES['hud.guide.firstInteract']).toBe('Руки помнят — нажми, потяни, послушай, что ответит.');
    expect(RU_MESSAGES['hud.minimap.distance']).toBe('{n} м');
  });
});
