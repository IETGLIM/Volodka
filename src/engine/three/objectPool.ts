import { devWarn } from '@/shared/utils/devLog';
/**
 * Generic object pool — reuse transient combat VFX / projectiles instead of
 * allocating new Three.js objects every action.
 *
 * `maxSize` caps total live instances (in use + idle). When exhausted, `acquire()`
 * returns null instead of calling `factory()` without limit.
 */
export class ObjectPool<T> {
  private readonly available: T[] = [];
  private readonly maxSize: number;
  private inUse = 0;

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

  /** Borrow an instance, or null when the pool is at `maxSize` capacity. */
  acquire(): T | null {
    if (this.available.length > 0) {
      this.inUse += 1;
      return this.available.pop()!;
    }
    if (this.totalLive < this.maxSize) {
      this.inUse += 1;
      return this.factory();
    }
    return null;
  }

  release(item: T): void {
    if (this.inUse > 0) {
      this.inUse -= 1;
    }
    this.reset?.(item);
    if (this.available.length >= this.maxSize) {
      if (this.disposeOverflow) {
        this.disposeOverflow(item);
      } else {
        devWarn(
          '[ObjectPool] Pool at capacity and disposeOverflow is unset — item was dropped and may leak GPU resources.',
        );
      }
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

  get inUseCount(): number {
    return this.inUse;
  }

  get totalLive(): number {
    return this.inUse + this.available.length;
  }

  get capacity(): number {
    return this.maxSize;
  }
}
