import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StatChangeIndicator } from '@/components/game/microAnimations/StatChangeIndicator';
import { statChangePool } from '@/components/game/microAnimations/statChangePool';
import { useNotificationPool } from '@/components/game/microAnimations/useNotificationPoolSubscription';
import { STAT_CHANGE_TTL_MS } from '@/engine/microAnimations/microAnimationsConstants';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function StatChangeLayerPanel() {
  const reducedMotion = useEffectiveReducedMotion();
  const entries = useNotificationPool(statChangePool);
  const now = Date.now();

  const liveAnnouncement =
    entries.length > 0
      ? `${entries[entries.length - 1]!.value > 0 ? '+' : ''}${entries[entries.length - 1]!.value} ${entries[entries.length - 1]!.statName}`
      : '';

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: UI_LAYERS.TOASTS + 2 }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{liveAnnouncement}</span>
      <AnimatePresence>
        {entries.map((entry) => {
          if (now - entry.createdAt > STAT_CHANGE_TTL_MS) return null;
          return (
            <StatChangeIndicator
              key={entry.id}
              statName={entry.statName}
              value={entry.value}
              color={entry.color}
              x={entry.x}
              y={entry.y}
              reducedMotion={reducedMotion}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function StatChangeLayer() {
  return (
    <ErrorBoundary name="stat-change-layer" fallback={null}>
      <StatChangeLayerPanel />
    </ErrorBoundary>
  );
}

export { showStatChange } from '@/components/game/microAnimations/statChangePool';
