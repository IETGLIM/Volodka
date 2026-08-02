/* ─── NPC proximity bark text resolution ─── */

import type { NpcEmotion } from '@/shared/types/definitions/npc';
import type { SceneWeatherType } from '@/shared/types/ambientSound';

/** Single line or a pool of variants — engine picks one at runtime. */
export type NPCBarkBand = string | readonly string[];

export interface NPCBarkTexts {
  readonly hostile: NPCBarkBand;
  readonly neutral: NPCBarkBand;
  readonly friendly: NPCBarkBand;
}

/**
 * Ambient barks — short overheard mutterings NPCs produce when the player is
 * NEAR them (within 4 m) but NOT interacting. Different from `barkTexts`
 * (which fire on approach): these are idle background chatter that makes a
 * scene feel inhabited.
 *
 * Each band is a pool of lines; the ambient bark system picks one at random
 * subject to a per-NPC cooldown (≥ 25 s between emissions for the same NPC).
 *
 * - `idle`     → default band, used when the NPC has no specific activity
 * - `working`  → used when the NPC is currently in a `working` animation
 *                (or any schedule-driven work activity)
 * - `pensive`  → rare band; the system rolls a 20 % chance per eligible tick
 *                to surface a more introspective line
 *
 * Emotion-linked barks — new bands keyed by NPC emotional state:
 * When an NPC is in a specific emotion, the emotion band overrides the
 * normal band selection, giving context-aware overheard speech.
 *
 * - `curious`      → «Что это?» «Интересно...»
 * - `alarmed`      → «Эй!» «Что происходит?»
 * - `contemplative` → «Хм...» «Красиво...»
 * - `respectful`   → «Здравствуйте.» «Добрый день.»
 * - `annoyed`      → «Ты мешаешь.» «Отойди.»
 * - `fearful`      → «Не трогай меня!» «Уходи...»
 */
export interface NPCAmbientBarks {
  /** Default idle mutterings (used when no other band qualifies). */
  readonly idle?: NPCBarkBand;
  /** Lines muttered while performing a working animation/activity. */
  readonly working?: NPCBarkBand;
  /** Rare introspective lines — 20 % chance per eligible tick. */
  readonly pensive?: NPCBarkBand;
  /** Emotion-linked barks — override band selection when NPC is in that emotion. */
  readonly curious?: NPCBarkBand;
  readonly alarmed?: NPCBarkBand;
  readonly contemplative?: NPCBarkBand;
  readonly respectful?: NPCBarkBand;
  readonly annoyed?: NPCBarkBand;
  readonly fearful?: NPCBarkBand;
}

/** Default emotion-linked bark pools (Russian). */
export const DEFAULT_EMOTION_BARKS: Record<NpcEmotion, readonly string[]> = {
  neutral: [
    'Опять ничего не происходит. Или происходит, но — без меня.',
    'Сервер не мигает. Странно. Обычно — мигает.',
  ],
  curious: [
    'Что это?',
    'Интересно...',
    'Хм, что-то новенькое.',
    'Посмотрим...',
    'Ты не отсюда, да? Я таких глаз не видел.',
    'Что у тебя в кармане светится?',
  ],
  alarmed: [
    'Эй!',
    'Что происходит?',
    'Это ещё что?',
    'Тревога!',
    'Камеры повернулись. Все — к нам.',
    'Шаги. Чужие. Быстрые. Тихо.',
  ],
  contemplative: [
    'Хм...',
    'Красиво...',
    'Задумчиво...',
    'Надо подумать...',
    'Город спит. Или притворяется. Я — второе.',
    'Где-то падает сервер. Чувствую — как чужую зубную боль.',
  ],
  respectful: [
    'Здравствуйте.',
    'Добрый день.',
    'Позвольте...',
    'Уважаемый...',
    'Проходите. Здесь — тихо. Пока.',
    'Позвольте — не вмешиваться. Я — наблюдаю.',
  ],
  annoyed: [
    'Ты мешаешь.',
    'Отойди.',
    'Не сейчас.',
    'Сколько можно...',
    'Топчешься. Не дышишь. Всё равно — мешаешь.',
    'Камера на тебя смотрит. И на меня. Уйди.',
  ],
  fearful: [
    'Не трогай меня!',
    'Уходи...',
    'Помогите!',
    'Страшно...',
    'Тише. Стены слушают. Стены — всегда слушают.',
    'Если что — я тебя не видел. Ты — тоже.',
  ],
};

/**
 * Weather-linked ambient bark pools (Russian).
 *
 * NPC-style observations about the weather — muttered when the player is near
 * an NPC and the scene has non-clear weather. Returned by `getWeatherBark`.
 *
 * - `rain`  → grumbling about wet gear, damp servers, neon reflections in puddles
 * - `snow`  → cautious appreciation (snow covers tracks), cold, muffled quiet
 * - `fog`   → unease about visibility, faces appearing from the white
 * - `storm` → terse, braced for trouble, wind, thunder
 *
 * `clear` is intentionally absent — clear weather yields no weather bark
 * (`getWeatherBark` returns `null`).
 *
 * Tone: cautious, observant, slightly grumpy about weather — same NPC
 * personality as the emotion-linked bark pools above.
 */
const WEATHER_BARKS: Partial<Record<SceneWeatherType, readonly string[]>> = {
  rain: [
    'Опять льёт. Кожа намокнет — серверы нет.',
    'Дождь. Хорошо. Хоть кто-то честно плачет за нас всех.',
    'Мокро. Лужи отражают неон — красивее, чем сам неон.',
    'Капюшон не спасает. Спасает — только терпение.',
  ],
  snow: [
    'Снег идёт. Хорошо. Следы заметает.',
    'Снежинки на рукаве. Тают. Как всё в этом городе.',
    'Белое на сером. Почти — красиво. Почти — чисто.',
    'Холодно. Зато — тихо. Снег глушит звук честнее камер.',
  ],
  fog: [
    'Туман. Не видно — кто рядом. Не видно — кто не рядом.',
    'Белизна впереди. Шаг — и пропасть. Или — край тротуара. Не различаю.',
    'Фонарь в тумане — как чужая совесть: тусклый, но — есть.',
    'Видимость — ноль. Хорошо. Меня — тоже не видно.',
  ],
  storm: [
    'Буря. Ветер бьёт в лицо. Лицо — заслужило.',
    'Гром. Или — выстрел. Или — сервер упал. Не различаю.',
    'Держись за перила. Перила — единственный друг сегодня.',
    'Ветер рвёт антенны. Антенны — молчат. Мы — тоже.',
  ],
};

/**
 * Pick a weather-appropriate bark line for the given weather state.
 *
 * Returns `null` when weather is `clear` (no weather bark should fire) or when
 * the weather type has no bark pool defined (defensive — currently all
 * non-clear types have pools).
 *
 * Used by the ambient bark system to occasionally surface weather-appropriate
 * NPC mutterings. Wired into `resolveNpcAmbientBark` as Priority 0 (highest),
 * gated by a 30 % probability roll so weather barks don't dominate the
 * ambient chatter.
 *
 * @param weatherState  Current scene weather type (clear/rain/snow/fog/storm)
 * @returns  A single Russian bark line, or `null` if weather is clear.
 */
export function getWeatherBark(weatherState: SceneWeatherType): string | null {
  if (weatherState === 'clear') return null;
  const pool = WEATHER_BARKS[weatherState];
  if (!pool || pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? pool[0];
}

export function pickNpcBarkLine(band: NPCBarkBand): string {
  if (typeof band === 'string') return band;
  if (band.length === 0) return '';
  const index = Math.floor(Math.random() * band.length);
  return band[index] ?? band[0];
}

/** Relation bands: ≤30 hostile, ≥70 friendly, otherwise neutral. */
export function resolveNpcBarkForRelation(
  barkTexts: NPCBarkTexts,
  relationValue: number,
): string {
  if (relationValue <= 30) return pickNpcBarkLine(barkTexts.hostile);
  if (relationValue >= 70) return pickNpcBarkLine(barkTexts.friendly);
  return pickNpcBarkLine(barkTexts.neutral);
}

/**
 * Resolve an ambient bark line for an NPC given its current activity, emotion,
 * and a random roll (0–1). Returns `null` if no ambient barks are defined or the
 * rolled band is missing.
 *
 * Priority chain (highest first):
 *   0. Weather-linked bark — 30 % chance per eligible tick when the scene has
 *      non-clear weather (rain/snow/fog/storm). Pure ambient observation,
 *      fires before emotion override so weather mutterings can surface even
 *      when an NPC has a custom emotion band. Gated by `weatherRng < 0.3` so
 *      weather barks don't dominate the chatter.
 *   1. Emotion-linked bark override — if the NPC has a specific emotion band
 *      defined in their `ambientBarks`, and that emotion is currently active,
 *      the emotion band overrides normal selection. If the NPC doesn't have a
 *      custom emotion band, the default pool from `DEFAULT_EMOTION_BARKS` is used.
 *   2. Pensive — 20 % chance when defined and emotion is neutral.
 *   3. Working — when the NPC is in a `working` animation/activity.
 *   4. Idle — default band.
 *
 * @param ambientBarks  NPC's ambient bark configuration (may be undefined)
 * @param isWorking     True when the NPC is in a `working` animation/activity
 * @param emotion       Current NPC emotional state (affects band selection)
 * @param rng           0–1 random roll controlling pensive vs. idle selection
 * @param weatherType   Optional current scene weather type (clear/rain/snow/fog/storm).
 *                      When non-clear and `weatherRng < 0.3`, a weather bark
 *                      is returned (Priority 0).
 * @param weatherRng    0–1 random roll controlling the 30 % weather-bark gate.
 *                      Defaults to `Math.random()`. Separate from `rng` so the
 *                      pensive roll and weather roll don't share entropy.
 */
export function resolveNpcAmbientBark(
  ambientBarks: NPCAmbientBarks | undefined,
  isWorking: boolean,
  emotion: NpcEmotion = 'neutral',
  rng: number = Math.random(),
  weatherType?: SceneWeatherType,
  weatherRng: number = Math.random(),
): string | null {
  // Priority 0 (highest): weather-linked bark — 30 % chance, non-clear weather.
  // Fires before emotion override. Weather barks are pure ambient observations;
  // they don't replace emotion-linked dialogue, just occasionally override the
  // idle churn.
  if (weatherType && weatherType !== 'clear' && weatherRng < 0.3) {
    const weatherBark = getWeatherBark(weatherType);
    if (weatherBark) return weatherBark;
  }

  if (!ambientBarks) {
    // No custom barks defined — fall through to default emotion barks
    if (emotion !== 'neutral') {
      const defaultBark = DEFAULT_EMOTION_BARKS[emotion];
      if (defaultBark.length > 0) return pickNpcBarkLine(defaultBark);
    }
    return null;
  }

  // Priority 1: emotion-linked bark override
  if (emotion !== 'neutral') {
    const emotionBand = ambientBarks[emotion];
    if (emotionBand) {
      return pickNpcBarkLine(emotionBand);
    }
    // No custom emotion band — fall through to default emotion barks
    const defaultBark = DEFAULT_EMOTION_BARKS[emotion];
    if (defaultBark.length > 0) return pickNpcBarkLine(defaultBark);
  }

  // 20 % chance to surface a pensive line when one is defined.
  if (ambientBarks.pensive && rng < 0.2) {
    return pickNpcBarkLine(ambientBarks.pensive);
  }

  // Working band takes priority when the NPC is actively working.
  if (isWorking && ambientBarks.working) {
    return pickNpcBarkLine(ambientBarks.working);
  }

  // Default: idle band.
  if (ambientBarks.idle) {
    return pickNpcBarkLine(ambientBarks.idle);
  }

  // Fall back to working if idle is missing.
  if (ambientBarks.working) {
    return pickNpcBarkLine(ambientBarks.working);
  }

  return null;
}

/**
 * Resolve which bark band was selected (for UI styling / theming).
 * Returns the band key that was actually used.
 *
 * Mirrors the priority chain of `resolveNpcAmbientBark` — see that function's
 * docstring for the full chain. `'weather'` is returned when Priority 0 fires.
 */
export function resolveNpcAmbientBarkBand(
  ambientBarks: NPCAmbientBarks | undefined,
  isWorking: boolean,
  emotion: NpcEmotion = 'neutral',
  rng: number = Math.random(),
  weatherType?: SceneWeatherType,
  weatherRng: number = Math.random(),
): NpcEmotion | 'idle' | 'working' | 'pensive' | 'weather' {
  // Priority 0: weather bark
  if (weatherType && weatherType !== 'clear' && weatherRng < 0.3) {
    const weatherBark = getWeatherBark(weatherType);
    if (weatherBark) return 'weather';
  }

  if (!ambientBarks) {
    if (emotion !== 'neutral') return emotion;
    return 'idle';
  }

  // Priority 1: emotion override
  if (emotion !== 'neutral') {
    const emotionBand = ambientBarks[emotion];
    if (emotionBand) return emotion;
    const defaultBark = DEFAULT_EMOTION_BARKS[emotion];
    if (defaultBark.length > 0) return emotion;
  }

  if (ambientBarks.pensive && rng < 0.2) return 'pensive';
  if (isWorking && ambientBarks.working) return 'working';
  if (ambientBarks.idle) return 'idle';
  if (ambientBarks.working) return 'working';

  return 'idle';
}
