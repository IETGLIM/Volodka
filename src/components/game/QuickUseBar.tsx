
/* ─── Volodka RPG – Quick Use Bar ─── */
/* Bottom-center bar showing consumable items for quick access.
 * Visible only during exploration mode. Keyboard shortcuts 1-4. */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemIcon } from './shared/ItemIcon';
import { useConsumableActions, useGameMode, useInventory } from '@/store/selectors';
import { getItemDefinition } from '@/data/items';
import type { ItemDefinition } from '@/data/items';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomQuickUsePx } from '@/shared/constants/hudLayout';

/* ─── Constants ─── */

const SLOT_COUNT = 4;
const COOLDOWN_MS = 300;



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
  const mode = useGameMode();
  const inventory = useInventory();
  const { addEnergy, addStress, addKarma, addSkill, removeItem } = useConsumableActions();

  /* ── Cooldown state per slot ── */
  const [cooldownSlots, setCooldownSlots] = useState<Set<number>>(new Set());

  /* ── Toast state ── */
  const [toast, setToast] = useState<string | null>(null);

  /* ── Flash state per slot (slot index → true while flashing) ── */
  const [flashSlots, setFlashSlots] = useState<Set<number>>(new Set());

  /* ── Derive consumable items from inventory ── */
  const consumables = useMemo(() => {
    return inventory
      .filter((item) => item.category === 'consumable')
      .slice(0, SLOT_COUNT);
  }, [inventory]);

  /* ── Build slots array (filled + empty) ── */
  const slots = useMemo(() => {
    const result: Array<{
      item: typeof inventory[number] | null;
      def: ItemDefinition | undefined;
    }> = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const item = consumables[i] ?? null;
      const def = item ? getItemDefinition(item.id) : undefined;
      result.push({ item, def });
    }
    return result;
  }, [consumables]);

  /* ── Use item at slot index ── */
  const handleUseItemAtSlot = useCallback(
    (slotIndex: number) => {
      // Ignore if cooldown active
      if (cooldownSlots.has(slotIndex)) return;

      const slot = slots[slotIndex];
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
    [slots, cooldownSlots, addEnergy, addStress, addKarma, addSkill, removeItem],
  );

  /* ── Keyboard shortcuts (1-4) ── */
  useEffect(() => {
    if (mode !== 'exploration') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
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

  /* ── Don't render if not in exploration ── */
  if (mode !== 'exploration') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="quick-use-bar"
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{ zIndex: UI_LAYERS.HUD, bottom: bottomQuickUsePx() }}
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
          {slots.map((slot, i) => {
            const hasItem = !!slot.item;
            const isFlashing = flashSlots.has(i);
            const isOnCooldown = cooldownSlots.has(i);

            return (
              <button
                key={`slot-${i}`}
                className={`quick-use-slot ${isFlashing ? 'quick-use-flash' : ''}`}
                onClick={() => handleUseItemAtSlot(i)}
                disabled={isOnCooldown || !hasItem}
                aria-label={
                  hasItem
                    ? `Использовать ${slot.item!.name} [${i + 1}]`
                    : `Пустой слот ${i + 1}`
                }
                title={
                  hasItem
                    ? `${slot.item!.name} [${i + 1}]`
                    : `Слот ${i + 1}`
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
