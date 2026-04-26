/**
 * Текст «консоли стойки» перед мини-игрой узлов (`volodka_rack_hack`).
 * Тон: ночная смена, мониторинг, техдолг процессов — без спойлеров сюжета.
 */

export const VOLODKA_RACK_CONSOLE_HEADLINE = 'volodka-desk-01 · heartbeats / prod';

export const VOLODKA_RACK_CONSOLE_LINES = [
  'session: duty_night · tty=pts/0 · pager=ACK-only',
  '',
  '$ kubectl config current-context',
  '  prod-heartbeat · namespace: on-call-memorial',
  '',
  '$ trace-heartbeat --sample 3s',
  '  dashboards: nominal · human latency: elevated · silence: preserved',
  '',
  '⚠ OUT-OF-BAND: принудительная синхронизация стойки обходит журнал изменений.',
  '  Если идёте дальше — вы принимаете цену доверия и сна.',
] as const;

export const VOLODKA_RACK_CONSOLE_PROCEED_LABEL = 'Принудительная синхронизация (матрица узлов)';

export const VOLODKA_RACK_CONSOLE_DISMISS_LABEL = 'Закрыть консоль';
