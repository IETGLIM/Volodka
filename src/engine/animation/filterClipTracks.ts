/* ─── Volodka RPG – filter AnimationClip tracks to bones that exist in the target skeleton ─── */

import * as THREE from 'three';
import { resolveDestinationBoneName } from './mixamoQuaterniusBoneMap';

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

const TRACK_PROPERTY_SUFFIX =
  /\.(position|quaternion|scale|morphTargetInfluences(?:\[\d+\])?)$/i;

function splitTrackName(trackName: string): { nodeName: string; property: string } | null {
  const propMatch = TRACK_PROPERTY_SUFFIX.exec(trackName);
  if (propMatch && propMatch.index > 0) {
    return {
      nodeName: trackName.substring(0, propMatch.index),
      property: trackName.substring(propMatch.index + 1),
    };
  }
  const dotIndex = trackName.indexOf('.');
  if (dotIndex === -1) return null;
  return {
    nodeName: trackName.substring(0, dotIndex),
    property: trackName.substring(dotIndex + 1),
  };
}

/**
 * Rename Mixamo / KayKit track bones onto Quaternius destination names when the
 * destination bone exists. Skips a remap when the destination bone already has
 * a track for the same property (avoids double-driving Wrist from hand.l + Wrist).
 * Returns the original clip when nothing changes.
 */
export function remapClipTracksToSkeleton(
  clip: THREE.AnimationClip,
  root: THREE.Object3D,
): THREE.AnimationClip {
  const nodeNames = collectNodeNames(root);
  const occupied = new Set<string>();
  for (const track of clip.tracks) {
    const parts = splitTrackName(track.name);
    if (!parts) continue;
    if (nodeNames.has(parts.nodeName)) {
      occupied.add(`${parts.nodeName}.${parts.property.toLowerCase()}`);
    }
  }

  let changed = false;
  const remapped = clip.tracks.map((track) => {
    const parts = splitTrackName(track.name);
    if (!parts) return track;
    if (nodeNames.has(parts.nodeName)) return track;

    const dest = resolveDestinationBoneName(parts.nodeName, nodeNames);
    if (!dest || dest === parts.nodeName) return track;

    const occKey = `${dest}.${parts.property.toLowerCase()}`;
    if (occupied.has(occKey)) return track;

    occupied.add(occKey);
    changed = true;
    const next = track.clone();
    next.name = `${dest}.${parts.property}`;
    return next;
  });

  if (!changed) return clip;
  return new THREE.AnimationClip(clip.name, clip.duration, remapped, clip.blendMode);
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
    const parts = splitTrackName(track.name);
    if (!parts) return true; // unknown format — keep
    return nodeNames.has(parts.nodeName);
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
  'body', // Quaternius locomotion root on idle/walk/talk interim clips
  'mixamorighips',
  'mixamorig:hips',
  'root',
  'armature',
  'characterarmature',
  'rig_medium',
]);

/**
 * Drop root-bone *translation* tracks so locomotion is driven by the capsule /
 * patrol mover — not by Mixamo in-place→with-root double motion (cheap foot-slide).
 * Rotation/scale on the root bone are kept for hip sway.
 */
export function stripRootTranslationTracks(clip: THREE.AnimationClip): THREE.AnimationClip {
  const kept = clip.tracks.filter((track) => {
    const parts = splitTrackName(track.name);
    if (!parts) return true;
    const nodeName = parts.nodeName.replace(/\s+/g, '').toLowerCase();
    const prop = parts.property.toLowerCase();
    if (!ROOT_BONE_NAMES.has(nodeName)) return true;
    return !prop.startsWith('position');
  });

  if (kept.length === clip.tracks.length) return clip;

  return new THREE.AnimationClip(clip.name, clip.duration, kept, clip.blendMode);
}
