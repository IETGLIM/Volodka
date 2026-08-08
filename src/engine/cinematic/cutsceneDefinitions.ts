/**
 * Volodka RPG – Preset-based Cutscene Definitions
 *
 * 4 cinematic cutscenes using camera presets from cinematicCameraPresets.ts.
 * Each cutscene is a CinematicTimelineDef with 'preset' camera motions anchored
 * to a subject position. Usable directly by startCinematicTimeline().
 *
 * Narration text is Russian — NOT poems, just story narration lines.
 */

import type { CinematicTimelineDef, CinematicTimelinePhase } from './cinematicTimelineTypes';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export interface CutsceneShotDef {
  /** Camera preset ID (must exist in CINEMATIC_CAMERA_PRESETS) */
  presetId: string;
  /** Duration of this shot in seconds */
  duration: number;
  /** Narration line displayed during this shot (Russian). Empty = no text. */
  narration: string;
  /** Optional light cue for this shot */
  lightCue?: 'neon_surge' | 'dim_hold' | 'warm_practical';
  /** Optional camera shake */
  cameraShake?: { intensity: number; frequency?: number };
  /** Fade-in for overlay text (ms) */
  fadeInMs?: number;
}

export interface PresetCutsceneDef {
  id: string;
  description: string;
  /** World position of the subject (player/NPC) for camera anchoring */
  subjectPos: [number, number, number];
  /** Subject facing direction (Y-axis radians) */
  subjectFacing?: number;
  /** Ordered shots */
  shots: CutsceneShotDef[];
  /** Accent color for text overlays */
  accentColor?: string;
  /** Letterbox style for the whole cutscene */
  letterboxStyle?: 'full' | 'thin' | 'none';
  /** Show embers throughout */
  showEmbers?: boolean;
  /** Glitch intensity (0-1) */
  glitchIntensity?: number;
  /** Safety timeout (ms) */
  fallbackMs?: number;
}

/* ══════════════════════════════════════════════════════════════
   Helper — build CinematicTimelineDef from PresetCutsceneDef
   ══════════════════════════════════════════════════════════════ */

export function presetCutsceneToTimeline(def: PresetCutsceneDef): CinematicTimelineDef {
  const phases: CinematicTimelinePhase[] = def.shots.map((shot, i) => ({
    id: `${def.id}_shot_${i}`,
    duration: shot.duration,
    actor: { mode: 'none' },
    camera: {
      mode: 'preset',
      presetId: shot.presetId,
      subjectPos: def.subjectPos,
      subjectFacing: def.subjectFacing,
    },
    overlay: shot.narration
      ? {
          text: shot.narration,
          accentColor: def.accentColor ?? '#00ff66',
          letterboxStyle: def.letterboxStyle ?? 'thin',
          showEmbers: def.showEmbers,
          glitchIntensity: def.glitchIntensity,
          fadeInMs: shot.fadeInMs,
        }
      : undefined,
    lightCue: shot.lightCue,
    cameraShake: shot.cameraShake,
  }));

  const totalDurationMs = def.shots.reduce((sum, s) => sum + s.duration * 1000, 0);

  return {
    id: `preset_${def.id}`,
    phases,
    fallbackMs: def.fallbackMs ?? totalDurationMs + 3000,
  };
}

/* ══════════════════════════════════════════════════════════════
   CUTSCENE 1: room_awakening — Пробуждение
   Камера: ESTABLISHING_WIDE → OVER_SHOULDER → CLOSE_UP_EMOTIONAL
   ══════════════════════════════════════════════════════════════ */

export const CUTSCENE_ROOM_AWAKENING: PresetCutsceneDef = {
  id: 'room_awakening',
  description: 'Пробуждение Володьки в комнате — от общего плана до крупного плана лица',
  subjectPos: [0, 0, -4],
  subjectFacing: 0,
  accentColor: '#00ff66',
  letterboxStyle: 'thin',
  showEmbers: true,
  glitchIntensity: 0.15,
  fallbackMs: 14000,
  shots: [
    {
      presetId: 'establishing_wide',
      duration: 3.5,
      narration: 'Комната. Экран мерцает. Ты не помнишь, когда уснул.',
      lightCue: 'dim_hold',
      fadeInMs: 500,
    },
    {
      presetId: 'over_shoulder',
      duration: 3.0,
      narration: 'Глаза привыкают к темноте. На столе — остывший чай.',
      lightCue: 'warm_practical',
    },
    {
      presetId: 'close_up_emotional',
      duration: 4.0,
      narration: 'Что-то изменилось. Ты чувствуешь это — в воздухе, в тишине.',
      fadeInMs: 300,
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   CUTSCENE 2: street_first_steps — Первые шаги
   Камера: CRANE_RISING → TRACKING_LATERAL
   ══════════════════════════════════════════════════════════════ */

export const CUTSCENE_STREET_FIRST_STEPS: PresetCutsceneDef = {
  id: 'street_first_steps',
  description: 'Первый выход на улицу — подъём крана и боковаяトラッキング',
  subjectPos: [0, 0, 0],
  subjectFacing: 0,
  accentColor: 'var(--cyber-cyan)',
  letterboxStyle: 'thin',
  showEmbers: false,
  glitchIntensity: 0.1,
  fallbackMs: 12000,
  shots: [
    {
      presetId: 'crane_rising',
      duration: 4.0,
      narration: 'Улица. Неоновые вывески режут ночь. Ты давно не был здесь.',
      lightCue: 'neon_surge',
      fadeInMs: 600,
    },
    {
      presetId: 'tracking_lateral',
      duration: 3.5,
      narration: 'Дождь только что закончился. Асфальт блестит, как чёрное зеркало.',
    },
    {
      presetId: 'tracking_lateral',
      duration: 3.0,
      narration: 'Куда идти? Вокруг — город, который не ждёт тебя обратно.',
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   CUTSCENE 3: guild_arrival — Прибытие в гильдию
   Камера: LOW_ANGLE_POWER → ESTABLISHING_WIDE
   ══════════════════════════════════════════════════════════════ */

export const CUTSCENE_GUILD_ARRIVAL: PresetCutsceneDef = {
  id: 'guild_arrival',
  description: 'Прибытие в IT-гильдию — мощный низкий ракурс и общий план здания',
  subjectPos: [0, 0, 5],
  subjectFacing: Math.PI,
  accentColor: '#f97316',
  letterboxStyle: 'full',
  showEmbers: true,
  glitchIntensity: 0.2,
  fallbackMs: 13000,
  shots: [
    {
      presetId: 'low_angle_power',
      duration: 3.5,
      narration: 'Здание гильдии. Стекло и сталь. Отсюда управляют всем.',
      lightCue: 'neon_surge',
      cameraShake: { intensity: 0.3 },
      fadeInMs: 400,
    },
    {
      presetId: 'establishing_wide',
      duration: 4.0,
      narration: 'Ты стоишь у дверей. За ними — тот мир, который ты покинул.',
    },
    {
      presetId: 'low_angle_power',
      duration: 3.5,
      narration: 'Но сегодня ты пришёл не как гость. Сегодня ты вернулся.',
      lightCue: 'warm_practical',
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   CUTSCENE 4: rain_moment — Дождливый момент
   Камера: DUTCH_ANGLE → CLOSE_UP_EMOTIONAL
   ══════════════════════════════════════════════════════════════ */

export const CUTSCENE_RAIN_MOMENT: PresetCutsceneDef = {
  id: 'rain_moment',
  description: 'Драматическая дождевая сцена — голландский ракурс и эмоциональный крупный план',
  subjectPos: [0, 0, 0],
  subjectFacing: -0.5,
  accentColor: '#6366f1',
  letterboxStyle: 'full',
  showEmbers: false,
  glitchIntensity: 0.05,
  fallbackMs: 15000,
  shots: [
    {
      presetId: 'dutch_angle',
      duration: 4.0,
      narration: 'Дождь. Он не прекращается уже третий час.',
      lightCue: 'dim_hold',
      fadeInMs: 800,
    },
    {
      presetId: 'dutch_angle',
      duration: 3.0,
      narration: 'Капли стучат по козырьку. Ритм, в котором нет смысла.',
    },
    {
      presetId: 'close_up_emotional',
      duration: 5.0,
      narration: 'Или есть? Ты стояшь и слушаешь. Впервые за долгое время — просто стоишь.',
      fadeInMs: 400,
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   Registry
   ══════════════════════════════════════════════════════════════ */

export const PRESET_CUTSCENES: Record<string, PresetCutsceneDef> = {
  [CUTSCENE_ROOM_AWAKENING.id]: CUTSCENE_ROOM_AWAKENING,
  [CUTSCENE_STREET_FIRST_STEPS.id]: CUTSCENE_STREET_FIRST_STEPS,
  [CUTSCENE_GUILD_ARRIVAL.id]: CUTSCENE_GUILD_ARRIVAL,
  [CUTSCENE_RAIN_MOMENT.id]: CUTSCENE_RAIN_MOMENT,
};

export function getPresetCutscene(id: string): PresetCutsceneDef | null {
  return PRESET_CUTSCENES[id] ?? null;
}
