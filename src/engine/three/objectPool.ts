/**
 * Generic object pool — reuse transient combat VFX / projectiles instead of
 * allocating new Three.js objects every action.
 */
export class ObjectPool<T> {
  private readonly available: T[] = [];
  private readonly maxSize: number;

  constructor(
    private readonly factory: () => T,
    private readonly reset?: (item: T) => void,
    initialSize = 0,
    maxSize?: number,
    private readonly disposeOverflow?: (item: T) => void,
  ) {
    this.maxSize = maxSize ?? Math.max(initialSize * 2, 16);
    for (let i = 0; i < initialSize; i += 1) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    return this.available.pop() ?? this.factory();
  }

  release(item: T): void {
    this.reset?.(item);
    if (this.available.length >= this.maxSize) {
      this.disposeOverflow?.(item);
      return;
    }
    this.available.push(item);
  }

  clear(disposeItem?: (item: T) => void): void {
    if (disposeItem) {
      for (const item of this.available) {
        disposeItem(item);
      }
    }
    this.available.length = 0;
  }

  get size(): number {
    return this.available.length;
  }

  get capacity(): number {
    return this.maxSize;
  }
}
