/* ─── Volodka RPG – Inventory Tooltip ─── */

import { memo, useEffect, useMemo, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { ItemRarity } from '@/data/items';
import type { InventoryItemView } from '@/engine/inventory/inventoryPresentation';
import { buildInventoryTooltipContent } from '@/engine/inventory/inventoryTooltipPresentation';
import type { TooltipComparisonDelta, TooltipComparisonRow } from '@/engine/inventory/inventoryTooltipPresentation';
import { inventoryTelemetry } from '@/engine/inventory/inventoryTelemetry';
import { useInventoryTooltipPosition } from '@/components/game/inventory/useInventoryTooltipPosition';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export interface InventoryTooltipProps {
  view: InventoryItemView;
  visible: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  tooltipId: string;
  position?: 'above' | 'below' | 'right';
  linkedQuestName?: string;
  reducedMotion?: boolean;
  /** ID of the currently-equipped item in the same slot (for comparison). */
  equippedItemIdForSlot?: string | null;
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

function ComparisonDelta({ delta }: { delta: TooltipComparisonDelta }) {
  const isPositive = delta.delta > 0;
  // "Beneficial" = positive delta AND positiveIsGood, or negative delta AND !positiveIsGood
  const isBeneficial = isPositive === delta.positiveIsGood;

  const arrow = isPositive ? '↑' : '↓';
  const sign = isPositive ? '+' : '';
  const colorClass = isBeneficial ? 'text-emerald-400 inv-stat-comparison-positive' : 'text-rose-400 inv-stat-comparison-negative';

  return (
    <p className={`font-mono text-xs ${colorClass} inv-stat-comparison-row flex items-center gap-1 break-words`}>
      <span className={isBeneficial ? 'text-emerald-500' : 'text-rose-500'} aria-hidden>▸</span>
      <span aria-hidden>{arrow}</span>
      <span>{delta.label} {sign}{delta.delta}</span>
    </p>
  );
}

/* ── v4.7.9: двухколоночное сравнение (Cyberpunk-стиль) ──
 * Полная картина: значение на НОВОМ предмете | на НАДЕТОМ, по каждой
 * строке — вердикт (лучше/хуже/равно). Строки с преимуществом нового
 * подсвечены emerald, проигрышем — rose, равные — приглушённо. */
function ComparisonRow({ row }: { row: TooltipComparisonRow }) {
  const isPositive = row.delta > 0;
  const newWins = row.delta !== 0 && isPositive === row.positiveIsGood;
  const equippedWins = row.delta !== 0 && !newWins;
  const sign = isPositive ? '+' : '';

  const newValueClass = newWins ? 'text-emerald-300' : equippedWins ? 'text-rose-300/80' : 'text-slate-300';
  const equippedValueClass = equippedWins ? 'text-emerald-300' : newWins ? 'text-rose-300/80' : 'text-slate-300';
  const deltaClass = row.delta === 0
    ? 'text-slate-600'
    : newWins ? 'text-emerald-400' : 'text-rose-400';
  const verdict = row.delta === 0 ? '=' : isPositive ? '↑' : '↓';

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 font-mono text-[11px] leading-relaxed">
      <span className="text-right tabular-nums break-words" style={{ color: undefined }}>
        <span className={newValueClass}>{row.newValue > 0 ? `+${row.newValue}` : row.newValue}</span>
      </span>
      <span className={equippedWins ? 'text-emerald-500/70' : 'text-slate-700'} aria-hidden>│</span>
      <span className="text-slate-400 truncate">{row.label}</span>
      <span className={newWins ? 'text-emerald-500/70' : 'text-slate-700'} aria-hidden>│</span>
      <span className="tabular-nums">
        <span className={equippedValueClass}>
          {row.equippedValue > 0 ? `+${row.equippedValue}` : row.equippedValue}
        </span>
        <span className={`ml-1.5 ${deltaClass}`} aria-label={`${row.label}: ${sign}${row.delta}`}>
          {verdict}{row.delta !== 0 ? `${sign}${row.delta}` : ''}
        </span>
      </span>
    </div>
  );
}

function SideBySideComparison({
  comparison,
}: {
  comparison: NonNullable<InventoryTooltipContentComparison>;
}) {
  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-950/10 px-2 py-1.5">
      {/* Заголовок колонок: НОВЫЙ (слева, cyan) vs НАДЕТО (справа, dim) */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 font-mono text-[9px] uppercase tracking-wider mb-1">
        <span className="text-right text-cyan-400/90">Новое</span>
        <span aria-hidden />
        <span className="text-amber-500/70 truncate">
          vs {comparison.equippedName}
        </span>
        <span aria-hidden />
        <span className="text-slate-500">Надето</span>
      </div>
      {comparison.rows.map((row) => (
        <ComparisonRow key={row.stat} row={row} />
      ))}
    </div>
  );
}

type InventoryTooltipContentComparison = ReturnType<
  typeof buildInventoryTooltipContent
>['comparison'];

export const InventoryTooltip = memo(function InventoryTooltip({
  view,
  visible,
  anchorRef,
  tooltipId,
  position = 'above',
  linkedQuestName,
  reducedMotion = false,
  equippedItemIdForSlot,
}: InventoryTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);
  const content = useMemo(
    () => buildInventoryTooltipContent(view, equippedItemIdForSlot),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [view.item.id, view.item.quantity, view.displayName, view.displayDescription, view.isUnknown, view.rarity, view.filterCategory, equippedItemIdForSlot],
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
          className={`fixed pointer-events-none max-w-[calc(100vw-16px)] hud-filmic-tooltip-ink ${
            content.comparison && content.comparison.rows.length > 0 ? 'w-72' : 'w-64'
          }`}
          style={{ top: coords.top, left: coords.left, zIndex: UI_LAYERS.TOOLTIP }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
          transition={{ duration: reducedMotion ? 0 : 0.12, ease: 'easeOut' }}
        >
          <div
            className="rounded-lg border backdrop-blur-md overflow-hidden break-words relative"
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

            {/* ── Equipment Comparison (v4.7.9: side-by-side, Cyberpunk-стиль) ── */}
            {content.comparison && content.comparison.rows.length > 0 && (
              <>
                <div
                  className="h-[1px] mx-3"
                  aria-hidden
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.2), transparent)',
                  }}
                />
                <div className="px-3 py-2 space-y-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/60 mb-0.5">
                    Сравнение · {content.comparison.slotLabel}
                  </p>
                  <SideBySideComparison comparison={content.comparison} />
                  {/* Компактная сводка дельт для скрин-ридеров и беглого взгляда */}
                  <div className="sr-only">
                    {content.comparison.deltas.map((delta) => (
                      <ComparisonDelta key={`sr-${delta.stat}`} delta={delta} />
                    ))}
                  </div>
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
