'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExplorationRackConsoleStore } from '@/state/explorationRackConsoleStore';

/**
 * Консоль перед взломом стойки: читабельный IT-слой (дежурство / мониторинг), затем мини-игра узлов.
 */
export const ExplorationRackConsoleOverlay = memo(function ExplorationRackConsoleOverlay() {
  const session = useExplorationRackConsoleStore((s) => s.session);
  const closeSession = useExplorationRackConsoleStore((s) => s.closeSession);
  const proceedSession = useExplorationRackConsoleStore((s) => s.proceedSession);
  const rootRef = useRef<HTMLDivElement>(null);

  const onKeyEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!useExplorationRackConsoleStore.getState().session) return;
      e.preventDefault();
      closeSession();
    },
    [closeSession],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyEscape);
    return () => window.removeEventListener('keydown', onKeyEscape);
  }, [onKeyEscape]);

  useEffect(() => {
    if (session) {
      rootRef.current?.focus();
    }
  }, [session]);

  return (
    <AnimatePresence>
      {session && (
        <motion.div
          key="rack-console"
          className="game-critical-motion fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 font-mono text-emerald-100/95 game-fm-layer game-fm-layer-promote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          <motion.div
            ref={rootRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Консоль стойки мониторинга"
            className="relative w-full max-w-xl rounded-lg border border-emerald-500/40 bg-gradient-to-b from-[#040806] to-black/95 p-5 shadow-[0_0_48px_rgba(16,185,129,0.14)] outline-none"
            initial={{ y: 8, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 6, scale: 0.98 }}
          >
            <p className="mb-1 text-[10px] uppercase tracking-[0.32em] text-emerald-400/75">rack.session · local</p>
            <h2 className="mb-4 text-base font-semibold tracking-wide text-emerald-200">{session.headline}</h2>
            <div
              className="mb-5 max-h-[min(42vh,22rem)] overflow-y-auto rounded border border-emerald-900/50 bg-[#020805] px-3 py-3 text-xs leading-relaxed text-slate-300"
              aria-live="polite"
            >
              {session.lines.map((line, i) => (
                <p key={i} className={line.trim() === '' ? 'h-2' : 'whitespace-pre-wrap'}>
                  {line}
                </p>
              ))}
            </div>
            <p className="mb-4 text-[11px] leading-snug text-slate-500">
              Полный терминал с командами kubectl и квестами — панель «терминал» в HUD.{' '}
              <span className="text-emerald-500/80">Esc</span> — выход без взлома.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-600/70 px-3 py-2 text-xs text-slate-300 hover:border-slate-500 min-h-11 touch-manipulation"
                onClick={() => closeSession()}
              >
                {session.dismissLabel}
              </button>
              <button
                type="button"
                className="rounded border border-emerald-500/55 bg-emerald-950/50 px-3 py-2 text-xs font-medium text-emerald-100 hover:border-emerald-400/80 min-h-11 touch-manipulation"
                onClick={() => proceedSession()}
              >
                {session.proceedLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
