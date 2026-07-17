import * as THREE from 'three';

/** Shared PBR material presets for procedural scenes. */
export const PBR_PRESETS = {
  asphalt: {
    color: '#3a3a52',
    roughness: 0.88,
    metalness: 0.05,
  },
  asphaltWet: {
    color: '#2a2a3a',
    roughness: 0.35,
    metalness: 0.25,
  },
  concrete: {
    color: '#5a5a6a',
    roughness: 0.92,
    metalness: 0.02,
  },
  wetMetal: {
    color: '#4a5568',
    roughness: 0.25,
    metalness: 0.85,
  },
  monitorGlass: {
    color: '#0a0a12',
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.15,
    thickness: 0.2,
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
  return new THREE.MeshPhysicalMaterial({
    color: p.color,
    roughness: p.roughness,
    metalness: p.metalness,
    transmission,
    thickness,
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
