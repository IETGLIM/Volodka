import * as THREE from 'three';

/** Shared PBR material presets for procedural scenes — tuned away from plastic kit look. */
export const PBR_PRESETS = {
  asphalt: {
    color: '#3a3a52',
    roughness: 0.88,
    metalness: 0.05,
  },
  asphaltWet: {
    color: '#2a2a3a',
    roughness: 0.32,
    metalness: 0.22,
  },
  concrete: {
    color: '#5a5a6a',
    roughness: 0.92,
    metalness: 0.02,
  },
  sidewalk: {
    color: '#4a4a62',
    roughness: 0.86,
    metalness: 0.04,
  },
  plaster: {
    color: '#7a7468',
    roughness: 0.9,
    metalness: 0.01,
  },
  wornWood: {
    color: '#6a4a32',
    roughness: 0.78,
    metalness: 0.02,
  },
  fabric: {
    color: '#4a4050',
    roughness: 0.95,
    metalness: 0,
  },
  paintedMetal: {
    color: '#4a5568',
    roughness: 0.55,
    metalness: 0.45,
  },
  wetMetal: {
    color: '#4a5568',
    roughness: 0.25,
    metalness: 0.85,
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
  overrides?: Partial<THREE.MeshStandardMaterialParameters>,
): THREE.MeshStandardMaterial {
  const p = PBR_PRESETS[preset];
  // Presets with transmission require MeshPhysicalMaterial
  if ('transmission' in p) {
    return createPhysicalFromPreset(preset, overrides as Partial<THREE.MeshPhysicalMaterialParameters>) as unknown as THREE.MeshStandardMaterial;
  }
  return new THREE.MeshStandardMaterial({
    color: p.color,
    roughness: p.roughness,
    metalness: p.metalness,
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
  overrides?: Partial<THREE.MeshPhysicalMaterialParameters>,
): THREE.MeshPhysicalMaterial {
  const p = PBR_PRESETS[preset];
  const transmission = 'transmission' in p ? p.transmission : 0;
  const thickness = 'thickness' in p ? p.thickness : 0;
  const wetGlassLike = preset === 'wetGlass' || preset === 'neonWetGlass' || preset === 'wetAsphaltPuddle';
  return new THREE.MeshPhysicalMaterial({
    color: p.color,
    roughness: p.roughness,
    metalness: p.metalness,
    transmission,
    thickness,
    ...(wetGlassLike
      ? {
          clearcoat: preset === 'wetAsphaltPuddle' ? 0.85 : 0.55,
          clearcoatRoughness: preset === 'wetAsphaltPuddle' ? 0.12 : 0.28,
          ior: preset === 'wetGlass' ? 1.45 : 1.35,
        }
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
  material: THREE.MeshStandardMaterial,
  dryRoughness: number,
  dryMetalness: number,
  wetness: number,
): void {
  const t = Math.min(1, Math.max(0, wetness));
  material.roughness = THREE.MathUtils.lerp(dryRoughness, 0.28, t);
  material.metalness = THREE.MathUtils.lerp(dryMetalness, 0.35, t);
  material.needsUpdate = true;
}
