import { motion } from 'framer-motion';
import { ChevronRight, Zap, RotateCcw, Timer } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode, Ref } from 'react';
import { buildChoiceAriaLabel } from '@/shared/utils/choiceAriaLabel';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { StoryConditionResult } from '@/shared/storyConditions';

/* ── Difficulty labels and colors ── */
function getDifficultyTier(difficulty: number): { label: string; cssClass: string } {
  if (difficulty <= 8) return { label: 'Легко', cssClass: 'easy' };
  if (difficulty <= 14) return { label: 'Средне', cssClass: 'medium' };
  return { label: 'Сложно', cssClass: 'hard' };
}

/* ── Consequence chip ── */
function ConsequenceChip({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  const cls = value > 0 ? 'positive' : 'negative';
  return (
    <span className={`choice-consequence-chip ${cls}`}>
      {label} {value > 0 ? '+' : ''}{value}
    </span>
  );
}

/* ── Previous choice badge ── */
function PreviousChoiceBadge() {
  return (
    <span className="choice-previous-indicator">
      <RotateCcw className="size-2.5" />
      Выбрано ранее
    </span>
  );
}

/* ── Timer display for a single choice ── */
function ChoiceTimer({
  seconds,
  onExpire,
  active,
}: {
  seconds: number;
  onExpire: () => void;
  active: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 0.1) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          onExpire();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [active, seconds, onExpire]);

  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const timerClass = pct > 50 ? 'safe' : pct > 20 ? 'warning' : 'danger';

  return (
    <div className="choice-timer-bar">
      <div
        className={`choice-timer-fill ${timerClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export interface CinematicChoiceItem {
  key: string;
  text: string;
  pass: boolean;
  cond: StoryConditionResult;
  onSelect: () => void;
  trailing?: ReactNode;
  /** Consequence preview data — shown below the choice text */
  consequences?: {
    karma: number;
    energy: number;
    stress: number;
  };
  /** Whether this choice was previously selected at this node */
  wasPreviousChoice?: boolean;
  /** Skill check difficulty (1-20) for color-coded display */
  skillDifficulty?: number;
}

export interface CinematicNarrativeChoicesProps {
  choices: CinematicChoiceItem[];
  accentColor: string;
  continueLabel?: string;
  onContinue?: () => void;
  firstChoiceRef?: Ref<HTMLButtonElement>;
  /** Optional countdown timer in seconds — auto-selects first available choice on expire */
  timerSeconds?: number;
}

/** Centered cinematic choice list — Witcher / FF style, not bottom HUD panel. */
export function CinematicNarrativeChoices({
  choices,
  accentColor,
  continueLabel = 'Продолжить',
  onContinue,
  firstChoiceRef,
  timerSeconds,
}: CinematicNarrativeChoicesProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const timerActive = timerSeconds !== undefined && timerSeconds > 0;
  const hasConsequences = choices.some((c) => c.consequences);
  const hasPrevious = choices.some((c) => c.wasPreviousChoice);

  const handleTimerExpire = useCallback(() => {
    const first = choices.find((c) => c.pass);
    if (first) first.onSelect();
  }, [choices]);

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
        className="group w-full text-left px-5 py-3 rounded-lg border border-white/15 bg-black/40 backdrop-blur-md text-slate-100 hover:bg-black/55 hover:border-white/25 transition-all narrative-choice-hover cyber-dialogue-choice dialogue-choice-card"
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
      {timerActive && (
        <div className="flex items-center gap-1.5 mb-2 justify-center">
          <Timer className="size-3 text-amber-400" />
          <span className="text-[10px] font-mono text-amber-300">
            Ограничено по времени: {timerSeconds}с
          </span>
        </div>
      )}
      {choices.map((choice, i) => {
        const tier = choice.skillDifficulty != null
          ? getDifficultyTier(choice.skillDifficulty)
          : null;
        const showEnhancements = hasConsequences || hasPrevious || tier || timerActive;

        return (
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
            className={`group w-full text-left px-5 py-3 rounded-lg border backdrop-blur-md transition-all cyber-dialogue-choice choice-card-enhanced ${
              choice.pass
                ? 'border-white/15 bg-black/40 text-slate-100 hover:bg-black/55 hover:border-white/25 cursor-pointer narrative-choice-hover dialogue-choice-card'
                : 'border-white/5 bg-black/25 text-slate-500 cursor-not-allowed opacity-55'
            } ${choice.wasPreviousChoice ? 'choice-card-was-selected' : ''}`}
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
              {/* Skill check with difficulty tier */}
              {choice.cond.skillCheck && (
                <span className={`choice-difficulty-badge ${tier?.cssClass ?? 'hard'}`}>
                  <Zap className="size-3" />
                  {choice.cond.skillCheck.skill} {choice.cond.skillCheck.needed}
                  {tier && <span style={{ opacity: 0.7 }}> · {tier.label}</span>}
                </span>
              )}
              {choice.trailing}
            </div>
            {/* Consequences row + previous choice badge */}
            {showEnhancements && (
              <div className="choice-consequences-row ml-8">
                {choice.wasPreviousChoice && <PreviousChoiceBadge />}
                {choice.consequences && (
                  <>
                    <ConsequenceChip value={choice.consequences.karma} label="☯" />
                    <ConsequenceChip value={choice.consequences.energy} label="⚡" />
                    <ConsequenceChip value={choice.consequences.stress} label="😰" />
                  </>
                )}
              </div>
            )}
            {/* Timer bar for timed choices */}
            {timerActive && choice.pass && i === 0 && (
              <ChoiceTimer
                seconds={timerSeconds!}
                onExpire={handleTimerExpire}
                active={true}
              />
            )}
          </motion.button>
        );
      })}
    </>
  );
}
