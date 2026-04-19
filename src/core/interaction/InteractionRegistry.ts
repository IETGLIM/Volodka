import type { Interaction } from './interactionTypes';
import type { InteractionContext } from './interactionContext';
import { executeInteraction } from './InteractionExecutor';

const noopContext: InteractionContext = {
  setGameMode: () => {},
};

/**
 * Register scripted world interactions (alongside legacy `TriggerSystem` / `TriggerZone`).
 */
export class InteractionRegistry {
  private readonly byId = new Map<string, Interaction>();

  register(interaction: Interaction): void {
    this.byId.set(interaction.id, interaction);
  }

  unregister(id: string): void {
    this.byId.delete(id);
  }

  get(id: string): Interaction | undefined {
    return this.byId.get(id);
  }

  /**
   * @param ctx When omitted, `setGameMode` is a no-op — only for callers that execute side-effect-free interactions.
   */
  tryExecute(id: string, ctx?: InteractionContext): boolean {
    const i = this.byId.get(id);
    if (!i) return false;
    return executeInteraction(i, ctx ?? noopContext);
  }

  getRegisteredInteractions(): Interaction[] {
    return [...this.byId.values()];
  }

  clear(): void {
    this.byId.clear();
  }
}
