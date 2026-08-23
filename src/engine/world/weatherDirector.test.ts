import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '@/config/sceneIds';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import {
  canEmitWeatherAlert,
  classifyWeatherScene,
  computeWeatherDirectorState,
  DRY_INTENSITY_MAX,
  DRY_WINDOW_PROBABILITY,
  estimateWeatherAlertTemperature,
  RAIN_INTENSITY_MAX,
  RAIN_INTENSITY_MIN,
  RAIN_RAMP_PER_SECOND,
  rampIntensityToward,
  resolveWeatherDirectorAlert,
  SNOW_INTENSITY_MAX,
  SNOW_INTENSITY_MIN,
  WEATHER_ALERT_COOLDOWN_GAME_MINUTES,
  WEATHER_FAST_FADE_PER_SECOND,
  type WeatherDirectorState,
} from '@/engine/world/weatherDirector';

/* ─── Хелперы ─── */

const RAIN_SCENES = ['street_night', 'rooftop_edge', 'river_pier'] as const;
const SNOW_SCENES = ['street_winter', 'chk_forest_zorge'] as const;
const DRY_SCENES = ['park_day', 'city_square', 'procedural_aaa'] as const;

function directed(sceneId: string, gameHour: number, weatherEnabled = true): WeatherDirectorState {
  return computeWeatherDirectorState({ sceneId: sceneId as never, gameHour, weatherEnabled });
}

/** Собрать интенсивность за полные сутки с заданным шагом (в игровых минутах). */
function daySamples(sceneId: string, stepMinutes = 1): number[] {
  const samples: number[] = [];
  for (let m = 0; m < 1440; m += stepMinutes) {
    samples.push(directed(sceneId, m / 60).intensity);
  }
  return samples;
}

describe('weatherDirector: классификация сцен', () => {
  it('базовая карта: дождь/снег/сухие улицы/помещения', () => {
    expect(classifyWeatherScene('street_night')).toBe('rain');
    expect(classifyWeatherScene('rooftop_edge')).toBe('rain');
    expect(classifyWeatherScene('river_pier')).toBe('rain');
    expect(classifyWeatherScene('street_winter')).toBe('snow');
    expect(classifyWeatherScene('chk_forest_zorge')).toBe('snow');
    expect(classifyWeatherScene('park_day')).toBe('dry_outdoor');
    expect(classifyWeatherScene('city_square')).toBe('dry_outdoor');
    expect(classifyWeatherScene('procedural_aaa')).toBe('dry_outdoor');
    expect(classifyWeatherScene('volodka_room')).toBe('sheltered');
    expect(classifyWeatherScene('factory_basement')).toBe('sheltered');
  });

  it('варианты сцен наследуют погоду родителя (sceneInheritance)', () => {
    expect(classifyWeatherScene('pier_evening')).toBe('rain'); // ← river_pier
    expect(classifyWeatherScene('factory_roof')).toBe('rain'); // ← rooftop_edge
    expect(classifyWeatherScene('forest_clearing')).toBe('snow'); // ← chk_forest_zorge
    expect(classifyWeatherScene('chk_campfire_night')).toBe('snow');
    expect(classifyWeatherScene('zarema_room')).toBe('sheltered'); // ← zarema_albert_room
  });

  it('все внутренние/подземные/сонные сцены — sheltered', () => {
    const indoor = SCENE_IDS.filter((id) => {
      const type = SCENE_DEFINITIONS[id].type;
      return type === 'indoor' || type === 'underground' || type === 'dream';
    });
    // 16 таких сцен — если добавили новую, классификацию нужно осознанно расширить
    expect(indoor.length).toBeGreaterThanOrEqual(16);
    for (const id of indoor) {
      expect(classifyWeatherScene(id), id).toBe('sheltered');
    }
  });

  it('спец-сцена боя не получает динамику (не «живой город»)', () => {
    expect(classifyWeatherScene('battle')).toBe('sheltered');
  });
});

describe('weatherDirector: детерминизм', () => {
  it('одинаковые входы — байт-в-байт одинаковый результат', () => {
    for (const scene of [...RAIN_SCENES, ...SNOW_SCENES, ...DRY_SCENES]) {
      const first = directed(scene, 13.37);
      const second = directed(scene, 13.37);
      expect(second).toEqual(first);
    }
  });

  it('порядок вызовов не влияет на результат (нет накопления состояния)', () => {
    const before = directed('street_night', 8.5);
    directed('park_day', 3.2);
    directed('volodka_room', 22.1);
    directed('street_winter', 15.9);
    expect(directed('street_night', 8.5)).toEqual(before);
  });

  it('периодичен по суткам: f(h) === f(h + 24) — сейв/лоад не ломает погоду', () => {
    for (const scene of [...RAIN_SCENES, ...SNOW_SCENES, ...DRY_SCENES]) {
      for (const hour of [0, 3.75, 9.5, 13.37, 20.125, 23.5]) {
        expect(directed(scene, hour + 24)).toEqual(directed(scene, hour));
      }
    }
  });

  it('сцены различаются: у каждой свой сид (своя погода)', () => {
    const hours = Array.from({ length: 24 }, (_, h) => h + 0.5);
    const street = hours.map((h) => directed('street_night', h).intensity);
    const rooftop = hours.map((h) => directed('rooftop_edge', h).intensity);
    expect(patternsDiffer(street, rooftop)).toBe(true);
  });
});

function patternsDiffer(a: number[], b: number[]): boolean {
  return a.some((value, i) => Math.abs(value - b[i]) > 1e-9);
}

describe('weatherDirector: внутренние сцены — никогда никакой погоды', () => {
  it('интенсивность 0 и kind none на протяжении всех суток', () => {
    const indoor = SCENE_IDS.filter((id) => classifyWeatherScene(id) === 'sheltered');
    for (const id of indoor) {
      for (let hour = 0; hour < 24; hour += 1.5) {
        const state = directed(id, hour);
        expect(state.intensity, id).toBe(0);
        expect(state.kind, id).toBe('none');
        expect(state.phase, id).toBe('sheltered');
        expect(state.storm, id).toBe(false);
      }
    }
  });
});

describe('weatherDirector: уважение weatherEnabled', () => {
  it('выключенная погода глушит директора в любой сцене', () => {
    for (const scene of [...RAIN_SCENES, ...SNOW_SCENES, ...DRY_SCENES, 'volodka_room']) {
      for (const hour of [0, 6.25, 12, 18.75, 23.5]) {
        const state = directed(scene, hour, false);
        expect(state.intensity, scene).toBe(0);
        expect(state.kind, scene).toBe('none');
        expect(state.phase, scene).toBe('sheltered');
        expect(state.storm, scene).toBe(false);
      }
    }
  });
});

describe('weatherDirector: дождливые сцены (синусоида + шум + грозы)', () => {
  it('интенсивность в штатном диапазоне 0.2..0.74 вне гроз (анти-флаппинг 0.75)', () => {
    for (const scene of RAIN_SCENES) {
      for (const intensity of daySamples(scene)) {
        expect(intensity).toBeGreaterThanOrEqual(RAIN_INTENSITY_MIN);
        if (intensity > RAIN_INTENSITY_MAX) {
          // выше штатного потолка — только пик грозы (см. следующий тест)
          expect(intensity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('дождь живой: за сутки есть и передышки, и ливни', () => {
    for (const scene of RAIN_SCENES) {
      const samples = daySamples(scene);
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      expect(min).toBeLessThanOrEqual(0.35); // передышки
      expect(max).toBeGreaterThanOrEqual(0.6); // ливни
    }
  });

  it('гроза: детерминированное окно с пиком ровно 1.0 и фазой storm', () => {
    // street_night по своему сиду имеет одно окно грозы в сутки
    let stormMinutes = 0;
    let peak = 0;
    for (let m = 0; m < 1440; m += 1) {
      const state = directed('street_night', m / 60);
      if (state.storm) {
        stormMinutes += 1;
        peak = Math.max(peak, state.intensity);
        expect(state.phase).toBe('storm');
        expect(state.kind).toBe('rain');
      } else {
        // вне грозы — не выше потолка (порог «storm» в determineWeatherType = 0.75)
        expect(state.intensity).toBeLessThanOrEqual(RAIN_INTENSITY_MAX);
      }
    }
    expect(stormMinutes).toBeGreaterThan(0);
    expect(stormMinutes).toBeLessThan(60); // «изредка», не бесконечная буря
    expect(peak).toBe(1);
  });

  it('фаза downpour соответствует порогу интенсивности', () => {
    for (let m = 0; m < 1440; m += 1) {
      const state = directed('street_night', m / 60);
      if (state.phase === 'downpour') {
        expect(state.intensity).toBeGreaterThanOrEqual(0.6);
        expect(state.storm).toBe(false);
      }
    }
  });
});

describe('weatherDirector: снежные сцены', () => {
  it('плотность снега дышит в диапазоне 0.2..0.7 без гроз', () => {
    for (const scene of SNOW_SCENES) {
      const samples = daySamples(scene);
      expect(Math.min(...samples)).toBeGreaterThanOrEqual(SNOW_INTENSITY_MIN);
      expect(Math.max(...samples)).toBeLessThanOrEqual(SNOW_INTENSITY_MAX);
      expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2);
      for (let m = 0; m < 1440; m += 1) {
        const state = directed(scene, m / 60);
        expect(state.kind).toBe('snow');
        expect(state.phase).toBe('snow');
        expect(state.storm).toBe(false);
      }
    }
  });
});

describe('weatherDirector: сухие уличные сцены (окна лёгкого дождя)', () => {
  it('вне окна — сухо, в окне — лёгкий дождь 0.15..0.35', () => {
    for (const scene of DRY_SCENES) {
      for (let m = 0; m < 1440; m += 1) {
        const state = directed(scene, m / 60);
        if (state.phase === 'drizzle') {
          // окно активно (включая плавные края): 0 < интенсивность ≤ 0.35
          expect(state.kind).toBe('rain');
          expect(state.intensity).toBeGreaterThan(0);
          expect(state.intensity).toBeLessThanOrEqual(DRY_INTENSITY_MAX);
        } else {
          // вне окна — идеально сухо
          expect(state.phase).toBe('clear');
          expect(state.kind).toBe('none');
          expect(state.intensity).toBe(0);
        }
        expect(state.storm).toBe(false);
      }
    }
  });

  it(`окна занимают ~10–15% суток (шанс слота ${(DRY_WINDOW_PROBABILITY * 100).toFixed(0)}%)`, () => {
    const coverage: number[] = [];
    for (const scene of DRY_SCENES) {
      const rainy = daySamples(scene).filter((i) => i > 0.02).length;
      const percent = (100 * rainy) / 1440;
      // у каждой сцены свой детерминированный сид — допускаем разброс
      expect(percent, scene).toBeGreaterThan(5);
      expect(percent, scene).toBeLessThan(20);
      coverage.push(percent);
    }
    const average = coverage.reduce((a, b) => a + b, 0) / coverage.length;
    expect(average).toBeGreaterThan(8);
    expect(average).toBeLessThan(16);
  });

  it('окна дождя есть хотя бы в одной сухой сцене за сутки', () => {
    const anyRain = DRY_SCENES.some((scene) => daySamples(scene).some((i) => i > 0.02));
    expect(anyRain).toBe(true);
  });
});

describe('weatherDirector: плавность', () => {
  it('нет телепортов интенсивности между соседними игровыми минутами', () => {
    const bounds: Record<string, number> = { rain: 0.26, snow: 0.1, dry: 0.11 };
    const cases: Array<[string, string]> = [
      ['rain', 'street_night'],
      ['rain', 'rooftop_edge'],
      ['rain', 'river_pier'],
      ['snow', 'street_winter'],
      ['snow', 'chk_forest_zorge'],
      ['dry', 'park_day'],
      ['dry', 'city_square'],
      ['dry', 'procedural_aaa'],
    ];
    for (const [kind, scene] of cases) {
      let prev: number | null = null;
      for (let m = 0; m <= 1440; m += 0.25) {
        const intensity = directed(scene, (m / 60) % 24).intensity;
        if (prev !== null) {
          // шаг 0.25 игровой минуты → приведённая скорость на минуту
          const perMinute = Math.abs(intensity - prev) / 0.25;
          expect(perMinute, `${scene}@${m}мин`).toBeLessThanOrEqual(bounds[kind]);
        }
        prev = intensity;
      }
    }
  });

  it('полночь непрерывна (период шума и синусоиды замкнут на сутки)', () => {
    for (const scene of [...RAIN_SCENES, ...DRY_SCENES, ...SNOW_SCENES]) {
      const before = directed(scene, 23.999).intensity;
      const after = directed(scene, 0.001).intensity;
      expect(Math.abs(before - after), scene).toBeLessThan(0.05);
    }
  });

  it('рамп ограничивает реальную скорость: полный размах 0.2↔1.0 за 60–90 секунд', () => {
    const fullSwingSeconds = 0.8 / RAIN_RAMP_PER_SECOND;
    expect(fullSwingSeconds).toBeGreaterThanOrEqual(60);
    expect(fullSwingSeconds).toBeLessThanOrEqual(90);
    // за секунду до завершения — ещё не доехали
    expect(rampIntensityToward(0.2, 1.0, fullSwingSeconds - 1)).toBeLessThan(1.0);
    // ровно за fullSwingSeconds — доехали точно
    expect(rampIntensityToward(0.2, 1.0, fullSwingSeconds)).toBe(1.0);
  });

  it('рамп: монотонность, ограничение шага и прилипание к цели', () => {
    // шаг не превышает rate·dt
    expect(rampIntensityToward(0.3, 0.9, 3)).toBeCloseTo(0.3 + 3 * RAIN_RAMP_PER_SECOND, 10);
    // движение вниз симметрично
    expect(rampIntensityToward(0.9, 0.2, 10)).toBeCloseTo(0.9 - 10 * RAIN_RAMP_PER_SECOND, 10);
    // цель достигнута — значение не перелетает
    expect(rampIntensityToward(0.5, 0.52, 100)).toBe(0.52);
    expect(rampIntensityToward(0.5, 0.48, 100)).toBe(0.48);
    // быстрое затухание гасит дождь за считанные секунды (кламп в 0)
    expect(rampIntensityToward(0.7, 0, 3, WEATHER_FAST_FADE_PER_SECOND)).toBe(0);
    // входы клампятся в 0..1
    expect(rampIntensityToward(-5, 2, 1)).toBeLessThanOrEqual(1);
    expect(rampIntensityToward(2, -5, 0)).toBeGreaterThanOrEqual(0);
  });
});

describe('weatherDirector: уведомления о крупных переходах', () => {
  it('начало ливня → «Начинается ливень»', () => {
    const alert = resolveWeatherDirectorAlert('rain', 'downpour', 14);
    expect(alert).not.toBeNull();
    expect(alert?.weatherType).toBe('rain');
    expect(alert?.text).toBe('Начинается ливень');
    expect(alert?.temperature).toBe(7); // день
  });

  it('гроза → «Начинается гроза» с ночная/дневной температурой', () => {
    expect(resolveWeatherDirectorAlert('rain', 'storm', 2)?.text).toBe('Начинается гроза');
    expect(resolveWeatherDirectorAlert('rain', 'storm', 2)?.weatherType).toBe('storm');
    expect(resolveWeatherDirectorAlert('rain', 'storm', 2)?.temperature).toBe(-3); // ночь
    expect(resolveWeatherDirectorAlert('rain', 'storm', 14)?.temperature).toBe(2); // день
  });

  it('окно дождя в сухой сцене → «По небу идут тучи…»', () => {
    const alert = resolveWeatherDirectorAlert('clear', 'drizzle', 10);
    expect(alert?.weatherType).toBe('rain');
    expect(alert?.text).toBe('По небу идут тучи…');
  });

  it('выход из грозы и первичная синхронизация — без карточки', () => {
    expect(resolveWeatherDirectorAlert('storm', 'downpour', 12)).toBeNull();
    expect(resolveWeatherDirectorAlert('storm', 'rain', 12)).toBeNull();
    expect(resolveWeatherDirectorAlert(null, 'downpour', 12)).toBeNull();
    expect(resolveWeatherDirectorAlert(null, 'storm', 12)).toBeNull();
  });

  it('мелкие переходы (rain/clear/snow/sheltered) — без карточки', () => {
    expect(resolveWeatherDirectorAlert('rain', 'rain', 12)).toBeNull();
    expect(resolveWeatherDirectorAlert('drizzle', 'clear', 12)).toBeNull();
    expect(resolveWeatherDirectorAlert('rain', 'sheltered', 12)).toBeNull();
    expect(resolveWeatherDirectorAlert('clear', 'snow', 12)).toBeNull();
  });

  it(`релей-лимит: не чаще раза в игровой час (${WEATHER_ALERT_COOLDOWN_GAME_MINUTES} мин)`, () => {
    expect(canEmitWeatherAlert(null, 100)).toBe(true);
    expect(canEmitWeatherAlert(100, 130)).toBe(false); // полчаса не прошло
    expect(canEmitWeatherAlert(100, 160)).toBe(true); // час прошёл
    expect(canEmitWeatherAlert(100, 100)).toBe(false); // тот же момент
    // «назад во времени» трактуется как полночный оборот — 23 ч 59 м «прошло»
    expect(canEmitWeatherAlert(160, 159)).toBe(true);
    // полночная граница: 23:50 → 00:05 = 15 минут
    expect(canEmitWeatherAlert(23 * 60 + 50, 5)).toBe(false);
    // 22:55 → 00:05 = 70 минут
    expect(canEmitWeatherAlert(22 * 60 + 55, 5)).toBe(true);
  });

  it('оценка температуры зеркалит WeatherAlertNotification', () => {
    expect(estimateWeatherAlertTemperature('rain', 3)).toBe(4);
    expect(estimateWeatherAlertTemperature('rain', 12)).toBe(7);
    expect(estimateWeatherAlertTemperature('storm', 3)).toBe(-3);
    expect(estimateWeatherAlertTemperature('snow', 3)).toBe(-15);
    expect(estimateWeatherAlertTemperature('snow', 12)).toBe(-8);
    expect(estimateWeatherAlertTemperature('clear', 12)).toBe(20);
  });
});
