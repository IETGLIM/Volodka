import { describe, expect, it } from 'vitest';
import { t } from '@/i18n';

describe('i18n', () => {
  it('resolves ambient keys from ru catalog', () => {
    expect(t('ambient.cafe.label', 'fallback')).toBe('Кафе');
  });

  it('falls back when key is missing', () => {
    expect(t('missing.key', 'Запасной текст')).toBe('Запасной текст');
  });

  /* ─── Этап 115 (волна 2): плейсхолдеры {name} ─── */

  it('интерполирует параметры в шаблоне из каталога', () => {
    expect(t('hud.toast.karma', 'Карма {delta}', { delta: '+5' })).toBe('Карма +5');
    expect(t('hud.toast.skill', 'Навык: {name} {delta}', { name: 'Письмо', delta: '-2' }))
      .toBe('Навык: Письмо -2');
  });

  it('интерполирует параметры в фолбэке, когда ключа нет в каталоге', () => {
    expect(t('missing.template', 'Награда за «{title}»: {rewards}', {
      title: 'Эхо пирса',
      rewards: '55 кредитов, 4 кармы',
    })).toBe('Награда за «Эхо пирса»: 55 кредитов, 4 кармы');
  });

  it('числовые параметры приводятся к строке', () => {
    expect(t('missing.template', 'Поражение: -{n} энергии', { n: 12 }))
      .toBe('Поражение: -12 энергии');
  });

  it('неизвестный параметр остаётся в шаблоне как литерал {имя}', () => {
    expect(t('missing.template', 'Значение: {unknown}', { known: '1' }))
      .toBe('Значение: {unknown}');
  });

  it('вызов без params не трогает фигурные скобки (совместимость с волной 1)', () => {
    expect(t('missing.template', 'Буквально {delta} без подстановки')).toBe(
      'Буквально {delta} без подстановки',
    );
  });

  it('одиночные/незакрытые скобки не считаются плейсхолдерами', () => {
    expect(t('missing.template', 'Скобки {} и { и } на месте', { x: '1' })).toBe(
      'Скобки {} и { и } на месте',
    );
  });
});
