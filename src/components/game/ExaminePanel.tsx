/* ─── Volodka RPG – Examine beat ───
 *  Act 1: compact bottom panel. Other acts: fullscreen cinematic frame.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExamineData } from '@/shared/types/game';
import { consumeEKey } from '@/engine/input/eKeyConsumption';
import {
  CinematicNarrativeChoices,
  CinematicNarrativeFrame,
  resolveExaminePresentation,
} from '@/components/game/cinematic';
import { NarrativeChoiceList } from '@/components/game/diegetic/NarrativeChoiceList';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';
import { useGameStore } from '@/store/gameStore';
import { isAct1DiegeticScene } from '@/engine/narrative/narrativePresentationPolicy';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { diegeticDialogueBottomPadCss } from '@/shared/constants/hudLayout';
import { useMobileDetection } from '@/components/game/orchestrator/useMobileDetection';
import { useSuppressExplorationBottomHud } from '@/hooks/useExplorationBottomHud';

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
  const isMobile = useMobileDetection();
  const suppressBottomHud = useSuppressExplorationBottomHud();
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const compact = isAct1DiegeticScene(sceneId);
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

  if (!open || !data) return null;

  const icon = data.icon || '🔍';
  const presentation = resolveExaminePresentation('#66ddcc');

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          key={`examine-compact-${data.title}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed left-0 right-0 px-4 pointer-events-auto"
          style={{
            zIndex: UI_LAYERS.DIALOGUE,
            bottom: diegeticDialogueBottomPadCss(isMobile, !suppressBottomHud),
          }}
          role="dialog"
          aria-label={`Осмотр: ${data.title}`}
        >
          <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-black/60 backdrop-blur-md p-4 glass-panel-dark">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cyan-300 mb-1">{data.title}</p>
                <p className="text-sm text-slate-100 font-serif whitespace-pre-line">{displayed}</p>
              </div>
              <button type="button" onClick={onClose} className="text-xs text-slate-400 shrink-0">Esc</button>
            </div>
            {done && (
              <div className="mt-2">
                <NarrativeChoiceList
                  choices={[]}
                  accentColor={presentation.accentColor}
                  compact
                  continueLabel={hasLinkedContent && onContinue ? 'Продолжить [E]' : 'Закрыть'}
                  onContinue={hasLinkedContent && onContinue ? onContinue : onClose}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

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
