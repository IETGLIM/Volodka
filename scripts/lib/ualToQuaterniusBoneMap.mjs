/**
 * Map Quaternius Universal Animation Library (DEF-* rig) bone names
 * to Ultimate Modular Characters skeleton (Head, Hips, Index1.L, …).
 *
 * UAL Standard (OpenGameArt / pre–v2.0 Godot export) uses Blender DEF-* names.
 * Modular NPC GLBs use PascalCase Mixamo-style names without mixamorig prefix.
 */

/** @type {Readonly<Record<string, string>>} */
export const UAL_TO_QUATERNIUS_BONE_MAP = {
  root: 'Root',
  'DEF-hips': 'Hips',
  'DEF-spine.001': 'Abdomen',
  'DEF-spine.002': 'Torso',
  'DEF-spine.003': 'Chest',
  'DEF-neck': 'Neck',
  'DEF-head': 'Head',
  'DEF-shoulder.L': 'Shoulder.L',
  'DEF-upper_arm.L': 'UpperArm.L',
  'DEF-forearm.L': 'LowerArm.L',
  'DEF-hand.L': 'Wrist.L',
  'DEF-f_index.01.L': 'Index1.L',
  'DEF-f_index.02.L': 'Index2.L',
  'DEF-f_index.03.L': 'Index3.L',
  'DEF-f_middle.01.L': 'Middle1.L',
  'DEF-f_middle.02.L': 'Middle2.L',
  'DEF-f_middle.03.L': 'Middle3.L',
  'DEF-f_pinky.01.L': 'Pinky1.L',
  'DEF-f_pinky.02.L': 'Pinky2.L',
  'DEF-f_pinky.03.L': 'Pinky3.L',
  'DEF-f_ring.01.L': 'Ring1.L',
  'DEF-f_ring.02.L': 'Ring2.L',
  'DEF-f_ring.03.L': 'Ring3.L',
  'DEF-thumb.01.L': 'Thumb1.L',
  'DEF-thumb.02.L': 'Thumb2.L',
  'DEF-thumb.03.L': 'Thumb3.L',
  'DEF-shoulder.R': 'Shoulder.R',
  'DEF-upper_arm.R': 'UpperArm.R',
  'DEF-forearm.R': 'LowerArm.R',
  'DEF-hand.R': 'Wrist.R',
  'DEF-f_index.01.R': 'Index1.R',
  'DEF-f_index.02.R': 'Index2.R',
  'DEF-f_index.03.R': 'Index3.R',
  'DEF-f_middle.01.R': 'Middle1.R',
  'DEF-f_middle.02.R': 'Middle2.R',
  'DEF-f_middle.03.R': 'Middle3.R',
  'DEF-f_pinky.01.R': 'Pinky1.R',
  'DEF-f_pinky.02.R': 'Pinky2.R',
  'DEF-f_pinky.03.R': 'Pinky3.R',
  'DEF-f_ring.01.R': 'Ring1.R',
  'DEF-f_ring.02.R': 'Ring2.R',
  'DEF-f_ring.03.R': 'Ring3.R',
  'DEF-thumb.01.R': 'Thumb1.R',
  'DEF-thumb.02.R': 'Thumb2.R',
  'DEF-thumb.03.R': 'Thumb3.R',
  'DEF-thigh.L': 'UpperLeg.L',
  'DEF-shin.L': 'LowerLeg.L',
  'DEF-foot.L': 'Foot.L',
  'DEF-toe.L': 'PT.L',
  'DEF-thigh.R': 'UpperLeg.R',
  'DEF-shin.R': 'LowerLeg.R',
  'DEF-foot.R': 'Foot.R',
  'DEF-toe.R': 'PT.R',
};

/**
 * @param {object} json GLB JSON chunk
 * @param {Readonly<Record<string, string>>} [map]
 */
export function remapGlbBoneNames(json, map = UAL_TO_QUATERNIUS_BONE_MAP) {
  if (!json.nodes?.length) return json;
  const nodes = json.nodes.map((node) => {
    if (!node.name) return node;
    const mapped = map[node.name];
    if (!mapped) return node;
    return { ...node, name: mapped };
  });
  return { ...json, nodes };
}
