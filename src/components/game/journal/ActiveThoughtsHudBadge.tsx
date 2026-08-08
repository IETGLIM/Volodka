'use client';

/**
 * Volodka RPG – Active Thoughts HUD Badge
 *
 * Displays a small floating badge (bottom-left) showing the count and
 * names of currently equipped thoughts. Cyberpunk palette, Russian text.
 *
 * This is a standalone component — it subscribes to the store directly
 * and can be mounted anywhere in the HUD layer.
 */

import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEquippedThoughts } from '@/store/selectors/thoughtCabinetSelectors';
import { VOICE_META } from './ThoughtCabinetTab';
import type { ThoughtCabinetItem } from '@/shared/types/game';
import './thought-cabinet.css';

interface ChipData {
  id: string;
  name: string;
  dotColor: string;
}

function toChipData(thought: ThoughtCabinetItem): ChipData {
  const meta = VOICE_META[thought.voice];
  return {
    id: thought.id,
    name: thought.name,
    dotColor: meta?.color ?? '#94a3b8',
  };
}

export const ActiveThoughtsHudBadge = memo(function ActiveThoughtsHudBadge() {
  const equipped = useEquippedThoughts();

  const chips = useMemo(() => equipped.map(toChipData), [equipped]);

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
            <span
              className="active-thoughts-hud-dot"
              style={{ color: chip.dotColor, background: chip.dotColor }}
              aria-hidden
            />
            <span className="active-thoughts-hud-label">{chip.name}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
