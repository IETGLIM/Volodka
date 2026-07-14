/* ─── Volodka RPG – Dialogue relationship indicator bar ───
 *  Shown at the top of the dialogue panel when talking to an NPC.
 *  Color-coded: red (hostile/enemy) → amber (neutral) → green (ally/friendly).
 *  Shows numeric value on hover. Animates transitions when relationship
 *  changes during dialogue (e.g. after choosing a dialogue option).
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRelationLevel, getRelationLevelColors } from '@/engine/npcRelationship/npcRelationshipPresentation';
import {
  NPC_RELATIONSHIP_LABELS,
  RELATION_LEVEL_LABELS,
  NPC_RELATION_ALLY_THRESHOLD,
  NPC_RELATION_ENEMY_THRESHOLD,
  type RelationLevel,
} from '@/engine/npcRelationship/npcRelationshipConstants';

interface DialogueRelationBarProps {
  /** NPC id for looking up relation */
  npcId: string;
  /** Current numeric relation value (0–100) */
  relationValue: number;
  /** Whether reduced motion is enabled */
  reducedMotion: boolean;
  /** Accent color from portrait system */
  accentColor: string;
}

/** Resolve the bar fill color for a given relation level */
function getBarColor(level: RelationLevel): string {
  switch (level) {
    case 'ally': return 'bg-emerald-500';
    case 'neutral': return 'bg-amber-500';
    case 'enemy': return 'bg-red-500';
  }
}

/** Resolve the bar glow color for a given relation level */
function getGlowColor(level: RelationLevel): string {
  const colors = getRelationLevelColors(level);
  return colors.glow;
}

/** Resolve the bar text color for a given relation level */
function getTextColor(level: RelationLevel): string {
  switch (level) {
    case 'ally': return 'text-emerald-400';
    case 'neutral': return 'text-amber-400';
    case 'enemy': return 'text-red-400';
  }
}

/** Dialogue relationship indicator bar */
export function DialogueRelationBar({
  npcId: _npcId,
  relationValue,
  reducedMotion,
  accentColor,
}: DialogueRelationBarProps) {
  const [hovered, setHovered] = useState(false);

  const level = getRelationLevel(relationValue);
  const barColor = getBarColor(level);
  const glowColor = getGlowColor(level);
  const textColor = getTextColor(level);
  const levelLabel = RELATION_LEVEL_LABELS[level];

  // Segments showing thresholds
  const segments = useMemo(() => {
    const enemyEnd = NPC_RELATION_ENEMY_THRESHOLD;
    const allyStart = NPC_RELATION_ALLY_THRESHOLD;
    return { enemyEnd, allyStart };
  }, []);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
      className="w-full max-w-2xl mb-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-white/50">
          {NPC_RELATIONSHIP_LABELS.relation}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${textColor}`}>
            {levelLabel}
          </span>
          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="text-[10px] font-mono text-white/70"
              >
                {relationValue}/100
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
        {/* Threshold markers */}
        <div
          className="absolute bottom-0 top-0 w-px bg-white/15 z-10"
          style={{ left: `${segments.enemyEnd}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 top-0 w-px bg-white/15 z-10"
          style={{ left: `${segments.allyStart}%` }}
          aria-hidden="true"
        />

        {/* Fill bar with animated transitions */}
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${relationValue}%` }}
          transition={reducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 120, damping: 18 }
          }
          style={{ boxShadow: `0 0 8px ${glowColor}` }}
          role="progressbar"
          aria-valuenow={relationValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={NPC_RELATIONSHIP_LABELS.relation}
        />
      </div>

      {/* Accent line beneath the bar */}
      <div
        className="mt-1 h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
