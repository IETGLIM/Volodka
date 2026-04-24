import type { SimArchetypeKey } from './archetypeKeys';

function growFloat32(src: Float32Array, used: number, newCap: number): Float32Array {
  const next = new Float32Array(newCap);
  next.set(src.subarray(0, used));
  return next;
}

/**
 * Один архетип = одна SoA-таблица: плотные `Float32Array`, длина логических строк = `count`.
 * Удаление строк — `swapRemove` (O(1)); порядок строк после удаления меняется (как в типичном ECS).
 */
export class SoaArchetypeTable {
  readonly key: SimArchetypeKey;
  count = 0;
  private cap: number;

  posX: Float32Array;
  posY: Float32Array;
  posZ: Float32Array;
  velX: Float32Array;
  velZ: Float32Array;
  health: Float32Array;
  maxHealth: Float32Array;

  constructor(key: SimArchetypeKey, initialCapacity = 256) {
    this.key = key;
    this.cap = Math.max(8, initialCapacity);
    this.posX = new Float32Array(this.cap);
    this.posY = new Float32Array(this.cap);
    this.posZ = new Float32Array(this.cap);
    this.velX = new Float32Array(this.cap);
    this.velZ = new Float32Array(this.cap);
    this.health = new Float32Array(this.cap);
    this.maxHealth = new Float32Array(this.cap);
  }

  private grow(): void {
    const n = this.cap * 2;
    const u = this.count;
    this.posX = growFloat32(this.posX, u, n);
    this.posY = growFloat32(this.posY, u, n);
    this.posZ = growFloat32(this.posZ, u, n);
    this.velX = growFloat32(this.velX, u, n);
    this.velZ = growFloat32(this.velZ, u, n);
    this.health = growFloat32(this.health, u, n);
    this.maxHealth = growFloat32(this.maxHealth, u, n);
    this.cap = n;
  }

  /**
   * Добавить строку; возвращает индекс строки (0 .. count-1 после вызова).
   */
  addRow(init: {
    posX?: number;
    posY?: number;
    posZ?: number;
    velX?: number;
    velZ?: number;
    health?: number;
    maxHealth?: number;
  }): number {
    if (this.count >= this.cap) this.grow();
    const i = this.count++;
    this.posX[i] = init.posX ?? 0;
    this.posY[i] = init.posY ?? 0;
    this.posZ[i] = init.posZ ?? 0;
    this.velX[i] = init.velX ?? 0;
    this.velZ[i] = init.velZ ?? 0;
    this.health[i] = init.health ?? 1;
    this.maxHealth[i] = init.maxHealth ?? 1;
    return i;
  }

  /** Удалить строку, подставив последнюю на её место. */
  swapRemove(index: number): void {
    const last = this.count - 1;
    if (index < 0 || index > last) return;
    if (index !== last) {
      this.posX[index] = this.posX[last]!;
      this.posY[index] = this.posY[last]!;
      this.posZ[index] = this.posZ[last]!;
      this.velX[index] = this.velX[last]!;
      this.velZ[index] = this.velZ[last]!;
      this.health[index] = this.health[last]!;
      this.maxHealth[index] = this.maxHealth[last]!;
    }
    this.count = last;
  }
}
