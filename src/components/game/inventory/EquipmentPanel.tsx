import { Shield } from 'lucide-react';
import { ItemIcon } from '@/components/game/shared/ItemIcon';
import { resolveInventoryItemView } from '@/engine/inventory/inventoryPresentation';
import {
  INVENTORY_SLOT_BORDER_COLORS,
  INVENTORY_SLOT_ICONS,
  INVENTORY_SLOT_LABELS,
} from '@/components/game/inventory/inventoryConstants';
import { useInventoryDnd } from '@/components/game/inventory/inventoryDnd';
import {
  isSlotDropCompatible,
  wasDraggingRecently,
} from '@/components/game/inventory/inventoryDndLogic';
import type { EquipmentSlot, InventoryItem } from '@/shared/types/game';

interface EquipmentPanelProps {
  equippedItems: Record<EquipmentSlot, InventoryItem | null>;
  selectedSlot: EquipmentSlot | null;
  onSelectSlot: (slot: EquipmentSlot | null) => void;
}

export function EquipmentPanel({
  equippedItems,
  selectedSlot,
  onSelectSlot,
}: EquipmentPanelProps) {
  const { dragPayload, dropTarget, beginEquippedPointerDown } = useInventoryDnd();
  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
        <Shield className="size-3.5 text-cyan-400" aria-hidden />
        Экипировка
      </h3>
      <div className="flex gap-2" role="group" aria-label="Слоты экипировки">
        {(['weapon', 'head', 'body', 'legs', 'feet', 'hands', 'accessory'] as EquipmentSlot[]).map((slot) => {
          const equipped = equippedItems[slot];
          const view = equipped ? resolveInventoryItemView(equipped) : null;
          const isSelected = selectedSlot === slot;
          const slotBorderColor = INVENTORY_SLOT_BORDER_COLORS[slot];
          // Подсветка цели дропа (v4.7.4): совместимый слот — cyan-пульс,
          // несовместимый под курсором — rose-отказ.
          const hoveredAsTarget = dragPayload && dropTarget?.kind === 'slot' && dropTarget.slot === slot;
          const compatibleTarget =
            hoveredAsTarget && dragPayload?.item
              ? isSlotDropCompatible(dragPayload.equipmentSlot, slot)
              : false;
          const rejectedTarget =
            hoveredAsTarget && dragPayload?.item ? !compatibleTarget : false;

          return (
            <button
              key={slot}
              type="button"
              data-dnd-slot={slot}
              aria-label={`${INVENTORY_SLOT_LABELS[slot]}${equipped ? `: ${equipped.name}` : ', пусто'}`}
              aria-pressed={isSelected}
              onClick={() => {
                if (wasDraggingRecently()) return;
                onSelectSlot(equipped ? slot : null);
              }}
              onPointerDown={(e) => {
                if (!equipped) return;
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                beginEquippedPointerDown(slot, equipped, e);
              }}
              className={`
                flex-1 rounded-md border p-2 transition-all duration-200 relative
                ${equipped
                  ? isSelected
                    ? `${slotBorderColor} bg-slate-800/50 ring-1 ring-cyan-500/30`
                    : `${slotBorderColor} bg-slate-900/50 hover:bg-slate-800/40`
                  : 'inv-slot-empty border-slate-700/20 bg-slate-900/20'
                }
                ${equipped ? 'cursor-grab active:cursor-grabbing' : ''}
                ${compatibleTarget
                  ? 'ring-2 ring-cyan-400/70 bg-cyan-500/10 inv-slot-drop-ok'
                  : ''}
                ${rejectedTarget
                  ? 'ring-2 ring-rose-500/70 inv-slot-drop-reject opacity-70'
                  : ''}
              `}
            >
              <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                {equipped ? (
                  <span className="inv-equipped-badge text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono leading-none">
                    НАДЕТО
                  </span>
                ) : null}
                <span>{INVENTORY_SLOT_LABELS[slot]}</span>
              </div>
              {equipped && view?.def ? (
                <div className="flex items-center gap-1.5">
                  <ItemIcon icon={view.def.icon} className="size-4 text-slate-100" />
                  <span className="text-xs text-slate-200 truncate">{equipped.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 opacity-30">
                  <span className="text-sm" aria-hidden>{INVENTORY_SLOT_ICONS[slot]}</span>
                  <span className="text-[10px] text-slate-500 italic">Пусто</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
