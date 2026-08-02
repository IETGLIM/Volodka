/* ─── Volodka RPG – Cyberpunk Dice Roll Display (Disco Elysium-style) ─── */

import { useState, useEffect, useRef } from 'react';
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

export interface DiceRollDisplayProps {
  result: DiceRollResult;
  skill: TrainablePlayerSkill;
  skillLevel: number;
  thoughtBonus?: number;
  /** Partial success degree — overrides the legacy resultLabel/color with Disco Elysium-style granular outcome. */
  successDegree?: SuccessDegree;
  onComplete: () => void;
  autoDismissMs?: number;
}

/* ── Animation phases ── */
type Phase = 'rolling' | 'reveal-dice' | 'reveal-modifier' | 'reveal-total' | 'result' | 'dismiss';

const PHASE_DURATIONS: Record<Phase, number> = {
  'rolling': 800,
  'reveal-dice': 400,
  'reveal-modifier': 500,
  'reveal-total': 400,
  'result': 600,
  'dismiss': 300,
};

/* ── 3D CSS cube faces (die faces 1–6 arranged as a standard die) ── */
function DieCube({ value, rolling, revealed, color }: {
  value: number;
  rolling: boolean;
  revealed: boolean;
  color: string;
}) {
  // Show random face during roll, final face after reveal
  const [displayValue, setDisplayValue] = useState(1);
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rolling) {
      rollInterval.current = setInterval(() => {
        setDisplayValue(1 + Math.floor(Math.random() * 6));
      }, 80);
    } else if (revealed) {
      if (rollInterval.current) clearInterval(rollInterval.current);
      setDisplayValue(value);
    }
    return () => {
      if (rollInterval.current) clearInterval(rollInterval.current);
    };
  }, [rolling, revealed, value]);

  const rotateX = rolling ? 720 : 0;
  const rotateY = rolling ? 360 : 0;

  // Dot patterns for die faces (3x3 grid, active dots)
  const dotPatterns: Record<number, number[]> = {
    1: [4],           // center
    2: [2, 6],        // top-right, bottom-left
    3: [2, 4, 6],     // diagonal
    4: [0, 2, 6, 8],  // corners
    5: [0, 2, 4, 6, 8], // corners + center
    6: [0, 2, 3, 5, 6, 8], // two columns
  };

  const dots = dotPatterns[displayValue] ?? [];

  return (
    <div className="relative cyber-scale-in" style={{ width: 56, height: 56, perspective: 200 }}>
      <motion.div
        animate={{
          rotateX,
          rotateY,
          scale: revealed ? 1.1 : rolling ? 0.9 : 0.8,
        }}
        transition={{
          duration: rolling ? 0.8 : 0.3,
          ease: rolling ? 'linear' : 'backOut',
        }}
        className="absolute inset-0 rounded-lg border-2 flex items-center justify-center"
        style={{
          borderColor: revealed ? color : 'rgba(255,255,255,0.2)',
          background: rolling
            ? 'rgba(0,0,0,0.8)'
            : revealed
              ? `linear-gradient(135deg, rgba(0,0,0,0.9), ${color}22)`
              : 'rgba(0,0,0,0.6)',
          boxShadow: revealed
            ? `0 0 20px ${color}40, inset 0 0 15px ${color}15`
            : 'none',
          transformStyle: 'preserve-3d',
        }}
      >
        {revealed ? (
          /* Show dots */
          <div className="grid grid-cols-3 gap-[3px] p-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  background: dots.includes(i) ? color : 'transparent',
                  boxShadow: dots.includes(i) ? `0 0 4px ${color}80` : 'none',
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-2xl font-mono text-white/40 animate-pulse">
            ?
          </span>
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
    if (!visible) {
      setDisplayed('');
      indexRef.current = 0;
      return;
    }
    const id = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [visible, text]);

  return (
    <span
      className="font-mono text-sm"
      style={{ color: color ?? 'rgba(255,255,255,0.85)' }}
    >
      {displayed}
      {visible && displayed.length < text.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse"
          style={{ background: color ?? 'rgba(0,255,255,0.7)' }}
        />
      )}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export function DiceRollDisplay({
  result,
  skill,
  skillLevel,
  thoughtBonus = 0,
  successDegree,
  onComplete,
  autoDismissMs = 3000,
}: DiceRollDisplayProps) {
  const [phase, setPhase] = useState<Phase>('rolling');
  const [die1Revealed, setDie1Revealed] = useState(false);
  const [die2Revealed, setDie2Revealed] = useState(false);
  const completedRef = useRef(false);

  const skillLabel = DICE_SKILL_LABELS[skill];
  const { dice, total, modifier, dc, success, criticalSuccess, criticalFailure } = result;

  // Use success degree for more granular result display when available
  const degreeLabel = successDegree ? getSuccessDegreeLabel(successDegree) : null;
  const degreeColor = successDegree ? getSuccessDegreeColor(successDegree) : null;

  const resultColor = degreeColor ?? (criticalSuccess
    ? '#fbbf24'  // gold
    : criticalFailure
      ? '#ef4444'  // red
      : success
        ? '#10b981'  // emerald
        : '#ef4444'); // red

  const resultLabel = degreeLabel ?? (criticalSuccess
    ? 'КРИТИЧЕСКИЙ УСПЕХ'
    : criticalFailure
      ? 'КРИТИЧЕСКИЙ ПРОВАЛ'
      : success
        ? 'УСПЕХ'
        : 'ПРОВАЛ');

  const probability = getSuccessProbability(modifier, dc);
  const probPercent = Math.round(probability * 100);

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Emit dice roll sound hint
    eventBus.emit('sound:play', { type: 'dice_roll' });

    // Phase: rolling → reveal-dice (first die at +600ms, second at +800ms)
    timers.push(setTimeout(() => setPhase('reveal-dice'), PHASE_DURATIONS.rolling));
    timers.push(setTimeout(() => setDie1Revealed(true), 600));
    timers.push(setTimeout(() => {
      setDie2Revealed(true);
      eventBus.emit('sound:play', { type: 'dice_land' });
    }, 900));

    // Phase: reveal-modifier
    timers.push(setTimeout(
      () => setPhase('reveal-modifier'),
      PHASE_DURATIONS.rolling + PHASE_DURATIONS['reveal-dice'],
    ));

    // Phase: reveal-total
    timers.push(setTimeout(
      () => setPhase('reveal-total'),
      PHASE_DURATIONS.rolling + PHASE_DURATIONS['reveal-dice'] + PHASE_DURATIONS['reveal-modifier'],
    ));

    // Phase: result
    const resultPhaseStart = PHASE_DURATIONS.rolling
      + PHASE_DURATIONS['reveal-dice']
      + PHASE_DURATIONS['reveal-modifier']
      + PHASE_DURATIONS['reveal-total'];
    timers.push(setTimeout(() => {
      setPhase('result');
      // Emit success/failure sound
      eventBus.emit('sound:play', {
        type: success ? 'dice_success' : 'dice_failure',
      });
    }, resultPhaseStart));

    // Phase: dismiss + onComplete
    timers.push(setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        setPhase('dismiss');
        onComplete();
      }
    }, resultPhaseStart + PHASE_DURATIONS.result + autoDismissMs));

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const finalTotal = total + modifier;

  // Build modifier text
  const modParts: string[] = [];
  if (skillLevel !== 0) modParts.push(`${skillLabel}[${skillLevel > 0 ? '+' : ''}${skillLevel}]`);
  if (thoughtBonus !== 0) modParts.push(`Мысль[${thoughtBonus > 0 ? '+' : ''}${thoughtBonus}]`);
  const modifierText = modParts.length > 0 ? modParts.join(' + ') : 'без модификатора';

  return (
    <AnimatePresence>
      {phase !== 'dismiss' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: phase === 'result' ? 1.02 : 1,
          }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md mx-auto rounded-xl border px-5 py-4 backdrop-blur-md glass-panel"
          style={{
            borderColor: phase === 'result' ? `${resultColor}60` : 'rgba(0,255,255,0.15)',
            background: 'rgba(0,0,0,0.85)',
            boxShadow: phase === 'result'
              ? `0 0 30px ${resultColor}25, 0 0 60px ${resultColor}10`
              : '0 0 20px rgba(0,255,255,0.05)',
          }}
        >
          {/* Title */}
          <div className="text-center mb-3">
            <span className="text-xs font-mono tracking-widest text-cyan-400/70 uppercase data-badge">
              {phase === 'rolling' ? 'Бросок кубиков...' : `Проверка: ${skillLabel}`}
            </span>
          </div>

          {/* Dice area */}
          <div className="flex items-center justify-center gap-6 mb-3">
            <DieCube
              value={dice[0]}
              rolling={phase === 'rolling'}
              revealed={die1Revealed}
              color={phase === 'result' ? resultColor : '#06b6d4'}
            />
            <span className="text-xl font-mono text-white/30">+</span>
            <DieCube
              value={dice[1]}
              rolling={phase === 'rolling'}
              revealed={die2Revealed}
              color={phase === 'result' ? resultColor : '#06b6d4'}
            />
          </div>

          {/* Dice total */}
          {die1Revealed && die2Revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-2"
            >
              <span className="text-sm font-mono text-white/60 data-badge">
                2d6 = <span className="text-cyan-300 text-base">{total}</span>
              </span>
            </motion.div>
          )}

          {/* Modifier breakdown (terminal typed) */}
          {(phase === 'reveal-modifier' || phase === 'reveal-total' || phase === 'result') && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center mb-2 px-4 py-1.5 rounded-md bg-black/40 border border-white/5 glass-panel-dark"
            >
              <TypedText
                text={`+ ${modifierText} = +${modifier}`}
                visible
                color="rgba(0,255,255,0.8)"
              />
            </motion.div>
          )}

          {/* Final total vs DC */}
          {(phase === 'reveal-total' || phase === 'result') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-3"
            >
              <span className="font-mono text-base">
                <span className="text-white/70">{total}</span>
                <span className="text-cyan-400/70"> + {modifier}</span>
                <span className="text-white/50"> = </span>
                <span
                  className={`text-lg font-bold ${success ? 'data-badge-success' : 'data-badge-danger'}`}
                  style={{ color: phase === 'result' ? resultColor : '#e2e8f0' }}
                >
                  {finalTotal}
                </span>
                <span className="text-white/40 mx-1.5">
                  {finalTotal >= dc ? '≥' : '<'}
                </span>
                <span className="text-white/70 data-badge">{dc}</span>
              </span>
            </motion.div>
          )}

          {/* Result banner */}
          <AnimatePresence>
            {phase === 'result' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, criticalSuccess || criticalFailure ? -4 : 0, 0],
                }}
                transition={{ duration: 0.4 }}
                className="text-center pt-1 pb-0.5 dice-result-flash"
              >
                <span
                  className={`text-sm font-mono font-bold tracking-wider uppercase ${success ? 'gradient-text-emerald' : 'neon-text-rose'}`}
                  style={{
                    color: resultColor,
                    textShadow: `0 0 12px ${resultColor}80`,
                  }}
                >
                  {resultLabel}
                </span>
                {/* Flavor text from partial success degree */}
                {result.partialEffects?.flavorText && (
                  <div className="text-[11px] font-mono text-white/40 mt-1 italic">
                    {result.partialEffects.flavorText}
                  </div>
                )}
                {/* Retry hint for failed white checks */}
                {!success && !criticalFailure && (
                  <div className="text-[10px] font-mono text-amber-300/60 mt-0.5">
                    Можно повторить, если навык вырастет
                  </div>
                )}
                {/* Red check closure hint */}
                {criticalFailure && (
                  <div className="text-[10px] font-mono text-red-400/70 mt-0.5">
                    Проверка закрыта навсегда
                  </div>
                )}
                {/* Probability hint */}
                <div className="text-[10px] font-mono text-white/25 mt-1 text-glow-pulse">
                  вероятность: {probPercent}%
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanline overlay for cyberpunk feel */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.03] panel-scanlines-subtle"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}