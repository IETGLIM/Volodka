import type { GameLifecycleEvents } from '@/engine/events/gameLifecycleEvents';

export type SystemAlertKind = GameLifecycleEvents['game:system_alert']['kind'];

const TITLES: Record<SystemAlertKind, string> = {
  save_failed: 'Ошибка сохранения',
  load_failed: 'Ошибка загрузки',
  load_recovered: 'Резервная копия',
};

export function getSystemAlertTitle(kind: SystemAlertKind): string {
  return TITLES[kind];
}

export function getSystemAlertDurationMs(kind: SystemAlertKind): number {
  return kind === 'load_recovered' ? 5000 : 4500;
}
