import { MathUtils, MeshPhysicalMaterial, MeshPhysicalMaterialParameters, MeshStandardMaterial, MeshStandardMaterialParameters } from 'three';

/** Shared PBR material presets for procedural scenes — tuned away from plastic kit look. */
export const PBR_PRESETS = {
  asphalt: {
    color: '#3a3a52',
    roughness: 0.88,
    metalness: 0.05,
    envMapIntensity: 0.20,
  },
  asphaltWet: {
    color: '#2a2a3a',
    roughness: 0.32,
    metalness: 0.22,
    envMapIntensity: 0.25,
  },
  concrete: {
    color: '#5a5a6a',
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.20,
  },
  sidewalk: {
    color: '#4a4a62',
    roughness: 0.86,
    metalness: 0.04,
    envMapIntensity: 0.22,
  },
  plaster: {
    color: '#7a7468',
    roughness: 0.9,
    metalness: 0.01,
    envMapIntensity: 0.18,
  },
  wornWood: {
    color: '#6a4a32',
    roughness: 0.78,
    metalness: 0.02,
    envMapIntensity: 0.20,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
  },
  fabric: {
    color: '#4a4050',
    roughness: 0.95,
    metalness: 0.01,
    envMapIntensity: 0.15,
    sheen: 0.3,
    sheenRoughness: 0.75,
    sheenColor: '#5a5a6a',
  },
  paintedMetal: {
    color: '#4a5568',
    roughness: 0.55,
    metalness: 0.45,
    envMapIntensity: 0.22,
  },
  wetMetal: {
    color: '#4a5568',
    roughness: 0.25,
    metalness: 0.85,
    envMapIntensity: 0.25,
  },
  /** Wood floor / furniture — clearcoat for varnished finish (MeshPhysical). */
  varnishedWood: {
    color: '#6a4a32',
    roughness: 0.52,
    metalness: 0.02,
    envMapIntensity: 0.22,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
  },
  /** Skin material — low metalness, moderate roughness, subtle SSS approx. */
  skin: {
    color: '#d4a878',
    roughness: 0.72,
    metalness: 0.0,
    envMapIntensity: 0.18,
    clearcoat: 0.08,
    clearcoatRoughness: 0.65,
    sheen: 0.28,
    sheenRoughness: 0.58,
    sheenColor: '#ffdfc4',
  },
  /** Heavy fabric — high sheen for deep cloth. */
  heavyFabric: {
    color: '#3a3545',
    roughness: 0.92,
    metalness: 0.01,
    envMapIntensity: 0.15,
    sheen: 0.5,
    sheenRoughness: 0.68,
    sheenColor: '#6a6a7a',
  },
  neonEmissive: {
    color: '#101018',
    roughness: 0.35,
    metalness: 0.4,
    emissive: '#22ffdd',
    emissiveIntensity: 1.4,
  },
  monitorGlass: {
    color: '#0a0a12',
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.15,
    thickness: 0.2,
  },
  /** Selective hero wet glass — plaza facades / cafe panes (MeshPhysical). */
  wetGlass: {
    color: '#88aacc',
    roughness: 0.06,
    metalness: 0.12,
    transmission: 0.22,
    thickness: 0.35,
  },
  /** Rain puddle sheen — few instances only, not blanket ground. */
  wetAsphaltPuddle: {
    color: '#1a2230',
    roughness: 0.12,
    metalness: 0.28,
    transmission: 0,
    thickness: 0,
  },
  /** Neon tube / fascia with wet clearcoat read. */
  neonWetGlass: {
    color: '#101018',
    roughness: 0.22,
    metalness: 0.45,
    transmission: 0.08,
    thickness: 0.15,
    emissive: '#22ffdd',
    emissiveIntensity: 1.1,
  },
} as const;

export type PbrPresetId = keyof typeof PBR_PRESETS;

export function createStandardFromPreset(
  preset: PbrPresetId,
  overrides?: Partial<MeshStandardMaterialParameters>,
): MeshStandardMaterial {
  const p = PBR_PRESETS[preset];
  // Presets with transmission require MeshPhysicalMaterial
  if ('transmission' in p) {
    return createPhysicalFromPreset(preset, overrides as Partial<MeshPhysicalMaterialParameters>) as unknown as MeshStandardMaterial;
  }
  return new MeshStandardMaterial({
    color: p.color,
    roughness: p.roughness,
    metalness: p.metalness,
    envMapIntensity: ('envMapIntensity' in p ? p.envMapIntensity : 0.22) as number,
    ...('emissive' in p
      ? {
          emissive: p.emissive,
          emissiveIntensity: 'emissiveIntensity' in p ? p.emissiveIntensity : 1,
        }
      : {}),
    ...overrides,
  });
}

export function createPhysicalFromPreset(
  preset: PbrPresetId,
  overrides?: Partial<MeshPhysicalMaterialParameters>,
): MeshPhysicalMaterial {
  const p = PBR_PRESETS[preset];
  const transmission = 'transmission' in p ? p.transmission : 0;
  const thickness = 'thickness' in p ? p.thickness : 0;
  const wetGlassLike = preset === 'wetGlass' || preset === 'neonWetGlass' || preset === 'wetAsphaltPuddle';
  return new MeshPhysicalMaterial({
    color: p.color,
    roughness: p.roughness,
    metalness: p.metalness,
    envMapIntensity: ('envMapIntensity' in p ? p.envMapIntensity : 0.22) as number,
    transmission,
    thickness,
    ...(wetGlassLike
      ? {
          clearcoat: preset === 'wetAsphaltPuddle' ? 0.85 : 0.55,
          clearcoatRoughness: preset === 'wetAsphaltPuddle' ? 0.12 : 0.28,
          ior: preset === 'wetGlass' ? 1.45 : 1.35,
        }
      : 'clearcoat' in p
        ? { clearcoat: p.clearcoat as number, clearcoatRoughness: ('clearcoatRoughness' in p ? p.clearcoatRoughness : 0.5) as number }
        : {}),
    ...('sheen' in p
      ? { sheen: p.sheen as number, sheenRoughness: ('sheenRoughness' in p ? p.sheenRoughness : 0.7) as number, sheenColor: ('sheenColor' in p ? p.sheenColor : '#6a6a7a') as any }
      : {}),
    ...('emissive' in p
      ? {
          emissive: p.emissive,
          emissiveIntensity: 'emissiveIntensity' in p ? p.emissiveIntensity : 1,
        }
      : {}),
    ...overrides,
  });
}

/** Lerp roughness/metalness toward wet surface values (rain intensity 0–1). */
export function applyWetness(
  material: MeshStandardMaterial,
  dryRoughness: number,
  dryMetalness: number,
  wetness: number,
): void {
  const t = Math.min(1, Math.max(0, wetness));
  material.roughness = MathUtils.lerp(dryRoughness, 0.28, t);
  material.metalness = MathUtils.lerp(dryMetalness, 0.35, t);
  material.needsUpdate = true;
}
