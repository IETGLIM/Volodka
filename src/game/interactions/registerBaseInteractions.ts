'use client';

import { InteractionRegistry } from '@/core/interaction/InteractionRegistry';

/** Singleton used by exploration (`RPGGameCanvas`). */
export const explorationInteractionRegistry = new InteractionRegistry();

let didRegisterBase = false;

/**
 * Registers default `InteractionRegistry` entries (idempotent).
 * Dialogue UI is opened via `onNPCInteraction` → `useDialogueFlow` (same path as E on NPC mesh).
 */
export function registerBaseInteractions(registry: InteractionRegistry = explorationInteractionRegistry): void {
  if (didRegisterBase) return;
  didRegisterBase = true;

  registry.register({
    id: 'npc_intro',
    type: 'dialogue',
    execute: (ctx) => {
      ctx.setGameMode('dialogue');
      ctx.onNPCInteraction?.('zarema_home');
    },
  });
}
