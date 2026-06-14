import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PoetryPowerSlot } from '@/components/game/poetryPowerBar/PoetryPowerSlot';
import { usePoetryPowerBarController } from '@/components/game/poetryPowerBar/usePoetryPowerBarController';
import '@/components/game/poetryPowerBar/poetry-power-bar.css';
import {
  POETRY_POWER_BAR_LABELS,
} from '@/engine/poetryPowerBar/poetryPowerBarConstants';
import { getBarEnterMotion } from '@/engine/poetryPowerBar/poetryPowerBarPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomPoetryPx } from '@/shared/constants/hudLayout';

export function PoetryPowerBar() {
  const { reducedMotion, quietStyle, visible, displayPowers, emptySlotCount } =
    usePoetryPowerBarController();

  if (!visible) return null;

  const barMotion = getBarEnterMotion(reducedMotion);

  return (
    <AnimatePresence>
      <motion.div
        initial={barMotion.initial}
        animate={barMotion.animate}
        exit={barMotion.exit}
        transition={barMotion.transition}
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        data-exploration-ui
        style={{ zIndex: UI_LAYERS.HUD, bottom: bottomPoetryPx(), ...quietStyle }}
        role="region"
        aria-label={POETRY_POWER_BAR_LABELS.barRegion}
      >
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-black/60 border border-amber-900/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3),0_0_10px_rgba(251,191,36,0.05)]">
            <div
              className="flex flex-col items-center gap-0.5 mr-1 pr-2 border-r border-amber-900/30"
              aria-hidden="true"
            >
              <Sparkles className="size-3.5 text-amber-500/60" />
              <span className="text-[9px] text-amber-500/60 uppercase tracking-wider font-bold">
                {POETRY_POWER_BAR_LABELS.label}
              </span>
              <span className="text-[7px] text-amber-600/40 italic">{POETRY_POWER_BAR_LABELS.subtitle}</span>
            </div>

            {displayPowers.map((entry, index) => (
              <PoetryPowerSlot
                key={entry.poemId}
                poemId={entry.poemId}
                slotIndex={index}
                reducedMotion={reducedMotion}
              />
            ))}

            {Array.from({ length: emptySlotCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                aria-hidden="true"
                className="poetry-power-empty-slot size-12 sm:size-14 rounded-lg border-2 border-dashed border-stone-700/25 bg-stone-900/20 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-0.5 opacity-25">
                  <Lock className="size-3 text-stone-500" />
                  <span className="text-[7px] text-stone-500 font-mono">—</span>
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </motion.div>
    </AnimatePresence>
  );
}
