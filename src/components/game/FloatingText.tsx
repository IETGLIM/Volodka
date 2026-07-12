/* ─── Volodka RPG – Floating text presentation layer ─── */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { floatingTextService } from '@/engine/floatingText/floatingTextService';
import {
  TYPE_COLORS,
  TYPE_GLOW,
  TYPE_PREFIX,
} from '@/engine/floatingText/floatingTextPresentation';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';

const DEFAULT_ANIM_DURATION_S = 1.5;
const LEVELUP_ANIM_DURATION_S = 2.2;

export type { FloatingTextEntry, FloatingTextPriority, FloatingTextType } from '@/engine/floatingText/floatingTextTypes';
export {
  floatCredits,
  floatDamage,
  floatEnergy,
  floatHeal,
  floatItem,
  floatKarma,
  floatLevelUp,
  floatSkill,
  floatStress,
  floatXP,
  floatingTextService,
  spawnFloatingText,
} from '@/engine/floatingText/floatingTextService';

function subscribe(callback: () => void): () => void {
  return floatingTextService.subscribe(callback);
}

function getSnapshot(): ReturnType<typeof floatingTextService.getSnapshot> {
  return floatingTextService.getSnapshot();
}

function getServerSnapshot(): ReturnType<typeof floatingTextService.getServerSnapshot> {
  return floatingTextService.getServerSnapshot();
}

export function FloatingTextLayer() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const latestLiveMessage = useMemo(() => {
    const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    return latestEntry ? `${TYPE_PREFIX[latestEntry.type]}${latestEntry.text}` : '';
  }, [entries]);

  return (
    <>
      <AriaLiveRegion message={latestLiveMessage} priority="assertive" />
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: UI_LAYERS.TOASTS + 1 }}
        aria-hidden="true"
      >
        <AnimatePresence>
          {entries.map((entry) => {
            const color = TYPE_COLORS[entry.type];
            const glow = TYPE_GLOW[entry.type];
            const prefix = TYPE_PREFIX[entry.type];
            const isLevelUp = entry.type === 'levelup';

            return (
              <motion.div
                key={entry.id}
                initial={{
                  opacity: 1,
                  y: 0,
                  scale: isLevelUp ? 0.5 : 1,
                  x: entry.x,
                }}
                animate={{
                  opacity: 0,
                  y: isLevelUp ? -120 : -70,
                  scale: isLevelUp ? 1.3 : 1,
                  x: entry.x + entry.animateOffsetX,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: isLevelUp ? LEVELUP_ANIM_DURATION_S : DEFAULT_ANIM_DURATION_S,
                  ease: 'easeOut',
                }}
                className="absolute pointer-events-none select-none will-change-transform"
                style={{
                  left: 0,
                  top: entry.y,
                  color,
                  textShadow: glow,
                  fontFamily: 'monospace',
                  fontWeight: isLevelUp ? 900 : 700,
                  fontSize: isLevelUp ? '20px' : entry.type === 'damage' ? '18px' : '14px',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {isLevelUp ? (
                  <motion.span
                    initial={{ scale: 2, opacity: 0.5 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 flex items-center justify-center text-amber-400/30"
                    style={{ textShadow: '0 0 30px rgba(251,191,36,0.5)' }}
                  >
                    ⬆
                  </motion.span>
                ) : null}
                {prefix}
                {entry.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
