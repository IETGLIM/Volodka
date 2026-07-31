/**
 * Mixamo / KayKit / Quaternius humanoid bone aliases.
 * Used when retargeting shipped animation clips onto Quaternius modular rigs.
 *
 * Keys are normalized (lowercase, no `mixamorig:` / separators).
 * Values are Quaternius destination bone names when present on the rig.
 */
export const MIXAMO_TO_QUATERNIUS_BONE_ALIASES: Readonly<Record<string, string>> = {
  // Classic Mixamo (with or without mixamorig: prefix — normalized away)
  hips: 'Hips',
  spine: 'Abdomen',
  spine1: 'Torso',
  spine2: 'Chest',
  neck: 'Neck',
  head: 'Head',
  leftshoulder: 'Shoulder.L',
  rightshoulder: 'Shoulder.R',
  leftarm: 'UpperArm.L',
  rightarm: 'UpperArm.R',
  leftforearm: 'LowerArm.L',
  rightforearm: 'LowerArm.R',
  lefthand: 'Wrist.L',
  righthand: 'Wrist.R',
  leftupleg: 'UpperLeg.L',
  rightupleg: 'UpperLeg.R',
  leftleg: 'LowerLeg.L',
  rightleg: 'LowerLeg.R',
  leftfoot: 'Foot.L',
  rightfoot: 'Foot.R',
  lefttoebase: 'PT.L',
  righttoebase: 'PT.R',

  // KayKit / UAL slot leftovers on sleeping clip (dotted + flattened)
  'hand.l': 'Wrist.L',
  'hand.r': 'Wrist.R',
  handl: 'Wrist.L',
  handr: 'Wrist.R',
  'handslot.l': 'Wrist.L',
  'handslot.r': 'Wrist.R',
  handslotl: 'Wrist.L',
  handslotr: 'Wrist.R',
  rig_medium: 'CharacterArmature',
  rigmedium: 'CharacterArmature',
};

/** Normalize bone names for alias lookup (strip Mixamo prefix; keep `.` / `_`). */
export function normalizeBoneAliasKey(boneName: string): string {
  return boneName.trim().replace(/^mixamorig:?/i, '').replace(/\s+/g, '').toLowerCase();
}

/**
 * Resolve a source track bone name to a destination skeleton bone, or null if none.
 * Prefers exact match on the destination, then alias map, then case-insensitive match.
 */
export function resolveDestinationBoneName(
  sourceBone: string,
  destinationBones: ReadonlySet<string>,
): string | null {
  if (destinationBones.has(sourceBone)) return sourceBone;

  const alias = MIXAMO_TO_QUATERNIUS_BONE_ALIASES[normalizeBoneAliasKey(sourceBone)];
  if (alias && destinationBones.has(alias)) return alias;

  // hand.l style keys need the dotted form in the alias table — also try raw lower
  const dottedKey = sourceBone.trim().toLowerCase();
  const dottedAlias = MIXAMO_TO_QUATERNIUS_BONE_ALIASES[dottedKey];
  if (dottedAlias && destinationBones.has(dottedAlias)) return dottedAlias;

  const lower = sourceBone.toLowerCase();
  for (const dest of destinationBones) {
    if (dest.toLowerCase() === lower) return dest;
  }

  return null;
}
