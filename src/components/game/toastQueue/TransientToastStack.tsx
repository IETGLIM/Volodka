/* ─── Volodka RPG – TransientToastStack (единая очередь крафта, системных алертов и лута) ───
 * Консолидация (v4.48.5, фаза 1): заменяет CraftingDiscoveryToast (245 строк)
 * и GameSystemToast (170 строк).
 * Фаза 2 (v4.48.6): сюда же переехал лут — LootNotification + хук
 * useLootNotifications удалены (собственный useState + таймеры + Escape-сброс).
 * Все три канала теперь читают один стор (toastQueueStore) и рисуются в одном
 * flex-ребёнке нижне-левого стека — в DOM-порядке крафт → системный алерт → лут
 * (flex-col-reverse: лут визуально выше алерта, алерт выше крафта — как раньше).
 *
 * Сохранено 1:1 из прежних компонентов:
 *   - слот-арбитраж (crafting=30, system=58 critical, loot=20);
 *   - гейты: menu/intro и suppressGameplayToasts прячут всё;
 *   - визуал карточек (rarity-иконки/акценты, иконки сейв/лоад, countdown);
 *   - Escape снимает только лут (capture + preventDefault — семантика хука);
 *   - sr-only живой анонс последней лут-карточки (role=status aria-live=polite);
 *   - reduced-motion ветки.
 */

import { useEffect, type CSSProperties, type FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Crown, FlaskConical, Gem, RotateCcw, Save, Sparkles } from 'lucide-react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { LOOT_NOTIFICATION_EVENT } from '@/engine/loot/lootNotificationConstants';
import { buildLootAnnouncement } from '@/engine/loot/lootNotificationPresentation';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamePhase } from '@/store/selectors';
import { useSuppressGameplayToasts } from '@/hooks/useSuppressGameplayToasts';
import type { ItemRarity } from '@/data/items';
import { getSystemAlertTitle, type SystemAlertKind } from '@/engine/system/systemPresentation';
import {
  dismissAllLootToasts,
  dismissToastQueueEntry,
  enqueueCraftingToast,
  enqueueLootToast,
  enqueueSystemAlert,
} from '@/components/game/toastQueue/toastQueueStore';
import { useToastQueue } from '@/components/game/toastQueue/useToastQueue';
import { LootToastCard } from '@/components/game/toastQueue/LootToastCard';

/* ─── Rarity visual config (из CraftingDiscoveryToast) ─── */

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

function RarityIcon({ rarity, className, style }: { rarity: ItemRarity; className?: string; style?: CSSProperties }) {
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

/* ─── System alert visuals (из GameSystemToast) ─── */

const SYSTEM_ACCENT: Record<SystemAlertKind, { primary: string; border: string; bg: string; glow: string }> = {
  save_failed: {
    primary: '#c65548',
    border: 'rgba(198, 85, 72, 0.35)',
    bg: 'rgba(30, 12, 16, 0.88)',
    glow: 'rgba(198, 85, 72, 0.12)',
  },
  load_failed: {
    primary: '#c65548',
    border: 'rgba(198, 85, 72, 0.35)',
    bg: 'rgba(28, 10, 10, 0.88)',
    glow: 'rgba(198, 85, 72, 0.12)',
  },
  load_recovered: {
    primary: '#e2a84b',
    border: 'rgba(226, 168, 75, 0.35)',
    bg: 'rgba(20, 16, 8, 0.88)',
    glow: 'rgba(226, 168, 75, 0.12)',
  },
};

const SYSTEM_ALERT_ICONS: Record<SystemAlertKind, FC<{ className?: string; style?: CSSProperties }>> = {
  save_failed: Save,
  load_failed: AlertTriangle,
  load_recovered: RotateCcw,
};

/* ─── Cards ─── */

interface CardBaseProps {
  reducedMotion: boolean;
  onDismiss: (id: string) => void;
}

function CraftingQueueCard({
  entry,
  index,
  reducedMotion,
  onDismiss,
}: {
  entry: ReturnType<typeof useToastQueue>['craftingEntries'][number];
  index: number;
} & CardBaseProps) {
  const accent = RARITY_CONFIG[entry.rarity];

  return (
    <motion.div
      layout
      className="crafting-discovery-toast hud-filmic-toast pointer-events-auto relative overflow-hidden"
      style={{
        background: accent.bg,
        borderColor: accent.border,
        minWidth: '220px',
        maxWidth: '300px',
      }}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
      transition={{
        duration: reducedMotion ? 0 : 0.4,
        delay: reducedMotion ? 0 : index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onClick={() => onDismiss(entry.id)}
    >
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        <div
          className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
          style={{ border: '1px solid var(--hud-filmic-border)' }}
        >
          <RarityIcon
            rarity={entry.rarity}
            className="size-4.5"
            style={{ color: accent.primary }}
          />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="hud-filmic-kicker truncate" style={{ color: accent.textColor }}>
            {entry.recipeName}
          </span>
          <span className="hud-filmic-body text-[11px]" style={{ textAlign: 'left' }}>
            Новый рецепт обнаружен!
          </span>
        </div>
      </div>

      {/* Bottom countdown bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: accent.countdownBg, opacity: 0.55 }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: reducedMotion ? 0 : entry.durationMs / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

function SystemQueueCard({
  entry,
  reducedMotion,
  onDismiss,
}: {
  entry: ReturnType<typeof useToastQueue>['systemEntries'][number];
} & CardBaseProps) {
  const accent = SYSTEM_ACCENT[entry.kind];
  const AlertIcon = SYSTEM_ALERT_ICONS[entry.kind];

  return (
    <motion.div
      key={entry.id}
      role="alert"
      className="pointer-events-auto relative overflow-hidden max-w-[320px] rounded-lg backdrop-blur-md"
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        boxShadow: `0 0 12px ${accent.glow}`,
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -48, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: -32, scale: 0.94 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
      onClick={() => onDismiss(entry.id)}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className="flex items-center justify-center w-8 h-8 shrink-0 rounded"
          style={{ background: `${accent.primary}18` }}
        >
          <AlertIcon className="size-4" style={{ color: accent.primary }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono font-bold tracking-wide" style={{ color: accent.primary }}>
            {getSystemAlertTitle(entry.kind)}
          </p>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-relaxed">
            {entry.message}
          </p>
        </div>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: accent.primary }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: reducedMotion ? 0 : entry.durationMs / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ─── Stack (единственный потребитель очереди) ─── */

export function TransientToastStack() {
  const mode = useGamePhase();
  const suppressToasts = useSuppressGameplayToasts();
  const reducedMotion = useEffectiveReducedMotion();
  const { craftingEntries, systemEntries, lootEntries, dismiss } = useToastQueue();

  const craftingSlot = useNotificationSlot(
    'crafting',
    NOTIFY_PRIORITY.crafting,
    craftingEntries.length > 0,
  );
  const systemSlot = useNotificationSlot(
    'system',
    NOTIFY_PRIORITY.system,
    systemEntries.length > 0,
    { critical: true },
  );
  const lootSlot = useNotificationSlot(
    'loot',
    NOTIFY_PRIORITY.loot,
    lootEntries.length > 0,
  );

  /* Мосты EventBus → очередь (жизненный цикл = жизненный цикл стека,
   * как у прежних компонентов-подписчиков). Лут раньше подписывался
   * в useLootNotifications с тем же приоритетом EventBusPriority.UI. */
  useEffect(() => {
    const unsubCrafting = eventBus.on('crafting:discovered', (payload) => {
      enqueueCraftingToast(payload);
    });
    const unsubSystem = eventBus.on(
      'game:system_alert',
      (payload) => {
        enqueueSystemAlert(payload);
      },
      EventBusPriority.UI,
    );
    const unsubLoot = eventBus.on(
      LOOT_NOTIFICATION_EVENT,
      (payload) => {
        enqueueLootToast(payload);
      },
      EventBusPriority.UI,
    );
    return () => {
      unsubCrafting();
      unsubSystem();
      unsubLoot();
    };
  }, []);

  /* Escape снимает все лут-карточки (семантика прежнего useLootNotifications:
   * capture + preventDefault, слушатель активен только при живом луте). */
  const lootCount = lootEntries.length;
  useEffect(() => {
    if (lootCount === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismissAllLootToasts();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [lootCount]);

  useEffect(() => {
    return () => {
      /* При размонтировании стека очередь опустошается — в противном случае
       * после возврата в exploration показались бы протухшие карточки
       * (события между сессиями не переигрываются). */
      if (craftingEntries.length > 0 || systemEntries.length > 0 || lootEntries.length > 0) {
        for (const entry of craftingEntries) dismissToastQueueEntry(entry.id);
        for (const entry of systemEntries) dismissToastQueueEntry(entry.id);
        for (const entry of lootEntries) dismissToastQueueEntry(entry.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только на unmount
  }, []);

  if (mode === 'menu' || mode === 'intro') return null;
  if (suppressToasts) return null;

  const liveLootAnnouncement = lootEntries.length > 0
    ? buildLootAnnouncement(lootEntries[lootEntries.length - 1]!.payload)
    : '';

  return (
    <div
      className="pointer-events-none flex flex-col-reverse gap-2"
      data-exploration-ui
      data-testid="transient-toast-stack"
    >
      {/* Живой анонс лута для скринридеров (прежний контейнер LootNotification). */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveLootAnnouncement}
      </div>
      <AnimatePresence mode="popLayout">
        {/* В flex-col-reverse поздние DOM-дети рисуются ВЫШЕ: крафт внизу,
         * системный алерт (критичный) над ним, лут — сверху, как раньше. */}
        {craftingSlot && craftingEntries.map((entry, index) => (
          <CraftingQueueCard
            key={entry.id}
            entry={entry}
            index={index}
            reducedMotion={reducedMotion}
            onDismiss={dismiss}
          />
        ))}
        {systemSlot && systemEntries.map((entry) => (
          <SystemQueueCard
            key={entry.id}
            entry={entry}
            reducedMotion={reducedMotion}
            onDismiss={dismiss}
          />
        ))}
        {lootSlot && lootEntries.map((entry) => (
          <LootToastCard
            key={entry.id}
            notification={entry.payload}
            reducedMotion={reducedMotion}
            onDismiss={() => dismiss(entry.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
