import { memo, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield } from 'lucide-react';
import { ItemIcon } from '@/components/game/shared/ItemIcon';
import { InventoryTooltip } from '@/components/game/InventoryTooltip';
import type { InventoryItemView } from '@/engine/inventory/inventoryPresentation';
import {
  getInventoryRarityHoverShadow,
  INVENTORY_RARITY_BORDER_CLASS,
  INVENTORY_RARITY_TEXT_CLASS,
} from '@/components/game/inventory/inventoryConstants';
import { useInventoryDnd } from '@/components/game/inventory/inventoryDnd';
import { wasDraggingRecently } from '@/components/game/inventory/inventoryDndLogic';
import type { EquipmentSlot } from '@/shared/types/game';

interface InventoryCardProps {
  view: InventoryItemView;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  reducedMotion: boolean;
  onSelect: (itemId: string, index: number) => void;
  /** Currently equipped items, for comparison tooltip. */
  equippedItems?: Record<EquipmentSlot, { id: string } | null>;
}

export const InventoryCard = memo(function InventoryCard({
  view,
  index,
  isSelected,
  isFocused,
  reducedMotion,
  onSelect,
  equippedItems,
}: InventoryCardProps) {
  const { item, def, rarity, categoryIcon, displayName } = view;
  const hasIcon = !!def?.icon;
  const ringClass = isSelected || isFocused
    ? 'bg-slate-800/60 ring-1 ring-cyan-500/30'
    : 'bg-slate-900/40 hover:bg-slate-800/50';

  // Determine the equipped item in the same slot for comparison tooltip
  const equippedItemIdForSlot = (def?.category === 'equipment' && def.equipmentSlot && equippedItems)
    ? equippedItems[def.equipmentSlot as EquipmentSlot]?.id ?? null
    : null;

  const cardRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const tooltipId = useId();
  const showTooltip = hovered || isFocused;
  const { beginItemPointerDown } = useInventoryDnd();
  // v4.7.5: экипировка — драг в слоты; расходуемые — драг в хотбар.
  const canBeDragged =
    (def?.category === 'equipment' && !!def.equipmentSlot) ||
    def?.category === 'consumable';

  return (
    <>
      <motion.button
        ref={cardRef}
        type="button"
        role="option"
        aria-label={displayName}
        aria-selected={isSelected}
        aria-describedby={showTooltip ? tooltipId : undefined}
        data-item-id={item.id}
        data-rarity={rarity !== 'common' ? rarity : undefined}
        data-focused={isFocused ? 'true' : undefined}
        tabIndex={isFocused ? 0 : -1}
        onClick={() => {
          // После состоявшегося драга клик гасится (click стреляет после pointerup).
          if (wasDraggingRecently()) return;
          onSelect(item.id, index);
        }}
        onPointerDown={(e) => {
          if (canBeDragged) beginItemPointerDown(item, e);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          inv-item-card inv-cell-hscanline inv-cell-scanline cyber-list-item cyber-3d-card group relative rounded-lg border p-2.5 text-left transition-all duration-200
          backdrop-blur-md w-full
          ${INVENTORY_RARITY_BORDER_CLASS[rarity]}
          ${ringClass}
          ${canBeDragged ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}
        whileHover={reducedMotion ? undefined : {
          scale: 1.03,
          boxShadow: getInventoryRarityHoverShadow(rarity),
          transition: { duration: 0.15 },
        }}
        whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      >
        {rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-lg inv-legendary-shimmer pointer-events-none" />
        )}
        {canBeDragged && (
          <span
            className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-cyan-500/10 px-1 text-[8px] font-mono uppercase tracking-wide text-cyan-300/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            aria-hidden
          >
            ⟷ тяни
          </span>
        )}
        {rarity === 'rare' && !isSelected && (
          <div className="absolute inset-0 rounded-lg inv-rare-pulse pointer-events-none" />
        )}

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] leading-none" aria-hidden>{categoryIcon}</span>
          <div className="flex items-center gap-1">
            {def?.questRelated && (
              <Lock className="size-2.5 text-cyan-400 drop-shadow-[0_0_3px_rgb(var(--cyber-cyan-rgb) / 0.5)]" aria-hidden />
            )}
            {def?.category === 'equipment' && (
              <Shield className="size-2.5 text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]" aria-hidden />
            )}
            {item.quantity > 1 && (
              <span key={`count-${item.quantity}`} className="inv-count-badge-cyber inv-count-badge-animated inv-count-pop">{item.quantity}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center h-10 mb-1.5">
          {hasIcon && def ? (
            <ItemIcon icon={def.icon} className="size-6 text-slate-200 drop-shadow-[0_0_3px_rgba(255,255,255,0.1)]" />
          ) : (
            <span className="text-[10px] text-slate-200 font-medium text-center leading-tight px-0.5">
              {displayName.length > 8 ? `${displayName.slice(0, 7)}…` : displayName}
            </span>
          )}
        </div>

        <div className={`text-[11px] font-medium truncate leading-tight ${INVENTORY_RARITY_TEXT_CLASS[rarity]}`}>
          {displayName}
        </div>
      </motion.button>

      <InventoryTooltip
        view={view}
        visible={showTooltip}
        anchorRef={cardRef}
        tooltipId={tooltipId}
        reducedMotion={reducedMotion}
        equippedItemIdForSlot={equippedItemIdForSlot}
      />
    </>
  );
});
