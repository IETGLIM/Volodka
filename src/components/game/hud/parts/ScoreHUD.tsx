/* ─────────────────────────────────────────────────────────────
   Volodka RPG – Score HUD «Стихосложение» (v4.55.0)

   Золотой WoW-чип: суммарный счёт забега + всплывающие дельты.
   Читает engine/score/scoreEngine через событие 'score:changed'
   (движок живёт вне zustand — ре-рендер только при начислении).

   Стиль: wow-classic.css палитра (--wow-gold*, serif Georgia),
   компактный чип под верхней панелью сцены, по центру.
   Reduced-motion: пульс дельты отключён.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { getRunScore } from '@/engine/score/scoreEngine';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface ScoreDelta {
  id: number;
  amount: number;
  label?: string;
}

const MAX_DELTAS = 4;
const DELTA_TTL_MS = 2200;

export function ScoreHUD() {
  const reducedMotion = useEffectiveReducedMotion();
  const [score, setScore] = useState(() => getRunScore());
  const [deltas, setDeltas] = useState<ScoreDelta[]>([]);
  const deltaIdRef = useRef(0);

  useEffect(() => {
    const onChanged = (p: { score: number; delta: number; label?: string }) => {
      setScore(p.score);
      if (p.delta === 0) return; // reset — без всплывашки
      const id = ++deltaIdRef.current;
      setDeltas((prev) => [
        ...prev.slice(-(MAX_DELTAS - 1)),
        { id, amount: p.delta, label: p.label },
      ]);
      window.setTimeout(() => {
        setDeltas((prev) => prev.filter((d) => d.id !== id));
      }, DELTA_TTL_MS);
    };
    eventBus.on('score:changed', onChanged);
    return () => {
      eventBus.off('score:changed', onChanged);
    };
  }, []);

  return (
    <div
      className="score-hud"
      style={{
        position: 'fixed',
        top: 54,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: UI_LAYERS.HUD,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
      aria-live="polite"
      aria-label={`Стихосложение: ${score}`}
    >
      <div
        className="score-hud__chip"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          padding: '3px 14px 5px',
          background: 'linear-gradient(180deg, var(--wow-panel-hi, rgba(26,21,11,0.94)) 0%, var(--wow-panel-lo, rgba(10,8,4,0.94)) 100%)',
          border: '1px solid var(--wow-gold-border, #5a4a1c)',
          boxShadow: 'inset 0 1px 0 rgba(232,217,160,0.18), 0 2px 8px rgba(0,0,0,0.55)',
          borderRadius: 3,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 11,
            lineHeight: 1,
            transform: 'translateY(1px)',
            filter: 'sepia(1) saturate(2.2) hue-rotate(-15deg)',
          }}
        >
          ✒
        </span>
        <span
          style={{
            fontFamily: 'var(--wow-font-serif, Georgia, serif)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--wow-gold-pale, #e8d9a0)',
            opacity: 0.82,
          }}
        >
          Стихосложение
        </span>
        <motion.span
          key={score}
          initial={reducedMotion ? false : { scale: 1.25, color: '#ffd100' }}
          animate={{ scale: 1, color: '#ffd100' }}
          transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
          style={{
            fontFamily: 'var(--wow-font-serif, Georgia, serif)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--wow-gold-bright, #ffd100)',
            textShadow: '0 0 6px rgba(255,209,0,0.35), 0 1px 2px rgba(0,0,0,0.8)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {score.toLocaleString('ru-RU')}
        </motion.span>
      </div>

      {/* Всплывающие дельты: «+200 · Строка возвращена миру» */}
      <div style={{ position: 'relative', height: 44, width: 260 }}>
        <AnimatePresence>
          {deltas.map((d, i) => (
            <motion.div
              key={d.id}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                opacity: 1 - i * 0.25,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--wow-font-serif, Georgia, serif)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: d.amount >= 0 ? 'var(--wow-gold-bright, #ffd100)' : '#d03a2b',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}
              >
                {d.amount >= 0 ? `+${d.amount}` : d.amount}
              </span>
              {d.label && (
                <span
                  style={{
                    fontFamily: 'var(--wow-font-serif, Georgia, serif)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: 'rgba(232,217,160,0.85)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}
                >
                  {d.label}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ScoreHUD;
