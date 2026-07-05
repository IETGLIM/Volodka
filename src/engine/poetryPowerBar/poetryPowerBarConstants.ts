/** Number keys 1–5 and empty placeholder slots when fewer powers are collected. */
export const POETRY_POWER_BAR_MAX_SLOTS = 5;

export const POETRY_POWER_BAR_LABELS = {
  label: 'Способности',
  subtitle: 'стихи',
  barRegion: 'Панель поэтических способностей',
  ready: 'Готово к использованию',
  readyWithShortcut: (key: string) => `Готово к использованию [${key}]`,
  cooldown: (seconds: number) => `Перезарядка: ${seconds}с`,
  slotAria: (name: string, slotIndex: number) => `Способность «${name}», слот ${slotIndex}`,
  slotActivateAria: (name: string, slotIndex: number, shortcutKey: string | null) =>
    shortcutKey
      ? `Активировать способность «${name}», слот ${slotIndex}. Клавиша ${shortcutKey}.`
      : `Активировать способность «${name}», слот ${slotIndex}.`,
  activatedAnnouncement: (name: string) => `Активирована способность «${name}»`,
  onCooldown: (name: string, seconds: number) => `«${name}» на перезарядке: ${seconds} секунд`,
} as const;
