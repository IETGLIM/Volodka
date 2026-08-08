
/* ─── Volodka RPG – Rest Panel (Enhanced) ─── */
/* Short rest / long rest options, time advance, recovery preview, dream effect. */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { useVitalStats, useCurrentSceneId, useRestAtHome } from '@/store/selectors';
import {
  BedDouble,
  X,
  Moon,
  Sun,
  Clock,
  Heart,
  BatteryMedium,
  Brain,
  Sparkles,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Rest type ─── */
type RestType = 'short' | 'long';

/* ─── Rest effects config ─── */
const REST_CONFIG: Record<RestType, {
  label: string;
  emoji: string;
  timeAdvance: string;
  energyRestore: number;
  stressReduce: number;
  karmaShift: number;
  description: string;
}> = {
  short: {
    label: 'Короткий отдых',
    emoji: '☕',
    timeAdvance: '+2 часа',
    energyRestore: 30,
    stressReduce: 10,
    karmaShift: 0,
    description: 'Быстрый перерыв. Энергия частично восстанавливается.',
  },
  long: {
    label: 'Долгий сон',
    emoji: '🌙',
    timeAdvance: '+8 часов',
    energyRestore: 100,
    stressReduce: 30,
    karmaShift: 0,
    description: 'Полноценный сон. Максимальное восстановление и пророческий сон.',
  },
};

interface RestPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Dream sequence overlay ─── */
function DreamOverlay({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0.8, 0.8, 0.6, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5, times: [0, 0.3, 0.5, 0.7, 0.9, 1] }}
    >
      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
      }} />

      {/* Center dream text fragments */}
      <div className="relative text-center space-y-4 max-w-xs px-8">
        {/* Floating dream words */}
        {['...тишина...', '...код течёт...', '...серверы шепчут...', '...память стирается...'].map((text, i) => (
          <motion.span
            key={text}
            className="block text-sm font-mono"
            style={{ color: 'rgba(0, 229, 255, 0.6)', textShadow: '0 0 12px rgba(0, 229, 255, 0.3)' }}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: [0, 0.7, 0.7, 0], y: [10, 0, 0, -10], filter: ['blur(8px)', 'blur(2px)', 'blur(0px)', 'blur(8px)'] }}
            transition={{ duration: 2, delay: i * 0.4, ease: 'easeInOut' }}
          >
            {text}
          </motion.span>
        ))}

        {/* Ambient particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full"
            style={{
              background: i % 2 === 0 ? '#00e5ff' : '#a855f7',
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              boxShadow: `0 0 4px ${i % 2 === 0 ? 'rgba(0,229,255,0.4)' : 'rgba(168,85,247,0.4)'}`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0, 0.5, 0.5, 0],
            }}
            transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Panel
   ══════════════════════════════════════════════════════════════ */
export function RestPanel({ open, onClose }: RestPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const restAtHome = useRestAtHome();
  const { energy, stress, karma } = useVitalStats();
  const currentScene = useCurrentSceneId();

  const [selectedRest, setSelectedRest] = useState<RestType>('long');
  const [isResting, setIsResting] = useState(false);
  const [showDream, setShowDream] = useState(false);
  const [restComplete, setRestComplete] = useState(false);

  const canRest = currentScene === 'volodka_room' || currentScene === 'home_evening';

  const config = REST_CONFIG[selectedRest];

  const handleRest = useCallback(() => {
    if (!canRest || isResting) return;
    setIsResting(true);
    setRestComplete(false);

    // For long rest, show dream sequence
    if (selectedRest === 'long') {
      setShowDream(true);
    } else {
      // Short rest completes immediately
      setTimeout(() => {
        restAtHome();
        setIsResting(false);
        setRestComplete(true);
        setTimeout(() => { setRestComplete(false); onClose(); }, 800);
      }, 800);
    }
  }, [canRest, isResting, selectedRest, restAtHome, onClose]);

  const handleDreamComplete = useCallback(() => {
    setShowDream(false);
    restAtHome();
    setIsResting(false);
    setRestComplete(true);
    setTimeout(() => { setRestComplete(false); onClose(); }, 800);
  }, [restAtHome, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Recovery calculation
  const newEnergy = Math.min(100, energy + config.energyRestore);
  const newStress = Math.max(0, stress - config.stressReduce);
  const energyDelta = newEnergy - energy;
  const stressDelta = stress - newStress;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: UI_LAYERS.PANEL }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

            <FocusTrap initialFocusRef={closeButtonRef}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-96"
              {...dialogProps}
            >
              <div className="bg-slate-950/95 border border-cyan-900/30 backdrop-blur-md rounded-xl p-6 overflow-hidden">
                {/* Close button */}
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="size-4" />
                </button>

                {/* Header icon with glow */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full border border-cyan-800/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full" style={{
                      background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
                    }} />
                    <motion.div
                      animate={isResting ? {
                        boxShadow: [
                          '0 0 12px rgba(0,229,255,0.1)',
                          '0 0 24px rgba(0,229,255,0.3)',
                          '0 0 12px rgba(0,229,255,0.1)',
                        ],
                      } : {}}
                      transition={isResting ? { duration: 1.5, repeat: Infinity } : {}}
                      className="absolute inset-0 rounded-full"
                    />
                    <BedDouble className="size-7 text-cyan-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 {...titleProps} className="text-lg font-semibold text-slate-100 text-center mb-1">
                  Отдохнуть?
                </h3>
                <p className="text-[10px] text-slate-500 text-center mb-4">
                  {canRest ? 'Вы дома. Время отдохнуть.' : 'Отдых доступен только дома'}
                </p>

                {/* Current stats */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-emerald-400 text-sm font-mono">
                      <BatteryMedium className="size-3.5" />
                      {energy}
                    </div>
                    <div className="text-[9px] text-slate-500">Энергия</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-rose-400 text-sm font-mono">
                      <Brain className="size-3.5" />
                      {stress}
                    </div>
                    <div className="text-[9px] text-slate-500">Стресс</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-mono">
                      <Heart className="size-3.5" />
                      {karma}
                    </div>
                    <div className="text-[9px] text-slate-500">Карма</div>
                  </div>
                </div>

                {/* Rest type selection */}
                <div className="flex gap-2 mb-4">
                  {(['short', 'long'] as RestType[]).map((type) => {
                    const cfg = REST_CONFIG[type];
                    const isSelected = selectedRest === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedRest(type)}
                        disabled={isResting}
                        className={`
                          flex-1 p-3 rounded-lg border text-left transition-all
                          ${isSelected
                            ? 'border-cyan-500/30 bg-cyan-950/20'
                            : 'border-slate-700/25 bg-slate-900/30 hover:border-slate-600/30'
                          }
                          ${isResting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                        `}
                      >
                        <div className="text-lg mb-0.5">{cfg.emoji}</div>
                        <div className={`text-xs font-medium ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                          {cfg.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {cfg.timeAdvance}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Recovery preview */}
                <div className="rounded-lg border border-slate-700/15 bg-slate-900/30 p-3 mb-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                    <Eye className="size-2.5" />
                    Превью восстановления
                  </div>
                  <div className="space-y-2">
                    {/* Energy */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <BatteryMedium className="size-3 text-emerald-400/60" />
                        Энергия
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{energy}</span>
                        <ShieldAlert className="size-2.5 text-emerald-400" />
                        <motion.span
                          className="text-emerald-400 font-mono font-semibold"
                          initial={false}
                          animate={open ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          → {newEnergy}
                        </motion.span>
                        <span className="text-[9px] text-emerald-400/50">+{energyDelta}</span>
                      </div>
                    </div>
                    {/* Stress */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Brain className="size-3 text-rose-400/60" />
                        Стресс
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{stress}</span>
                        <motion.span
                          className="text-cyan-400 font-mono font-semibold"
                          initial={false}
                          animate={open ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          → {newStress}
                        </motion.span>
                        <span className="text-[9px] text-cyan-400/50">−{stressDelta}</span>
                      </div>
                    </div>
                    {/* Time advance */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/30">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="size-3 text-amber-400/60" />
                        Время
                      </span>
                      <div className="flex items-center gap-1.5">
                        {selectedRest === 'long' ? (
                          <Moon className="size-3 text-amber-400/60" />
                        ) : (
                          <Sun className="size-3 text-amber-400/60" />
                        )}
                        <span className="text-amber-300 font-mono text-[11px]">
                          {config.timeAdvance}
                        </span>
                      </div>
                    </div>
                    {/* Dream note for long rest */}
                    {selectedRest === 'long' && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1.5">
                        <Sparkles className="size-2.5 text-purple-400/50" />
                        <span className="italic">Возможен пророческий сон...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rest description */}
                <div className="text-[11px] text-slate-400 text-center mb-4 italic">
                  {config.description}
                </div>

                {!canRest && (
                  <div className="text-xs text-rose-400 text-center mb-3">
                    Отдых доступен только дома
                  </div>
                )}

                {/* Rest complete feedback */}
                <AnimatePresence>
                  {restComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-emerald-400 text-center mb-3 flex items-center justify-center gap-1"
                    >
                      <Sparkles className="size-3" />
                      Отдых завершён!
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-700/40 text-slate-400 hover:bg-slate-800/30"
                    onClick={onClose}
                    disabled={isResting}
                  >
                    Нет
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-cyan-800/40 text-cyan-400 hover:bg-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRest}
                    disabled={!canRest || isResting}
                  >
                    {isResting ? (
                      <span className="flex items-center gap-1.5">
                        <motion.div
                          className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                        {config.label}...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {config.emoji}
                        Да, {config.label.toLowerCase()}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Loading bar animation during rest */}
                <AnimatePresence>
                  {isResting && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden rounded-full h-1 bg-slate-800/50"
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, rgba(0,229,255,0.4), rgba(168,85,247,0.4), rgba(0,229,255,0.4))',
                          backgroundSize: '200% 100%',
                        }}
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 0%'],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dream sequence overlay for long rest */}
      <AnimatePresence>
        {showDream && (
          <DreamOverlay
            active={showDream}
            onComplete={handleDreamComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}
