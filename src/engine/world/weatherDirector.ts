/* ─── Volodka RPG – Weather director (директор погоды) ─── */
/* Детерминированный режиссёр погоды: поверх базовой карты сцена→тип добавляет
 * живые переходы осадков по игровому времени (штатные ливни/передышки, редкие
 * грозы-пики, окна лёгкого дождя в сухих уличных сценах, дыхание снегопада).
 *
 * ЧИСТЫЙ модуль без React/стора: погода — это функция (сцена × игровое время ×
 * настройки). Никакого Math.random — только хеши от ключей сцены/слота, поэтому:
 *  - одинаковые входы всегда дают одинаковую погоду (сейв/лоад не ломает её);
 *  - юнит-тесты покрывают расчёт целиком без моков.
 *
 * Источник времени — exploration.timeOfDay (0..24, дробное). Счётчика игровых
 * дней в сторе нет, поэтому паттерн периодичен по суткам: грозы и окна дождя
 * «записаны» в слоты по 2 игровых часа и повторяются каждый день в одно время.
 *
 * Запись в рантайме идёт ТОЛЬКО через setRainIntensity (стор) — см. хук
 * useWeatherDirector. RainSystem/SnowSystem умножают эту интенсивность на свой
 * базовый множитель сцены (heavy 1.0 / light 0.4 / snow_light 0.35), мокрые
 * поверхности, HUD-эффекты и determineWeatherType читают её напрямую — директор
 * ничего не рендерит и никуда не пишет в обход стора.
 *
 * Оговорка по амплитуде синусоиды дождя: штатный диапазон 0.20–0.74 (а не
 * 0.20–1.0). Потолок 0.74 держит интенсивность ниже порога 0.75 «storm» в
 * determineWeatherType (data/weatherEffects.ts) — иначе каждый пик синусоиды
 * дёргал бы геймплейный тип «Дождь»↔«Гроза» каждые 60–100 реальных секунд и
 * заваливал HUD карточками погоды. Полный размах 0.2↔1.0 живёт в переходах
 * грозы: пик окна — ровно 1.0, наезд/сход — плавный рамп за ~60–90 реальных
 * секунд (см. RAIN_RAMP_PER_SECOND).
 *
 * Вспышки молний: отдельной 3D-системы молний нет, но HUD-оверлей
 * EnvironmentalEffectsOverlay уже рисует CSS-вспышку для типа «storm» —
 * директор активирует её автоматически, поднимая интенсивность выше 0.75.
 */

import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { SceneId } from '@/shared/types/game';
import type { EventWeatherType } from '@/shared/types/game';

/* ─── Базовая карта сцена → тип погоды ─── */
/* Перенесена из WeatherController.tsx — единый источник правды:
 * контроллер рендерит системы по этой карте, директор строит поверх неё
 * динамику. */

export type BaseWeatherType = 'rain_heavy' | 'rain_light' | 'snow' | 'snow_light' | 'none';

export const SCENE_BASE_WEATHER: Readonly<Partial<Record<SceneId, BaseWeatherType>>> = {
  street_night: 'rain_heavy',
  street_winter: 'snow',
  rooftop_edge: 'rain_light',
  volodka_room: 'none',
  volodka_corridor: 'none',
  home_evening: 'none',
  cafe_evening: 'none',
  office_day: 'none',
  park_day: 'none',
  library_day: 'none',
  battle: 'none',
  sleep_dream: 'none',
  abandoned_factory: 'none',
  zarema_albert_room: 'none',
  solnysh_room: 'none',
  chk_forest_zorge: 'snow_light',
  factory_basement: 'none',
  // Light mist/rain so WetStreetGround apron + pier water read as wet without street storm density.
  river_pier: 'rain_light',
};

/* ─── Классификация сцен для директора ─── */

/**
 * Семейство погоды сцены:
 *  - 'rain'        — базовый дождь (street_night, rooftop_edge + варианты пирса);
 *  - 'snow'        — базовый снег (street_winter, chk_forest_zorge + варианты);
 *  - 'dry_outdoor' — уличная сцена без базовой погоды: редкие динамические
 *                    окна лёгкого дождя;
 *  - 'sheltered'   — внутренние/подземные/сны и спец-сцены: погоды НИКОГДА нет.
 */
export type WeatherSceneKind = 'rain' | 'snow' | 'dry_outdoor' | 'sheltered';

/** Спец-сцены без базовой погоды, которые не получают и динамику
 *  (бой — арена комбата, не «живой город»). */
const NO_DYNAMIC_WEATHER_SCENES: ReadonlySet<SceneId> = new Set<SceneId>(['battle']);

/** Классифицировать сцену (сам вариант или его родитель) для директора. */
export function classifyWeatherScene(sceneId: SceneId): WeatherSceneKind {
  const root = resolveDerivedSceneId(sceneId);
  const base = SCENE_BASE_WEATHER[root];
  if (base === 'rain_heavy' || base === 'rain_light') return 'rain';
  if (base === 'snow' || base === 'snow_light') return 'snow';
  const definition = SCENE_DEFINITIONS[root];
  if (definition?.type === 'outdoor' && !NO_DYNAMIC_WEATHER_SCENES.has(root)) {
    return 'dry_outdoor';
  }
  return 'sheltered';
}

/* ─── Детерминированные хеши (без Math.random) ─── */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const UINT32 = 4294967296;
const TAU = Math.PI * 2;

/** FNV-1a — тот же алгоритм, что в eventBusDedup/npcPortraitPresentation. */
function fnv1a(text: string): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** Финализатор murmur3 — лавинное перемешивание. FNV-1a плохо различает
 *  ключи, отличающиеся последним символом («…:0» vs «…:1»), без него броски
 *  по слотам получаются монотонной последовательностью, а не шумом. */
function mix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Стабильное псевдослучайное 0..1 по строковому ключу (сид сцены+соли). */
function seeded01(key: string): number {
  return mix32(fnv1a(key)) / UINT32;
}

/** Стабильное псевдослучайное 0..1 для слота игровых часов (грозы/окна). */
function seededSlot(key: string, slot: number): number {
  return mix32(fnv1a(key) ^ Math.imul(slot + 1, 0x9e3779b9)) / UINT32;
}

/** Смешивание целочисленного индекса решётки шума в 0..1. */
function latticeHash(seed: number, index: number): number {
  let h = Math.imul(seed ^ Math.imul(index + 0x9e3779b9, 0x85ebca6b), 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f);
  return (h >>> 0) / UINT32;
}

/** Сглаженный value-noise по оси игровых минут (интерполяция smoothstep).
 *  modulus — размер решётки на сутки: шум периодичен по времени суток, чтобы
 *  интенсивность не прыгала на полуночной границе. */
function latticeNoise(x: number, seed: number, modulus: number): number {
  const index = Math.floor(x);
  const t = x - index;
  const smooth = t * t * (3 - 2 * t);
  const a = latticeHash(seed, ((index % modulus) + modulus) % modulus);
  const b = latticeHash(seed, (((index + 1) % modulus) + modulus) % modulus);
  return a + (b - a) * smooth;
}

/* ─── Математики ─── */

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function smoothstep01(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/**
 * Огибающая окна [start, end] с плавными краями по edgeMin игровых минут:
 * 0 → 1 → 0 без разрывов (плавность чистой функции для тестов).
 */
function edgeEnvelope(t: number, start: number, end: number, edgeMin: number): number {
  if (t <= start || t >= end) return 0;
  return smoothstep01((t - start) / edgeMin) * smoothstep01((end - t) / edgeMin);
}

/* ─── Константы режиссёра ─── */

/** Период штатной синусоиды дождя: 15–25 игровых минут (≈60–100 реальных секунд).
 *  Период квантуется к целому числу циклов в сутках (1440/период) — иначе фаза
 *  синусоиды разрывалась бы на полуночной границе. */
export const RAIN_PERIOD_MIN_MIN = 15;
export const RAIN_PERIOD_MAX_MIN = 25;
/** Середина/амплитуда синусоиды: 0.46 ± 0.26 → штатные ливни/передышки 0.20–0.72. */
const RAIN_SIN_MID = 0.46;
const RAIN_SIN_AMP = 0.26;
/** Шум поверх синусоиды (±0.04, решётка 5 игровых минут, периодичная по суткам). */
const RAIN_NOISE_AMP = 0.04;
const RAIN_NOISE_STEP_MIN = 5;
const RAIN_NOISE_LATTICE = 1440 / RAIN_NOISE_STEP_MIN;
export const RAIN_INTENSITY_MIN = 0.2;
/** Потолок штатного дождя — ниже порога 0.75 «storm» (см. шапку модуля). */
export const RAIN_INTENSITY_MAX = 0.74;

/** Целое число циклов синусоиды в сутках — период = 1440/k (лавинный сид). */
function dayCyclePeriod(key: string, cyclesFrom: number, cyclesTo: number): number {
  const span = cyclesTo - cyclesFrom + 1;
  const cycles = cyclesFrom + Math.floor(seeded01(key) * span);
  return 1440 / cycles;
}

/** Слоты гроз: 2 игровых часа, шанс ~15% на слот → в среднем ~1.8 грозы/сутки. */
export const STORM_SLOT_MIN = 120;
export const STORM_SLOT_PROBABILITY = 0.15;
/** Длина грозы 20 игровых минут, края по 6 минут, старт внутри слота с запасом. */
export const STORM_WINDOW_MIN = 20;
const STORM_EDGE_MIN = 6;
const STORM_MARGIN_MIN = 8;
const STORM_START_SPAN_MIN = STORM_SLOT_MIN - 2 * STORM_MARGIN_MIN - STORM_WINDOW_MIN;
/** Фаза «storm» — когда огибающая грозы разгорелась. */
const STORM_PHASE_THRESHOLD = 0.5;

/** Снегопад: период 25–40 игровых минут, диапазон 0.20–0.70 (0.7 < 0.75 «storm»). */
export const SNOW_PERIOD_MIN_MIN = 25;
export const SNOW_PERIOD_MAX_MIN = 40;
const SNOW_SIN_MID = 0.45;
const SNOW_SIN_AMP = 0.25;
const SNOW_NOISE_AMP = 0.04;
const SNOW_NOISE_STEP_MIN = 8;
const SNOW_NOISE_LATTICE = 1440 / SNOW_NOISE_STEP_MIN;
export const SNOW_INTENSITY_MIN = 0.2;
export const SNOW_INTENSITY_MAX = 0.7;

/** Окна лёгкого дождя в сухих сценах: слот 2 ч, шанс 33%, длина 40–70 мин
 *  → матожидание ~15% времени суток (цель 10–15%; конкретные сиды сцен дают
 *  разброс ~8–13%). Пик окна — свой на слот, в диапазоне 0.15–0.35;
 *  вход/выход — огибающая с краями по 5 минут. */
export const DRY_SLOT_MIN = 120;
export const DRY_WINDOW_PROBABILITY = 0.33;
export const DRY_WINDOW_MIN_MIN = 40;
export const DRY_WINDOW_MAX_MIN = 70;
const DRY_EDGE_MIN = 5;
export const DRY_INTENSITY_MIN = 0.15;
export const DRY_INTENSITY_MAX = 0.35;
/** Порог фазы «downpour» (начало ливня). */
export const DOWNPOUR_THRESHOLD = 0.6;

/** Полный размах 0.2↔1.0 за 60–90 реальных секунд (рабочая точка 75 с). */
export const RAIN_TRANSITION_SECONDS_MIN = 60;
export const RAIN_TRANSITION_SECONDS_MAX = 90;
export const RAIN_RAMP_PER_SECOND =
  0.8 / ((RAIN_TRANSITION_SECONDS_MIN + RAIN_TRANSITION_SECONDS_MAX) / 2);
/** Быстрое затухание — выключение погоды в настройках / уход внутрь помещения. */
export const WEATHER_FAST_FADE_PER_SECOND = 0.25;

/** Уведомления о крупных переходах — не чаще раза в игровой час. */
export const WEATHER_ALERT_COOLDOWN_GAME_MINUTES = 60;

/* ─── Результат директора ─── */

/**
 * Фаза погоды — дискретная ступень над непрерывной интенсивностью.
 * Крупные переходы фаз (drizzle/downpour/storm) превращаются в уведомления.
 */
export type DirectedWeatherPhase =
  | 'sheltered' // внутри — никакой погоды
  | 'clear' // сухая уличная сцена вне окна дождя
  | 'drizzle' // окно лёгкого дождя в сухой сцене
  | 'rain' // штатный дождь базовой дождливой сцены
  | 'downpour' // ливень (интенсивность ≥ DOWNPOUR_THRESHOLD)
  | 'storm' // гроза — пик окна, интенсивность до 1.0
  | 'snow'; // снежная сцена (плотность дышит)

export interface WeatherDirectorInput {
  /** Активная сцена (можно вариант — родитель разрешается внутри). */
  sceneId: SceneId;
  /** Игровой час 0..24 с дробной частью (минуты). */
  gameHour: number;
  /** Тумблер погоды в настройках — false полностью глушит директора. */
  weatherEnabled: boolean;
}

export interface WeatherDirectorState {
  phase: DirectedWeatherPhase;
  /** Тип осадков для этой сцены в это время. */
  kind: 'rain' | 'snow' | 'none';
  /** Целевая интенсивность осадков 0..1 (цель рампа setRainIntensity). */
  intensity: number;
  /** Идёт ли гроза (пик окна). */
  storm: boolean;
}

const SHELTERED_PHASE: DirectedWeatherPhase = 'sheltered';

/* ─── Основной расчёт ─── */

/**
 * Чистая функция режиссёра: целевое состояние погоды для (сцена × игровое время).
 * Детерминирована — одинаковые входы дают байт-в-байт одинаковый результат.
 */
export function computeWeatherDirectorState(input: WeatherDirectorInput): WeatherDirectorState {
  if (!input.weatherEnabled) {
    return { phase: SHELTERED_PHASE, kind: 'none', intensity: 0, storm: false };
  }
  const rawHour = Number.isFinite(input.gameHour) ? input.gameHour : 0;
  const gameMinutes = ((((rawHour % 24) + 24) % 24) * 60);

  const root = resolveDerivedSceneId(input.sceneId);
  const kind = classifyWeatherScene(root);

  switch (kind) {
    case 'rain':
      return computeRainState(root, gameMinutes);
    case 'snow':
      return computeSnowState(root, gameMinutes);
    case 'dry_outdoor':
      return computeDrySceneState(root, gameMinutes);
    case 'sheltered':
    default:
      return { phase: SHELTERED_PHASE, kind: 'none', intensity: 0, storm: false };
  }
}

/** Дождливые сцены: синусоида 15–25 мин + шум, изредка гроза-пик до 1.0. */
function computeRainState(root: SceneId, gameMinutes: number): WeatherDirectorState {
  // k циклов в сутки: 1440/k ∈ [15, 25] → k ∈ [58, 96]
  const period = dayCyclePeriod(`${root}:rain-period`, 58, 96);
  const seed = fnv1a(`${root}:rain`);
  const oscillation = RAIN_SIN_MID + RAIN_SIN_AMP * Math.sin((TAU * gameMinutes) / period);
  const noise = (latticeNoise(gameMinutes / RAIN_NOISE_STEP_MIN, seed, RAIN_NOISE_LATTICE) * 2 - 1) * RAIN_NOISE_AMP;
  const base = clamp(oscillation + noise, RAIN_INTENSITY_MIN, RAIN_INTENSITY_MAX);

  // Гроза: детерминированный «бросок» на слот игровых часов.
  const slot = Math.floor(gameMinutes / STORM_SLOT_MIN);
  let stormEnvelope = 0;
  if (seededSlot(`${root}:storm`, slot) < STORM_SLOT_PROBABILITY) {
    const start =
      slot * STORM_SLOT_MIN +
      STORM_MARGIN_MIN +
      seededSlot(`${root}:storm-start`, slot) * STORM_START_SPAN_MIN;
    stormEnvelope = edgeEnvelope(gameMinutes, start, start + STORM_WINDOW_MIN, STORM_EDGE_MIN);
  }

  const intensity = Math.max(base, stormEnvelope);
  const storm = stormEnvelope > STORM_PHASE_THRESHOLD;
  const phase: DirectedWeatherPhase = storm
    ? 'storm'
    : intensity >= DOWNPOUR_THRESHOLD
      ? 'downpour'
      : 'rain';

  return { phase, kind: 'rain', intensity, storm };
}

/** Снежные сцены: плотность дышит 0.20–0.70 (гроз нет — метель не заказана). */
function computeSnowState(root: SceneId, gameMinutes: number): WeatherDirectorState {
  // k циклов в сутки: 1440/k ∈ [25, 40] → k ∈ [36, 57]
  const period = dayCyclePeriod(`${root}:snow-period`, 36, 57);
  const seed = fnv1a(`${root}:snow`);
  const oscillation = SNOW_SIN_MID + SNOW_SIN_AMP * Math.sin((TAU * gameMinutes) / period);
  const noise = (latticeNoise(gameMinutes / SNOW_NOISE_STEP_MIN, seed, SNOW_NOISE_LATTICE) * 2 - 1) * SNOW_NOISE_AMP;
  const intensity = clamp(oscillation + noise, SNOW_INTENSITY_MIN, SNOW_INTENSITY_MAX);
  return { phase: 'snow', kind: 'snow', intensity, storm: false };
}

/** Сухие уличные сцены: редкие окна лёгкого дождя 0.15–0.35, вход/выход плавные. */
function computeDrySceneState(root: SceneId, gameMinutes: number): WeatherDirectorState {
  const slot = Math.floor(gameMinutes / DRY_SLOT_MIN);
  let envelope = 0;
  let peak = 0;
  if (seededSlot(`${root}:dry-window`, slot) < DRY_WINDOW_PROBABILITY) {
    const duration =
      DRY_WINDOW_MIN_MIN +
      seededSlot(`${root}:dry-len`, slot) * (DRY_WINDOW_MAX_MIN - DRY_WINDOW_MIN_MIN);
    const startSpan = Math.max(0, DRY_SLOT_MIN - duration - 2 * DRY_EDGE_MIN);
    const start = slot * DRY_SLOT_MIN + DRY_EDGE_MIN + seededSlot(`${root}:dry-start`, slot) * startSpan;
    envelope = edgeEnvelope(gameMinutes, start, start + duration, DRY_EDGE_MIN);
    peak = DRY_INTENSITY_MIN + seededSlot(`${root}:dry-peak`, slot) * (DRY_INTENSITY_MAX - DRY_INTENSITY_MIN);
  }

  const intensity = envelope * peak;
  const rainActive = envelope > 0;
  return {
    phase: rainActive ? 'drizzle' : 'clear',
    kind: rainActive ? 'rain' : 'none',
    intensity,
    storm: false,
  };
}

/* ─── Плавный рамп (реальное время) ─── */

/**
 * Продвинуть текущую интенсивность к цели с ограниченной скоростью (в секунду).
 * Гарантирует переход полного размаха 0.2↔1.0 за 60–90 секунд без телепорта.
 */
export function rampIntensityToward(
  current: number,
  target: number,
  elapsedSeconds: number,
  ratePerSecond: number = RAIN_RAMP_PER_SECOND,
): number {
  const from = clamp01(current);
  const to = clamp01(target);
  const delta = to - from;
  const step = Math.max(0, elapsedSeconds) * Math.max(0, ratePerSecond);
  if (Math.abs(delta) <= step) return to;
  return clamp01(from + Math.sign(delta) * step);
}

/* ─── Уведомления о крупных переходах ─── */

export interface WeatherDirectorAlert {
  /** Тип для карточки WeatherAlertNotification (слушает weather:changed). */
  weatherType: EventWeatherType;
  /** Русский нарративный текст («Начинается ливень» и т.п.). */
  text: string;
  /** Оценка температуры — как в WeatherAlertNotification. */
  temperature: number;
}

/**
 * Решить, нужно ли уведомление при переходе фаз. Крупные переходы:
 *  - drizzle  — «По небу идут тучи…» (окно дождя в сухой сцене);
 *  - downpour — «Начинается ливень»;
 *  - storm    — «Начинается гроза».
 * Выход из грозы и первичная синхронизация (from === null) без карточки.
 */
export function resolveWeatherDirectorAlert(
  from: DirectedWeatherPhase | null,
  to: DirectedWeatherPhase,
  gameHour: number,
): WeatherDirectorAlert | null {
  if (from === null || from === to || from === 'storm') return null;
  if (to === 'storm') {
    return {
      weatherType: 'storm',
      text: 'Начинается гроза',
      temperature: estimateWeatherAlertTemperature('storm', gameHour),
    };
  }
  if (to === 'downpour') {
    return {
      weatherType: 'rain',
      text: 'Начинается ливень',
      temperature: estimateWeatherAlertTemperature('rain', gameHour),
    };
  }
  if (to === 'drizzle') {
    return {
      weatherType: 'rain',
      text: 'По небу идут тучи…',
      temperature: estimateWeatherAlertTemperature('rain', gameHour),
    };
  }
  return null;
}

/**
 * Оценка температуры для карточки погоды (зеркалит логику
 * WeatherAlertNotification, чтобы директор не тянул UI-модуль в движок).
 */
export function estimateWeatherAlertTemperature(
  weatherType: EventWeatherType,
  gameHour: number,
): number {
  const isNight = gameHour >= 21 || gameHour < 6;
  switch (weatherType) {
    case 'snow':
      return isNight ? -15 : -8;
    case 'rain':
      return isNight ? 4 : 7;
    case 'storm':
      return isNight ? -3 : 2;
    case 'fog':
      return isNight ? 8 : 12;
    default:
      return isNight ? 10 : 20;
  }
}

/**
 * Рейт-лимит уведомлений: не чаще раза в игровой час (по игровым минутам,
 * корректно через полуночную границу).
 */
export function canEmitWeatherAlert(
  lastGameMinute: number | null,
  currentGameMinute: number,
): boolean {
  if (lastGameMinute === null) return true;
  const minute = ((currentGameMinute % 1440) + 1440) % 1440;
  const last = ((lastGameMinute % 1440) + 1440) % 1440;
  const elapsed = (minute - last + 1440) % 1440;
  return elapsed >= WEATHER_ALERT_COOLDOWN_GAME_MINUTES;
}
