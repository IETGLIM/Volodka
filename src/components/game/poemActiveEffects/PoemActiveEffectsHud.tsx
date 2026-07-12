import { AnimatePresence, motion } from 'framer-motion';
import { usePoemActiveEffectsHud } from '@/components/game/poemActiveEffects/usePoemActiveEffectsHud';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useMobileDetection } from '@/components/game/orchestrator/useMobileDetection';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  bottomPoemActiveEffectsMobilePx,
  bottomPoemActiveEffectsPx,
} from '@/shared/constants/hudLayout';
import '@/components/game/poemActiveEffects/poem-active-effects.css';

function formatRemainingSeconds(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  if (total >= 60) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${total}с`;
}

function PoemEffectChip({
  entry,
  reducedMotion,
}: {
  entry: ReturnType<typeof usePoemActiveEffectsHud>[number];
  reducedMotion: boolean;
}) {
  const expiring = entry.remainingMs < 5000;

  return (
    <div
      className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg border backdrop-blur-md shrink-0"
      style={{
        background: `linear-gradient(135deg, ${entry.color}18, rgba(2,6,23,0.85))`,
        borderColor: `${entry.color}55`,
        boxShadow: expiring && !reducedMotion
          ? `0 0 12px ${entry.color}35`
          : `0 0 8px ${entry.color}18`,
      }}
      title={entry.effectSummary}
      aria-label={`${entry.name}: ${entry.effectSummary}, осталось ${formatRemainingSeconds(entry.remainingMs)}`}
    >
      <span className="text-sm leading-none" aria-hidden="true">
        {entry.icon}
      </span>
      <div className="flex flex-col min-w-0">
        <span
          className="text-[10px] font-semibold font-mono truncate max-w-[108px] sm:max-w-[120px]"
          style={{ color: entry.color }}
        >
          {entry.name}
        </span>
        <span
          className={`text-[9px] font-mono ${expiring ? 'text-rose-300' : 'text-slate-400'}`}
        >
          {formatRemainingSeconds(entry.remainingMs)}
        </span>
      </div>
      <div className="w-8 h-1 rounded-full bg-slate-800/80 overflow-hidden shrink-0" aria-hidden="true">
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${Math.max(4, entry.remainingRatio * 100)}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          style={{ background: entry.color }}
        />
      </div>
    </div>
  );
}

/** Compact HUD strip for live poem-power TTL effects with countdown timers. */
export function PoemActiveEffectsHud() {
  const entries = usePoemActiveEffectsHud();
  const reducedMotion = useEffectiveReducedMotion();

  if (entries.length === 0) return null;

  const barMotion = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 8 },
      };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="poem-active-effects"
        initial={barMotion.initial}
        animate={barMotion.animate}
        exit={barMotion.exit}
        transition={{ duration: 0.2 }}
        className="pointer-events-auto"
        data-exploration-ui
        style={{ zIndex: UI_LAYERS.HUD }}
        role="region"
        aria-label="Активные силы стихов"
        aria-live="polite"
      >
        <div
          className="poem-active-effects-scroll flex items-center gap-1.5 px-2 py-1.5 rounded-xl border backdrop-blur-xl max-w-[min(92vw,360px)] overflow-x-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(8,12,28,0.88) 100%)',
            borderColor: 'rgba(251,191,36,0.25)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          }}
        >
          <span className="text-[8px] uppercase tracking-wider text-amber-500/70 font-bold shrink-0 pr-1 border-r border-amber-900/30">
            Силы
          </span>
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <motion.div
                key={entry.flagKey}
                layout={!reducedMotion}
                initial={reducedMotion ? false : { scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <PoemEffectChip entry={entry} reducedMotion={reducedMotion} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function PoemActiveEffectsHudSlot() {
  const isMobile = useMobileDetection();

  return (
    <div
      className={`absolute pointer-events-none ${isMobile ? 'left-1/2 -translate-x-1/2' : 'left-4'}`}
      style={{
        bottom: isMobile
          ? bottomPoemActiveEffectsMobilePx(true)
          : bottomPoemActiveEffectsPx(),
      }}
    >
      <PoemActiveEffectsHud />
    </div>
  );
}
