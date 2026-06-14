
/* ─── Volodka RPG – Gift Dialog ───
 * A compact dialog/modal for gifting items to NPCs.
 * Shows NPC info, affinity level, inventory items with preference indicators,
 * and animated reaction feedback after gifting.
 */

import { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Package } from 'lucide-react';
import { findNpcById } from '@/data/allNpcDefinitions';
import { getItemDefinition } from '@/data/items';
import {
  getGiftPreferenceColor,
  getGiftPreferenceBg,
  getGiftPreferenceGlow,
  getGiftPreferenceIcon,
  type GiftPreference,
} from '@/data/npcGifts';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGiftDialogData } from '@/components/game/gift/useGiftDialogData';
import { useGiftAction } from '@/components/game/gift/useGiftAction';

const PREFERENCE_LABELS: Record<GiftPreference, string> = {
  loved: 'Обожает',
  liked: 'Нравится',
  neutral: 'Нейтрально',
  disliked: 'Не нравится',
  hated: 'Ненавидит',
};

interface GiftDialogProps {
  open: boolean;
  onClose: () => void;
  npcId: string;
}

export function GiftDialog({ open, onClose, npcId }: GiftDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const npcDef = useMemo(() => findNpcById(npcId), [npcId]);
  const npcName = npcDef?.name ?? npcId;

  const {
    giftableItems,
    giftPreferenceCounts,
    currentAffinity,
    affinityLevel,
  } = useGiftDialogData(npcId);

  const { gift, giftingItemId, lastReaction, resetGiftState } = useGiftAction(npcId, npcName);

  useEffect(() => {
    if (!open) {
      resetGiftState();
    }
  }, [open, resetGiftState]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  const affinityBarColor = useMemo(() => {
    if (currentAffinity >= 51) return 'bg-emerald-500';
    if (currentAffinity >= 11) return 'bg-amber-500';
    if (currentAffinity >= -9) return 'bg-slate-500';
    if (currentAffinity >= -49) return 'bg-orange-500';
    return 'bg-rose-500';
  }, [currentAffinity]);

  const affinityTextColor = useMemo(() => {
    if (currentAffinity >= 51) return 'text-emerald-400';
    if (currentAffinity >= 11) return 'text-amber-400';
    if (currentAffinity >= -9) return 'text-slate-400';
    if (currentAffinity >= -49) return 'text-orange-400';
    return 'text-rose-400';
  }, [currentAffinity]);

  const affinityPercent = ((currentAffinity + 100) / 200) * 100;

  if (!npcDef) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.PANEL + 1 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-dialog-title"
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="relative z-10 w-full max-w-lg mx-4 overflow-hidden panel-slide-in digital-noise edge-glow outline-none"
            style={{
              background: 'linear-gradient(180deg, rgba(2,6,23,0.97) 0%, rgba(15,23,42,0.95) 50%, rgba(2,6,23,0.97) 100%)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
              borderRadius: '8px',
              boxShadow: '0 0 30px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.06)',
            }}
            data-testid="gift-dialog"
          >
            <div className="absolute inset-0 pointer-events-none rounded-[8px] panel-scanlines" />

            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/20 relative">
              <h2 id="gift-dialog-title" className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Gift className="size-5 text-cyan-400" />
                Подарить — {npcDef.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono" aria-hidden="true">[Esc]</span>
                <button
                  onClick={onClose}
                  className="close-btn-glow w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white transition-all duration-150 hover:rotate-90"
                  aria-label="Закрыть"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-slate-800/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Расположение</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-medium ${affinityTextColor}`}>
                    {currentAffinity > 0 ? '+' : ''}{currentAffinity}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${affinityTextColor} border-current/30`}>
                    {affinityLevel.label}
                  </span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] relative">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600/40 z-10" />
                <motion.div
                  className={`h-full rounded-full ${affinityBarColor}`}
                  initial={{ width: '50%' }}
                  animate={{ width: `${affinityPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{affinityLevel.description}</p>
            </div>

            <AnimatePresence>
              {lastReaction && (
                <>
                  <div role="status" aria-live="polite" className="sr-only">
                    {lastReaction.text}. Изменение отношения:{' '}
                    {lastReaction.affinityChange > 0 ? '+' : ''}
                    {lastReaction.affinityChange}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3, type: 'spring', damping: 20 }}
                    className="absolute inset-x-0 top-24 z-20 flex justify-center pointer-events-none"
                    aria-hidden="true"
                  >
                    <div
                      className={`px-4 py-2 rounded-lg border text-sm font-medium ${getGiftPreferenceBg(lastReaction.preference)}`}
                      style={{
                        boxShadow: `0 0 20px ${getGiftPreferenceGlow(lastReaction.preference)}, 0 4px 12px rgba(0,0,0,0.4)`,
                      }}
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={getGiftPreferenceColor(lastReaction.preference)}
                      >
                        {lastReaction.text}
                      </motion.span>
                      <div className="text-[10px] mt-0.5 text-slate-400">
                        {lastReaction.affinityChange > 0 ? '+' : ''}{lastReaction.affinityChange} расположение
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <ScrollArea className="max-h-80 px-4 py-2">
              {giftableItems.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {giftableItems.map((item) => {
                    const prefColor = getGiftPreferenceColor(item.preference);
                    const prefBg = getGiftPreferenceBg(item.preference);
                    const prefGlow = getGiftPreferenceGlow(item.preference);
                    const prefIcon = getGiftPreferenceIcon(item.preference);
                    const isGifting = giftingItemId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 ${prefBg} hover:brightness-125`}
                        style={{
                          boxShadow: `0 0 8px ${prefGlow}`,
                        }}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-md text-sm shrink-0 ${prefBg}`}
                          style={{ boxShadow: `0 0 6px ${prefGlow}` }}
                          title={PREFERENCE_LABELS[item.preference]}
                        >
                          {prefIcon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-200 truncate">{item.name}</span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-slate-500 font-mono">×{item.quantity}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] ${prefColor}`}>
                              {PREFERENCE_LABELS[item.preference]}
                            </span>
                            <span className="text-[10px] text-slate-600">•</span>
                            <span className={`text-[10px] font-mono ${item.affinityChange >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                              {item.affinityChange > 0 ? '+' : ''}{item.affinityChange}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => gift(item.id)}
                          disabled={isGifting || !!lastReaction}
                          className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                            ${isGifting || lastReaction
                              ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                              : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/50 hover:text-cyan-200 active:scale-95'
                            }`}
                          aria-label={`Подарить ${item.name}`}
                        >
                          {isGifting ? '...' : 'Подарить'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="size-10 text-slate-700/50 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-1">Нет подарков</p>
                  <p className="text-slate-600 text-xs max-w-[200px]">
                    В инвентаре нет предметов, которые можно подарить
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="px-4 py-2 border-t border-slate-800/40 bg-black/20">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Предметов: {giftableItems.length}</span>
                {giftPreferenceCounts && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">❤️ {giftPreferenceCounts.loved}</span>
                    <span className="text-emerald-400">👍 {giftPreferenceCounts.liked}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
