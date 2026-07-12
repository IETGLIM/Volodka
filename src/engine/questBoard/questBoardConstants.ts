export { QUEST_BOARD_MAX_ACTIVE_MISSIONS } from '@/shared/quest/questBoardConstants';

export const QUEST_BOARD_TAB_IDS = {
  daily: 'quest-board-tab-daily',
  weekly: 'quest-board-tab-weekly',
  panel: 'quest-board-tabpanel',
} as const;

export const QUEST_BOARD_LABELS = {
  title: 'ДОСКА ЗАДАНИЙ',
  urlPath: 'volodka://quest-board',
  shortcut: 'B',
  tabDaily: 'Ежедневные',
  tabWeekly: 'Еженедельные',
  tabDailySelected: 'Вкладка ежедневных заданий',
  tabWeeklySelected: 'Вкладка еженедельных заданий',
  tabDailyCount: (count: number) => `${count} ежедневных заданий`,
  tabWeeklyCount: (count: number) => `${count} еженедельных заданий`,
  activeSection: 'Активные задания',
  availableSection: 'Доступные задания',
  accept: 'Принять',
  acceptMission: (title: string) => `Принять задание «${title}»`,
  acceptMissionDisabled: (title: string) =>
    `Нельзя принять «${title}»: достигнут лимит активных заданий`,
  acceptSlotsFull: 'Достигнут лимит активных заданий',
  abandon: 'Отказаться',
  abandonMission: (title: string) => `Отказаться от задания «${title}»`,
  claim: 'Забрать',
  claimMission: (title: string) => `Забрать награду за «${title}»`,
  claimed: 'Получено',
  missionAria: (title: string) => `Задание: ${title}`,
  missionListRegion: 'Список заданий',
  tabListRegion: 'Вкладки заданий',
  activeMissionsList: 'Активные задания',
  availableMissionsList: 'Доступные задания',
  rewardsRegion: 'Награды',
  headerActiveBadge: (count: number) => `${count} активных`,
  headerActiveBadgeFull: (count: number, max: number) => `${count} из ${max} активных — лимит достигнут`,
  resetTimer: (timeLeft: string) => `До сброса: ${timeLeft}`,
  rewardXp: 'Опыт',
  rewardCredits: 'Кредиты',
  rewardKarma: 'Карма',
  resetSoon: 'Скоро сброс',
  resetDaysHours: (days: number, hours: number) => `${days}д ${hours % 24}ч`,
  resetHoursMinutes: (hours: number, minutes: number) => `${hours}ч ${minutes}м`,
  emptyTitle: 'Нет доступных заданий',
  emptyHint: 'Наберите уровень, чтобы открыть больше миссий',
  headerActiveSuffix: 'активных',
  footerStats: (active: number, completed: number, max: number) =>
    `Активных: ${active} • Выполнено: ${completed} • Максимум: ${max}`,
  objectiveProgress: (current: number, target: number, description: string) =>
    `${description}: ${current} из ${target}`,
  objectiveComplete: (description: string) => `Выполнено: ${description}`,
} as const;

export const QUEST_BOARD_DIFFICULTY_DIAMOND_COUNT = {
  easy: 1,
  medium: 2,
  hard: 3,
} as const;
