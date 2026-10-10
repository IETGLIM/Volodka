import type { ScheduleEntry } from '@/shared/types/game';
import type { LocationCategory } from '@/shared/types/locationCategory';

export const NPC_SCHEDULE_LABELS = {
  timelineAria: (npcId: string, summary: string) =>
    `Расписание персонажа ${npcId} на сутки: ${summary}`,
  segmentAria: (sceneName: string, startHour: number, endHour: number, activity: string) =>
    `${sceneName}, ${formatHourRange(startHour, endHour)}, ${activity}`,
  gapAria: (startHour: number, endHour: number) =>
    `Нет данных, ${formatHourRange(startHour, endHour)}`,
  currentLocationPrefix: 'Сейчас',
} as const;

export const SCHEDULE_ACTIVITY_LABELS = {
  sleep: 'Спит',
  work: 'Работает',
  read: 'Читает',
  rest: 'Отдыхает',
  walk: 'Гуляет',
  talk: 'Общается',
} as const satisfies Record<ScheduleEntry['activity'], string>;

export const TIMELINE_HOUR_MARKS = [0, 6, 12, 18, 24] as const;

export const HOURS_PER_DAY = 24;

export type LocationColorStyle = {
  bg: string;
  border: string;
  text: string;
  glow: string;
};

export const LOCATION_COLOR_STYLES: Record<LocationCategory, LocationColorStyle> = {
  home: {
    bg: 'rgba(100,116,139,0.65)',
    border: 'rgba(100,116,139,0.8)',
    text: '#94a3b8',
    glow: 'rgba(100,116,139,0.3)',
  },
  cafe: {
    bg: 'rgba(226,168,75,0.55)',
    border: 'rgba(226,168,75,0.7)',
    text: '#e2a84b',
    glow: 'rgba(226,168,75,0.25)',
  },
  office: {
    bg: 'rgba(16,185,129,0.55)',
    border: 'rgba(16,185,129,0.7)',
    text: '#57a874',
    glow: 'rgba(16,185,129,0.25)',
  },
  park: {
    bg: 'rgba(70,185,110,0.55)',
    border: 'rgba(70,185,110,0.7)',
    text: '#46b96e',
    glow: 'rgba(70,185,110,0.25)',
  },
  library: {
    bg: 'rgba(141,127,181,0.55)',
    border: 'rgba(141,127,181,0.7)',
    text: '#8d7fb5',
    glow: 'rgba(141,127,181,0.25)',
  },
  street: {
    bg: 'rgb(var(--cyber-cyan-rgb) / 0.45)',
    border: 'rgb(var(--cyber-cyan-rgb) / 0.65)',
    text: 'var(--cyber-cyan)',
    glow: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
  },
  factory: {
    bg: 'rgba(198,85,72,0.55)',
    border: 'rgba(198,85,72,0.7)',
    text: '#c65548',
    glow: 'rgba(198,85,72,0.25)',
  },
  rooftop: {
    bg: 'rgba(157,179,200,0.55)',
    border: 'rgba(157,179,200,0.7)',
    text: '#9db3c8',
    glow: 'rgba(157,179,200,0.25)',
  },
  corridor: {
    bg: 'rgba(100,116,139,0.5)',
    border: 'rgba(100,116,139,0.65)',
    text: '#94a3b8',
    glow: 'rgba(100,116,139,0.2)',
  },
  unknown: {
    bg: 'rgba(71,85,105,0.5)',
    border: 'rgba(71,85,105,0.65)',
    text: '#94a3b8',
    glow: 'rgba(71,85,105,0.2)',
  },
};

export const GAP_SEGMENT_STYLE = {
  bg: 'rgba(30,41,59,0.75)',
  border: 'rgba(51,65,85,0.6)',
} as const;

export const MARKER_STATIC_SHADOW =
  '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)';

export const MARKER_PULSE_SHADOW: string[] = [
  '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)',
  '0 0 10px rgba(255,255,255,1), 0 0 20px rgba(255,255,255,0.6)',
  '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)',
];

function formatHourRange(startHour: number, endHour: number): string {
  return `${String(startHour).padStart(2, '0')}:00–${String(endHour).padStart(2, '0')}:00`;
}

export { formatHourRange };
