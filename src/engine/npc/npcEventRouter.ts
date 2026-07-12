/* ─── Volodka RPG – single EventBus subscription for per-NPC animation handlers ─── */

import { eventBus } from '@/engine/EventBus';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

export type NpcAnimationHandler = (state: NPCAnimationState) => void;

const handlersByNpcId = new Map<string, Set<NpcAnimationHandler>>();
let unsubscribeBus: (() => void) | null = null;

function ensureBusSubscription(): void {
  if (unsubscribeBus) return;
  unsubscribeBus = eventBus.on('npc:animation', ({ npcId, state }) => {
    dispatchNpcAnimation(npcId, state);
  });
}

function teardownBusSubscriptionIfIdle(): void {
  if (handlersByNpcId.size > 0 || !unsubscribeBus) return;
  unsubscribeBus();
  unsubscribeBus = null;
}

export function dispatchNpcAnimation(npcId: string, state: NPCAnimationState): void {
  const handlers = handlersByNpcId.get(npcId);
  if (!handlers) return;
  for (const handler of handlers) {
    handler(state);
  }
}

/** Subscribe to `npc:animation` for one npcId — shares a single bus listener. */
export function onNpcAnimation(npcId: string, handler: NpcAnimationHandler): () => void {
  ensureBusSubscription();
  let handlers = handlersByNpcId.get(npcId);
  if (!handlers) {
    handlers = new Set();
    handlersByNpcId.set(npcId, handlers);
  }
  handlers.add(handler);
  return () => {
    const set = handlersByNpcId.get(npcId);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) {
      handlersByNpcId.delete(npcId);
    }
    teardownBusSubscriptionIfIdle();
  };
}

export function getNpcAnimationHandlerCount(): number {
  let total = 0;
  for (const set of handlersByNpcId.values()) {
    total += set.size;
  }
  return total;
}

export function getNpcAnimationBusSubscriptionCount(): number {
  return unsubscribeBus ? 1 : 0;
}

export function resetNpcEventRouterForTests(): void {
  if (unsubscribeBus) {
    unsubscribeBus();
    unsubscribeBus = null;
  }
  handlersByNpcId.clear();
}
