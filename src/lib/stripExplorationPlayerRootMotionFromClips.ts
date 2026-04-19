import * as THREE from 'three';

/**
 * Имена узлов, чьи **translation** в glTF часто задают root motion (смещение всего персонажа),
 * пока физика уже двигает **`RigidBody`**. Узлы вроде `chestl` / `chestr` не трогаем —
 * это локальные IK, не «перенос» тела по сцене.
 */
const ROOT_LIKE_POSITION_NODE = new Set([
  'root',
  'rootx',
  'hips',
  'armature',
]);

function normalizedPositionNodeName(trackName: string): string | null {
  if (!trackName.endsWith('.position')) return null;
  return trackName
    .slice(0, -'.position'.length)
    .toLowerCase()
    .replace(/:/g, '')
    .replace(/\s/g, '');
}

/** Только векторные треки позиции кости (`*.position`). */
export function isExplorationPlayerRootMotionPositionTrack(track: THREE.KeyframeTrack): boolean {
  if (!(track instanceof THREE.VectorKeyframeTrack)) return false;
  const node = normalizedPositionNodeName(track.name);
  if (!node) return false;
  if (ROOT_LIKE_POSITION_NODE.has(node)) return true;
  if (node.includes('hips') && (node.includes('mixamorig') || node.includes('mixamo'))) return true;
  if (node === 'bip001') return true;
  return false;
}

/** Мутирует клип: выкидывает root-motion translation; пересчитывает длительность. */
export function stripExplorationPlayerRootMotionTranslationInPlace(clip: THREE.AnimationClip): void {
  clip.tracks = clip.tracks.filter((t) => !isExplorationPlayerRootMotionPositionTrack(t));
  clip.resetDuration();
}

/**
 * Клонирует клипы и снимает root translation на клонах — не портим кэш **`useGLTF`** общими мутациями.
 */
export function cloneAnimationClipsWithoutExplorationPlayerRootMotion(
  animations: THREE.AnimationClip[] | undefined | null,
): THREE.AnimationClip[] {
  if (!animations?.length) return [];
  return animations.map((clip) => {
    const c = clip.clone();
    stripExplorationPlayerRootMotionTranslationInPlace(c);
    return c;
  });
}
