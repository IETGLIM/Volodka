import { motion } from 'framer-motion';
import { ChevronRight, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { buildChoiceAriaLabel } from '@/shared/utils/choiceAriaLabel';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { StoryConditionResult } from '@/shared/storyConditions';
import type { TrainablePlayerSkill } from '@/shared/types/game';

const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Кодинг',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Писательство',
  rhythm: 'Ритм',
};

/** Build a short human-readable reason why a choice is locked. */
function formatCondFailReason(cond: StoryConditionResult): string | null {
  if (cond.skillCheckNeeded) {
    const label = SKILL_LABELS[cond.skillCheckNeeded.skill] ?? cond.skillCheckNeeded.skill;
    return `Требуется ${label} ${cond.skillCheckNeeded.needed} (у тебя ${cond.skillCheckNeeded.current})`;
  }
  if (cond.relationNeeded) {
    return `Отношение слишком низкое: ${cond.relationNeeded.current}/${cond.relationNeeded.needed}`;
  }
  if (cond.actNeeded) {
    return `Откроется в акте ${cond.actNeeded.needed}`;
  }
  if (cond.karmaNeeded) {
    const label = cond.karmaNeeded.type === 'min' ? 'минимум' : 'не более';
    return `Карма: ${label} ${cond.karmaNeeded.needed} (сейчас ${cond.karmaNeeded.current})`;
  }
  return null;
}

export interface NarrativeChoiceItem {
  key: string;
  text: string;
  pass: boolean;
  cond: StoryConditionResult;
  onSelect: () => void;
  trailing?: ReactNode;
}

export interface NarrativeChoiceListProps {
  choices: NarrativeChoiceItem[];
  accentColor: string;
  continueLabel?: string;
  continueHint?: string;
  onContinue?: () => void;
  compact?: boolean;
}

/** Choice list for diegetic HUD and cinematic overlays. */
export function NarrativeChoiceList({
  choices,
  accentColor,
  continueLabel = 'Продолжить',
  continueHint,
  onContinue,
  compact = false,
}: NarrativeChoiceListProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const padding = compact ? 'px-3 py-2' : 'px-5 py-3';
  const textSize = compact ? 'text-sm' : 'text-base';

  if (choices.length === 0 && onContinue) {
    return (
      <motion.button
        type="button"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onContinue}
        aria-label={continueHint ? `${continueLabel}. ${continueHint}` : continueLabel}
        className={`group w-full text-left ${padding} hud-filmic-choice`}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 justify-center">
            <ChevronRight className="size-3.5 opacity-60" />
            <span className={textSize}>{continueLabel}</span>
          </div>
          {continueHint ? (
            <span className="hud-filmic-kicker">{continueHint}</span>
          ) : null}
        </div>
      </motion.button>
    );
  }

  return (
    <>
      {choices.map((choice, i) => (
        <motion.button
          key={choice.key}
          type="button"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { delay: i * 0.04, duration: 0.2 }}
          onClick={() => {
            if (choice.pass) choice.onSelect();
          }}
          disabled={!choice.pass}
          aria-label={buildChoiceAriaLabel({ index: i, text: choice.text, cond: choice.cond })}
          aria-disabled={!choice.pass}
          className={`group w-full text-left ${padding} hud-filmic-choice dialogue-choice-card ${textSize} ${
            choice.pass ? 'cursor-pointer' : 'opacity-45 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-2">
            <span
              className="hud-filmic-kicker w-4 shrink-0 text-center mt-0.5"
              style={{ color: choice.pass ? accentColor : undefined, letterSpacing: '0.08em' }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="block font-serif">{choice.text}</span>
              {!choice.pass && (() => {
                const reason = formatCondFailReason(choice.cond);
                return reason ? (
                  <span className="flex items-center gap-1 mt-1 hud-filmic-kicker" style={{ letterSpacing: '0.06em' }}>
                    <Lock className="size-2.5 shrink-0" />
                    {reason}
                  </span>
                ) : null;
              })()}
            </div>
            {choice.trailing}
          </div>
        </motion.button>
      ))}
    </>
  );
}
