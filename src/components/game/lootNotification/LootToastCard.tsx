import { memo } from 'react';
import { motion } from 'framer-motion';
import { Package, Sparkles, TrendingUp } from 'lucide-react';
import {
  buildLootAnnouncement,
  getLootVisualConfig,
  getRarityBadgeClass,
  getRarityBadgeLabel,
  resolveLootToastSurfaceClass,
} from '@/engine/loot/lootNotificationPresentation';
import type { LootNotificationItem } from '@/engine/loot/lootNotificationTypes';
import { cn } from '@/lib/utils';

type LootToastCardProps = {
  notification: LootNotificationItem;
  reducedMotion: boolean;
};

function LootToastIcon({ type, className }: { type: LootNotificationItem['type']; className: string }) {
  switch (type) {
    case 'skill':
    case 'xp':
      return <TrendingUp className={cn('size-4 shrink-0', className)} aria-hidden />;
    case 'item':
      return <Package className={cn('size-4 shrink-0', className)} aria-hidden />;
    case 'poem':
    case 'combat':
    case 'karma':
      return <Sparkles className={cn('size-4 shrink-0', className)} aria-hidden />;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export const LootToastCard = memo(function LootToastCard({
  notification,
  reducedMotion,
}: LootToastCardProps) {
  const visual = getLootVisualConfig(notification);
  const rarityBadge = notification.rarity ? getRarityBadgeLabel(notification.rarity) : null;

  return (
    <motion.div
      role="alert"
      aria-label={buildLootAnnouncement(notification)}
      initial={reducedMotion ? false : { opacity: 0, x: -40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: -40, scale: 0.9 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
      className={cn(
        'px-4 py-2.5 rounded-lg border-2 backdrop-blur-sm shadow-lg',
        visual.rarityGlow,
        resolveLootToastSurfaceClass(notification),
      )}
    >
      <div className="flex items-center gap-2.5">
        <LootToastIcon type={notification.type} className={visual.iconClass} />
        <div>
          <div className="text-sm font-medium text-slate-100">{notification.label}</div>
          {notification.detail && (
            <div className="text-[10px] text-slate-400">{notification.detail}</div>
          )}
          {rarityBadge && notification.rarity && (
            <div className={cn('text-[9px] font-bold mt-0.5', getRarityBadgeClass(notification.rarity))}>
              {rarityBadge}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
