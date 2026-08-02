import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { getPoemById } from '@/data/gameDataLoader';
import { getPoemCombatExcerptLines } from '@/shared/poem/poemExcerpt';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getAvailableCombatPowers } from '@/engine/CombatSystem';
import { COMBAT_BUTTON_HINTS } from '@/engine/combat/combatGamepadMap';
import { POEM_COMBAT_ABILITIES } from '@/engine/combat/actions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  getPoemCategoryColor,
  getPoemEffectCategory,
  getPoemEffectIcon,
  getPoemEffectLabel,
} from '@/components/game/combatUi/poemPowerPresentation';

function PoemPowerCard({
  power,
  index,
  onCooldown,
  isGamepadSelected,
  onSelect,
  gamepadUseHint,
}: {
  power: { poemId: string; name: string; description: string; cooldownRemaining: number };
  index: number;
  onCooldown: boolean;
  isGamepadSelected: boolean;
  onSelect: () => void;
  gamepadUseHint?: string;
}) {
  const category = getPoemEffectCategory(power.poemId);
  const categoryColor = getPoemCategoryColor(category);
  const categoryLabel = getPoemEffectLabel(category);
  const CategoryIcon = getPoemEffectIcon(category);
  const ability = POEM_COMBAT_ABILITIES[power.poemId];
  const totalCooldown = ability?.cooldown ?? 0;
  const poem = getPoemById(power.poemId);
  const excerptLines = poem ? getPoemCombatExcerptLines(poem) : [];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          disabled={onCooldown}
          className={`relative w-full min-h-[52px] px-3 py-2.5 text-left transition-all border-b border-slate-800/30 last:border-0 font-mono touch-manipulation active:scale-[0.99] ${
            onCooldown
              ? 'opacity-30 cursor-not-allowed grayscale'
              : isGamepadSelected
                ? 'bg-amber-900/50 ring-1 ring-amber-400/40'
                : 'hover:bg-amber-900/30 active:bg-amber-900/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {!onCooldown && (
                <span className="text-[8px] text-slate-600 bg-slate-800/60 rounded px-1 py-px font-mono shrink-0">
                  {index + 1}
                </span>
              )}
              <span className="text-xs text-amber-300 font-medium truncate">{power.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`inline-flex items-center gap-0.5 text-[7px] px-1 py-px rounded border ${categoryColor}`}>
                <CategoryIcon className="size-2" />
                {categoryLabel}
              </span>
              {gamepadUseHint && isGamepadSelected && !onCooldown && (
                <span className="text-[8px] text-amber-500/70 font-mono">{gamepadUseHint}</span>
              )}
              {onCooldown && (
                <span className="flex items-center gap-0.5 text-[8px] text-slate-500">
                  <Clock className="size-2.5" /> {power.cooldownRemaining}х
                </span>
              )}
            </div>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">{power.description}</div>
          {excerptLines.length > 0 && !onCooldown ? (
            <div className="mt-1 text-[8px] text-slate-500/90 italic font-serif leading-snug line-clamp-2">
              {excerptLines.join(' · ')}
            </div>
          ) : null}
          {onCooldown && totalCooldown > 0 && (
            <div className="mt-1 w-full h-0.5 bg-slate-800/60 rounded overflow-hidden">
              <div
                className="h-full bg-amber-700/40 rounded transition-all"
                style={{ width: `${((totalCooldown - power.cooldownRemaining) / totalCooldown) * 100}%` }}
              />
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-black/90 border border-slate-700/50 text-[10px] font-mono text-slate-200 max-w-[220px]"
        sideOffset={4}
      >
        <div className="font-semibold text-amber-300 mb-1">{power.name}</div>
        <div className="text-slate-400">{power.description}</div>
        {excerptLines.length > 0 ? (
          <div className="mt-1.5 text-slate-300/90 italic font-serif leading-snug">
            {excerptLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : null}
        <div className="mt-1 text-slate-500">Кулдаун: {totalCooldown} х.</div>
        <div className="text-slate-500">Эффект: {categoryLabel}</div>
        {onCooldown && <div className="text-red-400 mt-1">Готовность через {power.cooldownRemaining} х.</div>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Poem powers submenu with smart above/below positioning. */
export function PoemPowersSubmenu({
  showPowers,
  availablePowers,
  gamepadConnected,
  gamepadSelectedIdx,
  onSelectPower,
}: {
  showPowers: boolean;
  availablePowers: ReturnType<typeof getAvailableCombatPowers>;
  gamepadConnected: boolean;
  gamepadSelectedIdx: number;
  onSelectPower: (poemId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positionAbove, setPositionAbove] = useState(true);

  useEffect(() => {
    if (!showPowers || !containerRef.current) return;
    const btn = containerRef.current;
    const rect = btn.getBoundingClientRect();
    const estimatedHeight = Math.min(36 + availablePowers.length * 60, 280);
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    setPositionAbove(spaceAbove >= estimatedHeight || spaceAbove >= spaceBelow);
  }, [showPowers, availablePowers.length]);

  if (!showPowers || availablePowers.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: positionAbove ? 10 : -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: positionAbove ? 10 : -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`glass-panel-warm absolute left-0 right-0 bg-black/95 border border-amber-700/30 rounded-lg backdrop-blur-md overflow-hidden max-h-72 overflow-y-auto overscroll-contain touch-pan-y ${
          positionAbove ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}
        style={{ zIndex: UI_LAYERS.COMBAT, scrollbarWidth: 'thin', scrollbarColor: '#78716c transparent' }}
      >
        <div className="sticky top-0 bg-black/90 border-b border-amber-900/30 px-3 py-2 flex items-center justify-between z-10">
          <span className="text-[9px] text-amber-400/80 font-mono font-semibold uppercase tracking-wider">
            Стихотворения
          </span>
          <span className="text-[8px] text-slate-500 font-mono">
            [1-{Math.min(9, availablePowers.length)}] · Esc
          </span>
        </div>
        {availablePowers.map((power, idx) => {
          const onCooldown = power.cooldownRemaining > 0;
          const isGamepadSelected = gamepadConnected && idx === gamepadSelectedIdx;
          return (
            <PoemPowerCard
              key={power.poemId}
              power={power}
              index={idx}
              onCooldown={onCooldown}
              isGamepadSelected={isGamepadSelected}
              onSelect={() => !onCooldown && onSelectPower(power.poemId)}
              gamepadUseHint={gamepadConnected ? COMBAT_BUTTON_HINTS.poem_use_selected : undefined}
            />
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
