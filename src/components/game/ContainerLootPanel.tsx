/* ─── Volodka RPG – Container Loot Panel ─── */
/* Gothic-style ransack: open a container, see its contents, take items
   individually or all at once. Locked containers require a key item. */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Package, X, Check } from 'lucide-react';
import { getItemDefinition } from '@/data/gameDataLoader';
import { createInventoryItem } from '@/data/items';
import { useGameStore } from '@/store/gameStore';
import { tryAddInventoryItem } from '@/shared/gameBridge/gameActionBridge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRarityColor, getRarityBg } from '@/data/items';
import { ItemIcon } from '@/components/game/shared/ItemIcon';
import type { ItemRarity } from '@/data/items';

interface ContainerLootPanelProps {
  open: boolean;
  contents: Array<{ itemId: string; quantity: number }>;
  lockedKeyId: string | undefined;
  lootedFlag: string | undefined;
  onClose: () => void;
  onTakeItem: (itemId: string, quantity: number) => void;
}

interface LootEntryView {
  itemId: string;
  quantity: number;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  questRelated: boolean;
}

function resolveLootEntry(itemId: string, quantity: number): LootEntryView | null {
  const def = getItemDefinition(itemId);
  if (!def) return null;
  return {
    itemId,
    quantity,
    name: def.name,
    description: def.description,
    icon: def.icon,
    rarity: def.rarity,
    questRelated: def.questRelated ?? false,
  };
}

export function ContainerLootPanel({
  open,
  contents,
  lockedKeyId,
  lootedFlag,
  onClose,
  onTakeItem,
}: ContainerLootPanelProps) {
  const playerInventory = useGameStore((s) => s.playerState.inventory);
  const flags = useGameStore((s) => s.playerState.flags);

  const hasKey = useMemo(() => {
    if (!lockedKeyId) return true;
    return playerInventory.some((item) => item.id === lockedKeyId);
  }, [lockedKeyId, playerInventory]);

  const alreadyLooted = useMemo(() => {
    if (!lootedFlag) return false;
    return flags[lootedFlag] === true;
  }, [lootedFlag, flags]);

  const entries = useMemo(
    () =>
      contents
        .map((entry) => resolveLootEntry(entry.itemId, entry.quantity))
        .filter((entry): entry is LootEntryView => entry !== null),
    [contents],
  );

  const isEmpty = entries.length === 0;

  const handleTakeOne = (itemId: string) => {
    const def = getItemDefinition(itemId);
    if (!def) return;
    tryAddInventoryItem(createInventoryItem(itemId, 1));
    onTakeItem(itemId, 1);
  };

  const handleTakeAll = () => {
    for (const entry of entries) {
      const def = getItemDefinition(entry.itemId);
      if (!def) continue;
      tryAddInventoryItem(createInventoryItem(entry.itemId, entry.quantity));
      onTakeItem(entry.itemId, entry.quantity);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md mx-4 rounded-xl border border-slate-700/50 bg-slate-900/95 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                {lockedKeyId && !hasKey ? (
                  <Lock className="size-4 text-amber-400" />
                ) : (
                  <Package className="size-4 text-cyan-400" />
                )}
                <span className="text-sm font-medium text-slate-200">
                  {lockedKeyId && !hasKey ? 'Заперто' : alreadyLooted ? 'Пустой контейнер' : 'Содержимое'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {lockedKeyId && !hasKey ? (
                <div className="text-center py-8">
                  <Lock className="size-8 text-amber-400/60 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    Контейнер заперт. Нужен ключ.
                  </p>
                </div>
              ) : isEmpty ? (
                <div className="text-center py-8">
                  <Package className="size-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Пусто.</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-72">
                    <div className="flex flex-col gap-2 pr-2">
                      {entries.map((entry) => (
                        <div
                          key={entry.itemId}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:bg-slate-800/80 transition-colors"
                        >
                          <div
                            className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${getRarityBg(entry.rarity)}`}
                          >
                            <ItemIcon icon={entry.icon} className="size-5 text-slate-100" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${getRarityColor(entry.rarity)}`}>
                                {entry.name}
                              </span>
                              {entry.quantity > 1 && (
                                <Badge variant="outline" className="text-[10px] text-slate-400">
                                  ×{entry.quantity}
                                </Badge>
                              )}
                              {entry.questRelated && (
                                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-700/50">
                                  Сюжетный
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{entry.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 h-7 px-2 shrink-0"
                            onClick={() => handleTakeOne(entry.itemId)}
                          >
                            <Check className="size-3 mr-1" />
                            Взять
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Footer with Take All */}
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-700/30">
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs h-8"
                      onClick={handleTakeAll}
                    >
                      Забрать всё
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
