export type MinigameHubGameType =
  | 'codebreaker'
  | 'openstack_terminal'
  | 'bash_terminal'
  | 'poetry'
  | 'hacking'
  | 'memory'
  | 'quiz'
  | 'rhythm';

export type MinigameHubGameDef = {
  gameType: MinigameHubGameType;
  icon: string;
  name: string;
  description: string;
  difficulty: number;
  accentColor: string;
  accentRgb: string;
  borderGlow: string;
  maxDifficulty: number;
};

export const MINIGAME_HUB_GAMES: readonly MinigameHubGameDef[] = [
  {
    gameType: 'codebreaker',
    icon: '🔓',
    name: 'Взломщик кода',
    description: 'Расшифруйте код доступа к системе безопасности',
    difficulty: 3,
    accentColor: 'rgb(var(--cyber-cyan-rgb) / 0.9)',
    accentRgb: '0, 229, 255',
    borderGlow: 'rgb(var(--cyber-cyan-rgb) / 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'openstack_terminal',
    icon: '☁️',
    name: 'Терминал OpenStack',
    description: 'Управляйте облачной инфраструктурой через терминал',
    difficulty: 4,
    accentColor: 'rgba(251, 191, 36, 0.9)',
    accentRgb: '251, 191, 36',
    borderGlow: 'rgba(251, 191, 36, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'bash_terminal',
    icon: '⌨️',
    name: 'Терминал Bash',
    description: 'Выполняйте команды Linux для решения задач',
    difficulty: 5,
    accentColor: 'rgba(244, 63, 94, 0.9)',
    accentRgb: '244, 63, 94',
    borderGlow: 'rgba(244, 63, 94, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'poetry',
    icon: '✨',
    name: 'Поэтический транс',
    description: 'Составьте стихи из слов, чтобы раскрыть скрытые смыслы',
    difficulty: 2,
    accentColor: 'rgba(168, 85, 247, 0.9)',
    accentRgb: '168, 85, 247',
    borderGlow: 'rgba(168, 85, 247, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'hacking',
    icon: '🔓',
    name: 'Сетевой взлом',
    description: 'Пройдите через сеть к целевому серверу, избегая сканеров',
    difficulty: 3,
    accentColor: 'rgba(239, 68, 68, 0.9)',
    accentRgb: '239, 68, 68',
    borderGlow: 'rgba(239, 68, 68, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'memory',
    icon: '🧠',
    name: 'Нейросеть',
    description: 'Запомните и повторите паттерн нейронной сети',
    difficulty: 2,
    accentColor: 'rgba(52, 211, 153, 0.9)',
    accentRgb: '52, 211, 153',
    borderGlow: 'rgba(52, 211, 153, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'quiz',
    icon: '📡',
    name: 'Кибер-викторина',
    description: 'Проверьте знания о кибер-мире в trivia-викторине',
    difficulty: 2,
    accentColor: 'rgba(56, 189, 248, 0.9)',
    accentRgb: '56, 189, 248',
    borderGlow: 'rgba(56, 189, 248, 0.3)',
    maxDifficulty: 5,
  },
  {
    gameType: 'rhythm',
    icon: '🎵',
    name: 'Кибер-ритм',
    description: 'Нажимайте клавиши в такт кибер-музыке',
    difficulty: 3,
    accentColor: 'rgba(236, 72, 153, 0.9)',
    accentRgb: '236, 72, 153',
    borderGlow: 'rgba(236, 72, 153, 0.3)',
    maxDifficulty: 5,
  },
] as const;

export const MINIGAME_HUB_LABELS = {
  title: 'Аркада',
  subtitle: 'volodka://minigames — Быстрый доступ к мини-играм',
  terminalPath: 'volodka://minigames',
  difficulty: 'Сложность',
  launch: 'Запуск',
  launchAria: (name: string) => `Запустить ${name}`,
  closeAria: 'Закрыть аркаду',
  backHint: 'назад',
  openAnnouncement: 'Аркада открыта. Выберите мини-игру стрелками или геймпадом.',
  closeAnnouncement: 'Аркада закрыта.',
  unavailableTitle: 'Игра недоступна',
  unavailableNoHandler: 'Запуск мини-игры временно недоступен.',
  unavailableUnknown: 'Неизвестный тип игры.',
} as const;

/** Minimum card body height so descriptions of different lengths align in the grid. */
export const MINIGAME_CARD_MIN_HEIGHT_PX = 280;
