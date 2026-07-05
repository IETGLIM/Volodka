/** Fixed-size LRU cache — evicts least-recently-used entries on overflow. */
export class LRUCache<K, V> {
  private readonly map = new Map<K, V>();

  constructor(private readonly maxSize: number) {}

  get size(): number {
    return this.map.size;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V, onEvict?: (evicted: V) => void): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value as K | undefined;
      if (oldest !== undefined) {
        const evicted = this.map.get(oldest);
        this.map.delete(oldest);
        if (evicted !== undefined && onEvict) onEvict(evicted);
      }
    }
    this.map.set(key, value);
  }

  clear(onEvict?: (value: V) => void): void {
    if (onEvict) {
      for (const value of this.map.values()) onEvict(value);
    }
    this.map.clear();
  }
}
