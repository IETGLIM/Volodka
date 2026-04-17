import type { Object3D } from 'three';

/** Материал под ногами для SFX шагов (задаётся в `userData` у коллайдера Rapier). */
export type FootstepMaterial = 'wood' | 'concrete' | 'grass' | 'metal' | 'carpet' | 'default';

const KNOWN: ReadonlySet<string> = new Set(['wood', 'concrete', 'grass', 'metal', 'carpet', 'default']);

export function isFootstepMaterial(v: string): v is FootstepMaterial {
  return KNOWN.has(v);
}

const FS_PREFIX = 'fs:';

export function resolveFootstepMaterial(obj: Object3D | undefined): FootstepMaterial {
  if (!obj) return 'default';
  const raw = obj.userData?.footstepMaterial;
  if (typeof raw === 'string' && isFootstepMaterial(raw)) return raw;
  const n = obj.name;
  if (typeof n === 'string' && n.startsWith(FS_PREFIX)) {
    const m = n.slice(FS_PREFIX.length);
    if (isFootstepMaterial(m)) return m;
  }
  return 'default';
}

/** Для `CuboidCollider` из `@react-three/rapier` (в типах нет `userData` на коллайдере). */
export function footstepColliderName(material: FootstepMaterial): string {
  return `${FS_PREFIX}${material}`;
}

export function footstepSfxType(material: FootstepMaterial): string {
  return `footstep_${material}`;
}
