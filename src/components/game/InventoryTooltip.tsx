/* ─── Volodka RPG – Inventory Tooltip ─── */

import { memo, useEffect, useMemo, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { ItemRarity } from '@/data/items';
import type { InventoryItemView } from '@/engine/inventory/inventoryPresentation';
import { buildInventoryTooltipContent } from '@/engine/inventory/inventoryTooltipPresentation';
import { inventoryTelemetry } from '@/engine/inventory/inventoryTelemetry';
import { useInventoryTooltipPosition } from '@/components/game/inventory/useInventoryTooltipPosition';

export interface InventoryTooltipProps {
  view: InventoryItemView;
  visible: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  tooltipId: string;
  position?: 'above' | 'below' | 'right';
  linkedQuestName?: string;
  reducedMotion?: boolean;
}

const RARITY_BORDER: Record<ItemRarity, string> = {
  common: 'rgba(148, 163, 184, 0.2)',
  uncommon: 'rgba(52, 211, 153, 0.4)',
  rare: 'rgb(var(--cyber-cyan-rgb) / 0.4)',
  legendary: 'rgba(251, 191, 36, 0.5)',
};

const RARITY_GLOW: Record<ItemRarity, string> = {
  common: '',
  uncommon: '0 0 8px rgba(52, 211, 153, 0.15)',
  rare: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.2)',
  legendary: '0 0 16px rgba(251, 191, 36, 0.3)',
};

const RARITY_TEXT: Record<ItemRarity, string> = {
  common: 'text-slate-300',
  uncommon: 'text-emerald-300',
  rare: 'text-cyan-300',
  legendary: 'text-amber-300',
};

export const InventoryTooltip = memo(function InventoryTooltip({
  view,
  visible,
  anchorRef,
  tooltipId,
  position = 'above',
  linkedQuestName,
  reducedMotion = false,
}: InventoryTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  const content = useMemo(
    () => buildInventoryTooltipContent(view),
    [view.item.id, view.item.quantity, view.displayName, view.displayDescription, view.isUnknown, view.rarity, view.filterCategory],
  );
  const coords = useInventoryTooltipPosition(anchorRef, tooltipRef, visible, position);

  useEffect(() => {
    if (!visible) {
      trackedRef.current = false;
      return;
    }
    if (trackedRef.current) return;
    trackedRef.current = true;
    inventoryTelemetry.track({ action: 'tooltip_shown', itemId: content.itemId });
  }, [visible, content.itemId]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key={tooltipId}
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          aria-hidden={!visible}
          className="fixed z-[9999] pointer-events-none w-64 max-w-[calc(100vw-16px)]"
          style={{ top: coords.top, left: coords.left }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reducedMotion ? 0 : 0.12, ease: 'easeOut' }}
        >
          <div
            className="rounded-lg border backdrop-blur-md overflow-hidden break-words"
            style={{
              background: 'linear-gradient(180deg, rgba(8, 12, 18, 0.96) 0%, rgba(5, 8, 14, 0.98) 100%)',
              borderColor: RARITY_BORDER[content.rarity],
              boxShadow: RARITY_GLOW[content.rarity] || 'none',
            }}
          >
            {!reducedMotion && (
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(var(--cyber-cyan-rgb) / 0.01) 2px, rgb(var(--cyber-cyan-rgb) / 0.01) 4px)',
                }}
              />
            )}

            <div className="px-3 pt-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className={`font-mono text-sm font-bold leading-tight break-words ${RARITY_TEXT[content.rarity]}`}>
                  {content.displayName}
                </h4>
                <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {content.rarityLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {content.categoryLabel}
                </span>
                {content.isUnknown && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/30">
                    Неизвестный предмет
                  </span>
                )}
                {content.isQuestItem && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Предмет квеста
                  </span>
                )}
                {content.isEquipment && content.equipmentSlotLabel && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {content.equipmentSlotLabel}
                  </span>
                )}
              </div>
            </div>

            <div
              className="h-[1px] mx-3"
              aria-hidden
              style={{
                background: `linear-gradient(90deg, transparent, ${RARITY_BORDER[content.rarity]}, transparent)`,
              }}
            />

            <div className="px-3 py-2">
              <p className="font-mono text-xs text-slate-400 leading-relaxed break-words">
                {content.displayDescription}
              </p>
            </div>

            {content.effects.length > 0 && (
              <>
                <div
                  className="h-[1px] mx-3"
                  aria-hidden
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.15), transparent)',
                  }}
                />
                <div className="px-3 py-2 space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    {content.effectsHeader}
                  </p>
                  {content.effects.map((effect, index) => (
                    <p key={`${content.itemId}-effect-${index}`} className="font-mono text-xs text-emerald-400 flex items-center gap-1 break-words">
                      <span className="text-emerald-500" aria-hidden>▸</span>
                      {effect}
                    </p>
                  ))}
                </div>
              </>
            )}

            {content.isQuestItem && linkedQuestName && (
              <>
                <div
                  className="h-[1px] mx-3"
                  aria-hidden
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.15), transparent)',
                  }}
                />
                <div className="px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/50 mb-0.5">Квест</p>
                  <p className="font-mono text-xs text-cyan-300 break-words">{linkedQuestName}</p>
                </div>
              </>
            )}

            {content.quantity > 1 && (
              <div className="px-3 pb-2">
                <p className="font-mono text-[10px] text-slate-500">
                  Количество: <span className="text-slate-300">{content.quantity}</span>
                </p>
              </div>
            )}

            {content.rarity === 'legendary' && !reducedMotion && (
              <>
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/40 rounded-tl-lg" aria-hidden />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/40 rounded-tr-lg" aria-hidden />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/40 rounded-bl-lg" aria-hidden />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/40 rounded-br-lg" aria-hidden />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
});
