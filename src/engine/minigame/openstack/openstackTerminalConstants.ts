import type { OpenStackGamePhase, OpenStackPlayPhase } from '@/engine/minigame/openstack/openstackTerminalTypes';

export const OPENSTACK_TIME_LIMIT_SEC = 60;
export const OPENSTACK_ALERT_DURATION_MS = 2500;
export const OPENSTACK_COMMAND_DELAY_MS = 700;
export const OPENSTACK_PHASE_ADVANCE_MS = 800;
export const OPENSTACK_RETRY_DELAY_MS = 600;

export const OPENSTACK_TERMINAL_COLORS = {
  prompt: '#88ccaa',
  command: '#44ff88',
  success: '#44ff88',
  error: '#ff4444',
  phase: '#ffcc00',
  muted: '#6a8a9a',
  hint: '#4a6a5a',
  alert: '#ff4444',
  alertSub: '#ff6644',
} as const;

export const OPENSTACK_TERMINAL_LABELS = {
  dialogTitle: 'OpenStack терминал',
  headerTitle: 'OPENSTACK ТЕРМИНАЛ',
  close: 'Закрыть',
  closeAria: 'Закрыть мини-игру',
  timerSeconds: (seconds: number) => `${seconds}с`,
  phaseCounter: (current: number, total: number) => `${current}/${total}`,
  alertTitle: 'КРИТИЧЕСКАЯ ОШИБКА СЕРВЕРА',
  alertSubtitle: 'OpenStack Nova: инстанс srv-prod — статус ERROR',
  alertInit: 'Инициализация терминала диагностики...',
  commandsHeading: 'Доступные команды:',
  commandAria: (index: number, command: string) => `Команда ${index}: ${command}`,
  keyboardHint: (count: number) => `Нажмите 1-${count} для выбора · Esc — выход`,
  phaseHeader: (phaseNumber: number, title: string) => `─── ФАЗА ${phaseNumber}: ${title} ───`,
  promptPrefix: 'root@openstack-controller:~# ',
  successTitle: 'КРИЗИС ПРЕДОТВРАЩЁН!',
  successBody: 'Сервер srv-prod восстановлен. Статус: ACTIVE',
  successAlreadyTitle: 'СЕРВЕР УЖЕ ВОССТАНОВЛЕН',
  successAlreadyBody: 'Кризис OpenStack был решён ранее. Повторная награда не выдаётся.',
  failureTitle: 'ВРЕМЯ ВЫШЛО!',
  failureBody: 'Сервер srv-prod не восстановлен. Кризис продолжается.',
  rewardCoding: '+5 программирование',
  rewardKarma: '+3 карма',
  penaltyStress: '+3 стресс',
  liveRegionProcessing: 'Выполняется команда…',
  liveRegionSuccess: 'Команда выполнена успешно.',
  liveRegionFailure: 'Команда неверна. Попробуйте снова.',
  outcomeSuccessAlert: 'Кризис OpenStack предотвращён.',
  outcomeFailureAlert: 'Время на восстановление OpenStack истекло.',
} as const;

export const OPENSTACK_PLAY_PHASES: OpenStackPlayPhase[] = ['diagnose', 'isolate', 'repair'];

export function isOpenStackPlayPhase(phase: OpenStackGamePhase): phase is OpenStackPlayPhase {
  return (OPENSTACK_PLAY_PHASES as readonly string[]).includes(phase);
}

export function isTimerActivePhase(phase: OpenStackGamePhase): boolean {
  return isOpenStackPlayPhase(phase);
}
