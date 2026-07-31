/* ─── Volodka RPG – filter AnimationClip tracks to bones that exist in the target skeleton ─── */

import * as THREE from 'three';

/**
 * Collect the names of all named Object3D nodes under `root` (including root
 * itself). Used to filter AnimationClip tracks whose target node names do not
 * exist in the destination rig — a common case when retargeting Mixamo clips
 * (which target a Mixamo skeleton: `handl`, `handr`, `handslotl`,
 * `handslotr`, `Rig_Medium`, etc.) onto a Quaternius-style skeleton that
 * uses different bone names.
 *
 * Without this filter, three.js logs a `THREE.PropertyBinding: No target
 * node found for track: <name>.<property>` warning per orphan track and
 * silently drops the track. Filtering upfront silences the warnings and
 * avoids the wasted binding-resolution work per frame.
 */
export function collectNodeNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((node) => {
    if (node.name) names.add(node.name);
  });
  return names;
}

/**
 * Return a new AnimationClip with only the tracks whose target node exists
 * in `root`. If no tracks are filtered out, the original clip is returned
 * unchanged (no clone).
 *
 * Track name format is `<nodeName>.<propertyName>` or `<nodeName>.<subnodeName>.<propertyName>`
 * (morph target tracks). The node name is the first `.`-delimited segment.
 */
export function filterClipTracksToExistingNodes(
  clip: THREE.AnimationClip,
  root: THREE.Object3D,
): THREE.AnimationClip {
  const nodeNames = collectNodeNames(root);
  // Track names look like "Hips.position" or "Hips.quaternion" or
  // "Head.morphTargetInfluences[0]". The node name is the first segment.
  const keptTracks = clip.tracks.filter((track) => {
    const dotIndex = track.name.indexOf('.');
    if (dotIndex === -1) return true; // unknown format — keep
    const nodeName = track.name.substring(0, dotIndex);
    return nodeNames.has(nodeName);
  });

  if (keptTracks.length === clip.tracks.length) {
    return clip; // nothing filtered — no need to clone
  }

  return new THREE.AnimationClip(
    clip.name,
    clip.duration,
    keptTracks,
    clip.blendMode,
  );
}

const ROOT_BONE_NAMES = new Set([
  'hips',
  'mixamorighips',
  'mixamorig:hips',
  'root',
  'armature',
]);

/**
 * Drop root-bone *translation* tracks so locomotion is driven by the capsule /
 * patrol mover — not by Mixamo in-place→with-root double motion (cheap foot-slide).
 * Rotation/scale on the root bone are kept for hip sway.
 */
export function stripRootTranslationTracks(clip: THREE.AnimationClip): THREE.AnimationClip {
  const kept = clip.tracks.filter((track) => {
    const dotIndex = track.name.indexOf('.');
    if (dotIndex === -1) return true;
    const nodeName = track.name.substring(0, dotIndex).replace(/\s+/g, '').toLowerCase();
    const prop = track.name.substring(dotIndex + 1).toLowerCase();
    if (!ROOT_BONE_NAMES.has(nodeName)) return true;
    return !prop.startsWith('position');
  });

  if (kept.length === clip.tracks.length) return clip;

  return new THREE.AnimationClip(clip.name, clip.duration, kept, clip.blendMode);
}
