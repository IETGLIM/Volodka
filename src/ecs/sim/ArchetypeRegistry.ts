import type { SimArchetypeKey } from './archetypeKeys';
import { SIM_ARCHETYPE_MV_HEALTH } from './archetypeKeys';
import { SoaArchetypeTable } from './SoaArchetypeTable';

/**
 * Реестр SoA-таблиц по ключу архетипа. Пакетные системы берут таблицы отсюда, без обхода Map сущностей ECSWorld.
 */
export class ArchetypeRegistry {
  private readonly tables = new Map<SimArchetypeKey, SoaArchetypeTable>();

  getOrCreateTable(key: SimArchetypeKey, initialCapacity?: number): SoaArchetypeTable {
    let t = this.tables.get(key);
    if (!t) {
      t = new SoaArchetypeTable(key, initialCapacity);
      this.tables.set(key, t);
    }
    return t;
  }

  getTable(key: SimArchetypeKey): SoaArchetypeTable | undefined {
    return this.tables.get(key);
  }

  /** Таблица по умолчанию для движения + здоровья (NPC-толпа / боевая заготовка). */
  getMovableHealthTable(): SoaArchetypeTable {
    return this.getOrCreateTable(SIM_ARCHETYPE_MV_HEALTH);
  }

  clear(): void {
    this.tables.clear();
  }
}
