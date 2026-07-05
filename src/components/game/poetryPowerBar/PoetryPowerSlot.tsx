import { motion } from 'framer-motion';
import { Clock, Sparkles, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePoemPowerActivation } from '@/components/game/poetryPowerBar/usePoemPowerActivation';
import {
  POETRY_POWER_BAR_LABELS,
} from '@/engine/poetryPowerBar/poetryPowerBarConstants';
import {
  buildSlotTooltipCooldownLine,
  buildSlotTooltipReadyLine,
  getJustUsedPulseMotion,
  getShortcutKey,
  truncatePowerDisplayName,
} from '@/engine/poetryPowerBar/poetryPowerBarPresentation';

type PoetryPowerSlotProps = {
  poemId: string;
  slotIndex: number;
  reducedMotion: boolean;
};

export function PoetryPowerSlot({ poemId, slotIndex, reducedMotion }: PoetryPowerSlotProps) {
  const {
    power,
    available,
    activating,
    justUsed,
    onCooldown,
    cooldownSec,
    cooldownProgress,
    liveAnnouncement,
    activate,
  } = usePoemPowerActivation(poemId);

  if (!power) return null;

  const shortcutKey = getShortcutKey(slotIndex);
  const pulseMotion = getJustUsedPulseMotion(reducedMotion);
  const slotStateClass = justUsed
    ? 'poetry-power-slot--just-used border-amber-400 bg-amber-950/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
    : available
      ? 'poetry-power-slot--ready border-amber-700/40 bg-amber-950/20 hover:border-amber-500/60 hover:bg-amber-900/30'
      : 'border-stone-800/30 bg-stone-900/20 opacity-50 cursor-not-allowed';

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={activate}
            disabled={!available || activating}
            aria-label={POETRY_POWER_BAR_LABELS.slotActivateAria(power.name, slotIndex + 1, shortcutKey)}
            aria-disabled={!available || activating}
            className={`relative size-12 sm:size-14 shrink-0 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none ${slotStateClass}`}
            whileTap={reducedMotion || !available ? undefined : { scale: 0.9 }}
          >
            <Zap
              className={`size-4 sm:size-5 ${
                justUsed ? 'text-amber-300' : available ? 'text-amber-400' : 'text-stone-600'
              }`}
              aria-hidden="true"
            />

            <span
              className={`text-[8px] sm:text-[9px] mt-0.5 leading-none truncate max-w-[40px] sm:max-w-[48px] ${
                justUsed ? 'text-amber-200' : available ? 'text-amber-300/70' : 'text-stone-600'
              }`}
              aria-hidden="true"
            >
              {truncatePowerDisplayName(power.name)}
            </span>

            {shortcutKey && available && (
              <span
                className="absolute -top-1.5 -right-1.5 text-[8px] font-mono bg-slate-800 text-slate-400 px-1 rounded border border-slate-700/50"
                aria-hidden="true"
              >
                {shortcutKey}
              </span>
            )}

            {onCooldown && (
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none" aria-hidden="true">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-stone-900/70 transition-all duration-1000"
                  style={{ height: `${cooldownProgress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-amber-400/80 font-bold">{cooldownSec}</span>
                </div>
              </div>
            )}

            {justUsed && !reducedMotion && (
              <motion.div
                initial={pulseMotion.initial}
                animate={pulseMotion.animate}
                transition={pulseMotion.transition}
                className="absolute inset-0 rounded-lg border-2 border-amber-400/50 pointer-events-none"
                aria-hidden="true"
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-3 text-amber-400" aria-hidden="true" />
            <span className="text-sm font-medium text-amber-200">{power.name}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">{power.description}</p>
          {available ? (
            <p className="text-[10px] text-emerald-400/70">{buildSlotTooltipReadyLine(shortcutKey)}</p>
          ) : onCooldown ? (
            <p className="text-[10px] text-amber-400/60 flex items-center gap-1">
              <Clock className="size-2.5" aria-hidden="true" />
              {buildSlotTooltipCooldownLine(cooldownSec)}
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </>
  );
}
