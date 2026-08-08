import { audioEngine } from '@/engine/AudioEngine';
import { hapticLight, hapticMedium, hapticNpcInteraction } from '@/shared/utils/hapticFeedback';

export type InteractionFeedbackKind = 'npc' | 'object' | 'exit';

const FEEDBACK_BY_KIND: Record<InteractionFeedbackKind, { sfx: string; haptic: () => void }> = {
  npc: { sfx: 'ui_open', haptic: hapticNpcInteraction },
  object: { sfx: 'notify', haptic: hapticLight },
  exit: { sfx: 'confirm', haptic: hapticMedium },
};

export function triggerInteractionFeedback(kind: InteractionFeedbackKind): void {
  const feedback = FEEDBACK_BY_KIND[kind];
  audioEngine.playSfx(feedback.sfx);
  feedback.haptic();
}
