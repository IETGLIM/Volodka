import { ArchetypeRegistry } from './ArchetypeRegistry';
import type { ISimSystem } from './ISimSystem';
import type { SimContext } from './SimContext';

function compareSimSystems(a: ISimSystem, b: ISimSystem): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.name.localeCompare(b.name);
}

/**
 * Пакетный контур SoA: регистрирует системы в **детерминированном** порядке (`order`, затем `name`).
 * Вызывается из `SystemsRunner` в том же fixed/variable такте, что и `ECSWorld`, но без обхода Map-компонентов.
 */
export class SimPipeline {
  readonly registry: ArchetypeRegistry;
  private readonly systems: ISimSystem[] = [];

  constructor(registry?: ArchetypeRegistry) {
    this.registry = registry ?? new ArchetypeRegistry();
  }

  register(system: ISimSystem): void {
    this.systems.push(system);
    this.systems.sort(compareSimSystems);
  }

  /** Снимок зарегистрированных имён в порядке выполнения (для тестов/отладки). */
  getSystemOrder(): readonly string[] {
    return this.systems.map((s) => s.name);
  }

  fixedUpdate(deltaTimeMs: number): void {
    const ctx = this.makeContext(deltaTimeMs);
    for (const s of this.systems) {
      try {
        s.fixedUpdate?.(ctx);
      } catch (e) {
        console.error(`[SimPipeline] fixedUpdate "${s.name}"`, e);
      }
    }
  }

  update(deltaTimeMs: number): void {
    const ctx = this.makeContext(deltaTimeMs);
    for (const s of this.systems) {
      try {
        s.update?.(ctx);
      } catch (e) {
        console.error(`[SimPipeline] update "${s.name}"`, e);
      }
    }
  }

  private makeContext(deltaTimeMs: number): SimContext {
    return { deltaTimeMs, registry: this.registry };
  }
}
