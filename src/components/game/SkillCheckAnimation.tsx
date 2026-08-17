'use client';

/* ─── Volodka RPG – Enhanced Skill Check Dice Roll Animation ───
   3D-perspective spinning dice with glow burst, success/fail flash,
   threshold indicator, and difficulty modifier display. Russian text. */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';
import {
  type DiceRollResult,
  DICE_SKILL_LABELS,
  getSuccessProbability,
  getSuccessDegreeLabel,
  getSuccessDegreeColor,
  type SuccessDegree,
} from '@/engine/skillCheck';

export interface SkillCheckAnimationProps {
  result: DiceRollResult;
  skill: TrainablePlayerSkill;
  skillLevel: number;
  thoughtBonus?: number;
  successDegree?: SuccessDegree;
  onComplete: () => void;
  autoDismissMs?: number;
}

/* ── Animation phases ── */
type Phase = 'spinning' | 'reveal-dice' | 'reveal-modifier' | 'reveal-total' | 'result' | 'dismiss';

const PHASE_DURATIONS: Record<Phase, number> = {
  'spinning': 900,
  'reveal-dice': 400,
  'reveal-modifier': 500,
  'reveal-total': 400,
  'result': 700,
  'dismiss': 300,
};

/* ── 3D Die face with perspective transform ── */
function DieFace({ value, spinning, revealed, color }: {
  value: number;
  spinning: boolean;
  revealed: boolean;
  color: string;
}) {
  const [displayValue, setDisplayValue] = useState(1);
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [glowBurst, setGlowBurst] = useState(false);

  useEffect(() => {
    if (spinning) {
      rollInterval.current = setInterval(() => {
        setDisplayValue(1 + Math.floor(Math.random() * 6));
      }, 65);
    } else if (revealed) {
      if (rollInterval.current) clearInterval(rollInterval.current);
      setDisplayValue(value);
      setGlowBurst(true);
      const t = setTimeout(() => setGlowBurst(false), 500);
      return () => clearTimeout(t);
    }
    return () => {
      if (rollInterval.current) clearInterval(rollInterval.current);
    };
  }, [spinning, revealed, value]);

  const dotPatterns: Record<number, number[]> = {
    1: [4],
    2: [2, 6],
    3: [2, 4, 6],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const dots = dotPatterns[displayValue] ?? [];

  return (
    <div className="relative" style={{ width: 60, height: 60, perspective: 300 }}>
      {/* Glow burst on reveal */}
      <AnimatePresence>
        {glowBurst && (
          <motion.div
            key="glow-burst"
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          rotateX: spinning ? 720 + Math.random() * 360 : 0,
          rotateY: spinning ? 360 + Math.random() * 360 : 0,
          rotateZ: spinning ? (Math.random() - 0.5) * 30 : 0,
          scale: revealed ? 1.15 : spinning ? 0.85 : 0.75,
        }}
        transition={{
          duration: spinning ? 0.9 : 0.35,
          ease: spinning ? 'linear' : [0.34, 1.56, 0.64, 1],
        }}
        className="absolute inset-0 rounded-xl border-2 flex items-center justify-center"
        style={{
          borderColor: revealed ? color : 'rgba(255,255,255,0.15)',
          background: spinning
            ? 'rgba(0,0,0,0.85)'
            : revealed
              ? `linear-gradient(135deg, rgba(0,0,0,0.92), ${color}18)`
              : 'rgba(0,0,0,0.6)',
          boxShadow: revealed
            ? `0 0 24px ${color}50, 0 0 48px ${color}18, inset 0 0 16px ${color}12`
            : spinning
              ? `0 0 8px rgba(0,229,255,0.15)`
              : 'none',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {revealed ? (
          <div className="grid grid-cols-3 gap-[3px] p-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: dots.includes(i) ? 1 : 0.3 }}
                transition={{ delay: 0.05 * i, duration: 0.2, ease: 'backOut' }}
                className="rounded-full"
                style={{
                  width: 9,
                  height: 9,
                  background: dots.includes(i) ? color : 'rgba(255,255,255,0.08)',
                  boxShadow: dots.includes(i) ? `0 0 6px ${color}90, 0 0 12px ${color}30` : 'none',
                }}
              />
            ))}
          </div>
        ) : (
          <motion.span
            className="text-2xl font-mono text-white/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            ?
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}

/* ── Terminal-style typed text ── */
function TypedText({ text, visible, color }: {
  text: string;
  visible: boolean;
  color?: string;
}) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!visible) { setDisplayed(''); indexRef.current = 0; return; }
    const id = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [visible, text]);

  return (
    <span className="font-mono text-sm" style={{ color: color ?? 'rgba(255,255,255,0.85)' }}>
      {displayed}
      {visible && displayed.length < text.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse"
          style={{ background: color ?? 'rgba(0,255,255,0.7)' }}
        />
      )}
    </span>
  );
}

/* ── Threshold indicator bar ── */
function ThresholdBar({
  value, max, threshold, success, color,
}: {
  value: number;
  max: number;
  threshold: number;
  success: boolean;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const thresholdPct = Math.min(100, (threshold / max) * 100);

  return (
    <div className="w-full mt-2 mb-1 px-1">
      <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/5">
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px] z-10 rounded-full"
          style={{
            left: `${thresholdPct}%`,
            background: 'rgba(255,255,255,0.7)',
            boxShadow: '0 0 6px rgba(255,255,255,0.4)',
          }}
        />
        <span
          className="absolute -top-4 text-[9px] font-mono text-white/50 z-10"
          style={{ left: `${thresholdPct}%`, transform: 'translateX(-50%)' }}
        >
          Порог: {threshold}
        </span>
        {/* Value fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: success
              ? `linear-gradient(90deg, ${color}88, ${color})`
              : `linear-gradient(90deg, rgba(251,113,133,0.5), rgba(251,113,133,0.9))`,
            boxShadow: `0 0 8px ${success ? color + '40' : 'rgba(251,113,133,0.3)'}`,
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export function SkillCheckAnimation({
  result,
  skill,
  skillLevel,
  thoughtBonus = 0,
  successDegree,
  onComplete,
  autoDismissMs = 3000,
}: SkillCheckAnimationProps) {
  const [phase, setPhase] = useState<Phase>('spinning');
  const [die1Revealed, setDie1Revealed] = useState(false);
  const [die2Revealed, setDie2Revealed] = useState(false);
  const completedRef = useRef(false);

  const skillLabel = DICE_SKILL_LABELS[skill];
  const { dice, total, modifier, dc, success, criticalSuccess, criticalFailure } = result;

  const degreeLabel = successDegree ? getSuccessDegreeLabel(successDegree) : null;
  const degreeColor = successDegree ? getSuccessDegreeColor(successDegree) : null;

  const resultColor = degreeColor ?? (criticalSuccess
    ? '#fbbf24'
    : criticalFailure
      ? '#ef4444'
      : success
        ? '#10b981'
        : '#ef4444');

  const resultLabel = degreeLabel ?? (criticalSuccess
    ? 'КРИТИЧЕСКИЙ УСПЕХ'
    : criticalFailure
      ? 'КРИТИЧЕСКИЙ ПРОВАЛ'
      : success
        ? 'Успех!'
        : 'Провал!');

  const probability = getSuccessProbability(modifier, dc);
  const probPercent = Math.round(probability * 100);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      setPhase('dismiss');
      onCompleteRef.current();
    }
  }, []);

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    eventBus.emit('sound:play', { type: 'dice_roll' });

    timers.push(setTimeout(() => setPhase('reveal-dice'), PHASE_DURATIONS.spinning));
    timers.push(setTimeout(() => setDie1Revealed(true), 650));
    timers.push(setTimeout(() => {
      setDie2Revealed(true);
      eventBus.emit('sound:play', { type: 'dice_land' });
    }, 950));

    timers.push(setTimeout(
      () => setPhase('reveal-modifier'),
      PHASE_DURATIONS.spinning + PHASE_DURATIONS['reveal-dice'],
    ));

    timers.push(setTimeout(
      () => setPhase('reveal-total'),
      PHASE_DURATIONS.spinning + PHASE_DURATIONS['reveal-dice'] + PHASE_DURATIONS['reveal-modifier'],
    ));

    const resultPhaseStart = PHASE_DURATIONS.spinning
      + PHASE_DURATIONS['reveal-dice']
      + PHASE_DURATIONS['reveal-modifier']
      + PHASE_DURATIONS['reveal-total'];

    timers.push(setTimeout(() => {
      setPhase('result');
      eventBus.emit('sound:play', {
        type: success ? 'dice_success' : 'dice_failure',
      });
    }, resultPhaseStart));

    timers.push(setTimeout(() => {
      handleComplete();
    }, resultPhaseStart + PHASE_DURATIONS.result + autoDismissMs));

    return () => { for (const t of timers) clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalTotal = total + modifier;

  const modParts: string[] = [];
  if (skillLevel !== 0) modParts.push(`${skillLabel}[${skillLevel > 0 ? '+' : ''}${skillLevel}]`);
  if (thoughtBonus !== 0) modParts.push(`Мысль[${thoughtBonus > 0 ? '+' : ''}${thoughtBonus}]`);
  const modifierText = modParts.length > 0 ? modParts.join(' + ') : 'без модификатора';

  return (
    <AnimatePresence>
      {phase !== 'dismiss' && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.93 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: phase === 'result' ? 1.03 : 1,
          }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md mx-auto rounded-xl border px-5 py-5 backdrop-blur-md"
          style={{
            borderColor: phase === 'result' ? `${resultColor}60` : 'rgba(0,229,255,0.12)',
            background: 'rgba(0,0,0,0.88)',
            boxShadow: phase === 'result'
              ? `0 0 40px ${resultColor}20, 0 0 80px ${resultColor}08, inset 0 0 30px ${resultColor}06`
              : '0 0 24px rgba(0,229,255,0.06)',
          }}
        >
          {/* Title */}
          <div className="text-center mb-4">
            <span className="text-[10px] font-mono tracking-[0.2em] text-cyan-400/60 uppercase">
              {phase === 'spinning' ? 'Бросок кубиков...' : `Проверка навыка: ${skillLabel}`}
            </span>
          </div>

          {/* Dice area */}
          <div className="flex items-center justify-center gap-8 mb-3">
            <DieFace
              value={dice[0]}
              spinning={phase === 'spinning'}
              revealed={die1Revealed}
              color={phase === 'result' ? resultColor : '#00e5ff'}
            />
            <motion.span
              className="text-xl font-mono text-white/20"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              +
            </motion.span>
            <DieFace
              value={dice[1]}
              spinning={phase === 'spinning'}
              revealed={die2Revealed}
              color={phase === 'result' ? resultColor : '#00e5ff'}
            />
          </div>

          {/* Dice total */}
          {die1Revealed && die2Revealed && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-2"
            >
              <span className="text-sm font-mono text-white/50">
                2d6 = <span className="text-cyan-300 text-base font-bold">{total}</span>
              </span>
            </motion.div>
          )}

          {/* Modifier breakdown */}
          {(phase === 'reveal-modifier' || phase === 'reveal-total' || phase === 'result') && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center mb-2 px-4 py-1.5 rounded-md bg-black/50 border border-white/5"
            >
              <TypedText
                text={`+ ${modifierText} = +${modifier}`}
                visible
                color="rgba(0,229,255,0.8)"
              />
            </motion.div>
          )}

          {/* Threshold indicator + final total vs DC */}
          {(phase === 'reveal-total' || phase === 'result') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-2"
            >
              <span className="font-mono text-base">
                <span className="text-white/60">{total}</span>
                <span className="text-cyan-400/60"> + {modifier}</span>
                <span className="text-white/40"> = </span>
                <motion.span
                  className="text-lg font-bold"
                  style={{ color: phase === 'result' ? resultColor : '#e2e8f0' }}
                  animate={phase === 'result' ? {
                    textShadow: [
                      `0 0 8px ${resultColor}00`,
                      `0 0 20px ${resultColor}80`,
                      `0 0 8px ${resultColor}40`,
                    ],
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {finalTotal}
                </motion.span>
                <span className="text-white/35 mx-1.5">
                  {finalTotal >= dc ? '≥' : '<'}
                </span>
                <span className="text-white/60">{dc}</span>
              </span>
              {/* Threshold bar */}
              <ThresholdBar
                value={finalTotal}
                max={24}
                threshold={dc}
                success={success}
                color={resultColor}
              />
            </motion.div>
          )}

          {/* Result banner with color flash */}
          <AnimatePresence>
            {phase === 'result' && (
              <motion.div
                key="skill-check-result"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative text-center pt-2 pb-1"
              >
                {/* Color flash overlay */}
                <motion.div
                  key={success ? 'flash-success' : 'flash-fail'}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: success
                      ? 'radial-gradient(ellipse at center, rgba(16,185,129,0.3) 0%, transparent 70%)'
                      : 'radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, transparent 70%)',
                  }}
                />

                <motion.span
                  className="text-sm font-mono font-bold tracking-wider uppercase inline-block"
                  style={{
                    color: resultColor,
                    textShadow: `0 0 16px ${resultColor}90, 0 0 32px ${resultColor}40`,
                  }}
                  animate={criticalSuccess || criticalFailure ? {
                    y: [0, -4, 0],
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 0.5, repeat: criticalSuccess || criticalFailure ? 2 : 0 }}
                >
                  {resultLabel}
                </motion.span>

                {result.partialEffects?.flavorText && (
                  <div className="text-[11px] font-mono text-white/35 mt-1 italic">
                    {result.partialEffects.flavorText}
                  </div>
                )}

                {!success && !criticalFailure && (
                  <div className="text-[10px] font-mono text-amber-300/50 mt-0.5">
                    Можно повторить, если навык вырастет
                  </div>
                )}

                {criticalFailure && (
                  <div className="text-[10px] font-mono text-red-400/60 mt-0.5">
                    Проверка закрыта навсегда
                  </div>
                )}

                <div className="text-[9px] font-mono text-white/20 mt-1.5">
                  вероятность: {probPercent}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.03]"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.1) 2px, rgba(0,229,255,0.1) 4px)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
