import type { ISystem, SystemContext } from '@/shared/ecs';

/**
 * Только **detection** (кандидаты в зоне досягаемости).
 * **Resolve** — в gameplay (`eventBus.on('exploration:interaction_detected', …)`).
 * **Execute** — по `exploration:interaction_resolved` или прямым вызовам стора из handler'ов.
 */
export class InteractionSystem implements ISystem {
  readonly name = 'interaction';
  readonly priority = 80;

  update(ctx: SystemContext): void {
    void ctx;
    // TODO: emit exploration:interaction_detected — без resolve/runDialogue здесь.
  }
}
