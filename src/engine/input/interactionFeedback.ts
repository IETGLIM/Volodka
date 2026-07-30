import { audioEngine } from '@/engine/AudioEngine';

export type InteractionFeedbackKind = 'npc' | 'object' | 'exit';

const FEEDBACK_BY_KIND: Record<InteractionFeedbackKind, { sfx: string; vibrationMs: number }> = {
  npc: { sfx: 'ui_open', vibrationMs: 14 },
  object: { sfx: 'notify', vibrationMs: 10 },
  exit: { sfx: 'confirm', vibrationMs: 18 },
};

function vibrate(ms: number): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* Some desktop browsers expose vibrate but deny it. */
  }
}

export function triggerInteractionFeedback(kind: InteractionFeedbackKind): void {
  const feedback = FEEDBACK_BY_KIND[kind];
  audioEngine.playSfx(feedback.sfx);
  vibrate(feedback.vibrationMs);
}
