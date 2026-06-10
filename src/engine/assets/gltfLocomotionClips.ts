import * as THREE from 'three';

const LOCOMOTION_ALIASES: Record<string, string[]> = {
  idle: ['idle', 'Idle', 'IDLE', 'pose', 'Pose', 'TPose', '0'],
  walk: ['walk', 'Walk', 'walking', 'Walking', 'WalkCycle'],
  run: ['run', 'Run', 'running', 'Running', 'RunCycle'],
  jump: ['jump', 'Jump', 'jumping', 'Jumping'],
  fall: ['fall', 'Fall', 'Falling'],
  attack: ['attack', 'Attack', 'punch', 'Punch', 'slash', 'Slash', 'hit', 'Hit'],
};

/** Pick the best locomotion clip for a runtime animation state. */
export function findLocomotionClip(
  animations: THREE.AnimationClip[],
  state: string,
): THREE.AnimationClip | null {
  if (animations.length === 0) return null;

  const aliases = LOCOMOTION_ALIASES[state] ?? [state];
  for (const alias of aliases) {
    const lower = alias.toLowerCase();
    const match = animations.find(
      (clip) =>
        clip.name.toLowerCase() === lower || clip.name.toLowerCase().includes(lower),
    );
    if (match) return match;
  }

  if (state === 'run') return findLocomotionClip(animations, 'walk');
  if (state === 'fall') return findLocomotionClip(animations, 'jump');
  if (state === 'idle') return animations[0] ?? null;

  return findLocomotionClip(animations, 'idle');
}
