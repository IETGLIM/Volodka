
/* ─── Volodka RPG – Quick Use Bar (Assignabie Hotbar) ─── */
/* Bottom-center bar with 4 assignable consumable slots.
 * Right-click or long-press to assign items from inventory.
 * Keyboard shortcuts 1-4 to use. Persists via save system. */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemIcon } from './shared/ItemIcon';
import { useConsumableActions, useGameMode, useInventory } from '@/store/selectors';
import { usePlayerLevel } from '@/store/selectors/playerSelectors';
import { useCollectedPoems } from '@/store/selectors/worldSelectors';
import { useHotbarSlots, useSetHotbarSlot } from '@/store/selectors/uiSelectors';
import { countCollectedMainPoems } from '@/data/poemCollectionMeta';
import { getItemDefinition } from '@/data/items';
import type { ItemDefinition } from '@/data/items';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { bottomQuickUsePx } from '@/shared/constants/hudLayout';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';

/* ─── Constants ─── */

const SLOT_COUNT = 4;
const COOLDOWN_MS = 300;
const LONG_PRESS_MS = 500;

/* ─── Context Menu for assigning items ─── */

interface AssignMenuProps {
  slotIndex: number;
  onClose: () => void;
  onAssign: (itemId: string) => void;
  onClear: () => void;
  consumables: Array<{ id: string; name: string; icon?: string; quantity: number }>;
  currentItemId: string | null;
}

function AssignMenu({ slotIndex, onClose, onAssign, onClear, consumables, currentItemId }: AssignMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const filteredConsumables = consumables.filter((c) => c.id !== currentItemId);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 min-w-[180px] max-w-[220px] rounded-lg border border-slate-700/50 shadow-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 12, 24, 0.95)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="px-3 py-2 border-b border-slate-700/30">
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Слот {slotIndex + 1} — Назначить
        </p>
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {filteredConsumables.length === 0 ? (
          <div className="px-3 py-3 text-[11px] font-mono text-slate-600 text-center">
            Нет расходуемых
          </div>
        ) : (
          filteredConsumables.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-cyan-950/30 transition-colors"
              onClick={() => { onAssign(c.id); onClose(); }}
            >
              <ItemIcon icon={c.icon} className="size-3.5 text-slate-300 shrink-0" />
              <span className="text-[11px] font-mono text-slate-300 truncate flex-1">{c.name}</span>
              {c.quantity > 1 && (
                <span className="text-[10px] font-mono text-slate-500">×{c.quantity}</span>
              )}
            </button>
          ))
        )}
      </div>
      {currentItemId && (
        <button
          type="button"
          className="w-full px-3 py-1.5 text-left border-t border-slate-700/30 hover:bg-rose-950/30 transition-colors"
          onClick={() => { onClear(); onClose(); }}
        >
          <span className="text-[11px] font-mono text-rose-400">Убрать из слота</span>
        </button>
      )}
    </motion.div>
  );
}

/* ─── Toast notification for item use ─── */

function UseToast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="px-3 py-1.5 rounded-md text-[11px] font-mono whitespace-nowrap pointer-events-none"
      style={{
        background: 'rgba(8, 12, 18, 0.9)',
        border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
        color: 'var(--cyber-cyan)',
        boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {text}
    </motion.div>
  );
}

/* ─── Main Component ─── */

export function QuickUseBar() {
  const quietStyle = useHudQuietStyle();
  const bottomHudVisible = useExplorationBottomHudVisible();
  const mode = useGameMode();
  const inventory = useInventory();
  const { addEnergy, addStress, addKarma, addSkill, removeItem } = useConsumableActions();
  const hotbarSlots = useHotbarSlots();
  const setHotbarSlot = useSetHotbarSlot();

  /* ── Cooldown state per slot ── */
  const [cooldownSlots, setCooldownSlots] = useState<Set<number>>(new Set());

  /* ── Toast state ── */
  const [toast, setToast] = useState<string | null>(null);

  /* ── Flash state per slot ── */
  const [flashSlots, setFlashSlots] = useState<Set<number>>(new Set());

  /* ── Assign menu state ── */
  const [assignMenuSlot, setAssignMenuSlot] = useState<number | null>(null);

  /* ── Long press tracking ── */
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Build consumable list for assign menu ── */
  const consumableItems = useMemo(() => {
    return inventory
      .filter((item) => item.category === 'consumable')
      .map((item) => {
        const def = getItemDefinition(item.id);
        return {
          id: item.id,
          name: item.name,
          icon: def?.icon,
          quantity: item.quantity,
        };
      });
  }, [inventory]);

  /* ── Resolve hotbar slot contents from inventory ── */
  const resolvedSlots = useMemo(() => {
    return hotbarSlots.map((itemId) => {
      if (!itemId) return { item: null, def: undefined as ItemDefinition | undefined };
      const invItem = inventory.find((i) => i.id === itemId);
      if (!invItem) return { item: null, def: undefined as ItemDefinition | undefined };
      const def = getItemDefinition(invItem.id);
      return { item: invItem, def };
    });
  }, [hotbarSlots, inventory]);

  /* ── Auto-fill empty slots with first available consumables (only when all slots are empty) ── */
  useEffect(() => {
    const allEmpty = hotbarSlots.every((s) => s === null);
    if (!allEmpty) return;

    const autoFill = consumableItems.slice(0, SLOT_COUNT);
    if (autoFill.length === 0) return;

    for (let i = 0; i < autoFill.length; i++) {
      setHotbarSlot(i, autoFill[i].id);
    }
  }, [consumableItems, hotbarSlots, setHotbarSlot]);

  /* ── Clean up hotbar slots when items are removed from inventory ── */
  useEffect(() => {
    const inventoryIds = new Set<string>(inventory.map((i) => i.id as string));
    let changed = false;
    const newSlots = [...hotbarSlots] as [string | null, string | null, string | null, string | null];
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (newSlots[i] && !inventoryIds.has(newSlots[i]!)) {
        newSlots[i] = null;
        changed = true;
      }
    }
    if (changed) {
      // Update each changed slot
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (hotbarSlots[i] !== newSlots[i]) {
          setHotbarSlot(i, newSlots[i]);
        }
      }
    }
  }, [inventory, hotbarSlots, setHotbarSlot]);

  /* ── Use item at slot index ── */
  const handleUseItemAtSlot = useCallback(
    (slotIndex: number) => {
      if (cooldownSlots.has(slotIndex)) return;

      const slot = resolvedSlots[slotIndex];
      if (!slot?.item || !slot.def) return;

      const { item, def } = slot;

      // Apply effects
      for (const effect of def.effects) {
        if (effect.stat === 'energy') addEnergy(effect.value);
        else if (effect.stat === 'stress') addStress(effect.value);
        else if (effect.stat === 'karma') addKarma(effect.value);
        else if (effect.skill) addSkill(effect.skill, effect.value);
      }

      // Remove 1 quantity (consumable)
      removeItem(item.id, 1);

      // Build effect text for toast
      const effectText = def.effects
        .map((e) => {
          if (e.stat === 'energy') return `Энергия ${e.value > 0 ? '+' : ''}${e.value}`;
          if (e.stat === 'stress') return `Стресс ${e.value > 0 ? '+' : ''}${e.value}`;
          if (e.stat === 'karma') return `Карма ${e.value > 0 ? '+' : ''}${e.value}`;
          if (e.skill) return `${e.skill} +${e.value}`;
          return '';
        })
        .filter(Boolean)
        .join(', ');

      // Emit sound feedback
      eventBus.emit('sound:play', { type: 'item_use' });

      // Show toast
      setToast(`${item.name}: ${effectText || 'Использовано'}`);

      // Flash animation
      setFlashSlots((prev) => {
        const next = new Set(prev);
        next.add(slotIndex);
        return next;
      });

      // Cooldown
      setCooldownSlots((prev) => {
        const next = new Set(prev);
        next.add(slotIndex);
        return next;
      });

      setTimeout(() => {
        setFlashSlots((prev) => {
          const next = new Set(prev);
          next.delete(slotIndex);
          return next;
        });
      }, COOLDOWN_MS);

      setTimeout(() => {
        setCooldownSlots((prev) => {
          const next = new Set(prev);
          next.delete(slotIndex);
          return next;
        });
      }, COOLDOWN_MS);
    },
    [resolvedSlots, cooldownSlots, addEnergy, addStress, addKarma, addSkill, removeItem],
  );

  /* ── Keyboard shortcuts (1-4) ── */
  useEffect(() => {
    if (mode !== 'exploration') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= SLOT_COUNT) {
        e.preventDefault();
        handleUseItemAtSlot(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleUseItemAtSlot]);

  /* ── Long-press / right-click handlers ── */
  const handleSlotContextMenu = useCallback((e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault();
    setAssignMenuSlot(slotIndex);
  }, []);

  const handleSlotPointerDown = useCallback((slotIndex: number) => {
    longPressTimerRef.current = setTimeout(() => {
      setAssignMenuSlot(slotIndex);
    }, LONG_PRESS_MS);
  }, []);

  const handleSlotPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleSlotPointerLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /* ── Onboarding gate ── */
  const level = usePlayerLevel();
  const collectedPoems = useCollectedPoems();
  const mainPoemCount = countCollectedMainPoems(collectedPoems);
  const isOnboarding = level <= 1 && mainPoemCount <= 1;

  if (mode !== 'exploration' || !bottomHudVisible || isOnboarding) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="quick-use-bar"
        data-exploration-ui
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{ zIndex: UI_LAYERS.HUD, bottom: bottomQuickUsePx(), ...quietStyle }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Bar container */}
        <div className="quick-use-bar relative">
          {/* Neon border glow breathing */}
          <motion.div
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.06), inset 0 0 3px rgb(var(--cyber-cyan-rgb) / 0.02)',
                '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.12), inset 0 0 6px rgb(var(--cyber-cyan-rgb) / 0.04)',
                '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.06), inset 0 0 3px rgb(var(--cyber-cyan-rgb) / 0.02)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Slots */}
          {resolvedSlots.map((slot, i) => {
            const hasItem = !!slot.item;
            const isFlashing = flashSlots.has(i);
            const isOnCooldown = cooldownSlots.has(i);
            const isDimmed = !hasItem || isOnCooldown;

            return (
              <div key={`slot-${i}`} className="relative">
                <button
                  className={`quick-use-slot ${isFlashing ? 'quick-use-flash' : ''} ${isDimmed ? 'opacity-40' : ''}`}
                  onClick={() => {
                    if (hasItem) handleUseItemAtSlot(i);
                  }}
                  onContextMenu={(e) => handleSlotContextMenu(e, i)}
                  onPointerDown={() => handleSlotPointerDown(i)}
                  onPointerUp={handleSlotPointerUp}
                  onPointerLeave={handleSlotPointerLeave}
                  disabled={isOnCooldown}
                  aria-label={
                    hasItem
                      ? `Использовать ${slot.item!.name} [${i + 1}] (ПКМ — назначить)`
                      : `Пустой слот ${i + 1} (ПКМ — назначить)`
                  }
                  title={
                    hasItem
                      ? `${slot.item!.name} [${i + 1}] — ПКМ для назначения`
                      : `Слот ${i + 1} — ПКМ для назначения`
                  }
                  style={
                    isFlashing
                      ? {
                          borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
                          background: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
                          boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)',
                          transform: 'scale(1.08)',
                        }
                      : !hasItem
                        ? {
                            borderStyle: 'dashed',
                            borderColor: 'rgba(100, 116, 139, 0.25)',
                          }
                        : undefined
                  }
                >
                  {/* Slot number */}
                  <span className="quick-use-slot-number">{i + 1}</span>

                  {hasItem ? (
                    <>
                      {/* Item icon */}
                      <ItemIcon
                        icon={slot.def?.icon}
                        className="size-5 text-slate-200"
                      />

                      {/* Quantity badge */}
                      {slot.item!.quantity > 1 && (
                        <span
                          className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold leading-none px-1 py-px rounded-sm"
                          style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            color: '#94a3b8',
                            border: '1px solid rgba(100, 116, 139, 0.2)',
                          }}
                        >
                          {slot.item!.quantity}
                        </span>
                      )}
                    </>
                  ) : null}
                </button>

                {/* Assign menu */}
                <AnimatePresence>
                  {assignMenuSlot === i && (
                    <AssignMenu
                      slotIndex={i}
                      onClose={() => setAssignMenuSlot(null)}
                      onAssign={(itemId) => setHotbarSlot(i, itemId)}
                      onClear={() => setHotbarSlot(i, null)}
                      consumables={consumableItems}
                      currentItemId={hotbarSlots[i]}
                    />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <UseToast text={toast} onDone={() => setToast(null)} />
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
