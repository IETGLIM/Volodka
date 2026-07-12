import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { audioEngine } from '@/engine/AudioEngine';
import {
  canUsePower,
  getCooldownRemaining,
  getPoemPower,
} from '@/engine/PoemPowerSystem';
import { requestPoemPowerActivation } from '@/engine/poemReading/poemReadingOrchestrator';
import {
  POEM_POWER_JUST_USED_MS,
  POETRY_BOOK_LABELS,
} from '@/engine/poetryBook/poetryBookConstants';
import { getCooldownProgress } from '@/engine/poetryBook/poetryBookPresentation';
import { usePoemCooldownSeconds } from '@/components/game/poetryBook/usePoemCooldownSeconds';

type PoemPowerCardProps = {
  poemId: string;
  poemTitle?: string;
  variant: 'inline' | 'detailed';
  reducedMotion: boolean;
};

export function PoemPowerCard({
  poemId,
  poemTitle,
  variant,
  reducedMotion,
}: PoemPowerCardProps) {
  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);

  const power = getPoemPower(poemId);
  const available = power ? canUsePower(poemId) : false;
  const cooldownMs = power ? getCooldownRemaining(poemId) : 0;
  const cooldownSec = usePoemCooldownSeconds(poemId, !!power && cooldownMs > 0);
  const onCooldown = cooldownMs > 0;
  const cooldownProgress = power ? getCooldownProgress(cooldownMs, power.cooldownMs) : 0;

  const handleActivate = useCallback(() => {
    if (!available || activating || !power) return;

    setActivating(true);
    const result = requestPoemPowerActivation(poemId);
    if (result.status === 'activated' || result.status === 'cutscene_pending') {
      if (result.status === 'activated') {
        audioEngine.playSfx('quest_complete');
      }
      setJustUsed(true);
      setTimeout(() => setJustUsed(false), POEM_POWER_JUST_USED_MS);
    }
    setActivating(false);
  }, [poemId, available, activating, power]);

  if (!power) return null;

  const activateLabel = variant === 'inline'
    ? POETRY_BOOK_LABELS.activatePower
    : POETRY_BOOK_LABELS.activatePowerShort;

  if (variant === 'inline') {
    return (
      <div
        className={`relative mt-4 p-3 rounded-lg border transition-all duration-300 ${
          justUsed
            ? 'border-amber-400/60 bg-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
            : available
              ? 'border-amber-800/30 bg-amber-950/10'
              : 'border-stone-800/30 bg-stone-900/20 opacity-60'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Zap
            className={`size-4 ${justUsed ? 'text-amber-400' : available ? 'text-amber-400' : 'text-stone-500'}`}
            aria-hidden="true"
          />
          <span
            className={`text-sm font-medium ${justUsed ? 'text-amber-300' : available ? 'text-amber-300' : 'text-stone-400'}`}
          >
            {power.name}
          </span>
        </div>
        <p className="text-xs text-stone-400 mb-3 leading-relaxed">{power.description}</p>
        {available ? (
          <Button
            onClick={handleActivate}
            disabled={activating}
            size="sm"
            aria-label={POETRY_BOOK_LABELS.activatePowerAria(power.name)}
            className="w-full bg-amber-900/30 hover:bg-amber-800/40 text-amber-200 border border-amber-700/30 text-xs"
            variant="outline"
          >
            <Sparkles className="size-3 mr-1.5" aria-hidden="true" />
            {activating ? POETRY_BOOK_LABELS.activating : activateLabel}
          </Button>
        ) : onCooldown ? (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Clock className="size-3" aria-hidden="true" />
            <span>{POETRY_BOOK_LABELS.cooldown(cooldownSec)}</span>
          </div>
        ) : null}
        {justUsed && !reducedMotion && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg border-2 border-amber-400/40 pointer-events-none"
            style={{ boxShadow: '0 0 30px rgba(251,191,36,0.15)' }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
        justUsed
          ? 'border-amber-400/60 bg-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
          : available
            ? 'border-amber-800/30 bg-amber-950/10 hover:border-amber-600/40'
            : 'border-stone-800/25 bg-stone-900/15'
      }`}
    >
      {onCooldown && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-stone-800/30 transition-all duration-1000"
          style={{ clipPath: `inset(${100 - cooldownProgress}% 0 0 0)` }}
        />
      )}
      <div className="relative p-4">
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
              justUsed
                ? 'bg-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : available
                  ? 'bg-amber-900/30'
                  : 'bg-stone-800/30'
            }`}
          >
            <Zap
              className={`size-4 ${justUsed ? 'text-amber-300' : available ? 'text-amber-400' : 'text-stone-500'}`}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={`text-sm font-semibold font-serif block ${
                justUsed ? 'text-amber-200' : available ? 'text-amber-200' : 'text-stone-400'
              }`}
            >
              {power.name}
            </span>
            {poemTitle && (
              <p className="text-[10px] text-amber-600/40 font-serif">
                {POETRY_BOOK_LABELS.powerFromPoem(poemTitle)}
              </p>
            )}
          </div>
          {available ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-700/30 text-emerald-400/70 shrink-0">
              {POETRY_BOOK_LABELS.powerReady}
            </span>
          ) : onCooldown ? (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-900/20 border border-amber-700/20 text-amber-500/50 shrink-0 flex items-center gap-1">
              <Clock className="size-2.5" aria-hidden="true" />
              {cooldownSec}с
            </span>
          ) : null}
        </div>
        <p className="text-xs text-stone-400/80 leading-relaxed mb-3 ml-12">{power.description}</p>
        {available ? (
          <div className="ml-12">
            <Button
              onClick={handleActivate}
              disabled={activating}
              size="sm"
              aria-label={POETRY_BOOK_LABELS.activatePowerAria(power.name)}
              className="bg-amber-900/30 hover:bg-amber-800/40 text-amber-200 border border-amber-700/30 text-xs"
              variant="outline"
            >
              <Sparkles className="size-3 mr-1.5" aria-hidden="true" />
              {activating ? POETRY_BOOK_LABELS.activating : activateLabel}
            </Button>
          </div>
        ) : null}
        {onCooldown && (
          <div className="ml-12 mt-2">
            <div
              role="progressbar"
              aria-valuenow={Math.round(cooldownProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={POETRY_BOOK_LABELS.cooldown(cooldownSec)}
              className="h-1.5 bg-stone-800/50 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${cooldownProgress}%` }}
              />
            </div>
            <p className="text-[9px] text-stone-600 mt-1">{POETRY_BOOK_LABELS.cooldown(cooldownSec)}</p>
          </div>
        )}
      </div>
      {justUsed && !reducedMotion && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0 rounded-lg border-2 border-amber-400/40 pointer-events-none"
        />
      )}
    </div>
  );
}
