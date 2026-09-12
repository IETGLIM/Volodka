/* ─── Volodka RPG – KeyedTimeoutScheduler (v4.25, этап 107) ───
 *
 * Планировщик однострочных отложенных задач с дедупликацией по ключу.
 *
 * Проблема: useGameLifecycleManager вешал 13 «голых» setTimeout
 * (баннер сцены, мысли при входе в сцену, реактивные мысли на 9 видов
 * событий). У каждого подхода были недостатки:
 *   – при размонтировании оркестратора «хвосты» продолжали срабатывать —
 *     эмиссии volodka:thought и записи в журнал после unmount (в HMR —
 *     дубли, в строгом режиме — фантомные мысли);
 *   – быстрые серии одного и того же события (двойной combat:victory,
 *     репатриация quest:completed) складывали в очередь НЕСКОЛЬКО
 *     отложенных эмиссий — последующие всё равно гасились рейт-лимитером,
 *     но таймеры и замыкания оставались жить;
 *   – баннер сцены вручную клэарил предыдущий таймер — одинаковый паттерн
 *     был размазан по коду.
 *
 * Решение: одна точка планирования — schedule(key, fn, delay). Повторный
 * schedule с тем же ключом ЗАМЕНЯЕТ незрелый таймер (дедуп), disposeAll()
 * снимает все незрелые таймеры при размонтировании/HMR.
 */

export type ScheduledTaskKey = string;

export class KeyedTimeoutScheduler {
  private timers = new Map<ScheduledTaskKey, ReturnType<typeof setTimeout>>();

  /**
   * Запланировать задачу под ключом `key`. Незрелый таймер того же ключа
   * снимается (дедуп) — в очереди не бывает двух задач с одним ключом.
   */
  schedule(key: ScheduledTaskKey, fn: () => void, delayMs: number): void {
    this.cancel(key);
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        fn();
      }, delayMs),
    );
  }

  /** Снять незрелый таймер ключа (если он есть). */
  cancel(key: ScheduledTaskKey): void {
    const timer = this.timers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /** Есть ли незрелый таймер под ключом. */
  has(key: ScheduledTaskKey): boolean {
    return this.timers.has(key);
  }

  /** Число незрелых таймеров (тесты/диагностика). */
  get pendingCount(): number {
    return this.timers.size;
  }

  /** Снять ВСЕ незрелые таймеры — вызывается при размонтировании/HMR. */
  disposeAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
