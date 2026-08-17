/* ─── Volodka RPG – Quick Inventory Bar (HUD) ───
 * Horizontal bar at the bottom-center showing the first 5 items
 * from the player's inventory. Clicking a consumable triggers its use.
 * Styled with cyberpunk glass-morphism + neon border.
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemIcon } from '@/components/game/shared/ItemIcon';
import { useInventory, useConsumableActions, useGameMode } from '@/store/selectors';
import { usePlayerLevel } from '@/store/selectors/playerSelectors';
import { useCollectedPoems } from '@/store/selectors/worldSelectors';
import { getItemDefinition } from '@/data/items';
import { countCollectedMainPoems } from '@/data/poemCollectionMeta';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { useGameplayPresentationProfile, isExplorationHudProfile } from '@/hooks/useGameplayPresentationProfile';
import { playSfx } from '@/engine/audio/interactionSfx';

const SLOT_COUNT = 5;
const COOLDOWN_MS = 300;

/* ─── Slot Component ─── */

function InventorySlot({
  name,
  icon,
  quantity,
  stackable,
  consumable,
  onClick,
  flash,
  disabled,
}: {
  name: string;
  icon?: string;
  quantity: number;
  stackable: boolean;
  consumable: boolean;
  onClick: () => void;
  flash: boolean;
  disabled: boolean;
}) {
  const abbreviated = name.length > 10 ? name.slice(0, 9) + '…' : name;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={consumable ? `Использовать ${name}` : `${name} — ${quantity} шт.`}
      title={name}
      className={`
        cyber-focus-ring
        relative flex flex-col items-center justify-center gap-0.5
        w-12 h-14 rounded-md
        transition-all duration-200
        ${flash ? 'scale-105' : 'hover:scale-105'}
        ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
      `}
      style={
        flash
          ? {
              borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
              background: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
              boxShadow: '0 0 14px rgb(var(--cyber-cyan-rgb) / 0.25)',
              border: '1px solid',
            }
          : {
              background: 'rgba(8, 12, 24, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)',
              boxShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.05)',
            }
      }
    >
      {/* Item icon */}
      <ItemIcon icon={icon} className="size-4 text-slate-300" />

      {/* Abbreviated name */}
      <span className="text-[8px] font-mono text-slate-400 leading-tight text-center truncate w-full px-0.5">
        {abbreviated}
      </span>

      {/* Quantity badge */}
      {stackable && quantity > 1 && (
        <span
          className="absolute -top-1 -right-1 text-[7px] font-mono font-bold leading-none
                     px-1 py-px rounded-sm"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#94a3b8',
            border: '1px solid rgba(100, 116, 139, 0.2)',
          }}
        >
          {quantity}
        </span>
      )}

      {/* Consumable indicator (small dot) */}
      {consumable && (
        <span
          className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full"
          style={{
            background: 'rgb(var(--cyber-green-rgb) / 0.6)',
            boxShadow: '0 0 4px rgb(var(--cyber-green-rgb) / 0.3)',
          }}
        />
      )}
    </button>
  );
}

/* ─── Use Toast ─── */

function UseToast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
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

export function QuickInventoryBar() {
  const profile = useGameplayPresentationProfile();
  const explorationActive = isExplorationHudProfile(profile);
  const quietStyle = useHudQuietStyle();
  const bottomHudVisible = useExplorationBottomHudVisible();
  const mode = useGameMode();
  const inventory = useInventory();
  const { addEnergy, addStress, addKarma, addSkill, removeItem } = useConsumableActions();

  const [flashSlots, setFlashSlots] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  /* ── Onboarding gate (matches QuickUseBar logic) ── */
  const level = usePlayerLevel();
  const collectedPoems = useCollectedPoems();
  const mainPoemCount = countCollectedMainPoems(collectedPoems);
  const isOnboarding = level <= 1 && mainPoemCount <= 1;

  /* ── Derive first 5 items ── */
  const slots = useMemo(() => {
    return inventory.slice(0, SLOT_COUNT).map((item) => {
      const def = getItemDefinition(item.id);
      return {
        item,
        def,
        isConsumable: def?.category === 'consumable',
      };
    });
  }, [inventory]);

  /* ── Use item handler ── */
  const handleUseItem = useCallback(
    (slotIndex: number) => {
      const slot = slots[slotIndex];
      if (!slot || !slot.isConsumable || !slot.def) return;

      const { item, def } = slot;

      // Apply effects
      for (const effect of def.effects) {
        if (effect.stat === 'energy') addEnergy(effect.value);
        else if (effect.stat === 'stress') addStress(effect.value);
        else if (effect.stat === 'karma') addKarma(effect.value);
        else if (effect.skill) addSkill(effect.skill, effect.value);
      }

      removeItem(item.id, 1);
      playSfx('pickup');

      setToast(def.useMessage ?? `${item.name}: использовано`);
      setFlashSlots((prev) => {
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
    },
    [slots, addEnergy, addStress, addKarma, addSkill, removeItem],
  );

  /* ── Visibility gate ── */
  if (mode !== 'exploration' || !bottomHudVisible || !explorationActive || isOnboarding) {
    return null;
  }

  /* Don't render if inventory is empty */
  if (inventory.length === 0) return null;

  return (
    <motion.div
      data-exploration-ui
      className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
      style={{ zIndex: UI_LAYERS.HUD, bottom: 190, ...quietStyle }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Neon border glow breathing */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.04), inset 0 0 2px rgb(var(--cyber-cyan-rgb) / 0.01)',
            '0 0 10px rgb(var(--cyber-cyan-rgb) / 0.1), inset 0 0 4px rgb(var(--cyber-cyan-rgb) / 0.03)',
            '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.04), inset 0 0 2px rgb(var(--cyber-cyan-rgb) / 0.01)',
          ],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bar container */}
      <div
        className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
        style={{
          background: 'rgba(8, 12, 24, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.12)',
        }}
      >
        {/* Label */}
        <span
          className="text-[8px] font-mono tracking-wider text-cyan-500/40 mr-1 select-none"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          INV
        </span>

        {/* Item slots */}
        {slots.map((slot, i) => (
          <InventorySlot
            key={slot.item.id}
            name={slot.item.name}
            icon={slot.def?.icon}
            quantity={slot.item.quantity}
            stackable={slot.item.stackable}
            consumable={slot.isConsumable}
            onClick={() => handleUseItem(i)}
            flash={flashSlots.has(i)}
            disabled={!slot.isConsumable}
          />
        ))}

        {/* Fill empty slots to maintain width */}
        {Array.from({ length: Math.max(0, SLOT_COUNT - slots.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-12 h-14 rounded-md border border-dashed border-slate-700/30"
          />
        ))}
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
  );
}