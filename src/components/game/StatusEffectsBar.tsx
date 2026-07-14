
/* ─── Volodka RPG – Status Effects Bar ───
   Compact horizontal bar showing active buffs/debuffs as icon badges.
   Reads directly from the game store — no props needed.
   Auto-detects: weather debuffs, perk buffs, low energy/stress.
*/

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStatusEffectsContext } from '@/store/selectors';
import {
  type StatusEffectDef,
  STATUS_EFFECTS,
  getStatusEffectById,
} from '@/data/statusEffects';
import { type WeatherType, determineWeatherType } from '@/data/weatherEffects';
import { eventBus } from '@/engine/EventBus';
import {
  buildActiveStatusEffects,
  type ActiveStatusEffect,
} from '@/engine/statusEffects/activeStatusEffects';

export type { ActiveStatusEffect };

/* ─── Tooltip ─── */

function EffectTooltip({
  effect,
  remainingHours,
  stacks,
  position,
}: {
  effect: StatusEffectDef;
  remainingHours?: number;
  stacks?: number;
  position: 'above' | 'below';
}) {
  const isExpiring = remainingHours !== undefined && remainingHours < 1;
  const isDebuff = effect.category === 'debuff' || effect.category === 'weather';

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'above' ? 6 : -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position === 'above' ? 6 : -6, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 z-50 pointer-events-none`}
    >
      <div
        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg border backdrop-blur-xl min-w-[160px] max-w-[220px]"
        style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.95) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.88) 100%)',
          borderColor: `${effect.color}40`,
          boxShadow: `0 0 16px ${effect.color}15, 0 4px 16px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{effect.icon}</span>
          <span
            className="text-xs font-semibold font-mono"
            style={{ color: effect.color, textShadow: `0 0 6px ${effect.color}60` }}
          >
            {effect.name}
          </span>
        </div>
        <span className="text-[10px] text-slate-300/80 leading-tight">{effect.description}</span>
        <div className="flex items-center gap-2 mt-0.5">
          {remainingHours !== undefined && (
            <span
              className={`text-[9px] font-mono ${isExpiring ? 'text-rose-400' : 'text-slate-400'}`}
              style={isExpiring ? { textShadow: '0 0 6px rgba(251,113,133,0.5)' } : {}}
            >
              ⏱ {remainingHours.toFixed(1)}ч
            </span>
          )}
          {stacks !== undefined && stacks > 1 && (
            <span className="text-[9px] font-mono text-amber-400/80">×{stacks}</span>
          )}
          <span
            className="text-[9px] font-mono uppercase tracking-wider"
            style={{ color: isDebuff ? '#fb718580' : '#34d39980' }}
          >
            {effect.category === 'buff' ? 'Усиление' :
             effect.category === 'debuff' ? 'Ослабление' :
             effect.category === 'weather' ? 'Погода' : 'Черта'}
          </span>
        </div>
      </div>
      {/* Arrow */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border ${
          position === 'above' ? '-bottom-1 border-l border-b' : '-top-1 border-r border-t'
        }`}
        style={{
          background: 'rgba(0,0,0,0.95)',
          borderColor: `${effect.color}40`,
        }}
      />
    </motion.div>
  );
}

/* ─── Single effect icon badge ─── */

function EffectBadge({
  effect,
  remainingHours,
  stacks,
}: {
  effect: StatusEffectDef;
  remainingHours?: number;
  stacks?: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isExpiring = remainingHours !== undefined && remainingHours < 1;
  const isDebuff = effect.category === 'debuff' || effect.category === 'weather';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip((prev) => !prev)}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          ...(isExpiring ? { scale: [1, 1.1, 1] } : {}),
        }}
        transition={{
          scale: isExpiring ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 400, damping: 20 },
          opacity: { duration: 0.2 },
        }}
        className="relative flex items-center justify-center rounded-md cursor-pointer select-none"
        style={{
          width: 28,
          height: 28,
          background: `linear-gradient(135deg, ${effect.color}15, ${effect.color}08)`,
          border: `1px solid ${effect.color}50`,
          boxShadow: `0 0 8px ${effect.color}25, inset 0 0 4px ${effect.color}10`,
        }}
      >
        <span className="text-sm leading-none">{effect.icon}</span>

        {/* Stack count badge */}
        {stacks !== undefined && stacks > 1 && (
          <span
            className="absolute -top-1 -right-1 min-w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center px-0.5 font-mono"
            style={{
              background: isDebuff ? '#f87171' : '#34d399',
              color: '#000',
              boxShadow: `0 0 4px ${isDebuff ? '#f8717180' : '#34d39980'}`,
            }}
          >
            {stacks > 9 ? '9+' : stacks}
          </span>
        )}

        {/* Expiring pulse ring */}
        {isExpiring && (
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 0px ${effect.color}00`,
                `0 0 10px ${effect.color}50`,
                `0 0 0px ${effect.color}00`,
              ],
            }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <EffectTooltip
            effect={effect}
            remainingHours={remainingHours}
            stacks={stacks}
            position="above"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Overflow badge ─── */

function OverflowBadge({ count }: { count: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-md select-none"
      style={{
        width: 28,
        height: 28,
        background: 'rgba(100,116,139,0.15)',
        border: '1px solid rgba(100,116,139,0.3)',
      }}
    >
      <span className="text-[9px] font-mono font-bold text-slate-400">+{count}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT — StatusEffectsBar
   Reads store state directly; no props needed.
   ══════════════════════════════════════════════════════════════ */

const MAX_VISIBLE_EFFECTS = 8;

export function StatusEffectsBar() {
  const {
    karma: _karma,
    energy,
    stress,
    unlockedPerks,
    weatherEnabled,
    rainIntensity,
    currentSceneId,
    timeOfDay,
  } = useStatusEffectsContext();

  const [snowActive, setSnowActive] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  // Compute current weather
  const currentWeather: WeatherType = useMemo(() =>
    determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay],
  );

  // Build active effects list
  const activeEffects: ActiveStatusEffect[] = useMemo(
    () =>
      buildActiveStatusEffects({
        currentWeather,
        unlockedPerks,
        energy,
        stress,
      }),
    [currentWeather, unlockedPerks, energy, stress],
  );

  // Split into visible + overflow
  const visibleEffects = activeEffects.slice(0, MAX_VISIBLE_EFFECTS);
  const overflowCount = activeEffects.length - MAX_VISIBLE_EFFECTS;

  // Separate buffs & debuffs for coloring
  const hasBuffs = visibleEffects.some((e) => {
    const cat = STATUS_EFFECTS[e.id].category;
    return cat === 'buff' || cat === 'perk';
  });
  const hasDebuffs = visibleEffects.some((e) => {
    const cat = STATUS_EFFECTS[e.id].category;
    return cat === 'debuff' || cat === 'weather';
  });

  if (activeEffects.length === 0) return null;

  return (
    <div className="pointer-events-auto">
      <div
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(2,6,23,0.9) 0%, rgba(8,12,28,0.85) 50%, rgba(4,8,18,0.82) 100%)',
          borderColor: hasDebuffs
            ? 'rgba(251,113,133,0.35)'
            : hasBuffs
              ? 'rgba(52,211,153,0.3)'
              : 'rgb(var(--cyber-cyan-rgb) / 0.2)',
          boxShadow: hasDebuffs
            ? '0 0 16px rgba(251,113,133,0.1), 0 4px 16px rgba(0,0,0,0.4)'
            : hasBuffs
              ? '0 0 16px rgba(52,211,153,0.08), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.06), 0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Category separator indicator */}
        <div className="flex items-center gap-0.5 mr-1">
          {hasBuffs && (
            <div
              className="cyber-status-dot cyber-status-dot-green"
              style={{ boxShadow: '0 0 4px #34d39960' }}
            />
          )}
          {hasDebuffs && (
            <div
              className="cyber-status-dot cyber-status-dot-red"
              style={{ boxShadow: '0 0 4px #f8717160' }}
            />
          )}
        </div>

        {/* Effect icons */}
        <AnimatePresence mode="popLayout">
          {visibleEffects.map((active) => {
            const def = getStatusEffectById(active.id);
            return (
              <motion.div
                key={active.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <EffectBadge
                  effect={def}
                  remainingHours={active.remainingHours}
                  stacks={active.stacks}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Overflow indicator */}
        {overflowCount > 0 && <OverflowBadge count={overflowCount} />}
      </div>
    </div>
  );
}
