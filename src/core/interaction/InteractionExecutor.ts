import { rememberInteraction } from '@/core/memory/MemoryEngine';
import { handleInteractionForQuests } from '@/core/quests/QuestEngine';

import type { Interaction } from './interactionTypes';
import type { InteractionContext } from './interactionContext';

/**
 * Single entry for running a registered interaction with store / gameplay hooks.
 */
export function executeInteraction(
  interaction: Interaction,
  ctx: InteractionContext,
): boolean {
  if (interaction.condition && !interaction.condition()) {
    return false;
  }
  interaction.execute(ctx);
  handleInteractionForQuests(interaction.id);
  rememberInteraction(interaction.id);
  return true;
}
