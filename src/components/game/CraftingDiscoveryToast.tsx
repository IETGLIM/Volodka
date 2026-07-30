
/* ─── Volodka RPG – Crafting Discovery Toast ─── */
/* Restrained filmic toast notification that appears when a player discovers
 * a new crafting recipe. Shows recipe icon, name with rarity-colored text,
 * "Новое рецепт обнаружен!" subtitle, rarity glow effect, and auto-dismisses
 * after 3.5 seconds. Queues up to 3 toasts stacking vertically with 100ms stagger.
 * Positioned fixed bottom-left (above QuickUseBar).
 * Listens on EventBus `crafting:discovered` event. */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Sparkles, Crown, Gem } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { bottomCraftingToastPx } from '@/shared/constants/hudLayout';
import { useMobileDetection } from './orchestrator/useMobileDetection';
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
  border: string;
  bg: string;
  textColor: string;
  countdownBg: string;
}> = {
  common: {
    primary: 'var(--hud-filmic-ink-muted)',
    border: 'var(--hud-filmic-border)',
    bg: 'var(--hud-filmic-plate-strong)',
    textColor: 'var(--hud-filmic-ink-muted)',
    countdownBg: 'var(--hud-filmic-ink-muted)',
  },
  uncommon: {
    primary: 'var(--hud-filmic-accent)',
    border: 'var(--hud-filmic-border)',
    bg: 'var(--hud-filmic-plate-strong)',
    textColor: 'var(--hud-filmic-accent)',
    countdownBg: 'var(--hud-filmic-accent)',
  },
  rare: {
    primary: 'rgba(196, 181, 160, 0.88)',
    border: 'rgba(196, 181, 160, 0.2)',
    bg: 'var(--hud-filmic-plate-strong)',
    textColor: 'rgba(196, 181, 160, 0.88)',
    countdownBg: 'rgba(196, 181, 160, 0.88)',
  },
  legendary: {
    primary: 'var(--hud-filmic-warn)',
    border: 'rgba(252, 211, 165, 0.24)',
    bg: 'var(--hud-filmic-plate-strong)',
    textColor: 'var(--hud-filmic-warn)',
    countdownBg: 'var(--hud-filmic-warn)',
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
          className="crafting-discovery-toast hud-filmic-toast pointer-events-auto relative overflow-hidden"
          style={{
            background: accent.bg,
            borderColor: accent.border,
            minWidth: '220px',
            maxWidth: '300px',
          }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{
            duration: 0.4,
            delay: index * (STAGGER_MS / 1000),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* ── Content ── */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            {/* Rarity icon */}
            <div
              className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
              style={{
                border: '1px solid var(--hud-filmic-border)',
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
                className="hud-filmic-kicker truncate"
                style={{ color: accent.textColor }}
              >
                {toast.recipeName}
              </span>

              {/* Subtitle */}
              <span className="hud-filmic-body text-[11px]" style={{ textAlign: 'left' }}>
                Новый рецепт обнаружен!
              </span>
            </div>
          </div>

          {/* ── Bottom countdown bar (shrinks from 100% to 0% over 3.5s) ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ background: accent.countdownBg, opacity: 0.55 }}
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
  const isMobile = useMobileDetection();
  const slotGranted = useNotificationSlot('crafting', NOTIFY_PRIORITY.crafting, toasts.length > 0);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, []);

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, []);

  /* ── Render ── */
  return (
    <div
      className="fixed left-3 sm:left-4 pointer-events-none flex flex-col-reverse gap-2"
      data-exploration-ui
      style={{
        bottom: bottomCraftingToastPx(isMobile),
        zIndex: UI_LAYERS.TOASTS,
      }}
    >
      <AnimatePresence mode="popLayout">
        {slotGranted && toasts.map((toast, index) => (
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
