import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { buildChoiceAriaLabel } from '@/shared/utils/choiceAriaLabel';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { StoryConditionResult } from '@/shared/storyConditions';

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
        whileHover={reducedMotion ? undefined : { scale: 1.01 }}
        whileTap={reducedMotion ? undefined : { scale: 0.99 }}
        onClick={onContinue}
        aria-label={continueHint ? `${continueLabel}. ${continueHint}` : continueLabel}
        className={`group w-full text-left ${padding} rounded-lg border border-white/15 bg-black/50 backdrop-blur-md text-slate-100 hover:bg-black/65 hover:border-white/25 transition-all`}
        style={{ boxShadow: `0 0 20px ${accentColor}12` }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 justify-center">
            <ChevronRight className="size-4" style={{ color: accentColor }} />
            <span className={textSize} style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
              {continueLabel}
            </span>
          </div>
          {continueHint ? (
            <span className="text-[10px] font-mono text-slate-500 tracking-wide">
              {continueHint}
            </span>
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
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { delay: i * 0.05, duration: 0.22 }}
          whileHover={choice.pass && !reducedMotion ? { scale: 1.01 } : undefined}
          whileTap={choice.pass && !reducedMotion ? { scale: 0.99 } : undefined}
          onClick={() => {
            if (choice.pass) choice.onSelect();
          }}
          disabled={!choice.pass}
          aria-label={buildChoiceAriaLabel({ index: i, text: choice.text, cond: choice.cond })}
          aria-disabled={!choice.pass}
          className={`group w-full text-left ${padding} rounded-lg border backdrop-blur-md transition-all ${textSize} ${
            choice.pass
              ? 'border-white/15 bg-black/50 text-slate-100 hover:bg-black/65 hover:border-white/25 cursor-pointer narrative-choice-hover'
              : 'border-white/5 bg-black/30 text-slate-500 cursor-not-allowed opacity-55'
          }`}
          style={choice.pass ? { boxShadow: `0 0 16px ${accentColor}10` } : undefined}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono w-4 shrink-0 text-center"
              style={{ color: choice.pass ? accentColor : undefined }}
            >
              {i + 1}
            </span>
            <span className="flex-1" style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}>
              {choice.text}
            </span>
            {choice.trailing}
            {choice.pass && (
              <Zap className="size-3 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: accentColor }} />
            )}
          </div>
        </motion.button>
      ))}
    </>
  );
}
