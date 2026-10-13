/* ─── Immersive Voice Channel — single-lane presentation coordinator ───
 *
 * QA report (v4.48.13): «Мысли володьки и Голос перекрывают друг друга,
 * идут одновременно и сбивают с толку» — thought bubble (volodka:thought)
 * and the Голос voice-line subtitle (audio:voice_line_start) could appear
 * at the same time: two competing "inner voice" texts on screen.
 *
 * QA report (v4.48.17, скриншот): «Мысли, меню и голос накладываются друг
 * на друга, всё это надо выстроить поэтапно» — diegetic-плашка «голоса»
 * (DiegeticDialogueHud) и кинематик-диалог (DialogueRenderer) НЕ держали
 * канал, поэтому мысль «Комната. Три монитора…» ложилась ПОВЕРХ бокса с
 * выборами. Теперь реплика «голоса» — тоже владелец полосы:
 *
 * Contract (поэтапная подача — один текстовый фокус за раз):
 *  • DIALOGUE (плашка реплики/выборов) — первичная полоса: пока игрок
 *    читает и выбирает, мысли и TTS-субтитры ждут. Открываясь, прерывает
 *    активную мысль (она возвращается в голову очереди и покажется после
 *    закрытия).
 *  • The VOICE lane (TTS-субтитр) owns the channel while a voice line
 *    plays — voice is tied to real audio timing and cannot be delayed.
 *    Пока плашка открыта, субтитр подавлен (он дублирует текст плашки).
 *  • THOUGHTS are queued (FIFO, bounded) and presented when the channel
 *    frees — поэтапно, после закрытия реплики/субтитра.
 *
 * Consumers: InnerMonologueOverlay (thoughts), VoiceLineSubtitleHud
 * (Голос TTS-субтитры), DiegeticDialogueHud + DialogueRenderer (реплика).
 * All stay eventBus-decoupled — this module is the only shared state.
 */

export type ImmersiveVoiceOwner = 'thought' | 'voice' | 'dialogue';

let activeOwner: ImmersiveVoiceOwner | null = null;

type FreedListener = (info: { previous: ImmersiveVoiceOwner | null }) => void;
const freedListeners = new Set<FreedListener>();
const thoughtPreemptedListeners = new Set<() => void>();
/** v4.48.17: наблюдатели захвата полосы (хинты ждут, пока владелец есть). */
type AcquiredListener = (info: { owner: ImmersiveVoiceOwner; previous: ImmersiveVoiceOwner | null }) => void;
const acquiredListeners = new Set<AcquiredListener>();

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

function notifyAcquired(owner: ImmersiveVoiceOwner, previous: ImmersiveVoiceOwner | null): void {
  for (const fn of [...acquiredListeners]) {
    try {
      fn({ owner, previous });
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
 * Request exclusive presentation. Preemption matrix (поэтапная подача):
 *  • DIALOGUE preempts an active THOUGHT (реплика важнее висящей мысли —
 *    мысль вернётся в голову очереди и покажется после закрытия).
 *  • VOICE preempts an active THOUGHT (реплика привязана к реальному аудио).
 *  • THOUGHT and VOICE wait while DIALOGUE holds (плашка уже показывает
 *    этот текст — субтитр дублировал бы его; мысли ждут своей очереди).
 *  • Every other conflict waits and returns false.
 */
export function requestImmersiveVoiceChannel(next: ImmersiveVoiceOwner): boolean {
  if (activeOwner === next) return true;
  const previous: ImmersiveVoiceOwner | null = activeOwner;
  if (activeOwner === null) {
    activeOwner = next;
    notifyAcquired(next, previous);
    return true;
  }
  if (next === 'voice' && activeOwner === 'thought') {
    activeOwner = 'voice';
    notifyThoughtPreempted();
    notifyAcquired(next, previous);
    return true;
  }
  if (next === 'dialogue' && activeOwner === 'thought') {
    activeOwner = 'dialogue';
    notifyThoughtPreempted();
    notifyAcquired(next, previous);
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

/** v4.48.17: subscribe to lane-acquired notifications (owner changed).
 *  Fires only on actual ownership transitions — the holders' periodic
 *  re-requests (no-op `activeOwner === next`) do NOT notify. */
export function onImmersiveVoiceAcquired(fn: AcquiredListener): () => void {
  acquiredListeners.add(fn);
  return () => acquiredListeners.delete(fn);
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
  acquiredListeners.clear();
}
