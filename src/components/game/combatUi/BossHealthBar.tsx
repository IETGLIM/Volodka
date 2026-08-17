/* ─── Boss Health Bar — full-width ornate bar at top of screen ───
 *
 * Rendered only during boss fights (when `isBossEnemyType(enemy.type)` is
 * true). Replaces the regular CombatEnemyPanel HP bar with a larger, more
 * dramatic treatment:
 *   - Full-width bar (left padding to right padding of the combat UI).
 *   - Ornate cyberpunk border with a gold/red gradient.
 *   - Boss name (Russian) + "Акт N" / level indicator.
 *   - Phase indicator pips at the 100% / 66% / 33% thresholds. Pips light
 *     up as the boss HP drops past each threshold — purely visual, no
 *     phase mechanics are wired up.
 *   - Animated framer-motion fill with a Dark-Souls-style damage preview
 *     ghost segment (reuses the CyberStatBar pattern: detect HP drops,
 *     spawn a translucent ghost that drains over ~500ms).
 *
 * All visible text is Russian. Code identifiers / structural comments are
 * English to match the surrounding file style.
 */

'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isBossEnemyType } from '@/engine/combat/types';
import type { CombatEnemy, EnemyType } from '@/shared/types/game';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ══════════════════════════════════════════════════════════════
   Boss display data — Russian name + act number for the level chip.
   Reuses the same names as BOSS_INTRO_DATA (without subtitle) so the
   health bar and intro cinematic show a consistent label.
   ══════════════════════════════════════════════════════════════ */

interface BossBarData {
  /** Boss display name (Russian, upper-case). */
  name: string;
  /** Act number — shown as "АКТ N" in the level chip. */
  act: number;
  /** Accent hue for the bar fill + border glow (hex). */
  accent: string;
}

const BOSS_BAR_DATA: Partial<Record<EnemyType, BossBarData>> = {
  boss_neuro_sys: { name: 'НЕЙРО-СИСТЕМА', act: 3, accent: '#ff3b6b' },
  boss_dream_eater: { name: 'ПОЖИРАТЕЛЬ СНОВ', act: 5, accent: '#9b5cff' },
  boss_final_code: { name: 'ФИНАЛЬНЫЙ КОД', act: 7, accent: '#00e5ff' },
};

/* ══════════════════════════════════════════════════════════════
   Damage preview config — mirrors CyberStatBar's pattern so the ghost
   segment behaviour matches the player HP bar.
   ══════════════════════════════════════════════════════════════ */

const DAMAGE_PREVIEW_THRESHOLD = 0.5;
const DAMAGE_PREVIEW_DURATION_MS = 600;
/** Main bar drops quickly on damage so the ghost is visible. */
const MAIN_BAR_DAMAGE_DURATION_S = 0.18;
/** Normal main-bar animation duration (heals, etc.). */
const MAIN_BAR_NORMAL_DURATION_S = 0.7;

interface PendingDamage {
  /** Width of the ghost segment as a percentage of the bar (0–100). */
  pct: number;
  /** Left offset (%) where the ghost starts. */
  left: number;
  /** Monotonic key — bumping forces framer-motion to remount the segment. */
  key: number;
}

/* ══════════════════════════════════════════════════════════════
   Phase pips — 3 indicators at 100% / 66% / 33% thresholds.
   Each pip lights up when the boss HP drops below its threshold.
   ══════════════════════════════════════════════════════════════ */

const PHASE_THRESHOLDS = [100, 66, 33] as const;

const PhasePips = memo(function PhasePips({
  pct,
  accent,
  reducedMotion,
}: {
  pct: number;
  accent: string;
  reducedMotion: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {PHASE_THRESHOLDS.map((threshold, i) => {
        const active = pct < threshold;
        return (
          <motion.div
            key={threshold}
            className="w-2.5 h-2.5 rounded-sm border"
            style={{
              borderColor: active ? `${accent}88` : 'rgba(148,163,184,0.35)',
              background: active ? accent : 'transparent',
              boxShadow: active ? `0 0 8px ${accent}aa` : 'none',
            }}
            initial={false}
            animate={{
              opacity: active ? 1 : 0.35,
              scale: active ? 1.0 : 0.85,
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              ease: 'easeOut',
              delay: reducedMotion ? 0 : i * 0.04,
            }}
          />
        );
      })}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   Main bar — animated fill + damage preview ghost + segment ticks.
   ══════════════════════════════════════════════════════════════ */

interface BossFillProps {
  current: number;
  max: number;
  accent: string;
  reducedMotion: boolean;
}

const BossFill = memo(function BossFill({ current, max, accent, reducedMotion }: BossFillProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  const prevValueRef = useRef(current);
  const damageKeyRef = useRef(0);
  const [pendingDamage, setPendingDamage] = useState<PendingDamage | null>(null);

  // Synchronous damage detection — runs during render so the main bar's
  // transition can switch to the fast variant on the same paint as the
  // value change (otherwise the slow animation would hide the ghost).
  const prevValueForRender = prevValueRef.current;
  const isDamageThisRender = current < prevValueForRender - DAMAGE_PREVIEW_THRESHOLD;

  useEffect(() => {
    const prev = prevValueRef.current;
    if (current < prev - DAMAGE_PREVIEW_THRESHOLD) {
      const newPct = Math.min(100, Math.max(0, (current / max) * 100));
      const damagePct = Math.min(100, Math.max(0, ((prev - current) / max) * 100));
      damageKeyRef.current += 1;
      setPendingDamage({ pct: damagePct, left: newPct, key: damageKeyRef.current });
    } else if (current > prev + DAMAGE_PREVIEW_THRESHOLD) {
      setPendingDamage(null);
    }
    prevValueRef.current = current;
  }, [current, max]);

  const mainBarTransition = isDamageThisRender
    ? { duration: MAIN_BAR_DAMAGE_DURATION_S, ease: 'easeOut' as const }
    : { duration: MAIN_BAR_NORMAL_DURATION_S, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  // Boss fill uses a gold→red gradient (gold at high HP, shifting to red as
  // HP drops) so the bar's tone itself reflects the boss's desperation.
  // The accent color is layered on top via the outer glow.
  const fillColor =
    pct > 66
      ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)'
      : pct > 33
        ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 60%, #b91c1c 100%)'
        : 'linear-gradient(90deg, #ef4444 0%, #b91c1c 70%, #7f1d1d 100%)';

  return (
    <div
      className="relative w-full h-4 sm:h-5 bg-black/85 overflow-hidden"
      style={{
        borderRadius: '3px',
        boxShadow: `inset 0 1px 2px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 14px ${accent}33`,
      }}
    >
      {/* Segment ticks at 33% / 66% — visual phase boundaries */}
      {[33, 66].map((mark) => (
        <div
          key={mark}
          className="absolute top-0 bottom-0 w-px pointer-events-none"
          style={{ left: `${mark}%`, background: 'rgba(255,255,255,0.18)' }}
          aria-hidden="true"
        />
      ))}

      {/* Pending-damage ghost segment (Dark-Souls-style). Rendered behind
       *  the main fill so it's visible only in the area no longer covered. */}
      <AnimatePresence>
        {pendingDamage && (
          <motion.div
            key={pendingDamage.key}
            className="absolute inset-y-0 pointer-events-none"
            style={{
              left: `${pendingDamage.left}%`,
              background: 'rgba(252, 165, 165, 0.45)',
              boxShadow: 'inset 0 0 6px rgba(255, 80, 80, 0.4)',
            }}
            initial={{ width: `${pendingDamage.pct}%`, opacity: 1 }}
            animate={{ width: '0%', opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: DAMAGE_PREVIEW_DURATION_MS / 1000,
              ease: 'easeOut',
            }}
            onAnimationComplete={() => {
              setPendingDamage((cur) =>
                cur && cur.key === pendingDamage.key ? null : cur,
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Main fill */}
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background: fillColor,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.35)`,
        }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={mainBarTransition}
      />

      {/* Diagonal shimmer sweep — adds motion to the fill */}
      {!reducedMotion && (
        <motion.div
          className="absolute inset-y-0 left-0 overflow-hidden"
          animate={{ width: `${pct}%` }}
          transition={mainBarTransition}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.0, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* HP numeric readout — centered, monospace, drop-shadowed */}
      <div className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs text-white font-mono font-bold tracking-wide pointer-events-none"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.6)' }}
      >
        {Math.max(0, Math.round(current))} / {max}
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   Outer boss bar card — ornate border, name, level, phase pips.
   ══════════════════════════════════════════════════════════════ */

interface BossHealthBarProps {
  enemy: CombatEnemy;
  /** Optional introVisible flag — when the CombatIntroSplash is showing,
   *  we hide the boss bar so the two don't compete for attention. */
  hidden?: boolean;
}

export const BossHealthBar = memo(function BossHealthBar({ enemy, hidden }: BossHealthBarProps) {
  const reducedMotion = useEffectiveReducedMotion();

  if (!isBossEnemyType(enemy.type)) return null;
  const data = BOSS_BAR_DATA[enemy.type];
  if (!data) return null;

  const pct = enemy.maxHp > 0 ? Math.min(100, Math.max(0, (enemy.hp / enemy.maxHp) * 100)) : 0;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="pointer-events-none fixed left-0 right-0 top-0 px-3 sm:px-6 pt-3 sm:pt-4"
          style={{ zIndex: UI_LAYERS.COMBAT + 5 }}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          aria-label={`Здоровье босса: ${data.name}, ${Math.max(0, Math.round(enemy.hp))} из ${enemy.maxHp}`}
          role="status"
        >
          {/* Ornate cyberpunk border card — gold/red gradient with double
           *  inset border for a "framed" AAA feel. */}
          <div
            className="relative pointer-events-auto"
            style={{
              padding: '8px 10px 10px',
              borderRadius: '6px',
              background: 'linear-gradient(180deg, rgba(8,4,2,0.92) 0%, rgba(20,6,4,0.92) 100%)',
              boxShadow:
                `inset 0 0 0 1px rgba(251,191,36,0.35),` +
                ` inset 0 0 0 2px rgba(239,68,68,0.18),` +
                ` inset 0 1px 0 rgba(255,255,255,0.05),` +
                ` 0 0 18px ${data.accent}33,` +
                ` 0 6px 18px rgba(0,0,0,0.55)`,
            }}
          >
            {/* Top row: boss name (left) + level chip + phase pips (right) */}
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                {/* Accent dot — color-coded by boss */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: data.accent,
                    boxShadow: `0 0 6px ${data.accent}, 0 0 12px ${data.accent}66`,
                  }}
                  aria-hidden="true"
                />
                <div
                  className="text-sm sm:text-lg font-mono font-extrabold uppercase tracking-[0.18em] truncate"
                  style={{
                    color: '#fff',
                    textShadow: `0 0 8px ${data.accent}aa, 0 0 16px ${data.accent}55`,
                  }}
                >
                  {data.name}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {/* Act / level chip */}
                <div
                  className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm"
                  style={{
                    color: '#fbbf24',
                    border: '1px solid rgba(251,191,36,0.35)',
                    background: 'rgba(251,191,36,0.08)',
                    textShadow: '0 0 6px rgba(251,191,36,0.4)',
                  }}
                >
                  Акт {data.act}
                </div>
                {/* Phase pips */}
                <PhasePips pct={pct} accent={data.accent} reducedMotion={reducedMotion} />
              </div>
            </div>

            {/* HP bar */}
            <BossFill
              current={enemy.hp}
              max={enemy.maxHp}
              accent={data.accent}
              reducedMotion={reducedMotion}
            />

            {/* Tiny accent strip under the bar — adds visual weight */}
            <div
              className="absolute left-0 right-0 bottom-0 h-px pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${data.accent}55 50%, transparent 100%)`,
              }}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
