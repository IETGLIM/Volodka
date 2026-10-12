/* ─── Immersive Voice Channel — single-lane presentation coordinator ───
 *
 * QA report (v4.48.13): «Мысли володьки и Голос перекрывают друг друга,
 * идут одновременно и сбивают с толку» — thought bubble (volodka:thought)
 * and the Голос voice-line subtitle (audio:voice_line_start) could appear
 * at the same time: two competing "inner voice" texts on screen.
 *
 * Contract:
 *  • The VOICE lane owns the channel while a voice line plays — voice is
 *    tied to real audio timing and cannot be delayed.
 *  • THOUGHTS are queued (FIFO, bounded) and presented when the channel
 *    frees. A thought that is on screen when a voice line starts is
 *    preempted: it is re-queued at the front and re-presented afterwards.
 *
 * Consumers: InnerMonologueOverlay (thoughts) and VoiceLineSubtitleHud
 * (Голос subtitles). Both stay eventBus-decoupled — this module is the
 * only shared state between them.
 */

export type ImmersiveVoiceOwner = 'thought' | 'voice';

let activeOwner: ImmersiveVoiceOwner | null = null;

type FreedListener = (info: { previous: ImmersiveVoiceOwner | null }) => void;
const freedListeners = new Set<FreedListener>();
const thoughtPreemptedListeners = new Set<() => void>();

function notifyFreed(previous: ImmersiveVoiceOwner | null): void {
  for (const fn of [...freedListeners]) {
    try {
      fn({ previous });
    } catch {
      /* listener errors must not break the channel */
    }
  }
}

function notifyThoughtPreempted(): void {
  for (const fn of [...thoughtPreemptedListeners]) {
    try {
      fn();
    } catch {
      /* listener errors must not break the channel */
    }
  }
}

/** Current channel owner, or null when the channel is free. */
export function getImmersiveVoiceOwner(): ImmersiveVoiceOwner | null {
  return activeOwner;
}

/**
 * Request exclusive presentation. VOICE preempts an active THOUGHT (the
 * thought owner receives onImmersiveVoiceThoughtPreempted and re-queues);
 * every other conflict waits and returns false.
 */
export function requestImmersiveVoiceChannel(next: ImmersiveVoiceOwner): boolean {
  if (activeOwner === next) return true;
  if (activeOwner === null) {
    activeOwner = next;
    return true;
  }
  if (next === 'voice' && activeOwner === 'thought') {
    activeOwner = 'voice';
    notifyThoughtPreempted();
    return true;
  }
  return false;
}

/**
 * Release the channel. Only the current owner can release it — a stale
 * release from a competing overlay is ignored.
 */
export function releaseImmersiveVoiceChannel(owner: ImmersiveVoiceOwner): boolean {
  if (activeOwner !== owner) return false;
  activeOwner = null;
  notifyFreed(owner);
  return true;
}

/** Subscribe to channel-free notifications (retry queued presentations). */
export function onImmersiveVoiceFreed(fn: FreedListener): () => void {
  freedListeners.add(fn);
  return () => freedListeners.delete(fn);
}

/** Subscribe to thought preemption (voice taking over mid-thought). */
export function onImmersiveVoiceThoughtPreempted(fn: () => void): () => void {
  thoughtPreemptedListeners.add(fn);
  return () => thoughtPreemptedListeners.delete(fn);
}

/** Test helper — reset module state between tests. */
export function resetImmersiveVoiceChannelForTests(): void {
  activeOwner = null;
  freedListeners.clear();
  thoughtPreemptedListeners.clear();
}
