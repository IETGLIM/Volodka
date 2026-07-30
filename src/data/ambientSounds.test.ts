import { describe, expect, it } from 'vitest';
import {
  resolveAmbienceForScene,
  applyWeatherAmbienceOverride,
  getPlaybackAmbientDef,
  validateAmbientSoundDefs,
  validateSceneAmbienceCoverage,
  getAmbienceForScene,
} from '@/data/ambientSounds';

describe('ambientSounds', () => {
  it('resolves scene ambience via O(1) SceneDefinition map', () => {
    expect(getAmbienceForScene('cafe_evening', 12)).toBe('cafe');
    expect(getAmbienceForScene('cafe_evening', 22)).toBe('cafe');
    expect(getAmbienceForScene('office_day', 22)).toBe('corridor');
  });

  it('uses pier and basement profiles for new scenes', () => {
    expect(getAmbienceForScene('river_pier', 12)).toBe('pier');
    expect(getAmbienceForScene('factory_basement', 12)).toBe('basement');
  });

  it('applies weather override on outdoor scenes', () => {
    const rain = applyWeatherAmbienceOverride('street_night', 'street', 'rain');
    expect(rain.sound).toBe('rain');
    expect(rain.weatherApplied).toBe(true);

    const squareRain = applyWeatherAmbienceOverride('city_square', 'street', 'rain');
    expect(squareRain.sound).toBe('rain');
    expect(squareRain.weatherApplied).toBe(true);

    const factoryRoofSnow = applyWeatherAmbienceOverride('factory_roof', 'rooftop', 'snow');
    expect(factoryRoofSnow.sound).toBe('snow');
    expect(factoryRoofSnow.weatherApplied).toBe(true);

    const indoor = applyWeatherAmbienceOverride('cafe_evening', 'cafe', 'rain');
    expect(indoor.sound).toBe('cafe');
    expect(indoor.weatherApplied).toBe(false);
  });

  it('story procedural override takes priority', () => {
    const resolved = resolveAmbienceForScene('volodka_room', 12, {
      proceduralOverride: 'combat',
      weather: 'clear',
    });
    expect(resolved?.sound).toBe('combat');
    expect(resolved?.source).toBe('story');
  });

  it('strips LFO and random sounds under reduced motion when respectReducedMotion', () => {
    const safe = getPlaybackAmbientDef('combat', true);
    expect(safe.lfoRate).toBe(0);
    expect(safe.lfoDepth).toBe(0);
    expect(safe.randomSounds).toBeUndefined();
    expect(safe.noise?.lfoFreq).toBe(0);
  });

  it('passes ambient definition validation', () => {
    expect(validateAmbientSoundDefs()).toEqual([]);
    expect(validateSceneAmbienceCoverage()).toEqual([]);
  });
});
