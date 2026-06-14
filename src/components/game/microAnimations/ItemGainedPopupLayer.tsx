import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { itemGainedPool } from '@/components/game/microAnimations/itemGainedPool';
import { useNotificationPool } from '@/components/game/microAnimations/useNotificationPoolSubscription';
import {
  ITEM_GAINED_LABEL,
  ITEM_GAINED_TTL_MS,
  RARITY_COLORS,
} from '@/engine/microAnimations/microAnimationsConstants';
import { buildItemGainedAnnouncement } from '@/engine/microAnimations/microAnimationsPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function ItemGainedPopupLayerPanel() {
  const reducedMotion = useEffectiveReducedMotion();
  const entries = useNotificationPool(itemGainedPool);
  const now = Date.now();

  const liveAnnouncement =
    entries.length > 0 ? buildItemGainedAnnouncement(entries[entries.length - 1]!.name) : '';

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ zIndex: UI_LAYERS.TOASTS + 3 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{liveAnnouncement}</span>
      <AnimatePresence>
        {entries.map((entry) => {
          if (now - entry.createdAt > ITEM_GAINED_TTL_MS) return null;
          const color = RARITY_COLORS[entry.rarity ?? 'common'] ?? RARITY_COLORS.common;
          return (
            <motion.div
              key={entry.id}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.3 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(15,23,42,0.85) 100%)',
                borderColor: `${color}40`,
                boxShadow: `0 0 20px ${color}15, 0 4px 16px rgba(0,0,0,0.4)`,
              }}
            >
              {entry.icon ? <span className="text-lg" aria-hidden="true">{entry.icon}</span> : null}
              <span className="text-sm font-medium font-mono" style={{ color, textShadow: `0 0 6px ${color}40` }}>
                {entry.name}
              </span>
              <span className="text-[10px] text-slate-400">{ITEM_GAINED_LABEL}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ItemGainedPopupLayer() {
  return (
    <ErrorBoundary name="item-gained-layer" fallback={null}>
      <ItemGainedPopupLayerPanel />
    </ErrorBoundary>
  );
}

export { showItemGained } from '@/components/game/microAnimations/itemGainedPool';
