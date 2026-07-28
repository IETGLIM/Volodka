import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { buildChoiceAriaLabel } from '@/shared/utils/choiceAriaLabel';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { StoryConditionResult } from '@/shared/storyConditions';

export interface CinematicChoiceItem {
  key: string;
  text: string;
  pass: boolean;
  cond: StoryConditionResult;
  onSelect: () => void;
  trailing?: ReactNode;
}

export interface CinematicNarrativeChoicesProps {
  choices: CinematicChoiceItem[];
  accentColor: string;
  continueLabel?: string;
  onContinue?: () => void;
  firstChoiceRef?: Ref<HTMLButtonElement>;
}

/** Centered cinematic choice list — Witcher / FF style, not bottom HUD panel. */
export function CinematicNarrativeChoices({
  choices,
  accentColor,
  continueLabel = 'Продолжить',
  onContinue,
  firstChoiceRef,
}: CinematicNarrativeChoicesProps) {
  const reducedMotion = useEffectiveReducedMotion();

  if (choices.length === 0 && onContinue) {
    return (
      <motion.button
        type="button"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reducedMotion ? undefined : { scale: 1.01 }}
        whileTap={reducedMotion ? undefined : { scale: 0.99 }}
        onClick={onContinue}
        aria-label={continueLabel}
        className="group w-full text-left px-5 py-3 rounded-lg border border-white/15 bg-black/40 backdrop-blur-md text-slate-100 hover:bg-black/55 hover:border-white/25 transition-all narrative-choice-hover cyber-dialogue-choice"
        style={{ boxShadow: `0 0 24px ${accentColor}12` }}
      >
        <div className="flex items-center gap-2 justify-center">
          <ChevronRight className="size-4" style={{ color: accentColor }} />
          <span style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>{continueLabel}</span>
        </div>
      </motion.button>
    );
  }

  return (
    <>
      {choices.map((choice, i) => (
        <motion.button
          key={choice.key}
          ref={i === 0 ? firstChoiceRef : undefined}
          type="button"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { delay: i * 0.04, duration: 0.18 }}
          whileHover={choice.pass && !reducedMotion ? { scale: 1.01 } : undefined}
          whileTap={choice.pass && !reducedMotion ? { scale: 0.99 } : undefined}
          onClick={() => {
            if (choice.pass) choice.onSelect();
          }}
          disabled={!choice.pass}
          aria-label={buildChoiceAriaLabel({ index: i, text: choice.text, cond: choice.cond })}
          aria-disabled={!choice.pass}
          className={`group w-full text-left px-5 py-3 rounded-lg border backdrop-blur-md transition-all cyber-dialogue-choice ${
            choice.pass
              ? 'border-white/15 bg-black/40 text-slate-100 hover:bg-black/55 hover:border-white/25 cursor-pointer narrative-choice-hover'
              : 'border-white/5 bg-black/25 text-slate-500 cursor-not-allowed opacity-55'
          }`}
          style={choice.pass ? { boxShadow: `0 0 20px ${accentColor}10` } : undefined}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-mono w-5 shrink-0 text-center"
              style={{ color: choice.pass ? accentColor : undefined }}
            >
              {i + 1}
            </span>
            <span
              className="flex-1"
              style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              {choice.text}
            </span>
            {choice.cond.skillCheck && (
              <span className="flex items-center gap-1 text-xs text-rose-300 shrink-0">
                <Zap className="size-3" />
                {choice.cond.skillCheck.skill} {choice.cond.skillCheck.needed}
              </span>
            )}
            {choice.trailing}
          </div>
        </motion.button>
      ))}
    </>
  );
}
