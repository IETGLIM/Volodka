/**
 * Идеальный старт "С пролога" — константы для ошеломительного UX.
 * Оптимизация: все фазы маскируют загрузку WASM + GLB.
 */

export const PROLOGUE_PERFECTION = {
  // Timings — жесты, а не задержки. Все скипается.
  bootLinesPerCharMs: 12, // ~120 WPM как настоящий терминал
  bootLinePauseMs: 85,
  bootTotalTargetMs: 4200, // целевое время фазы boot — за это время грузим физику
  breathDurationMs: 2200,
  eyeOpenDurationMs: 1400,
  titleCardDurationMs: 2400,

  // Тексты — Disco Elysium inner monologue
  innerMonologue: [
    'Система загружается... Память фрагментирована на 37%.',
    '06:47. Комната 3×4. Воздух пахнет вчерашним кофе и старой проводкой.',
    'Ты — Володня. IT-специалист. Телефон мертв, тикет висит, блокнот со стихами открыт на середине.',
  ] as const,

  // Поэтические призраки за boot-линиями
  poemGhosts: [
    'Смерть есть лишь начало.',
    'Мой город не отпустит меня к тебе.',
    'Я камень. Домом служит сырая земля.',
  ] as const,

  // Прелоад — что грузим пока игрок читает boot
  preloadStoryNodes: ['start', 'explore_mode', 'room_table', 'room_bed', 'room_terminal'] as const,

  // Камеры и эффекты
  filmGrainOpacity: 0.07,
  vignetteStrength: 0.55,
  scanlineOpacity: 0.04,
} as const;

export type ProloguePhase =
  | 'boot'
  | 'breath'
  | 'eyeOpen'
  | 'title'
  | 'handoff';
