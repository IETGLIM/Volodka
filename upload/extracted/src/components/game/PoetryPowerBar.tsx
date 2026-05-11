'use client';

/* ─── Volodka RPG – Poetry Power Quick-Bar ───
   Action bar at the bottom of the screen showing collected poem powers.
   Like an RPG skill bar: slots for powers, cooldown indicators, click to activate.
   Быстрая панель поэтических способностей.
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { Zap, Clock, Lock, Sparkles } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import {
  getPoemPower,
  canUsePower,
  activatePoemPowerById,
  getCooldownRemaining,
} from '@/engine/PoemPowerSystem';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** Hook: requestAnimationFrame-based timer that ticks at a given interval (ms) */
function useRafTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const loop = (timestamp: number) => {
      if (timestamp - lastUpdate >= intervalMs) {
        lastUpdate = timestamp;
        setTick((t) => t + 1);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [intervalMs]);
  return tick;
}

/* ── Single power slot ── */
function PowerSlot({ poemId, slotIndex }: { poemId: string; slotIndex: number }) {
  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const power = getPoemPower(poemId);
  const available = canUsePower(poemId);

  // Update cooldown timer using requestAnimationFrame for smooth display
  useEffect(() => {
    let rafId: number;
    let lastUpdate = -Infinity; // Trigger first tick immediately

    const tick = (timestamp: number) => {
      if (timestamp - lastUpdate >= 500) {
        lastUpdate = timestamp;
        setCooldownMs(getCooldownRemaining(poemId));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [poemId]);

  const cooldownSec = Math.ceil(cooldownMs / 1000);
  const onCooldown = cooldownMs > 0;
  const cooldownProgress = power ? (cooldownMs / power.cooldownMs) * 100 : 0;

  const handleActivate = useCallback(() => {
    if (!available || activating || !power) return;

    setActivating(true);
    const success = activatePoemPowerById(poemId);
    if (success) {
      audioEngine.playSfx('quest_complete');
      setJustUsed(true);
      setCooldownMs(power.cooldownMs);
      setTimeout(() => setJustUsed(false), 2000);
    }
    setActivating(false);
  }, [poemId, available, activating, power]);

  if (!power) return null;

  // Keyboard shortcut: 1-5 keys for slots
  const shortcutKey = slotIndex < 5 ? String(slotIndex + 1) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleActivate}
            disabled={!available || activating}
            className={`
              relative size-12 sm:size-14 rounded-lg border-2 flex flex-col items-center justify-center
              transition-all duration-200 cursor-pointer select-none
              ${justUsed
                ? 'border-amber-400 bg-amber-950/50 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-110'
                : available
                  ? 'border-amber-700/40 bg-amber-950/20 hover:border-amber-500/60 hover:bg-amber-900/30 hover:scale-105'
                  : 'border-stone-800/30 bg-stone-900/20 opacity-50 cursor-not-allowed'
              }
            `}
            whileTap={available ? { scale: 0.9 } : undefined}
          >
            {/* Power icon */}
            <Zap className={`size-4 sm:size-5 ${
              justUsed ? 'text-amber-300' : available ? 'text-amber-400' : 'text-stone-600'
            }`} />

            {/* Power name (truncated) */}
            <span className={`text-[8px] sm:text-[9px] mt-0.5 leading-none truncate max-w-[40px] sm:max-w-[48px] ${
              justUsed ? 'text-amber-200' : available ? 'text-amber-300/70' : 'text-stone-600'
            }`}>
              {power.name.split(' ')[0]}
            </span>

            {/* Keyboard shortcut indicator */}
            {shortcutKey && available && (
              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-mono bg-slate-800 text-slate-400 px-1 rounded border border-slate-700/50">
                {shortcutKey}
              </span>
            )}

            {/* Cooldown overlay */}
            {onCooldown && (
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-stone-900/70 transition-all duration-1000"
                  style={{ height: `${cooldownProgress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-amber-400/80 font-bold">
                    {cooldownSec}
                  </span>
                </div>
              </div>
            )}

            {/* Just-used glow pulse */}
            {justUsed && (
              <motion.div
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 1.3 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute inset-0 rounded-lg border-2 border-amber-400/50 pointer-events-none"
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-3 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">{power.name}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">{power.description}</p>
          {available ? (
            <p className="text-[10px] text-emerald-400/70">✓ Готово к использованию{shortcutKey ? ` [${shortcutKey}]` : ''}</p>
          ) : onCooldown ? (
            <p className="text-[10px] text-amber-400/60 flex items-center gap-1">
              <Clock className="size-2.5" /> Перезарядка: {cooldownSec}с
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Main quick-bar component ── */
export function PoetryPowerBar() {
  const collectedPoems = useGameStore((s) => s.collectedPoems);

  // Get collected poems that have powers
  const collectedWithPowers = collectedPoems
    .map((poemId) => ({ poemId, power: getPoemPower(poemId) }))
    .filter((p) => p.power !== undefined);

  // Derive visibility directly from state
  const visible = collectedWithPowers.length > 0;

  // Listen for keyboard shortcuts (1-5 keys for first 5 powers)
  useEffect(() => {
    if (!visible) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 5 && num <= collectedWithPowers.length) {
        const poemId = collectedWithPowers[num - 1].poemId;
        const available = canUsePower(poemId);
        if (available) {
          const success = activatePoemPowerById(poemId);
          if (success) {
            audioEngine.playSfx('quest_complete');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, collectedWithPowers]);

  if (!visible) return null;

  // Show max 5 powers in the quick-bar (like an action bar)
  const displayPowers = collectedWithPowers.slice(0, 5);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{ zIndex: UI_LAYERS.HUD }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-black/60 border border-amber-900/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3),0_0_10px_rgba(251,191,36,0.05)]">
          {/* Label — always visible to differentiate from health bars */}
          <div className="flex flex-col items-center gap-0.5 mr-1 pr-2 border-r border-amber-900/30">
            <Sparkles className="size-3.5 text-amber-500/60" />
            <span className="text-[9px] text-amber-500/60 uppercase tracking-wider font-bold">Способности</span>
            <span className="text-[7px] text-amber-600/40 italic">стихи</span>
          </div>

          {/* Power slots */}
          {displayPowers.map((p, i) => (
            <PowerSlot key={p.poemId} poemId={p.poemId} slotIndex={i} />
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 5 - displayPowers.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="size-12 sm:size-14 rounded-lg border-2 border-dashed border-stone-700/25 bg-stone-900/20 flex items-center justify-center"
              style={{
                background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(120,113,108,0.04) 3px, rgba(120,113,108,0.04) 6px)',
              }}
            >
              <div className="flex flex-col items-center gap-0.5 opacity-25">
                <Lock className="size-3 text-stone-500" />
                <span className="text-[7px] text-stone-500 font-mono">—</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
