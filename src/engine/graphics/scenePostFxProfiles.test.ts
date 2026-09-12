import { describe, expect, it } from 'vitest';
import {
  GODRAYS_POST_SCENES,
  getGodRaysSunConfig,
  resolveScenePostFxProfile,
} from '@/engine/graphics/scenePostFxProfiles';
import { resolveProceduralLutKind } from '@/engine/graphics/proceduralLutTextures';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import type { SceneId } from '@/shared/types/game';

describe('resolveScenePostFxProfile (этап 98)', () => {
  it('отдаёт точные значения прямых табличных ключей (street_night)', () => {
    const p = resolveScenePostFxProfile('street_night');
    expect(p.bloom).toEqual({ intensity: 0.62, threshold: 0.52, smoothing: 0.48 });
    expect(p.vignette).toEqual({ offset: 0.4, darkness: 0.3 });
    expect(p.colorGrade).toEqual({ hue: 0.04, saturation: 0.12, brightness: 0.02, contrast: 0.28 });
    expect(p.chromatic).toEqual({ baseAmount: 0.25, stressMax: 0.8 });
    expect(p.bloomEmissiveBoost).toBe(0.14);
    expect(p.aoColor).toBe('#0a0a14');
    // street_night отсутствует в SCENE_TONE_EXPOSURE → глобальный фолбэк
    expect(p.toneExposure).toBe(SCENE_VISIBILITY.toneExposure);
    expect(p.wantsNoise).toBe(true);
    expect(p.wantsScanlines).toBe(false);
    expect(p.isHeroPostFx).toBe(true);
    expect(p.lutKind).toBe('synthwave_neon');
    expect(p.godRaysSun).toEqual({ position: [-6, 3, -2], color: '#d88a9c' });
  });

  it('боевая сцена: тёмный блум, без зерна/LUT/godrays, пер-сценная экспозиция', () => {
    const p = resolveScenePostFxProfile('battle');
    expect(p.bloom).toEqual({ intensity: 0.9, threshold: 0.5, smoothing: 0.4 });
    expect(p.vignette).toEqual({ offset: 0.2, darkness: 0.6 });
    expect(p.toneExposure).toBe(1.05);
    expect(p.isHeroPostFx).toBe(false);
    expect(p.wantsNoise).toBe(false);
    expect(p.wantsScanlines).toBe(false);
    expect(p.lutKind).toBeNull();
    expect(p.godRaysSun).toBeNull();
  });

  it('CRT-сцены со сканлайнами определяются по прямой таблице', () => {
    expect(resolveScenePostFxProfile('guild_mainframe').wantsScanlines).toBe(true);
    expect(resolveScenePostFxProfile('office_day').wantsScanlines).toBe(true);
    expect(resolveScenePostFxProfile('volodka_room').wantsScanlines).toBe(false);
  });

  it('неизвестная сцена получает дефолты (без выброса)', () => {
    const p = resolveScenePostFxProfile('nonexistent_scene' as SceneId);
    expect(p.colorGrade).toEqual({ hue: 0, saturation: 0, brightness: 0, contrast: 0.15 });
    expect(p.vignette).toEqual({ offset: 0.4, darkness: 0.32 });
    expect(p.bloom).toEqual({ intensity: 0.5, threshold: 0.7, smoothing: 0.5 });
    expect(p.chromatic).toEqual({ baseAmount: 0.18, stressMax: 0.5 });
    expect(p.aoColor).toBe('black');
    expect(p.toneExposure).toBe(SCENE_VISIBILITY.toneExposure);
    expect(p.bloomEmissiveBoost).toBe(0);
    expect(p.wantsNoise).toBe(false);
    expect(p.wantsScanlines).toBe(false);
    expect(p.isHeroPostFx).toBe(false);
    expect(p.lutKind).toBeNull();
    expect(p.godRaysSun).toBeNull();
  });

  it('наследник без прямого ключа фолбэчится к родителю (chromatic)', () => {
    // zarema_room отсутствует в SCENE_CHROMATIC; родитель zarema_albert_room —
    // тоже → дефолт (0.18 base совпадает, stressMax — дефолтный 0.5)
    expect(resolveScenePostFxProfile('zarema_room').chromatic)
      .toEqual({ baseAmount: 0.18, stressMax: 0.5 });
    // factory_roof отсутствует в SCENE_CHROMATIC → родитель rooftop_edge
    expect(resolveScenePostFxProfile('factory_roof').chromatic)
      .toEqual({ baseAmount: 0.28, stressMax: 0.0 });
  });

  it('наследник фолбэчится к родителю для bloom, но прямой vignette-ключ сильнее', () => {
    const zarema = resolveScenePostFxProfile('zarema_room');
    // bloom — нет прямого ключа → родитель
    expect(zarema.bloom).toEqual({ intensity: 0.35, threshold: 0.72, smoothing: 0.5 });
    // vignette — прямой ключ сохраняется (наследование не затирает авторский ключ)
    expect(zarema.vignette).toEqual({ offset: 0.38, darkness: 0.3 });
  });

  it('результат заморожен (профиль нельзя мутировать извне)', () => {
    const p = resolveScenePostFxProfile('street_night');
    expect(Object.isFrozen(p)).toBe(true);
  });

  it('godRays-реестр согласован с конфигом солнца', () => {
    expect(GODRAYS_POST_SCENES.size).toBe(12);
    expect(GODRAYS_POST_SCENES.has('sleep_dream')).toBe(true);
    expect(GODRAYS_POST_SCENES.has('battle')).toBe(false);
    expect(getGodRaysSunConfig('nonexistent' as SceneId)).toBeNull();
    for (const sceneId of GODRAYS_POST_SCENES) {
      expect(getGodRaysSunConfig(sceneId)).not.toBeNull();
    }
  });

  it('lutKind согласован с реестром процедурных LUT', () => {
    for (const sceneId of ['street_night', 'city_square', 'guild_mainframe', 'volodka_room'] as SceneId[]) {
      expect(resolveScenePostFxProfile(sceneId).lutKind).toBe(resolveProceduralLutKind(sceneId));
    }
  });
});
