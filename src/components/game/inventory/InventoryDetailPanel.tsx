import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Lock, Shield, Trash2, X } from 'lucide-react';
import { getRarityBg, getRarityColor, getRarityLabel } from '@/data/items';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ItemIcon } from '@/components/game/shared/ItemIcon';
import type { InventoryItemView } from '@/engine/inventory/inventoryPresentation';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_RARITY_DETAIL_BG,
  INVENTORY_RARITY_ICON_SHADOW,
  INVENTORY_RARITY_TEXT_CLASS,
  INVENTORY_SLOT_LABELS,
  INVENTORY_STAT_ICONS,
} from '@/components/game/inventory/inventoryConstants';
import type { EquipmentSlot } from '@/shared/types/game';

interface InventoryDetailPanelProps {
  view: InventoryItemView;
  isEquipped: boolean;
  equippedSlot: EquipmentSlot | null;
  feedback: string | null;
  pendingActionKey: string | null;
  canUse: boolean;
  canEquip: boolean;
  canDrop: boolean;
  reducedMotion: boolean;
  onUse: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  onDrop: () => void;
  onClose: () => void;
}

export function InventoryDetailPanel({
  view,
  isEquipped,
  equippedSlot,
  feedback,
  pendingActionKey,
  canUse,
  canEquip,
  canDrop,
  reducedMotion,
  onUse,
  onEquip,
  onUnequip,
  onDrop,
  onClose,
}: InventoryDetailPanelProps) {
  const { item, def, isUnknown, displayName, displayDescription, rarity } = view;
  const isConsumable = def?.category === 'consumable';
  const isBook = def?.category === 'book';
  const isPoemFragment = def?.category === 'poem_fragment';
  const isEquipment = def?.category === 'equipment';
  const isQuestItem = def?.questRelated ?? false;
  const iconName = def?.icon;
  const hasIcon = !!iconName;
  const isPending = pendingActionKey !== null;

  const useLabel = isConsumable
    ? 'Использовать'
    : isBook
      ? 'Прочитать'
      : isPoemFragment
        ? 'Изучить'
        : 'Использовать';

  const detailVariants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        hidden: { x: '100%', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
        exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
      };

  return (
    <motion.div
      key="detail-panel"
      variants={detailVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="dialog"
      aria-label={`Детали: ${displayName}`}
      className={`
        w-full sm:w-64 shrink-0
        fixed inset-0 z-40 sm:relative sm:inset-auto sm:z-auto
        bg-black/80 sm:bg-transparent
        flex items-end sm:items-start sm:block
      `}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:w-auto rounded-t-xl sm:rounded-lg max-h-[60vh] sm:max-h-none overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex flex-col gap-3 rounded-lg border border-slate-700/30 p-3 ${INVENTORY_RARITY_DETAIL_BG[rarity]} backdrop-blur-md`}>
          <div className="flex items-center justify-between sm:hidden mb-1">
            <span className="text-xs text-slate-500 font-mono">Детали</span>
            <button type="button" onClick={onClose} aria-label="Закрыть детали" className="text-slate-500 hover:text-slate-300">
              <X className="size-4" />
            </button>
          </div>

          <div
            className={`w-16 h-16 rounded-md border mx-auto flex items-center justify-center relative ${getRarityBg(rarity)}`}
            style={{ boxShadow: INVENTORY_RARITY_ICON_SHADOW[rarity] }}
          >
            {hasIcon && iconName ? (
              <ItemIcon icon={iconName} className="size-7 text-slate-100 drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
            ) : (
              <span className="text-xs text-slate-100 font-medium text-center px-1 leading-tight">
                {displayName}
              </span>
            )}
            {rarity === 'legendary' && (
              <div className="absolute inset-0 rounded-md inv-legendary-shimmer pointer-events-none" />
            )}
          </div>

          <div className="text-center">
            <div className={`text-sm font-medium ${INVENTORY_RARITY_TEXT_CLASS[rarity]}`}>
              {displayName}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              {isUnknown ? (
                <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                  Неизвестный предмет
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className={`text-[10px] ${getRarityColor(rarity)}`}>
                    {getRarityLabel(rarity)}
                  </Badge>
                  {isEquipment && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                      <Shield className="size-2.5 mr-0.5" aria-hidden />
                      Экипировка
                    </Badge>
                  )}
                  {def && (
                    <Badge variant="outline" className="text-[10px] border-slate-700/40 text-slate-400">
                      {INVENTORY_CATEGORY_LABELS[def.category] ?? def.category}
                    </Badge>
                  )}
                  {isQuestItem && (
                    <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400">
                      <Lock className="size-2.5 mr-0.5" aria-hidden />
                      Квест
                    </Badge>
                  )}
                </>
              )}
              {isEquipped && equippedSlot && (
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 inv-equipped-badge">
                  НАДЕТО: {INVENTORY_SLOT_LABELS[equippedSlot]}
                </Badge>
              )}
            </div>
          </div>

          {displayDescription && (
            <p className="text-xs text-slate-400 leading-relaxed">{displayDescription}</p>
          )}

          {(isConsumable || isBook || isPoemFragment || isEquipment) && def && def.effects.length > 0 && (
            <div className="space-y-1 rounded-md bg-slate-900/40 border border-slate-700/20 p-2">
              {def.effects.map((effect, i) => {
                let label = '';
                let statIcon = '';
                let valueClass = '';
                if (effect.stat === 'energy') {
                  label = `Энергия ${effect.value > 0 ? '+' : ''}${effect.value}`;
                  statIcon = INVENTORY_STAT_ICONS.energy;
                  valueClass = effect.value > 0 ? 'text-emerald-400' : 'text-rose-400';
                } else if (effect.stat === 'stress') {
                  label = `Стресс ${effect.value > 0 ? '+' : ''}${effect.value}`;
                  statIcon = INVENTORY_STAT_ICONS.stress;
                  valueClass = effect.value > 0 ? 'text-rose-400' : 'text-emerald-400';
                } else if (effect.stat === 'karma') {
                  label = `Карма ${effect.value > 0 ? '+' : ''}${effect.value}`;
                  statIcon = INVENTORY_STAT_ICONS.karma;
                  valueClass = effect.value > 0 ? 'text-cyan-400' : 'text-rose-400';
                } else if (effect.skill) {
                  label = `${effect.skill} +${effect.value}`;
                  statIcon = '📈';
                  valueClass = 'text-violet-400';
                }
                return (
                  <div key={i} className={`text-xs flex items-center gap-1.5 ${valueClass}`}>
                    <span className="text-[11px]" aria-hidden>{statIcon}</span>
                    <span className="font-mono">{label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {isBook && def?.linkedContent && (
            <div className="text-xs text-cyan-400/70 italic">
              {def.linkedContent.type === 'poem' ? '📖 Откроет стихотворение' : '📜 Добавит запись в журнал'}
            </div>
          )}

          {item.stackable && item.quantity > 1 && (
            <div className="text-xs text-slate-500">Количество: {item.quantity}</div>
          )}

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-cyan-400 text-center font-medium neon-text-cyan"
                aria-live="polite"
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2 mt-1">
            {(isConsumable || isBook || isPoemFragment) && (
              <Button
                size="sm"
                variant="outline"
                className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb) / 0.2)] transition-all duration-200"
                onClick={onUse}
                disabled={!canUse || isPending}
                aria-busy={isPending}
              >
                <Hand className="size-3.5 mr-1.5" aria-hidden />
                {isPending ? 'Используется…' : useLabel}
              </Button>
            )}

            {isEquipment && !isEquipped && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 text-amber-400 hover:bg-amber-900/30 hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all duration-200"
                onClick={onEquip}
                disabled={!canEquip || isPending}
                aria-busy={isPending}
              >
                <Shield className="size-3.5 mr-1.5" aria-hidden />
                {isPending ? 'Экипируется…' : 'Экипировать'}
              </Button>
            )}

            {isEquipped && (
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/30 hover:shadow-[0_0_12px_rgba(52,211,153,0.2)] transition-all duration-200"
                onClick={onUnequip}
                disabled={isPending}
                aria-busy={isPending}
              >
                <Shield className="size-3.5 mr-1.5" aria-hidden />
                {isPending ? 'Снимается…' : 'Снять'}
              </Button>
            )}

            {!isEquipped && (
              <Button
                size="sm"
                variant="outline"
                className="border-rose-500/30 text-rose-400 hover:bg-rose-900/30 hover:shadow-[0_0_8px_rgba(251,113,133,0.15)] transition-all duration-200"
                onClick={onDrop}
                disabled={!canDrop || isPending}
                aria-busy={isPending}
              >
                <Trash2 className="size-3.5 mr-1.5" aria-hidden />
                {isPending ? 'Выбрасывается…' : canDrop ? 'Выбросить' : 'Нельзя выбросить'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
