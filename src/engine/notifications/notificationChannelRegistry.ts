/* ─── Volodka RPG – Notification Channel Registry ─── */
/**
 * SINGLE SOURCE OF TRUTH for all notification channels in the game.
 *
 * Architecture rule: every user-facing notification MUST go through exactly
 * one of the channels listed below. Do NOT create new top-level notification
 * components — extend an existing channel or add a new entry here first.
 *
 * ── Channels ──
 * Each channel has:
 *   - id: unique stable identifier (used by useNotificationSlot arbiter)
 *   - priority: higher wins the visible slot when >MAX_VISIBLE channels compete
 *   - position: screen quadrant
 *   - component: the React component that renders this channel
 *   - sources: what feeds events into this channel
 *
 * ── Coordination ──
 * useNotificationSlot (src/hooks/useNotificationSlot.ts) is the arbiter.
 * At most MAX_VISIBLE=2 non-critical channels show simultaneously, ordered
 * by priority. Critical channels (save/load failures) bypass the cap.
 *
 * ── Event flow ──
 *   store action -> store.notifications  -> NotificationToasts (filtered)
 *                                            (karma/skill/energy/stress/poem only;
 *                                             quest filtered out — see useNotificationToastController)
 *   eventBus     -> quest:* events       -> QuestNotificationSystem (useQuests + events)
 *   eventBus     -> game:notification    -> EventNotificationPopup
 *   eventBus     -> ui:loot_notification -> LootNotification
 *   eventBus     -> achievement:unlocked -> AchievementNotification
 *   eventBus     -> lore:discovered      -> LoreDiscoveryToast
 *   eventBus     -> interaction:hint     -> InteractionHintPopup
 *   eventBus     -> weather:changed      -> WeatherAlertNotification
 *   eventBus     -> crafting:discovered  -> CraftingDiscoveryToast
 *   eventBus     -> game:system_alert    -> GameSystemToast
 *
 * ── Anti-patterns (DO NOT) ──
 *   X Push the same event into both store.notifications AND eventBus
 *     (causes duplicate toasts — quest events were doing this before fix)
 *   X Create a new <XxxNotification /> component without registering here
 *   X Subscribe to events directly in OrchestratorGameplaySections —
 *     each channel owns its own subscriptions
 *   X Bypass useNotificationSlot — uncoordinated toasts stack into a wall
 */

import { NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';

export interface NotificationChannelDescriptor {
  /** Stable unique id used by useNotificationSlot */
  readonly id: string;
  /** Priority for the slot arbiter (higher wins visible slot) */
  readonly priority: number;
  /** Screen position */
  readonly position: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'center';
  /** React component name that renders this channel */
  readonly component: string;
  /** Event bus channels / store paths that feed this channel */
  readonly sources: readonly string[];
  /** What kind of content this channel handles */
  readonly description: string;
}

export const NOTIFICATION_CHANNELS: readonly NotificationChannelDescriptor[] = [
  {
    id: 'quest',
    priority: NOTIFY_PRIORITY.quest,
    position: 'bottom-right',
    component: 'QuestNotificationSystem',
    sources: ['useQuests()', 'story:quest_available', 'quest:objective_updated', 'quest:failed'],
    description: 'Quest accepted / objective complete / quest complete / quest failed',
  },
  {
    id: 'event',
    priority: NOTIFY_PRIORITY.event,
    position: 'top-right',
    component: 'EventNotificationPopup',
    sources: ['game:notification', 'ui:exploration_message', 'combat:start', 'combat:victory'],
    description: 'Game notifications, exploration messages, combat start/victory',
  },
  {
    id: 'toast',
    priority: NOTIFY_PRIORITY.toast,
    position: 'top-right',
    component: 'NotificationToasts',
    sources: ['store.notifications (karma/skill/energy/stress/poem only)'],
    description: 'Stat changes (karma, skill, energy, stress) and poem collected. Quest type filtered out.',
  },
  {
    id: 'achievement',
    priority: NOTIFY_PRIORITY.achievement,
    position: 'top-right',
    component: 'AchievementNotification',
    sources: ['achievement:unlocked', 'fx:achievement'],
    description: 'Achievement unlocked popup',
  },
  {
    id: 'system',
    priority: NOTIFY_PRIORITY.system,
    position: 'bottom-left',
    component: 'GameSystemToast',
    sources: ['game:system_alert'],
    description: 'Critical system alerts (save/load failures, etc.)',
  },
  {
    id: 'lore',
    priority: NOTIFY_PRIORITY.lore,
    position: 'top-left',
    component: 'LoreDiscoveryToast',
    sources: ['lore:discovered'],
    description: 'Lore codex discovery toasts',
  },
  {
    id: 'weather',
    priority: NOTIFY_PRIORITY.weather,
    position: 'top-left',
    component: 'WeatherAlertNotification',
    sources: ['weather:changed'],
    description: 'Weather change alerts',
  },
  {
    id: 'crafting',
    priority: NOTIFY_PRIORITY.crafting,
    position: 'bottom-left',
    component: 'CraftingDiscoveryToast',
    sources: ['crafting:discovered'],
    description: 'Crafting recipe discovery',
  },
  {
    id: 'loot',
    priority: NOTIFY_PRIORITY.loot,
    position: 'top-left',
    component: 'LootNotification',
    sources: ['ui:loot_notification'],
    description: 'Loot pickup notifications',
  },
] as const;

/** Validate that a channel id is registered — use when adding new subscriptions. */
export function isValidNotificationChannel(id: string): boolean {
  return NOTIFICATION_CHANNELS.some((c) => c.id === id);
}

/** Get a channel descriptor by id. */
export function getNotificationChannel(id: string): NotificationChannelDescriptor | undefined {
  return NOTIFICATION_CHANNELS.find((c) => c.id === id);
}
