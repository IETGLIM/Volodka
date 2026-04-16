'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { ChoiceLogEntry } from '@/data/types';

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
}

const LogRow = memo(function LogRow({ entry }: { entry: ChoiceLogEntry }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-b border-cyan-500/10 py-2.5 font-mono text-xs leading-relaxed"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-cyan-500/45">
        <span>{formatTime(entry.at)}</span>
        <span className="tracking-wider">NODE::{entry.fromNodeId}</span>
        {entry.kind === 'skill' && (
          <span className={entry.skillRollSuccess ? 'text-emerald-500/70' : 'text-amber-500/70'}>
            {entry.skillRollSuccess ? 'SKILL_PASS' : 'SKILL_FAIL'}
          </span>
        )}
      </div>
      <p className="mt-1 text-cyan-100/85">
        <span className="text-cyan-500/50">&gt;</span> {entry.choiceText || '(авто)'}
      </p>
      <p className="mt-0.5 text-cyan-500/55">
        <span className="text-cyan-600/40">→</span> {entry.toNodeId}
      </p>
    </motion.div>
  );
});

export const JournalPanel = memo(function JournalPanel({ onClose }: { onClose: () => void }) {
  const choiceLog = useGameStore((s) => s.choiceLog);
  const rows = useMemo(() => [...choiceLog].reverse(), [choiceLog]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        className="relative max-h-[85vh] w-full max-w-[min(95vw,32rem)] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(5,8,15,0.98) 0%, rgba(8,12,22,0.98) 100%)',
          border: '1px solid rgba(0, 255, 255, 0.22)',
          clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.08), inset 0 0 40px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cyan-500/15 bg-black/40 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
            <span className="h-2 w-2 rounded-full bg-red-500/80" />
            <span className="ml-2 font-mono text-[10px] tracking-[0.2em] text-cyan-500/45">
              volodka://log/decisions
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center font-mono text-sm text-cyan-400/50 transition-colors hover:text-cyan-200"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.12) 2px, rgba(0,255,255,0.12) 4px)',
          }}
        />

        <div className="max-h-[calc(85vh-52px)] overflow-y-auto px-4 pb-4 pt-2 game-scrollbar">
          {rows.length === 0 ? (
            <p className="py-8 text-center font-mono text-sm text-cyan-500/35">
              Лог пуст. Выборы появятся здесь по мере прохождения.
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {rows.map((e) => (
                <LogRow key={e.id} entry={e} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

export default JournalPanel;
