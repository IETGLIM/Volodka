/* ─── Volodka RPG – filter AnimationClip tracks to bones that exist in the target skeleton ─── */

import { AnimationClip, Object3D } from 'three';
import { resolveDestinationBoneName } from './mixamoQuaterniusBoneMap';

/**
 * Collect the names of all named Object3D nodes under `root` (including root
 * itself). Used to filter AnimationClip tracks whose target node names do not
 * exist in the destination rig — a common case when retargeting Mixamo clips
 * (which target a Mixamo skeleton: `handl`, `handr`, `handslotl`,
 * `handslotr`, `Rig_Medium`, etc.) onto a Quaternius-style skeleton that
 * uses different bone names.
 *
 * Without this filter, three.js logs a `PropertyBinding: No target
 * node found for track: <name>.<property>` warning per orphan track and
 * silently drops the track. Filtering upfront silences the warnings and
 * avoids the wasted binding-resolution work per frame.
 */
export function collectNodeNames(root: Object3D): Set<string> {
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
  clip: AnimationClip,
  root: Object3D,
): AnimationClip {
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
  return new AnimationClip(clip.name, clip.duration, remapped, clip.blendMode);
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
  clip: AnimationClip,
  root: Object3D,
): AnimationClip {
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

  return new AnimationClip(
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
 * Make root-bone translation in-place so locomotion is driven by the capsule /
 * patrol mover rather than doubled by the clip. Horizontal values stay fixed
 * at the first frame, while vertical hip motion is preserved for gait bounce,
 * sitting, kneeling and sleeping poses.
 */
export function stripRootTranslationTracks(clip: AnimationClip): AnimationClip {
  let changed = false;
  const tracks = clip.tracks.map((track) => {
    const parts = splitTrackName(track.name);
    if (!parts) return track;
    const nodeName = parts.nodeName.replace(/\s+/g, '').toLowerCase();
    const prop = parts.property.toLowerCase();
    if (
      !ROOT_BONE_NAMES.has(nodeName) ||
      !prop.startsWith('position') ||
      track.getValueSize() !== 3 ||
      track.values.length < 3
    ) {
      return track;
    }

    const firstX = track.values[0];
    const firstZ = track.values[2];
    let hasHorizontalMotion = false;
    for (let index = 0; index < track.values.length; index += 3) {
      if (track.values[index] !== firstX || track.values[index + 2] !== firstZ) {
        hasHorizontalMotion = true;
        break;
      }
    }
    if (!hasHorizontalMotion) return track;

    const next = track.clone();
    for (let index = 0; index < next.values.length; index += 3) {
      next.values[index] = firstX;
      next.values[index + 2] = firstZ;
    }
    changed = true;
    return next;
  });

  if (!changed) return clip;

  return new AnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
}
