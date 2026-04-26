'use client';

import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { POEMS } from '@/data/poems';
import { PoemReveal } from './PoemComponents';

/** Ошибка загрузки lazy-панели (dynamic import) — не роняет весь orchestrator. */
export class PanelErrorBoundary extends Component<
  { children: ReactNode; panelLabel: string; onClose: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[PanelLoadError] ${this.props.panelLabel}`, error, info);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto my-4 max-w-lg rounded border border-red-500/40 bg-red-950/60 p-4 font-mono text-sm text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.12)]">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-red-400/80">
            {'// сбой_загрузки_модуля'}
          </p>
          <p className="mb-3 text-red-100/90">Панель «{this.props.panelLabel}» не загрузилась.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.retry}
              className="rounded border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-200 hover:border-cyan-400/60"
            >
              Повторить
            </button>
            <button
              type="button"
              onClick={this.props.onClose}
              className="rounded border border-slate-600/50 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500"
            >
              Закрыть
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function KernelPanicOverlay({ isActive, onCalmDown }: { isActive: boolean; onCalmDown: () => void }) {
  if (!isActive) return null;

  return (
    <div className="game-critical-motion fixed inset-0 z-[60] kernel-panic-overlay flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-4xl font-bold text-red-500 kernel-panic-text mb-4">
          ⚠️ ПАНИКА ЯДРА ⚠️
        </h2>
        <p className="text-red-300/80 text-lg mb-8 kernel-panic-text">
          Критический уровень стресса. Система нестабильна.
        </p>
        <button
          type="button"
          onClick={onCalmDown}
          className="px-8 py-3 bg-red-900/80 hover:bg-red-800/80 border border-red-600/50 text-red-200 rounded-lg text-lg transition-colors"
          aria-label="Снизить стресс и выйти из режима паники"
        >
          🧘 Успокоиться
        </button>
      </div>
    </div>
  );
}

export function PanelWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [layerAnimating, setLayerAnimating] = useState(true);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLayerAnimating(false), 2000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    lastActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? dialogRef.current;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      lastActiveRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      className={`game-critical-motion fixed inset-0 z-50 flex items-center justify-center p-4 game-fm-layer game-fm-layer-promote${layerAnimating ? ' is-animating' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <motion.div
        ref={dialogRef}
        className="relative z-10 max-h-[85vh] max-w-[95vw] overflow-y-auto overflow-x-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Игровая панель"
        tabIndex={-1}
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        onAnimationComplete={() => setLayerAnimating(false)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function PoemRevealOverlay({ poemId, onClose }: { poemId: string; onClose: () => void }) {
  const poem = POEMS.find((p) => p.id === poemId);
  if (!poem) return null;

  return <PoemReveal poem={poem} intro={poem.intro} onClose={onClose} />;
}

export function EnergyBar({
  energy,
  maxEnergy,
  energyLevel,
}: {
  energy: number;
  maxEnergy: number;
  energyLevel: 'exhausted' | 'tired' | 'normal' | 'energized';
}) {
  const percentage = (energy / maxEnergy) * 100;

  const levelColor = {
    exhausted: 'bg-red-500',
    tired: 'bg-amber-500',
    normal: 'bg-cyan-400',
    energized: 'bg-emerald-400',
  }[energyLevel];

  const levelGlow = {
    exhausted: 'shadow-red-500/50',
    tired: 'shadow-amber-500/40',
    normal: 'shadow-cyan-400/30',
    energized: 'shadow-emerald-400/40',
  }[energyLevel];

  const levelLabel = {
    exhausted: 'Истощение',
    tired: 'Усталость',
    normal: 'Бодрость',
    energized: 'Энергия',
  }[energyLevel];

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none select-none">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700/30 rounded-sm"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
        }}
      >
        <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">{levelLabel}</span>

        <div className="w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${levelColor} rounded-full ${levelGlow}`}
            style={{ boxShadow: `0 0 6px currentColor` }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <span className="text-[10px] font-mono text-slate-300">
          {energy}/{maxEnergy}
        </span>
      </div>
    </div>
  );
}
