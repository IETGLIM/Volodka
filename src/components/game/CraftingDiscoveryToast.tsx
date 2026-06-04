
/* ─── Volodka RPG – Crafting Discovery Toast ─── */
/* Cyberpunk toast notification that appears when a player discovers
 * a new crafting recipe. Shows recipe icon, name with rarity-colored text,
 * "Новое рецепт обнаружен!" subtitle, rarity glow effect, and auto-dismisses
 * after 3.5 seconds. Queues up to 3 toasts stacking vertically with 100ms stagger.
 * Positioned fixed bottom-left (above QuickUseBar).
 * Listens on EventBus `crafting:discovered` event. */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Sparkles, Crown, Gem, Star } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { type ItemRarity } from '@/data/items';

/* ─── Types ─── */

interface CraftingToastData {
  id: string;
  recipeId: string;
  recipeName: string;
  rarity: ItemRarity;
  createdAt: number;
}

/* ─── Constants ─── */

const TOAST_DURATION_MS = 3500;
const MAX_TOASTS = 3;
const STAGGER_MS = 100;

/* ─── Rarity visual config ─── */

const RARITY_CONFIG: Record<ItemRarity, {
  primary: string;
  glow: string;
  border: string;
  bg: string;
  shadow: string;
  iconBg: string;
  textColor: string;
  countdownBg: string;
}> = {
  common: {
    primary: '#94a3b8',     // slate-400
    glow: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.30)',
    bg: 'rgba(15, 20, 30, 0.82)',
    shadow: '0 0 10px rgba(148, 163, 184, 0.10)',
    iconBg: 'rgba(148, 163, 184, 0.10)',
    textColor: '#94a3b8',
    countdownBg: '#94a3b8',
  },
  uncommon: {
    primary: '#22d3ee',     // cyan-400
    glow: 'rgba(34, 211, 238, 0.18)',
    border: 'rgba(34, 211, 238, 0.35)',
    bg: 'rgba(8, 20, 30, 0.82)',
    shadow: '0 0 12px rgba(34, 211, 238, 0.12)',
    iconBg: 'rgba(34, 211, 238, 0.12)',
    textColor: '#22d3ee',
    countdownBg: '#22d3ee',
  },
  rare: {
    primary: '#a78bfa',     // violet-400
    glow: 'rgba(167, 139, 250, 0.20)',
    border: 'rgba(167, 139, 250, 0.40)',
    bg: 'rgba(16, 8, 30, 0.82)',
    shadow: '0 0 14px rgba(167, 139, 250, 0.14)',
    iconBg: 'rgba(167, 139, 250, 0.12)',
    textColor: '#a78bfa',
    countdownBg: '#a78bfa',
  },
  legendary: {
    primary: '#fbbf24',     // amber-400
    glow: 'rgba(251, 191, 36, 0.20)',
    border: 'rgba(251, 191, 36, 0.40)',
    bg: 'rgba(20, 16, 8, 0.82)',
    shadow: '0 0 14px rgba(251, 191, 36, 0.14)',
    iconBg: 'rgba(251, 191, 36, 0.12)',
    textColor: '#fbbf24',
    countdownBg: '#fbbf24',
  },
};

/* ─── Icon renderer by rarity ─── */

function RarityIcon({ rarity, className, style }: { rarity: ItemRarity; className?: string; style?: React.CSSProperties }) {
  switch (rarity) {
    case 'common':
      return <FlaskConical className={className} style={style} />;
    case 'uncommon':
      return <Gem className={className} style={style} />;
    case 'rare':
      return <Sparkles className={className} style={style} />;
    case 'legendary':
      return <Crown className={className} style={style} />;
  }
}

/* ─── ID counter ─── */

let nextToastId = 0;

/* ─── Single toast card ─── */

function CraftingToastCard({ toast, index }: { toast: CraftingToastData; index: number }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accent = RARITY_CONFIG[toast.rarity];

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, TOAST_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {!exiting && (
        <motion.div
          layout
          key={toast.id}
          className="crafting-discovery-toast pointer-events-auto relative overflow-hidden"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            borderRadius: '8px',
            boxShadow: accent.shadow,
            minWidth: '220px',
            maxWidth: '300px',
            fontFamily: "'Geist Mono', monospace",
          }}
          initial={{ opacity: 0, x: -60, scale: 0.9, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -40, scale: 0.9, filter: 'blur(2px)' }}
          transition={{
            duration: 0.4,
            delay: index * (STAGGER_MS / 1000),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* ── Scan-line sweep animation on entry ── */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(180deg, transparent 0%, transparent 40%, ${accent.primary}18 50%, transparent 60%, transparent 100%)`,
              backgroundSize: '100% 200%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '0% 200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* ── Hex-grid pattern overlay (subtle) ── */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(accent.primary)}' fill-opacity='0.015'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.6,
            }}
          />

          {/* ── Neon border glow breathing animation ── */}
          <motion.div
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
                `0 0 18px ${accent.glow}, inset 0 0 6px ${accent.glow}`,
                `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Corner bracket decorations (4 corners, rarity color at 25% opacity) ── */}
          <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none z-20" style={{ borderTop: `1px solid ${accent.primary}40`, borderLeft: `1px solid ${accent.primary}40` }} />
          <div className="absolute top-0 right-0 w-3 h-3 pointer-events-none z-20" style={{ borderTop: `1px solid ${accent.primary}40`, borderRight: `1px solid ${accent.primary}40` }} />
          <div className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none z-20" style={{ borderBottom: `1px solid ${accent.primary}40`, borderLeft: `1px solid ${accent.primary}40` }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none z-20" style={{ borderBottom: `1px solid ${accent.primary}40`, borderRight: `1px solid ${accent.primary}40` }} />

          {/* ── Content ── */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            {/* Rarity icon */}
            <div
              className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
              style={{
                background: accent.iconBg,
                boxShadow: `0 0 8px ${accent.glow}`,
              }}
            >
              <RarityIcon
                rarity={toast.rarity}
                className="size-4.5"
                style={{ color: accent.primary }}
              />
            </div>

            {/* Text area */}
            <div className="flex flex-col gap-0.5 min-w-0">
              {/* Recipe name with rarity-colored text */}
              <span
                className="text-sm font-mono font-bold tracking-wide truncate"
                style={{ color: accent.textColor, textShadow: `0 0 8px ${accent.glow}` }}
              >
                {toast.recipeName}
              </span>

              {/* Subtitle */}
              <span className="text-[10px] font-mono text-slate-400 tracking-wide">
                Новое рецепт обнаружен!
              </span>
            </div>
          </div>

          {/* ── Bottom countdown bar (shrinks from 100% to 0% over 3.5s) ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ background: accent.countdownBg, boxShadow: `0 0 6px ${accent.glow}` }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: TOAST_DURATION_MS / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main component ─── */

export function CraftingDiscoveryToast() {
  const [toasts, setToasts] = useState<CraftingToastData[]>([]);
  const timersMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const timers = timersMap.current;

  /* ── Listen for crafting:discovered events ── */
  useEffect(() => {
    const unsub = eventBus.on('crafting:discovered', (payload) => {
      const id = `crafting-toast-${++nextToastId}`;

      const newToast: CraftingToastData = {
        id,
        recipeId: payload.recipeId,
        recipeName: payload.recipeName,
        rarity: payload.rarity,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast].slice(-MAX_TOASTS));

      // Auto-remove after duration + exit animation
      const removeTimer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers[id];
      }, TOAST_DURATION_MS + 600);

      timers[id] = removeTimer;
    });

    return unsub;
  }, []);

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  }, []);

  /* ── Render ── */
  return (
    <div
      className="fixed bottom-20 left-4 pointer-events-none flex flex-col-reverse gap-2"
      style={{ zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <CraftingToastCard
            key={toast.id}
            toast={toast}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
