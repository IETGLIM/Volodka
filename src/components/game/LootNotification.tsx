/* ─── Volodka RPG – Loot/skill notifications ─── */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { Package, TrendingUp, Sparkles } from 'lucide-react';
import { audioEngine } from '@/engine/AudioEngine';
import {
  registerLootNotifier,
  type LootNotificationEntry,
} from './lootNotificationApi';

type Notification = LootNotificationEntry;

let nextId = 0;

/* ── Component ── */
export function LootNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = nextId++;
    setNotifications((prev) => [...prev, { ...n, id }]);

    // Play sound
    if (n.type === 'skill') {
      audioEngine.playSfx('quest_complete');
    } else if (n.type === 'item') {
      audioEngine.playSfx('notify');
    } else if (n.type === 'poem') {
      audioEngine.playSfx('confirm');
    } else {
      audioEngine.playSfx('click');
    }

    // Auto-dismiss
    setTimeout(() => {
      setNotifications((prev) => prev.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  // Register global callback
  useEffect(() => {
    registerLootNotifier(addNotification);
    return () => {
      registerLootNotifier(null);
    };
  }, [addNotification]);

  const RARITY_BORDER: Record<string, string> = {
    common: 'border-slate-500/40 shadow-slate-500/10',
    uncommon: 'border-emerald-500/50 shadow-emerald-500/20',
    rare: 'border-cyan-500/50 shadow-cyan-500/20',
    legendary: 'border-amber-500/50 shadow-amber-500/30',
  };

  const RARITY_GLOW: Record<string, string> = {
    common: '',
    uncommon: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    rare: 'shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb) / 0.2)]',
    legendary: 'shadow-[0_0_16px_rgba(245,158,11,0.3)]',
  };

  return (
    <div className="fixed top-20 left-3 sm:top-24 sm:left-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: UI_LAYERS.TOASTS }} data-exploration-ui>
      <AnimatePresence>
        {notifications.map((n) => {
          const rarityBorder = n.rarity ? RARITY_BORDER[n.rarity] : '';
          const rarityGlow = n.rarity ? RARITY_GLOW[n.rarity] : '';
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={
                `px-4 py-2.5 rounded-lg border-2 backdrop-blur-sm shadow-lg ${rarityGlow} `
                + (
                  n.type === 'combat'
                    ? `bg-amber-950/80 ${rarityBorder || 'border-amber-700/40'}`
                    : n.type === 'xp'
                      ? 'bg-purple-950/80 border-purple-700/40'
                      : n.type === 'skill'
                        ? 'bg-emerald-950/80 border-emerald-700/40'
                        : n.type === 'item'
                          ? `bg-cyan-950/80 ${rarityBorder || 'border-cyan-700/40'}`
                          : n.type === 'poem'
                            ? 'bg-amber-950/80 border-amber-700/40'
                            : `bg-slate-950/80 ${rarityBorder || 'border-slate-700/40'}`
                )
              }
            >
              <div className="flex items-center gap-2.5">
                {n.type === 'skill' && <TrendingUp className="size-4 text-emerald-400 shrink-0" />}
                {n.type === 'item' && <Package className="size-4 text-cyan-400 shrink-0" />}
                {(n.type === 'poem' || n.type === 'combat') && <Sparkles className="size-4 text-amber-400 shrink-0" />}
                {n.type === 'xp' && <TrendingUp className="size-4 text-purple-400 shrink-0" />}
                {n.type === 'karma' && <Sparkles className="size-4 text-slate-300 shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-slate-100">{n.label}</div>
                  {n.detail && <div className="text-[10px] text-slate-400">{n.detail}</div>}
                  {n.rarity && n.rarity !== 'common' && (
                    <div className={`text-[9px] font-bold mt-0.5 ${
                      n.rarity === 'legendary' ? 'text-amber-400' : n.rarity === 'rare' ? 'text-cyan-400' : 'text-emerald-400'
                    }`}>
                      {n.rarity === 'legendary' ? '★ ЛЕГЕНДАРНЫЙ' : n.rarity === 'rare' ? '◆ РЕДКИЙ' : '● НЕОБЫЧНЫЙ'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
