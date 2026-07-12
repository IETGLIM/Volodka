export const POETRY_COMPOSITION_ACCENT_RGB = '168, 85, 247';
export const POETRY_COMPOSITION_ACCENT_COLOR = `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.9)`;
export const POETRY_COMPOSITION_ACCENT_GLOW = `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 0.3)`;

export const POETRY_COMPOSITION_TOTAL_ROUNDS = 3;

export const POETRY_XP_REWARD_MIN = 5;
export const POETRY_XP_REWARD_MAX = 15;
export const POETRY_KARMA_REWARD_MIN = 2;
export const POETRY_KARMA_REWARD_MAX = 8;
export const POETRY_KARMA_SCORE_DIVISOR = 3;

export const POETRY_QUALITY_MASTER_THRESHOLD = 24;
export const POETRY_QUALITY_POET_THRESHOLD = 18;

export const POETRY_COMPOSITION_LABELS = {
  title: 'ПОЭТИЧЕСКИЙ ТРАНС',
  close: 'Закрыть мини-игру',
  closeEsc: 'Выйти из мини-игры',
  score: 'Очки:',
  roundCounter: (current: number, total: number) => `${current}/${total}`,
  themePrefix: 'тема:',
  wordBank: 'Слово: банк',
  instructionSelectBlank: 'Нажмите на пропуск, затем выберите слово',
  instructionPickWord: 'Выберите слово из банка для заполнения пропуска',
  instructionSr: 'Нажмите на пропуск, затем выберите слово из банка',
  nextRound: 'Следующий раунд →',
  finish: 'Завершить',
  allBlanksFilled: 'Все пропуски заполнены. Можно завершить раунд.',
  poemComplete: 'Стихотворение завершено',
  totalScore: 'Итого очков',
  roundScore: (round: number, points: number) => `Раунд ${round}: ${points} очков`,
  rewards: 'Награды',
  rewardXp: (value: number) => `+${value} XP`,
  rewardKarma: (value: number) => `+${value} карма`,
  rewardWriting: '+1 письмо',
  claimRewards: 'Забрать награды',
  qualityMaster: 'Мастер слова',
  qualityPoet: 'Поэт',
  qualityNovice: 'Новичок',
  blankEmpty: (index: number) => `Пропуск ${index}, пуст`,
  blankFilled: (index: number, word: string) => `Пропуск ${index}, заполнено: ${word}`,
  selectWord: (word: string) => `Выбрать слово «${word}»`,
  wordUsed: (word: string) => `Слово «${word}» уже использовано`,
  resultsSummary: (score: number, rating: string) =>
    `Стихотворение завершено. Итого ${score} очков. Рейтинг: ${rating}.`,
} as const;

export type PoetryCompositionGamePhase = 'playing' | 'results';
