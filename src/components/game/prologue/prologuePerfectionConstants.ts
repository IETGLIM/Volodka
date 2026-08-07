/**
 * Идеальный старт "С пролога" — константы для ошеломительного UX.
 * ИСПРАВЛЕНО: единый источник истины outer phase boot->breath->title->handoff
 * eyeOpen — subPhase внутри breath, а не отдельная outer фаза.
 */

export const PROLOGUE_PERFECTION = {
  bootLinesPerCharMs: 12,
  bootLinePauseMs: 85,
  bootTotalTargetMs: 4200,
  breathDurationMs: 2200,
  eyeOpenDurationMs: 1400,
  titleCardDurationMs: 2400,

  innerMonologue: [
    'Система загружается... Память фрагментирована на 37%.',
    '06:47. Комната 3×4. Воздух пахнет вчерашним кофе и старой проводкой.',
    'Ты — Володня. IT-специалист. Телефон мертв, тикет висит, блокнот со стихами открыт на середине.',
  ] as const,

  poemGhosts: [
    'Смерть есть лишь начало.',
    'Мой город не отпустит меня к тебе.',
    'Я камень. Домом служит сырая земля.',
  ] as const,

  preloadStoryNodes: ['start', 'explore_mode', 'room_table', 'room_bed', 'room_terminal'] as const,

  filmGrainOpacity: 0.07,
  vignetteStrength: 0.55,
  scanlineOpacity: 0.04,
} as const;

export type ProloguePhase = 'boot' | 'breath' | 'eyeOpen' | 'title' | 'handoff';
