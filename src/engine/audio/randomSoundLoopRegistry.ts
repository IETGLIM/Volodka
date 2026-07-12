/** Timer loop record for procedural ambient random sounds. */
export interface RandomSoundLoopRecord {
  timer: ReturnType<typeof setTimeout> | null;
  cancelled: boolean;
  generation: number;
}

/**
 * Tracks rescheduling random-sound timers; stale records self-remove so the
 * backing array cannot grow without bound after scene/ambient changes.
 */
export class RandomSoundLoopRegistry {
  private readonly loops: RandomSoundLoopRecord[] = [];
  private generation = 0;

  get currentGeneration(): number {
    return this.generation;
  }

  get size(): number {
    return this.loops.length;
  }

  register(): RandomSoundLoopRecord {
    const record: RandomSoundLoopRecord = {
      timer: null,
      cancelled: false,
      generation: this.generation,
    };
    this.loops.push(record);
    return record;
  }

  isStale(record: RandomSoundLoopRecord, disposed = false): boolean {
    return (
      disposed ||
      record.cancelled ||
      record.generation !== this.generation
    );
  }

  /** Returns false when the record was stale and removed. */
  guard(record: RandomSoundLoopRecord, disposed = false): boolean {
    if (!this.isStale(record, disposed)) return true;
    this.retire(record);
    return false;
  }

  retire(record: RandomSoundLoopRecord): void {
    record.cancelled = true;
    if (record.timer !== null) {
      clearTimeout(record.timer);
      record.timer = null;
    }
    const idx = this.loops.indexOf(record);
    if (idx !== -1) {
      this.loops.splice(idx, 1);
    }
  }

  clearAll(): void {
    this.generation += 1;
    const snapshot = this.loops.splice(0);
    for (const record of snapshot) {
      this.retire(record);
    }
  }
}
