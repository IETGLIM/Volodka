/** Ambient audio lifecycle — explicit FSM for crossfade / dispose guards. */

export type AudioPlaybackState =
  | 'idle'
  | 'fadingOut'
  | 'fadingIn'
  | 'playing'
  | 'disposed';

const VALID_TRANSITIONS: Record<AudioPlaybackState, readonly AudioPlaybackState[]> = {
  idle: ['fadingIn', 'fadingOut', 'disposed'],
  fadingOut: ['idle', 'fadingIn', 'disposed'],
  fadingIn: ['playing', 'fadingOut', 'disposed'],
  playing: ['fadingOut', 'fadingIn', 'disposed'],
  disposed: [],
};

export function canTransitionAudioState(
  from: AudioPlaybackState,
  to: AudioPlaybackState,
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from].includes(to);
}

export function transitionAudioState(
  current: AudioPlaybackState,
  next: AudioPlaybackState,
): AudioPlaybackState {
  if (!canTransitionAudioState(current, next)) {
    return current;
  }
  return next;
}
