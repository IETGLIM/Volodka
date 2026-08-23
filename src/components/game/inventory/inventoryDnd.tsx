/* ─── Volodka RPG – Drag & Drop для инвентаря (v4.7.4) ───
 *
 * Перетаскивание предметов мышью и тачем (единые pointer-события):
 *   • предмет из сетки → слот экипировки    = надеть
 *   • надетый предмет   → зона инвентаря    = снять
 *
 * ПРОИЗВОДИТЕЛЬНОСТЬ (паттерн StaminaBar): позиция drag-ghost пишется
 * прямо в DOM через transform на pointermove — ни одного React-рендера
 * на кадр. Ре-рендер провоцируют только смены dragState (1× на драг) и
 * dropTarget (редко, при переходе между зонами).
 *
 * ТАЧ: перетаскивание стартует после лонг-пресса 250 мс (движение <10px
 * за это время), чтобы не конфликтовать со скроллом сетки; мышь — сразу
 * после порога 6px (клик-выбор не ломается).
 */

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ItemIcon } from '@/components/game/shared/ItemIcon';
import {
  INVENTORY_RARITY_BORDER_CLASS,
  INVENTORY_RARITY_TEXT_CLASS,
} from '@/components/game/inventory/inventoryConstants';
import { resolveInventoryItemView } from '@/engine/inventory/inventoryPresentation';
import type { EquipmentSlot, InventoryItem } from '@/shared/types/game';

/* Чистая логика (пороги, совместимость, поиск зоны) — в inventoryDndLogic.ts */
import {
  resolveDropTargetFromElement,
  isSlotDropCompatible,
  isHotbarDropCompatible,
  shouldStartMouseDrag,
  DRAG_TOUCH_DELAY_MS,
  DRAG_TOUCH_SLOP_PX,
  markDragEnded,
  setDndMirror,
  type DropTarget,
  type DragPayload,
} from '@/components/game/inventory/inventoryDndLogic';


/* ─── Drag state (вне React — подписка точечная) ─── */

export interface DndContextValue {
  dragPayload: DragPayload | null;
  dropTarget: DropTarget;
  /** Начать потенциальный драг предмета сетки (pointerdown на карточке). */
  beginItemPointerDown: (item: InventoryItem, e: ReactPointerEvent) => void;
  /** Начать потенциальный драг надетого предмета (pointerdown на слоте). */
  beginEquippedPointerDown: (
    slot: EquipmentSlot,
    item: InventoryItem,
    e: ReactPointerEvent,
  ) => void;
  /** Начать потенциальный драг предмета из слота хотбара (переупорядочивание). */
  beginHotbarPointerDown: (
    slotIndex: number,
    item: InventoryItem,
    e: ReactPointerEvent,
  ) => void;
}

const DndContext = createContext<DndContextValue | null>(null);

export function useInventoryDnd(): DndContextValue {
  const ctx = useContext(DndContext);
  if (!ctx) {
    return {
      dragPayload: null,
      dropTarget: null,
      beginItemPointerDown: () => undefined,
      beginEquippedPointerDown: () => undefined,
      beginHotbarPointerDown: () => undefined,
    };
  }
  return ctx;
}

interface ProviderProps {
  onEquipDrop: (item: InventoryItem) => void;
  onUnequipDrop: (slot: EquipmentSlot) => void;
  /** v4.7.5: дроп расходуемого в слот хотбара (index, itemId). */
  onHotbarDrop: (slotIndex: number, itemId: string) => void;
  /** v4.7.7: перенос предмета между слотами хотбара (from → to). */
  onHotbarReorder?: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
}

interface PendingDrag {
  payload: DragPayload;
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  isTouch: boolean;
  holdTimer: ReturnType<typeof setTimeout> | null;
}

export function InventoryDragProvider({
  onEquipDrop,
  onUnequipDrop,
  onHotbarDrop,
  onHotbarReorder,
  children,
}: ProviderProps) {
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const pendingRef = useRef<PendingDrag | null>(null);
  const activeRef = useRef(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dropTargetRef = useRef<DropTarget>(null);
  const payloadRef = useRef<DragPayload | null>(null);
  const cbRef = useRef({ onEquipDrop, onUnequipDrop, onHotbarDrop, onHotbarReorder });
  cbRef.current = { onEquipDrop, onUnequipDrop, onHotbarDrop, onHotbarReorder };

  const cancelPending = useCallback(() => {
    const p = pendingRef.current;
    if (p?.holdTimer) clearTimeout(p.holdTimer);
    pendingRef.current = null;
  }, []);

  const finishDrag = useCallback(() => {
    cancelPending();
    activeRef.current = false;
    markDragEnded();
    payloadRef.current = null;
    dropTargetRef.current = null;
    setDndMirror({ payload: null, target: null });
    setDragPayload(null);
    setDropTarget(null);
  }, [cancelPending]);

  const updateGhost = useCallback((x: number, y: number) => {
    const g = ghostRef.current;
    if (g) g.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const activateDrag = useCallback(
    (x: number, y: number) => {
      const p = pendingRef.current;
      if (!p || activeRef.current) return;
      activeRef.current = true;
      payloadRef.current = p.payload;
      setDragPayload(p.payload);
      setDndMirror({ payload: p.payload, target: null });
      updateGhost(x, y);
      if (p.holdTimer) {
        clearTimeout(p.holdTimer);
        p.holdTimer = null;
      }
      // Тач: захват продолжается и вне элемента-источника — иначе скролл
      // перехватит pointer. Для мыши setPointerCapture не нужен.
      if (p.isTouch && p.pointerId != null) {
        try {
          ghostRef.current?.setPointerCapture?.(p.pointerId);
        } catch {
          /* элемент мог быть размонтирован — драг продолжится по координатам */
        }
      }
    },
    [updateGhost],
  );

  /* Общий pointerdown — регистрируем потенциальный драг. */
  const registerPointerDown = useCallback(
    (
      payload: DragPayload,
      e: ReactPointerEvent,
    ) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (activeRef.current) return; // уже тащим
      const isTouch = e.pointerType === 'touch';
      const pending: PendingDrag = {
        payload,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startedAt: performance.now(),
        isTouch,
        holdTimer: null,
      };
      pendingRef.current = pending;
      if (isTouch) {
        // Лонг-пресс без сдвига — старт драга (иначе пусть скроллит сетку).
        pending.holdTimer = setTimeout(() => {
          const cur = pendingRef.current;
          if (cur === pending) activateDrag(cur.startX, cur.startY);
        }, DRAG_TOUCH_DELAY_MS);
      }
    },
    [activateDrag],
  );

  const beginItemPointerDown = useCallback(
    (item: InventoryItem, e: ReactPointerEvent) => {
      const view = resolveInventoryItemView(item);
      registerPointerDown(
        {
          item,
          label: view.displayName,
          icon: view.def?.icon,
          rarity: view.rarity,
          equipmentSlot: view.def?.equipmentSlot,
          // Категория для совместимости с хотбаром (только consumable).
          itemCategory: view.def?.category,
        },
        e,
      );
    },
    [registerPointerDown],
  );

  const beginEquippedPointerDown = useCallback(
    (slot: EquipmentSlot, item: InventoryItem, e: ReactPointerEvent) => {
      const view = resolveInventoryItemView(item);
      registerPointerDown(
        {
          fromSlot: slot,
          label: view.displayName,
          icon: view.def?.icon,
          rarity: view.rarity,
        },
        e,
      );
    },
    [registerPointerDown],
  );

  const beginHotbarPointerDown = useCallback(
    (slotIndex: number, item: InventoryItem, e: ReactPointerEvent) => {
      const view = resolveInventoryItemView(item);
      registerPointerDown(
        {
          fromHotbar: slotIndex,
          item,
          label: view.displayName,
          icon: view.def?.icon,
          rarity: view.rarity,
          itemCategory: view.def?.category,
        },
        e,
      );
    },
    [registerPointerDown],
  );

  /* Движение/отпускание — на window, чтобы работать за пределами карточки. */
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const p = pendingRef.current;
      if (!p) return;
      const dx = e.clientX - p.startX;
      const dy = e.clientY - p.startY;
      const moved = Math.hypot(dx, dy);

      if (!activeRef.current) {
        if (p.isTouch) {
          // Тач: сдвиг до истечения лонг-пресса = скролл, драг отменяется.
          if (moved > DRAG_TOUCH_SLOP_PX) cancelPending();
        } else if (shouldStartMouseDrag(moved)) {
          activateDrag(e.clientX, e.clientY);
        }
        if (!activeRef.current) return;
      }

      e.preventDefault();
      updateGhost(e.clientX, e.clientY);

      // Зона дропа — только на смену (без ре-рендеров на кадр).
      const el =
        e.pointerId != null
          ? document.elementFromPoint(e.clientX, e.clientY)
          : null;
      const target = resolveDropTargetFromElement(el);
      if (target?.kind !== dropTargetRef.current?.kind ||
          (target?.kind === 'slot' && dropTargetRef.current?.kind === 'slot' &&
            target.slot !== dropTargetRef.current.slot)) {
        dropTargetRef.current = target;
        setDndMirror({ payload: payloadRef.current, target });
        setDropTarget(target);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const p = pendingRef.current;
      if (!p && !activeRef.current) return;
      const payload = payloadRef.current;

      if (activeRef.current && payload) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const target = resolveDropTargetFromElement(el);
        if (payload.item && target?.kind === 'slot' &&
            isSlotDropCompatible(payload.equipmentSlot, target.slot)) {
          cbRef.current.onEquipDrop(payload.item);
        } else if (payload.fromHotbar !== undefined && target?.kind === 'hotbar' &&
            target.slot !== payload.fromHotbar) {
          // v4.7.7: перенос между слотами хотбара (drag-to-reorder).
          cbRef.current.onHotbarReorder?.(payload.fromHotbar, target.slot);
        } else if (payload.fromHotbar !== undefined && target?.kind === 'inventory') {
          // Убрать из хотбара — сброс в зону инвентаря (пустой itemId).
          cbRef.current.onHotbarDrop(payload.fromHotbar, '');
        } else if (payload.item && target?.kind === 'hotbar' &&
            isHotbarDropCompatible(payload.itemCategory)) {
          cbRef.current.onHotbarDrop(target.slot, payload.item.id);
        } else if (payload.fromSlot && target?.kind === 'inventory') {
          cbRef.current.onUnequipDrop(payload.fromSlot);
        }
        // Несовместимая цель — просто отмена (без тостов: rose-рамка
        // подсветки уже показала отказ во время наведения).
      }
      finishDrag();
    };

    const onPointerCancel = () => {
      if (pendingRef.current || activeRef.current) finishDrag();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };
  }, [activateDrag, cancelPending, finishDrag, updateGhost]);

  const ctxValue = useMemo(
    () => ({
      dragPayload,
      dropTarget,
      beginItemPointerDown,
      beginEquippedPointerDown,
      beginHotbarPointerDown,
    }),
    [dragPayload, dropTarget, beginItemPointerDown, beginEquippedPointerDown, beginHotbarPointerDown],
  );

  return (
    <DndContext.Provider value={ctxValue}>
      {children}
      <DragGhost payload={dragPayload} ghostRef={ghostRef} />
    </DndContext.Provider>
  );
}

/* ─── Ghost — призрак карточки под пальцем/курсором ─── */

interface GhostProps {
  payload: DragPayload | null;
  /** React 19: ref — обычный проп. */
  ghostRef: React.RefObject<HTMLDivElement | null>;
}

const DragGhost = memo(function DragGhost({ payload, ghostRef }: GhostProps) {
  if (!payload) return null;
  return (
    <div
      ref={ghostRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[80] will-change-transform"
      style={{ touchAction: 'none' }}
    >
      <div
        className={`
          inv-drag-ghost flex items-center gap-2 rounded-lg border px-3 py-2
          bg-slate-900/90 backdrop-blur-md shadow-2xl
          ${INVENTORY_RARITY_BORDER_CLASS[payload.rarity]}
        `}
        style={{
          transform: 'translate(14px, -50%) rotate(-2.5deg) scale(1.06)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 18px rgba(6,182,212,0.25)',
        }}
      >
        {payload.icon ? (
          <ItemIcon icon={payload.icon} className="size-5 text-slate-100" />
        ) : null}
        <span
          className={`text-xs font-medium whitespace-nowrap ${
            INVENTORY_RARITY_TEXT_CLASS[payload.rarity]
          }`}
        >
          {payload.label}
        </span>
      </div>
    </div>
  );
});
