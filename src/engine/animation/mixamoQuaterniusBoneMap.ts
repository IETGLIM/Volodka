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

  // Clavicles + full Mixamo finger chains. Mapping finger roots to Wrist used
  // to drop most finger motion when a real hand track was also present, or
  // worse, rotate the whole wrist when it was absent.
  leftclavicle: 'Shoulder.L',
  rightclavicle: 'Shoulder.R',
  lefthandthumb1: 'Thumb1.L',
  lefthandthumb2: 'Thumb2.L',
  lefthandthumb3: 'Thumb3.L',
  righthandthumb1: 'Thumb1.R',
  righthandthumb2: 'Thumb2.R',
  righthandthumb3: 'Thumb3.R',
  lefthandindex1: 'Index1.L',
  lefthandindex2: 'Index2.L',
  lefthandindex3: 'Index3.L',
  righthandindex1: 'Index1.R',
  righthandindex2: 'Index2.R',
  righthandindex3: 'Index3.R',
  lefthandmiddle1: 'Middle1.L',
  lefthandmiddle2: 'Middle2.L',
  lefthandmiddle3: 'Middle3.L',
  righthandmiddle1: 'Middle1.R',
  righthandmiddle2: 'Middle2.R',
  righthandmiddle3: 'Middle3.R',
  lefthandring1: 'Ring1.L',
  lefthandring2: 'Ring2.L',
  lefthandring3: 'Ring3.L',
  righthandring1: 'Ring1.R',
  righthandring2: 'Ring2.R',
  righthandring3: 'Ring3.R',
  lefthandpinky1: 'Pinky1.L',
  lefthandpinky2: 'Pinky2.L',
  lefthandpinky3: 'Pinky3.L',
  righthandpinky1: 'Pinky1.R',
  righthandpinky2: 'Pinky2.R',
  righthandpinky3: 'Pinky3.R',

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
