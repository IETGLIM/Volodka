import type { SimContext } from './SimContext';

/**
 * Система симуляции SoA: выполняется **в явном порядке** внутри `SimPipeline` (`order`, затем `name`).
 * Не наследует `ISystem` ECSWorld — отдельный контур для толп/боя.
 */
export interface ISimSystem {
  readonly name: string;
  /** Меньше — раньше. При равенстве — лексикографически по `name`. */
  readonly order: number;
  fixedUpdate?(ctx: SimContext): void;
  update?(ctx: SimContext): void;
}
