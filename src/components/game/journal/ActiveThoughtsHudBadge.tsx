'use client';

/**
 * Volodka RPG – Active Thoughts HUD Badge
 *
 * Displays a small floating badge (bottom-left) showing the count and
 * names of currently equipped thoughts. Cyberpunk palette, Russian text.
 *
 * v4.16: чипы арочных мыслей показывают прогресс проработки — тонкое
 * кольцо-индикатор вокруг точки и суффикс процента; завершённые —
 * изумрудная точка.
 *
 * This is a standalone component — it subscribes to the store directly
 * and can be mounted anywhere in the HUD layer.
 */

import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEquippedThoughts } from '@/store/selectors/thoughtCabinetSelectors';
import { VOICE_META } from './ThoughtCabinetTab';
import { useGameStore } from '@/store/gameStore';
import { formatThoughtProgressPercent } from '@/shared/thoughts/thoughtInternalization';
import type { ThoughtCabinetItem } from '@/shared/types/game';
import './thought-cabinet.css';

interface ChipData {
  id: string;
  name: string;
  dotColor: string;
  /** 0..1 — прогресс проработки (undefined для мыслей без арки). */
  fraction?: number;
}

function toChipData(thought: ThoughtCabinetItem, points: number | undefined): ChipData {
  const meta = VOICE_META[thought.voice];
  const arc = thought.internalization;
  const fraction = arc
    ? Math.min((points ?? 0) / arc.requiredPoints, 1)
    : undefined;
  return {
    id: thought.id,
    name: thought.name,
    dotColor: meta?.color ?? '#94a3b8',
    fraction,
  };
}

export const ActiveThoughtsHudBadge = memo(function ActiveThoughtsHudBadge() {
  const equipped = useEquippedThoughts();
  const internalizationPoints = useGameStore((s) => s.thoughtInternalizationPoints);

  const chips = useMemo(
    () => equipped.map((t) => toChipData(t, internalizationPoints[t.id])),
    [equipped, internalizationPoints],
  );

  if (chips.length === 0) return null;

  return (
    <div className="active-thoughts-hud" aria-label="Активные мысли">
      {/* Count header */}
      <div
        className="text-[8px] font-mono uppercase tracking-widest mb-0.5 pl-1"
        style={{
          color: 'rgba(148, 163, 184, 0.5)',
          textShadow: '0 0 6px rgba(0, 229, 255, 0.15)',
        }}
      >
        Голоса: {chips.length}
      </div>

      <AnimatePresence>
        {chips.map((chip, idx) => (
          <motion.div
            key={chip.id}
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="active-thoughts-hud-chip"
          >
            {/* v4.16: точка с кольцом прогресса проработки */}
            {chip.fraction !== undefined ? (
              <span
                className="active-thoughts-hud-dot"
                style={{
                  color: chip.fraction >= 1 ? '#34d399' : chip.dotColor,
                  background:
                    chip.fraction >= 1
                      ? '#34d399'
                      : `color-mix(in srgb, ${chip.dotColor} ${Math.round(30 + chip.fraction * 70)}%, #1e293b)`,
                  boxShadow: `inset 0 0 0 1.5px rgba(15, 23, 42, 0.9)`,
                }}
                aria-hidden
              />
            ) : (
              <span
                className="active-thoughts-hud-dot"
                style={{ color: chip.dotColor, background: chip.dotColor }}
                aria-hidden
              />
            )}
            <span className="active-thoughts-hud-label">{chip.name}</span>
            {chip.fraction !== undefined && chip.fraction < 1 && (
              <span
                className="text-[7px] font-mono shrink-0"
                style={{ color: 'rgba(251, 191, 36, 0.75)' }}
              >
                {formatThoughtProgressPercent(chip.fraction)}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
