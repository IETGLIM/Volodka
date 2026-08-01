import type { StingerId } from '@/engine/audio/SfxEngine';

/** Visual preset executed by executePoemWorldVisuals + PoemWorldEffect overlay. */
export type PoemWorldVisualPreset =
  | 'letterbox_truth'
  | 'god_rays_gold'
  | 'storm_break'
  | 'shield_pulse'
  | 'warm_echo'
  | 'matrix_pulse';

export type PoemWorldCategory =
  | 'exploration'
  | 'dialogue'
  | 'combat'
  | 'defense'
  | 'social'
  | 'utility';

/** Narrative-visible world response hint — read by HUD / interaction layers. */
export type PoemWorldHint = 'exit_glow' | 'npc_shimmer' | 'interaction_pulse' | 'none';

export interface PoemWorldEffectProfile {
  category: PoemWorldCategory;
  visualPreset: PoemWorldVisualPreset;
  audioCue: StingerId;
  durationMs: number;
  worldTint?: string;
  narrationLine?: string;
  worldHint: PoemWorldHint;
  /** Link poem hint flags to exploration highlight colors (see poemExplorationHighlight). */
  highlightColor?: string;
}

/** Per-hint exploration beam colors — synced with InteractiveTriggers. */
export const POEM_WORLD_HINT_HIGHLIGHT_COLORS: Record<Exclude<PoemWorldHint, 'none'>, string> = {
  exit_glow: '#ffd866',
  npc_shimmer: '#a8e6ff',
  interaction_pulse: '#66ffcc',
};

export const POEM_WORLD_CATEGORY_DEFAULTS: Record<PoemWorldCategory, PoemWorldEffectProfile> = {
  exploration: {
    category: 'exploration',
    visualPreset: 'god_rays_gold',
    audioCue: 'discovery',
    durationMs: 4500,
    worldTint: 'rgba(255, 215, 100, 0.12)',
    narrationLine: 'Мир приоткрывает дверь. Ты видишь то, чего не замечал.',
    worldHint: 'exit_glow',
  },
  dialogue: {
    category: 'dialogue',
    visualPreset: 'letterbox_truth',
    audioCue: 'emotional',
    durationMs: 4000,
    worldTint: 'rgba(200, 240, 255, 0.10)',
    narrationLine: 'Смерть — не конец. Она просто перезагружает процесс.',
    worldHint: 'npc_shimmer',
  },
  combat: {
    category: 'combat',
    visualPreset: 'storm_break',
    audioCue: 'danger',
    durationMs: 3500,
    worldTint: 'rgba(255, 60, 60, 0.14)',
    narrationLine: 'Код — это тоже стихия. Просто рифма измеряется в наносекундах.',
    worldHint: 'none',
  },
  defense: {
    category: 'defense',
    visualPreset: 'shield_pulse',
    audioCue: 'tension',
    durationMs: 4000,
    worldTint: 'rgba(80, 140, 255, 0.12)',
    narrationLine: 'Любовь — единственный баг, который не хочется фиксить.',
    worldHint: 'none',
  },
  social: {
    category: 'social',
    visualPreset: 'warm_echo',
    audioCue: 'emotional',
    durationMs: 4000,
    worldTint: 'rgba(255, 180, 120, 0.10)',
    narrationLine: 'Эхо чужих слов — как Wi-Fi из соседней комнаты: ловишь обрывки, но подключиться не можешь.',
    worldHint: 'npc_shimmer',
  },
  utility: {
    category: 'utility',
    visualPreset: 'matrix_pulse',
    audioCue: 'mystery',
    durationMs: 3500,
    worldTint: 'rgba(0, 255, 200, 0.08)',
    worldHint: 'interaction_pulse',
  },
};

/** Per-poem overrides — full profiles for representative poems; others use category defaults. */
export const POEM_WORLD_EFFECT_OVERRIDES: Partial<Record<string, Partial<PoemWorldEffectProfile>>> = {
  poem_1: {
    category: 'dialogue',
    visualPreset: 'letterbox_truth',
    audioCue: 'emotional',
    durationMs: 4200,
    worldTint: 'rgba(220, 245, 255, 0.14)',
    narrationLine: '«Слово режет ложь — и мир замирает, чтобы услышать правду.»',
    worldHint: 'npc_shimmer',
  },
  poem_3: {
    category: 'exploration',
    visualPreset: 'god_rays_gold',
    audioCue: 'discovery',
    durationMs: 5500,
    worldTint: 'rgba(255, 220, 80, 0.18)',
    narrationLine: '«Звезда вспыхивает сквозь неон — путь проступает из тьмы.»',
    worldHint: 'exit_glow',
  },
  poem_5: {
    category: 'combat',
    visualPreset: 'storm_break',
    audioCue: 'danger',
    durationMs: 3800,
    worldTint: 'rgba(255, 80, 40, 0.16)',
    narrationLine: '«Штормовой ветер срывает преграды — мир дрожит от напора слова.»',
    worldHint: 'interaction_pulse',
  },
  poem_10: {
    category: 'defense',
    visualPreset: 'shield_pulse',
    audioCue: 'tension',
    durationMs: 4500,
    worldTint: 'rgba(100, 160, 255, 0.15)',
    narrationLine: '«Каменная кожа — стих становится бронёй вокруг тела.»',
    worldHint: 'none',
  },
  poem_7: {
    category: 'exploration',
    visualPreset: 'god_rays_gold',
    audioCue: 'mystery',
    durationMs: 4800,
    worldTint: 'rgba(184, 240, 255, 0.14)',
    narrationLine: '«Детский взгляд видит то, что взрослые перестали замечать.»',
    worldHint: 'interaction_pulse',
  },
  poem_16: {
    category: 'social',
    visualPreset: 'warm_echo',
    audioCue: 'emotional',
    durationMs: 4800,
    worldTint: 'rgba(255, 200, 140, 0.14)',
    narrationLine: '«Эхо детства отзывается в воздухе — память согревает мир.»',
    worldHint: 'npc_shimmer',
  },
  poem_8: {
    category: 'utility',
    visualPreset: 'matrix_pulse',
    audioCue: 'discovery',
    durationMs: 5000,
    worldTint: 'rgba(0, 255, 180, 0.12)',
    narrationLine: '«Прорыв — когда код становится стихом, а стена становится дверью.»',
    worldHint: 'interaction_pulse',
  },
  poem_9: {
    category: 'dialogue',
    visualPreset: 'letterbox_truth',
    audioCue: 'mystery',
    durationMs: 4200,
    worldTint: 'rgba(255, 100, 200, 0.10)',
    narrationLine: '«Шутовское слово бьёт точнее меча — правда звучит как смех.»',
    worldHint: 'npc_shimmer',
  },
  poem_11: {
    category: 'exploration',
    visualPreset: 'god_rays_gold',
    audioCue: 'discovery',
    durationMs: 5200,
    worldTint: 'rgba(200, 255, 180, 0.12)',
    narrationLine: '«Голос улиц шепчет названия тех, кого ты ещё не встретил.»',
    worldHint: 'exit_glow',
  },
  poem_12: {
    category: 'exploration',
    visualPreset: 'god_rays_gold',
    audioCue: 'mystery',
    durationMs: 6000,
    worldTint: 'rgba(180, 140, 255, 0.14)',
    narrationLine: '«Звёздный путь — не линия, а ритм. Каждый шаг — новая строфа.»',
    worldHint: 'exit_glow',
  },
  poem_2: {
    category: 'social',
    visualPreset: 'warm_echo',
    audioCue: 'emotional',
    durationMs: 5500,
    worldTint: 'rgba(255, 160, 160, 0.12)',
    narrationLine: '«Второе дыхание — когда смерть становится началом нового стиха.»',
    worldHint: 'npc_shimmer',
  },
  poem_18: {
    category: 'dialogue',
    visualPreset: 'letterbox_truth',
    audioCue: 'discovery',
    durationMs: 4800,
    worldTint: 'rgba(220, 220, 255, 0.14)',
    narrationLine: '«Возвращение правды — мир перестраивается вокруг одного слова.»',
    worldHint: 'npc_shimmer',
  },
  poem_4: {
    category: 'social',
    visualPreset: 'warm_echo',
    audioCue: 'emotional',
    durationMs: 5000,
    worldTint: 'rgba(255, 200, 200, 0.14)',
    narrationLine: '«Связь сердец — невидимый кабель между тем, кто рядом и тем, кого нет.»',
    worldHint: 'npc_shimmer',
  },
};

/** Default category per poem id — covers all PoemPowerSystem entries. */
export const POEM_WORLD_CATEGORIES: Record<string, PoemWorldCategory> = {
  // ── Main corpus (poem_1–21) ──
  poem_1: 'dialogue',
  poem_2: 'social',
  poem_3: 'exploration',
  poem_4: 'social',
  poem_5: 'combat',
  poem_6: 'dialogue',
  poem_7: 'exploration',
  poem_8: 'utility',
  poem_9: 'dialogue',
  poem_10: 'defense',
  poem_11: 'exploration',
  poem_12: 'exploration',
  poem_13: 'dialogue',
  poem_14: 'utility',
  poem_15: 'dialogue',
  poem_16: 'social',
  poem_17: 'social',
  poem_18: 'dialogue',
  poem_19: 'social',
  poem_20: 'utility',
  poem_21: 'utility',
  // ── Numbered bonus poems (poem_22–35) ──
  poem_22: 'exploration',  // Коридор — liminal discovery
  poem_23: 'utility',      // Высотники — urban observation
  poem_24: 'utility',      // Ночная Смена — work/tech
  poem_25: 'social',       // Переработка — human cost
  poem_26: 'combat',       // Сообщения — connection/rage
  poem_27: 'dialogue',     // Метро — crowd voices
  poem_28: 'exploration',  // return void — code as poetry
  poem_29: 'dialogue',     // Комментарий — inner voice
  poem_30: 'social',       // Мёртвый телефон — analog nostalgia
  poem_31: 'exploration',  // До башен — urban exploration
  poem_32: 'utility',      // (if exists)
  poem_33: 'utility',      // (if exists)
  poem_34: 'exploration',  // (if exists)
  poem_35: 'defense',      // (if exists)
  // ── Special bonus poems ──
  poem_tolpa: 'social',
  poem_act6_01: 'exploration',
  poem_act6_02: 'dialogue',
  poem_act6_03: 'combat',
  poem_act6_04: 'combat',
  poem_act6_05: 'dialogue',
  poem_act6_06: 'defense',
  poem_act6_07: 'utility',
  poem_act6_08: 'social',
  poem_act7_01: 'dialogue',
  poem_act7_ending: 'dialogue',
};

export const POEM_WORLD_FALLBACK_CATEGORY: PoemWorldCategory = 'utility';
