
/* ─── Volodka RPG – Trading Panel ───
 * Barter/trading system where players can buy and sell items with NPCs.
 * Two-panel layout with NPC inventory (left) and Player inventory (right).
 * Cyberpunk terminal-style design matching other panels.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  ArrowLeftRight,
  Coins,
  Lock,
  Check,
  AlertCircle,
  Package,
} from 'lucide-react';
import { ItemIcon } from './shared/ItemIcon';
import { useTradingPanelState } from '@/store/selectors';
import { findNpcById } from '@/data/allNpcDefinitions';
import {
  getItemDefinition,
  getRarityColor,
  getRarityBg,
  getRarityLabel,
} from '@/data/items';
import {
  MERCHANT_INVENTORIES,
  getMerchantInventory,
  getBuyPrice,
  getSellPrice,
  getBasePriceByRarity,
  isSellItemAccessible,
  merchantBuysItem,
  CURRENCY_SYMBOL,
} from '@/data/tradingData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PanelWrapper } from '@/components/game/PanelWrapper';



/* ─── Trade tab type ─── */
type TradeTab = 'buy' | 'sell';

/* ─── Transaction animation state ─── */
interface TransactionAnim {
  itemId: string;
  type: 'buy' | 'sell';
  timestamp: number;
}

/* ─── Props ─── */
interface TradingPanelProps {
  open: boolean;
  onClose: () => void;
  /** If provided, auto-select this merchant. Otherwise show merchant selector. */
  initialNpcId?: string;
}

/* ══════════════════════════════════════════════════════════════
   Main Panel component
   ══════════════════════════════════════════════════════════════ */

export function TradingPanel({ open, onClose, initialNpcId }: TradingPanelProps) {
  const {
    credits,
    inventory,
    npcRelations,
    buyItem,
    sellItem,
    canBuyItem,
    canSellItem,
  } = useTradingPanelState();

  const [activeTab, setActiveTab] = useState<TradeTab>('buy');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [transactionAnim, setTransactionAnim] = useState<TransactionAnim | null>(null);

  // Initialize selected NPC
  const effectiveNpcId = initialNpcId ?? (MERCHANT_INVENTORIES.length > 0 ? MERCHANT_INVENTORIES[0].npcId : null);
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(effectiveNpcId);

  // Wrapper to change tab and reset selection
  const handleTabChange = useCallback((tab: TradeTab) => {
    setActiveTab(tab);
    setSelectedItemId(null);
  }, []);

  // Wrapper to change NPC and reset selection
  const handleNpcChange = useCallback((npcId: string) => {
    setSelectedNpcId(npcId);
    setSelectedItemId(null);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Get current merchant data
  const merchant = useMemo(
    () => (selectedNpcId ? getMerchantInventory(selectedNpcId) : undefined),
    [selectedNpcId],
  );

  const relationValue = useMemo(() => {
    const rel = npcRelations.find((r) => r.npcId === selectedNpcId);
    return rel?.value ?? 50;
  }, [npcRelations, selectedNpcId]);

  const _npcDef = useMemo(
    () => (selectedNpcId ? findNpcById(selectedNpcId) : undefined),
    [selectedNpcId],
  );

  // Buy items list with computed prices
  const buyItems = useMemo(() => {
    if (!merchant) return [];
    return merchant.sells
      .filter((entry) => isSellItemAccessible(merchant, entry.itemId, relationValue))
      .map((entry) => {
        const def = getItemDefinition(entry.itemId);
        if (!def) return null;
        const price = getBuyPrice(merchant, entry.itemId, relationValue);
        const canAfford = credits >= price;
        const hasSpace = canBuyItem(selectedNpcId!, entry.itemId);
        return {
          ...entry,
          name: def.name,
          description: def.description,
          icon: def.icon,
          rarity: def.rarity,
          stackable: def.stackable,
          price,
          canAfford,
          hasSpace,
          locked: entry.minRelation ? relationValue < entry.minRelation : false,
        };
      })
      .filter(Boolean);
  }, [merchant, relationValue, credits, canBuyItem, selectedNpcId]);

  // Sell items — player inventory filtered by what the NPC buys
  const sellItems = useMemo(() => {
    if (!merchant) return [];
    return inventory
      .filter((item) => {
        // Can't sell quest items
        const def = getItemDefinition(item.id);
        if (def?.questRelated) return false;
        return merchantBuysItem(selectedNpcId!, item.id, relationValue);
      })
      .map((invItem) => {
        const def = getItemDefinition(invItem.id);
        const basePrice = def ? getBasePriceByRarity(def.rarity) : 5;
        const merchantSellEntry = merchant.sells.find((s) => s.itemId === invItem.id);
        const effectiveBasePrice = merchantSellEntry?.basePrice ?? basePrice;
        const price = getSellPrice(merchant, invItem.id, effectiveBasePrice, relationValue);
        return {
          id: invItem.id,
          name: invItem.name,
          description: invItem.description,
          icon: invItem.icon,
          rarity: def?.rarity ?? 'common' as const,
          quantity: invItem.quantity,
          stackable: invItem.stackable,
          price,
          canSell: canSellItem(selectedNpcId!, invItem.id),
        };
      });
  }, [merchant, inventory, relationValue, canSellItem, selectedNpcId]);

  // Handle buy
  const handleBuy = useCallback((itemId: string) => {
    if (!selectedNpcId) return;
    buyItem(selectedNpcId, itemId);
    setTransactionAnim({ itemId, type: 'buy', timestamp: Date.now() });
    setTimeout(() => setTransactionAnim(null), 600);
  }, [selectedNpcId, buyItem]);

  // Handle sell
  const handleSell = useCallback((itemId: string) => {
    if (!selectedNpcId) return;
    sellItem(selectedNpcId, itemId);
    setTransactionAnim({ itemId, type: 'sell', timestamp: Date.now() });
    setTimeout(() => setTransactionAnim(null), 600);
  }, [selectedNpcId, sellItem]);

  // Discount indicator
  const discountPercent = merchant
    ? Math.round((relationValue / 100) * merchant.maxRelationDiscount * 100)
    : 0;

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Торговля"
      urlPath="volodka://trade"
      accentColor="cyan"
      layout="sidebar"
      icon={<ShoppingCart className="size-5 text-cyan-400" />}
      shortcutLabel="Esc"
      headerExtra={(
        <div className="flex items-center gap-3">
          {/* Credits display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-950/20">
            <Coins className="size-3.5 text-amber-400" />
            <span className="text-sm font-mono font-semibold text-amber-300">
              {credits}{CURRENCY_SYMBOL}
            </span>
          </div>
        </div>
      )}
      footer={(
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Баланс: {credits}{CURRENCY_SYMBOL}</span>
          <div className="flex items-center gap-3">
            {merchant && (
              <span className="flex items-center gap-1">
                <span className={`size-1.5 rounded-full ${relationValue >= 65 ? 'bg-emerald-500' : relationValue <= 30 ? 'bg-red-500' : 'bg-amber-500'}`} />
                Отношение: {relationValue}
              </span>
            )}
            <span className="text-slate-600 font-mono">volodka://trade</span>
          </div>
        </div>
      )}
    >
      <div className="scanline-overlay flex flex-col h-full" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {/* Merchant selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar px-4 pt-3">
          {MERCHANT_INVENTORIES.map((m) => {
            const npc = findNpcById(m.npcId);
            const isSelected = selectedNpcId === m.npcId;
            const rel = npcRelations.find((r) => r.npcId === m.npcId);
            const relVal = rel?.value ?? 50;
            return (
              <button
                key={m.npcId}
                onClick={() => handleNpcChange(m.npcId)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg border whitespace-nowrap text-xs transition-all shrink-0
                  ${isSelected
                    ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
                    : 'border-slate-700/30 bg-slate-900/30 text-slate-400 hover:border-slate-600/40 hover:text-slate-300'
                  }
                `}
              >
                <span>{npc?.name ?? m.npcName}</span>
                {relVal >= 65 && <span className="text-emerald-400 text-[10px]">♥</span>}
                {relVal <= 30 && <span className="text-red-400 text-[10px]">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Merchant info bar */}
        {merchant && (
          <div className="flex items-center justify-between mt-2 px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 italic">&ldquo;{merchant.greeting}&rdquo;</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-950/20">
                <span className="text-[10px] text-emerald-400">Скидка: -{discountPercent}%</span>
              </div>
            )}
          </div>
        )}

        {/* Buy/Sell tabs */}
        <div className="flex border-b border-cyan-900/15">
          <button
            onClick={() => handleTabChange('buy')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all
              ${activeTab === 'buy'
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-950/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'
              }
            `}
          >
            <ShoppingCart className="size-4" />
            Купить
          </button>
          <button
            onClick={() => handleTabChange('sell')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all
              ${activeTab === 'sell'
                ? 'text-amber-300 border-b-2 border-amber-400 bg-amber-950/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'
              }
            `}
          >
            <ArrowLeftRight className="size-4" />
            Продать
          </button>
        </div>

        {/* Content area */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'buy' ? (
                <motion.div
                  key="buy"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {buyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="size-10 text-slate-700/50 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Нет доступных товаров</p>
                      <p className="text-slate-600 text-xs mt-1">Улучшите отношения с торговцем</p>
                    </div>
                  ) : (
                    <div className="grid gap-2.5">
                      {buyItems.map((item, i) => {
                        if (!item) return null;
                        const isItemSelected = selectedItemId === item.itemId;
                        const isAnimating = transactionAnim?.itemId === item.itemId && transactionAnim.type === 'buy';

                        return (
                          <motion.div
                            key={item.itemId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            onClick={() => setSelectedItemId(item.itemId)}
                            className={`
                              rounded-xl border p-3 cursor-pointer transition-all
                              ${isItemSelected
                                ? 'border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb) / 0.1)]'
                                : 'border-slate-700/25 bg-slate-900/30 hover:border-slate-600/35 hover:bg-slate-800/30'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              {/* Item icon */}
                              <div className={`
                                w-10 h-10 rounded-lg border flex items-center justify-center shrink-0
                                ${getRarityBg(item.rarity)}
                              `}>
                                <ItemIcon icon={item.icon} className={`size-5 ${getRarityColor(item.rarity).split(' ')[0]}`} />
                              </div>

                              {/* Item info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-sm font-medium ${getRarityColor(item.rarity).split(' ')[0]}`}>
                                    {item.name}
                                  </span>
                                  {item.locked && (
                                    <Lock className="size-3 text-red-400/60" />
                                  )}
                                  <span className="text-[10px] text-slate-500">
                                    {getRarityLabel(item.rarity)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400/70 leading-relaxed line-clamp-2 mb-1.5">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Coins className="size-3 text-amber-400/70" />
                                    <span className={`text-xs font-mono font-semibold ${item.canAfford ? 'text-amber-300' : 'text-red-400'}`}>
                                      {item.price}{CURRENCY_SYMBOL}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={item.canAfford && item.hasSpace ? 'default' : 'ghost'}
                                    disabled={!item.canAfford || !item.hasSpace}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBuy(item.itemId);
                                    }}
                                    className={`
                                      h-7 px-3 text-xs font-medium gap-1
                                      ${item.canAfford && item.hasSpace
                                        ? 'bg-cyan-600/80 hover:bg-cyan-500/80 text-white'
                                        : 'text-slate-500'
                                      }
                                    `}
                                  >
                                    {isAnimating ? (
                                      <Check className="size-3" />
                                    ) : !item.canAfford ? (
                                      <>
                                        <AlertCircle className="size-3" />
                                        Мало кредитов
                                      </>
                                    ) : !item.hasSpace ? (
                                      'Инвентарь полон'
                                    ) : (
                                      'Купить'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Relation gate warning */}
                            {item.locked && (
                              <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded border border-red-500/15 bg-red-950/10">
                                <Lock className="size-3 text-red-400/50" />
                                <span className="text-[10px] text-red-400/60">
                                  Требуется отношение {item.minRelation}+
                                </span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="sell"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {sellItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="size-10 text-slate-700/50 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">Нечего продать</p>
                      <p className="text-slate-600 text-xs mt-1">
                        {merchant
                          ? `${merchant.npcName} не покупает ваши предметы`
                          : 'Выберите торговца'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2.5">
                      {sellItems.map((item, i) => {
                        const isItemSelected = selectedItemId === item.id;
                        const isAnimating = transactionAnim?.itemId === item.id && transactionAnim.type === 'sell';

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`
                              rounded-xl border p-3 cursor-pointer transition-all
                              ${isItemSelected
                                ? 'border-amber-500/40 bg-amber-950/20 shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                                : 'border-slate-700/25 bg-slate-900/30 hover:border-slate-600/35 hover:bg-slate-800/30'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              {/* Item icon */}
                              <div className={`
                                w-10 h-10 rounded-lg border flex items-center justify-center shrink-0
                                ${getRarityBg(item.rarity)}
                              `}>
                                <ItemIcon icon={item.icon} className={`size-5 ${getRarityColor(item.rarity).split(' ')[0]}`} />
                              </div>

                              {/* Item info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-sm font-medium ${getRarityColor(item.rarity).split(' ')[0]}`}>
                                    {item.name}
                                  </span>
                                  {item.stackable && item.quantity > 1 && (
                                    <span className="text-[10px] text-slate-500 font-mono">×{item.quantity}</span>
                                  )}
                                  <span className="text-[10px] text-slate-500">
                                    {getRarityLabel(item.rarity)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400/70 leading-relaxed line-clamp-2 mb-1.5">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Coins className="size-3 text-emerald-400/70" />
                                    <span className="text-xs font-mono font-semibold text-emerald-300">
                                      +{item.price}{CURRENCY_SYMBOL}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={item.canSell ? 'default' : 'ghost'}
                                    disabled={!item.canSell}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSell(item.id);
                                    }}
                                    className={`
                                      h-7 px-3 text-xs font-medium gap-1
                                      ${item.canSell
                                        ? 'bg-amber-600/80 hover:bg-amber-500/80 text-white'
                                        : 'text-slate-500'
                                      }
                                    `}
                                  >
                                    {isAnimating ? (
                                      <Check className="size-3" />
                                    ) : (
                                      'Продать'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </PanelWrapper>
  );
}
