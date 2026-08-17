/* ─── Volodka RPG – Quick Save/Load Slot Indicator ─── */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HardDrive, Download, Clock } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { useAutoSaveTimestamps } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

type SavePhase = 'idle' | 'saving' | 'saved' | 'loading';

const VISIBLE_DURATION_MS = 3000;
const SAVING_PULSE_MS = 600;
const SLOT_LABEL = 'Слот 1';
const CYAN = 'var(--cyber-cyan)';
const AMBER = '#fbbf24';
const MATRIX_GREEN = 'var(--cyber-matrix)';

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function phaseColorFor(phase: SavePhase): string {
  if (phase === 'loading') return MATRIX_GREEN;
  if (phase === 'saving') return AMBER;
  return CYAN;
}

export function QuickSaveIndicator() {
  const reducedMotion = useEffectiveReducedMotion();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<SavePhase>('idle');
  const { lastSaveTimestamp } = useAutoSaveTimestamps();
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = eventBus.on('game:saved', () => {
      showIndicator('saved');
    });
    return unsub;
  }, []);

  const showIndicator = useCallback((newPhase: SavePhase) => {
    setVisible(true);
    setPhase(newPhase);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (newPhase === 'saving') {
      phaseTimerRef.current = setTimeout(() => {
        setPhase('saved');
        hideTimerRef.current = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
      }, SAVING_PULSE_MS);
    } else {
      hideTimerRef.current = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'KeyH') {
        e.preventDefault();
        setVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  const clr = phaseColorFor(phase);
  const PhaseIcon = phase === 'loading' ? Download : HardDrive;
  const phaseLabel =
    phase === 'saving' ? 'Сохранение…' :
    phase === 'loading' ? 'Загрузка…' :
    phase === 'saved' ? 'Сохранено' :
    'Быстрое сохранение';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-4 right-4 pointer-events-auto"
          data-exploration-ui
          style={{ zIndex: UI_LAYERS.TOASTS }}
        >
          <div
            className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(8, 12, 24, 0.88) 0%, rgba(4, 8, 16, 0.82) 100%)',
              backdropFilter: 'blur(16px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
              border: '1px solid rgba(0,229,255,0.19)',
              boxShadow: '0 0 12px rgba(0,229,255,0.08), 0 2px 8px rgba(0,0,0,0.4)',
              minWidth: 180,
            }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 shrink-0 rounded-md"
              style={{
                background: 'rgba(0,229,255,0.07)',
                border: '1px solid rgba(0,229,255,0.13)',
              }}
            >
              <PhaseIcon className="size-3.5" style={{ color: clr }} />
            </div>
            <div className="flex flex-col gap-0.5 relative z-20">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-semibold tracking-wide" style={{ color: clr }}>
                  {phaseLabel}
                </span>
                <span className="text-[9px] font-mono px-1 py-px rounded" style={{ color: 'rgba(0,229,255,0.5)', background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.08)' }}>
                  {SLOT_LABEL}
                </span>
              </div>
              {lastSaveTimestamp && (
                <div className="flex items-center gap-1">
                  <Clock className="size-2.5" style={{ color: 'rgba(148,163,184,0.5)' }} />
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(148,163,184,0.6)' }}>{formatTime(lastSaveTimestamp)}</span>
                </div>
              )}
            </div>
            <div className="ml-auto flex flex-col items-end gap-0.5 relative z-20">
              <div className="flex gap-1">
                <kbd className="text-[8px] font-mono px-1 py-px rounded" style={{ color: 'rgba(148,163,184,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>F5</kbd>
                <kbd className="text-[8px] font-mono px-1 py-px rounded" style={{ color: 'rgba(148,163,184,0.4)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>F9</kbd>
              </div>
              <span className="text-[8px] font-mono" style={{ color: 'rgba(148,163,184,0.3)' }}>сохранить / загрузить</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
