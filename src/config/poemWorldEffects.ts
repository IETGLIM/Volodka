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
}

export const POEM_WORLD_CATEGORY_DEFAULTS: Record<PoemWorldCategory, PoemWorldEffectProfile> = {
  exploration: {
    category: 'exploration',
    visualPreset: 'god_rays_gold',
    audioCue: 'discovery',
    durationMs: 4500,
    worldTint: 'rgba(255, 215, 100, 0.12)',
    worldHint: 'exit_glow',
  },
  dialogue: {
    category: 'dialogue',
    visualPreset: 'letterbox_truth',
    audioCue: 'emotional',
    durationMs: 4000,
    worldTint: 'rgba(200, 240, 255, 0.10)',
    worldHint: 'npc_shimmer',
  },
  combat: {
    category: 'combat',
    visualPreset: 'storm_break',
    audioCue: 'danger',
    durationMs: 3500,
    worldTint: 'rgba(255, 60, 60, 0.14)',
    worldHint: 'none',
  },
  defense: {
    category: 'defense',
    visualPreset: 'shield_pulse',
    audioCue: 'tension',
    durationMs: 4000,
    worldTint: 'rgba(80, 140, 255, 0.12)',
    worldHint: 'none',
  },
  social: {
    category: 'social',
    visualPreset: 'warm_echo',
    audioCue: 'emotional',
    durationMs: 4000,
    worldTint: 'rgba(255, 180, 120, 0.10)',
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
  poem_16: {
    category: 'social',
    visualPreset: 'warm_echo',
    audioCue: 'emotional',
    durationMs: 4800,
    worldTint: 'rgba(255, 200, 140, 0.14)',
    narrationLine: '«Эхо детства отзывается в воздухе — память согревает мир.»',
    worldHint: 'npc_shimmer',
  },
};

/** Default category per poem id — covers all PoemPowerSystem entries. */
export const POEM_WORLD_CATEGORIES: Record<string, PoemWorldCategory> = {
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
  poem_tolpa: 'social',
  poem_act6_04: 'combat',
  poem_act6_05: 'dialogue',
  poem_act6_07: 'utility',
};

export const POEM_WORLD_FALLBACK_CATEGORY: PoemWorldCategory = 'utility';
