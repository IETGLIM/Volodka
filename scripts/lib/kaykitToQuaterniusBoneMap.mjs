/**
 * Map KayKit Rig_Medium bone names (lowercase, dot-separated)
 * to Quaternius Ultimate Modular Character skeleton (PascalCase Mixamo-style).
 *
 * Source: KayKit Character Animations (CC0) — Med_Simulation.glb / Lie_Idle
 * https://kaylousberg.itch.io/kaykit-character-animations
 */

/** @type {Readonly<Record<string, string>>} */
export const KAYKIT_TO_QUATERNIUS_BONE_MAP = {
  root: 'Root',
  hips: 'Hips',
  spine: 'Abdomen',
  chest: 'Chest',
  head: 'Head',
  'upperarm.l': 'UpperArm.L',
  'lowerarm.l': 'LowerArm.L',
  'wrist.l': 'Wrist.L',
  'upperarm.r': 'UpperArm.R',
  'lowerarm.r': 'LowerArm.R',
  'wrist.r': 'Wrist.R',
  'upperleg.l': 'UpperLeg.L',
  'lowerleg.l': 'LowerLeg.L',
  'foot.l': 'Foot.L',
  'toes.l': 'PT.L',
  'upperleg.r': 'UpperLeg.R',
  'lowerleg.r': 'LowerLeg.R',
  'foot.r': 'Foot.R',
  'toes.r': 'PT.R',
};

/** Duplicate spine-driven motion onto Torso (KayKit has no separate Torso bone). */
export const KAYKIT_CHANNEL_DUPLICATES = [
  { from: 'Abdomen', to: 'Torso' },
];

/**
 * @param {object} json GLB JSON chunk
 * @param {Readonly<Record<string, string>>} [map]
 */
export function remapGlbBoneNames(json, map = KAYKIT_TO_QUATERNIUS_BONE_MAP) {
  if (!json.nodes?.length) return json;
  const nodes = json.nodes.map((node) => {
    if (!node.name) return node;
    const mapped = map[node.name];
    if (!mapped) return node;
    return { ...node, name: mapped };
  });
  return { ...json, nodes };
}

/**
 * Copy animation channels from one remapped bone to another (e.g. Abdomen → Torso).
 * @param {object} json GLB JSON chunk with animations[]
 * @param {readonly { from: string, to: string }[]} pairs
 */
export function duplicateAnimationBoneChannels(json, pairs = KAYKIT_CHANNEL_DUPLICATES) {
  if (!json.animations?.length || !json.nodes?.length) return json;

  const nameToIndex = new Map(json.nodes.map((node, index) => [node.name, index]));

  for (const { from, to } of pairs) {
    let toIndex = nameToIndex.get(to);
    if (toIndex === undefined) {
      const fromIndex = nameToIndex.get(from);
      if (fromIndex === undefined) continue;
      toIndex = json.nodes.length;
      json.nodes.push({ name: to });
      nameToIndex.set(to, toIndex);
    }

    const fromIndex = nameToIndex.get(from);
    if (fromIndex === undefined) continue;

    for (const anim of json.animations) {
      for (const channel of anim.channels ?? []) {
        if (channel.target?.node !== fromIndex) continue;
        anim.channels.push({
          ...channel,
          target: { ...channel.target, node: toIndex },
        });
      }
    }
  }

  return json;
}
