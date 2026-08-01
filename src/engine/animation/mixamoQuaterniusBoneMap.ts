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

  // Clavicle / finger stubs (common Mixamo export gaps on Quaternius)
  leftclavicle: 'Shoulder.L',
  rightclavicle: 'Shoulder.R',
  lefthandthumb1: 'Wrist.L',
  righthandthumb1: 'Wrist.R',
  lefthandindex1: 'Wrist.L',
  righthandindex1: 'Wrist.R',
  lefthandmiddle1: 'Wrist.L',
  righthandmiddle1: 'Wrist.R',

  // Underscore Mixamo variants
  left_arm: 'UpperArm.L',
  right_arm: 'UpperArm.R',
  left_forearm: 'LowerArm.L',
  right_forearm: 'LowerArm.R',
  left_hand: 'Wrist.L',
  right_hand: 'Wrist.R',
  left_up_leg: 'UpperLeg.L',
  right_up_leg: 'UpperLeg.R',
  left_leg: 'LowerLeg.L',
  right_leg: 'LowerLeg.R',
  left_foot: 'Foot.L',
  right_foot: 'Foot.R',

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
 * Quaternius modular `_rigs` use undotted sides (`ShoulderL`); classic packs use `Shoulder.L`.
 */
export function resolveDestinationBoneName(
  sourceBone: string,
  destinationBones: ReadonlySet<string>,
): string | null {
  if (destinationBones.has(sourceBone)) return sourceBone;

  const alias = MIXAMO_TO_QUATERNIUS_BONE_ALIASES[normalizeBoneAliasKey(sourceBone)];
  const dottedKey = sourceBone.trim().toLowerCase();
  const dottedAlias = MIXAMO_TO_QUATERNIUS_BONE_ALIASES[dottedKey];

  for (const candidate of expandQuaterniusBoneCandidates(alias ?? dottedAlias ?? null)) {
    if (destinationBones.has(candidate)) return candidate;
  }

  // Also try expanding the raw source name (already-Quaternius tracks on mixed clips).
  for (const candidate of expandQuaterniusBoneCandidates(sourceBone)) {
    if (destinationBones.has(candidate)) return candidate;
  }

  const lower = sourceBone.toLowerCase();
  for (const dest of destinationBones) {
    if (dest.toLowerCase() === lower) return dest;
  }

  return null;
}

/** `Shoulder.L` ↔ `ShoulderL`, `PT.L` ↔ `PTL` for modular vs classic Quaternius. */
export function expandQuaterniusBoneCandidates(name: string | null): string[] {
  if (!name) return [];
  const out: string[] = [name];
  if (name.includes('.')) {
    out.push(name.replace(/\./g, ''));
  } else {
    const side = name.match(/^(.*?)([LR])$/);
    if (side && side[1] && side[1].length > 0) {
      out.push(`${side[1]}.${side[2]}`);
    }
  }
  return out;
}
