import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lock, Zap, Shield, Skull } from 'lucide-react';
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
  /** Karma delta preview — shown before the player chooses */
  karmaPreview?: number;
  /** Explicit difficulty tier hint (1–20 scale). Parent can compute from cond.skillCheckResult.difficulty */
  difficultyHint?: number;
}

/* ── Difficulty tier computation ── */

type DifficultyTier = 'easy' | 'medium' | 'hard' | 'extreme';

interface DifficultyInfo {
  tier: DifficultyTier;
  label: string;
}

const DIFFICULTY_TIERS: Record<string, DifficultyInfo> = {
  easy:    { tier: 'easy',    label: 'Лёгкий' },
  medium:  { tier: 'medium',  label: 'Средний' },
  hard:    { tier: 'hard',    label: 'Сложный' },
  extreme: { tier: 'extreme', label: 'Экстрем.' },
};

function computeDifficultyTier(difficulty: number): DifficultyInfo {
  if (difficulty <= 5)  return DIFFICULTY_TIERS.easy;
  if (difficulty <= 10) return DIFFICULTY_TIERS.medium;
  if (difficulty <= 15) return DIFFICULTY_TIERS.hard;
  return DIFFICULTY_TIERS.extreme;
}

function getDifficultyIcon(tier: string) {
  switch (tier) {
    case 'easy':    return Shield;
    case 'medium':  return Zap;
    case 'hard':    return Zap;
    case 'extreme': return Skull;
    default:        return null;
  }
}

function getDifficultyFromCond(cond: StoryConditionResult): number | undefined {
  // Active skill-check roll
  if (cond.skillCheckResult?.difficulty != null) return cond.skillCheckResult.difficulty;
  // Locked choice — show difficulty of the gate
  if (cond.skillCheckNeeded) return cond.skillCheckNeeded.needed;
  return undefined;
}

/* ── Choice badges sub-component ── */

interface ChoiceBadgesProps {
  karmaPreview?: number;
  difficultyHint?: number;
  cond: StoryConditionResult;
  pass: boolean;
}

function ChoiceBadges({ karmaPreview, difficultyHint, cond, pass }: ChoiceBadgesProps) {
  const [hovered, setHovered] = useState(false);
  const difficulty = difficultyHint ?? getDifficultyFromCond(cond);
  if (karmaPreview == null && difficulty == null) return null;

  const diffInfo = difficulty != null ? computeDifficultyTier(difficulty) : null;
  const DiffIcon = diffInfo ? getDifficultyIcon(diffInfo.tier) : null;

  return (
    <div
      className="flex items-center gap-1.5 shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Karma preview badge */}
      {karmaPreview != null && pass && (
        <span className={`karma-preview ${karmaPreview >= 0 ? 'positive' : 'negative'}`}>
          ☯ {karmaPreview >= 0 ? '+' : ''}{karmaPreview}
        </span>
      )}

      {/* Difficulty indicator badge */}
      {diffInfo && DiffIcon && (
        <span
          className={`choice-difficulty choice-difficulty-${diffInfo.tier}`}
          title={hovered ? `Сложность: ${diffInfo.label} (${difficulty})` : undefined}
        >
          <DiffIcon className="size-2.5" />
          <span className="choice-difficulty-label">{hovered ? diffInfo.label : difficulty}</span>
        </span>
      )}
    </div>
  );
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
          className={`group w-full text-left ${padding} hud-filmic-choice hud-filmic-hover-lift ${textSize} ${
            choice.pass ? 'cursor-pointer' : 'opacity-45 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-2">
            <span
              className="hud-filmic-kicker hud-filmic-choice-badge w-4 shrink-0 text-center mt-0.5"
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
            <ChoiceBadges
              karmaPreview={choice.karmaPreview}
              difficultyHint={choice.difficultyHint}
              cond={choice.cond}
              pass={choice.pass}
            />
          </div>
        </motion.button>
      ))}
    </>
  );
}
