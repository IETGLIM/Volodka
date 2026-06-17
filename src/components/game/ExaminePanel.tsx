/* ─── Volodka RPG – Examine cinematic beat ───
 *  Object inspection as full-screen AAA title card (not HUD panel).
 */

import { useEffect } from 'react';
import type { ExamineData } from '@/shared/types/game';
import { consumeEKey } from '@/engine/input/eKeyConsumption';
import {
  CinematicNarrativeChoices,
  CinematicNarrativeFrame,
  resolveExaminePresentation,
} from '@/components/game/cinematic';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';

interface ExaminePanelProps {
  open: boolean;
  data: ExamineData | null;
  onClose: () => void;
  hasLinkedContent?: boolean;
  onContinue?: () => void;
}

export function ExaminePanel({
  open,
  data,
  onClose,
  hasLinkedContent,
  onContinue,
}: ExaminePanelProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const bodyText = data
    ? data.detailText
      ? `${data.description}\n\n${data.detailText}`
      : data.description
    : '';
  const { displayed, done, skip } = useNarrativeTypewriter(bodyText, open ? 22 : 0);

  useEffect(() => {
    if (!open || !hasLinkedContent || !onContinue) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || !done) return;
      e.preventDefault();
      e.stopPropagation();
      consumeEKey(300);
      onContinue();
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, hasLinkedContent, onContinue, done]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  if (!open || !data) return null;

  const icon = data.icon || '🔍';
  const presentation = resolveExaminePresentation('#66ddcc');

  return (
    <CinematicNarrativeFrame
      nodeKey={`examine-${data.title}`}
      presentation={presentation}
      ariaLabel="Осмотр предмета"
      speakerTitleId="examine-title"
      speakerLabel={data.title}
      displayedText={displayed}
      done={done}
      reducedMotion={reducedMotion}
      liveMessage={`${data.title}: ${displayed}`}
      onSkip={skip}
      onClose={onClose}
      footer={
        <p className="text-center text-4xl sm:text-5xl mt-2" aria-hidden>
          {icon}
        </p>
      }
    >
      {done && hasLinkedContent && onContinue && (
        <CinematicNarrativeChoices
          accentColor={presentation.accentColor}
          continueLabel="Продолжить [E]"
          onContinue={onContinue}
          choices={[]}
        />
      )}
      {done && !hasLinkedContent && (
        <CinematicNarrativeChoices
          accentColor={presentation.accentColor}
          continueLabel="Закрыть"
          onContinue={onClose}
          choices={[]}
        />
      )}
    </CinematicNarrativeFrame>
  );
}
