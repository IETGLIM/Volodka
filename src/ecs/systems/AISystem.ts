import type { ISystem, SystemContext } from '@/shared/ecs';

/** NPC / патрули; приоритет ниже interaction и camera. */
export class AISystem implements ISystem {
  readonly name = 'ai';
  readonly priority = 50;

  update(_ctx: SystemContext): void {
    // TODO: вынести из NPC.tsx / NPCSystem поведение без меша в JSX.
  }
}
