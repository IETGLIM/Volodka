'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWireHackOverlayStore } from '@/state/wireHackOverlayStore';
import { audioEngine } from '@/engine/AudioEngine';

const NODE_LABELS = ['α', 'β', 'γ', 'δ'] as const;

function triggerHackGlitchFlash(): void {
  if (typeof document === 'undefined') return;
  document.body.classList.add('exploration-hack-glitch-flash');
  window.setTimeout(() => {
    document.body.classList.remove('exploration-hack-glitch-flash');
  }, 420);
}

/**
 * Мини-игра: клик по узлам в порядке `sequence`. Ошибка сбрасывает прогресс.
 */
export const HackingWireMinigameOverlay = memo(function HackingWireMinigameOverlay() {
  const active = useWireHackOverlayStore((s) => s.active);
  const closeWireHack = useWireHackOverlayStore((s) => s.closeWireHack);
  const activeKey = active ? `${active.title}:${active.sequence.join(',')}` : '';
  return (
    <AnimatePresence>
      {active && (
        <ActiveHackingWireMinigame
          key={activeKey}
          active={active}
          closeWireHack={closeWireHack}
        />
      )}
    </AnimatePresence>
  );
});

type ActiveWireHack = NonNullable<ReturnType<typeof useWireHackOverlayStore.getState>['active']>;

const ActiveHackingWireMinigame = memo(function ActiveHackingWireMinigame({
  active,
  closeWireHack,
}: {
  active: ActiveWireHack;
  closeWireHack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [shake, setShake] = useState(0);

  const seqLen = active?.sequence.length ?? 0;

  const onKeyEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      active.onFinished(false);
      closeWireHack();
    },
    [active, closeWireHack],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyEscape);
    return () => window.removeEventListener('keydown', onKeyEscape);
  }, [onKeyEscape]);

  const handleNodeClick = useCallback(
    (nodeIndex: number) => {
      if (seqLen === 0) return;
      const expect = active.sequence[step];
      if (nodeIndex !== expect) {
        setStep(0);
        setShake((s) => s + 1);
        audioEngine.playSfx('radio_static', 0.08);
        return;
      }
      const next = step + 1;
      setStep(next);
      audioEngine.playSfx('ui', 0.12);
      if (next >= seqLen) {
        triggerHackGlitchFlash();
        audioEngine.playSfx('skill', 0.22);
        active.onFinished(true);
      }
    },
    [active, closeWireHack, seqLen, step],
  );

  return (
        <motion.div
          key="wire-hack"
          className="game-critical-motion fixed inset-0 z-[100] flex items-center justify-center bg-black/82 p-4 font-mono text-cyan-100 game-fm-layer game-fm-layer-promote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label="Мини-игра взлома узлов"
        >
          <motion.div
            animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.28 }}
            className="relative w-full max-w-lg rounded-lg border border-emerald-500/35 bg-gradient-to-b from-slate-950/95 to-black/90 p-6 shadow-[0_0_40px_rgba(34,197,94,0.12)]"
          >
            <p className="mb-1 text-[10px] uppercase tracking-[0.35em] text-emerald-400/80">unauthorized.stack</p>
            <h2 className="mb-2 text-lg font-semibold tracking-wide text-emerald-200/95">{active.title}</h2>
            <p className="mb-6 text-xs leading-relaxed text-slate-400">
              Соедините узлы в порядке подсветки трассировки. Неверный клик — сброс.{' '}
              <span className="text-cyan-500/90">Esc</span> — выход без записи в журнал.
            </p>
            <div className="relative mx-auto mb-8 w-full max-w-sm rounded-md border border-cyan-900/40 bg-[#030806] px-4 py-6">
              <div className="pointer-events-none absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(34,197,94,0.08)_2px,rgba(34,197,94,0.08)_4px)]" />
              <div className="relative grid grid-cols-2 gap-8 place-items-center">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/50 bg-slate-900/90 text-lg text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.25)] transition hover:border-emerald-400/70 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    onClick={() => handleNodeClick(i)}
                    aria-label={`Узел ${NODE_LABELS[i]}`}
                  >
                    {NODE_LABELS[i]}
                  </button>
                ))}
              </div>
              <p className="pointer-events-none mt-4 text-center text-[10px] uppercase tracking-widest text-slate-500">
                progress {step}/{seqLen}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-600/60 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
                onClick={() => {
                  active.onFinished(false);
                  closeWireHack();
                }}
              >
                Прервать
              </button>
            </div>
          </motion.div>
        </motion.div>
  );
});
