/**
 * Pillar 6 — Atmosphere / volumetric rays / auto tonemap LUT.
 * Extends ExplorationPostFX concepts with height+distance fog + cheap god-rays.
 */

import { AdditiveBlending, Color, DoubleSide, FogExp2, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Vector3 } from 'three';
import type { ProceduralAaaParams } from './params';

export interface AtmosphereState {
  fogColor: Color;
  fogNear: number;
  fogFar: number;
  lutStrength: number;
  rayIntensity: number;
  sceneAverage: Color;
}

/** Auto color grade from scene average luminance (cheap CPU sample of last frame color). */
export function computeAutoLutTarget(
  averageRgb: { r: number; g: number; b: number },
  strength: number,
): { hueShift: number; satBoost: number; contrast: number; lift: Color } {
  const lum = 0.2126 * averageRgb.r + 0.7152 * averageRgb.g + 0.0722 * averageRgb.b;
  // Push cool nights cooler; warm under-lit scenes warmer
  const cool = lum < 0.35 ? 1 : 0;
  const warm = lum > 0.55 ? 1 : 0;
  return {
    hueShift: (cool * -0.04 + warm * 0.05) * strength,
    satBoost: (0.08 + cool * 0.06) * strength,
    contrast: (0.12 + (0.45 - lum) * 0.2) * strength,
    lift: new Color().setRGB(
      averageRgb.r * 0.15 * strength,
      averageRgb.g * 0.12 * strength,
      averageRgb.b * 0.22 * strength,
    ),
  };
}

export function buildAtmosphereState(params: ProceduralAaaParams): AtmosphereState {
  return {
    fogColor: new Color('#2a3048'),
    fogNear: 4,
    fogFar: Math.max(18, 55 - params.fogDensity * 800),
    lutStrength: params.autoLutStrength,
    rayIntensity: params.volumetricRays,
    sceneAverage: new Color('#445566'),
  };
}

/**
 * Cheap volumetric ray mesh — fullscreen-ish cone planes toward light.
 * Not true raymarch volume; reads as god-rays at night for 60fps budget.
 */
export function createVolumetricRayPlanes(
  lightPos: Vector3,
  count: number,
  intensity: number,
): Group {
  const group = new Group();
  group.name = 'proceduralAaaVolumetricRays';
  const geo = new PlaneGeometry(2.5, 14);
  for (let i = 0; i < count; i++) {
    const mat = new MeshBasicMaterial({
      color: new Color('#8899ff'),
      transparent: true,
      opacity: 0.04 * intensity,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    const mesh = new Mesh(geo, mat);
    const ang = (i / count) * Math.PI * 2;
    mesh.position.set(
      lightPos.x + Math.cos(ang) * 1.2,
      lightPos.y - 3,
      lightPos.z + Math.sin(ang) * 1.2,
    );
    mesh.lookAt(lightPos);
    group.add(mesh);
  }
  return group;
}

/** Apply fog to Scene from params.
 *  Мутируем существующий FogExp2 in-place, чтобы не аллоцировать новый объект каждый кадр. */
export function applyHeightDistanceFog(
  scene: Scene,
  params: ProceduralAaaParams,
  cameraY: number,
): void {
  const heightFactor = 1 + Math.max(0, cameraY) * params.fogHeightFalloff * 0.05;
  const dens = params.fogDensity * heightFactor;
  const existing = scene.fog;
  if (existing instanceof FogExp2) {
    // Переиспользуем уже созданный туман — обновляем только density и color.
    existing.density = dens;
    existing.color.set('#2a3048');
  } else {
    // Лишь при отсутствии подходящего тумана создаём новый (один раз).
    scene.fog = new FogExp2('#2a3048', dens);
  }
}
