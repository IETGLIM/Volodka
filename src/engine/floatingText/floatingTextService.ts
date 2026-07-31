/* ─── Volodka RPG – floating text spawn service ─── */

import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  MAX_POOL_SIZE,
  TEXT_LIFETIME_MS,
  type FloatingTextEntry,
  type FloatingTextPriority,
  type FloatingTextType,
} from './floatingTextTypes';

type SpawnOptions = {
  x?: number;
  y?: number;
  priority?: FloatingTextPriority;
};

type FloatingTextServiceDeps = {
  rng: () => number;
  now: () => number;
  scheduleFrame: (callback: () => void) => void;
  scheduleTimeout: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearScheduledTimeout: (handle: ReturnType<typeof setTimeout>) => void;
};

const defaultDeps: FloatingTextServiceDeps = {
  rng: () => Math.random(),
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  scheduleFrame: (callback) => {
    if (typeof requestAnimationFrame === 'undefined') {
      callback();
      return 0;
    }
    return requestAnimationFrame(callback);
  },
  scheduleTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearScheduledTimeout: (handle) => clearTimeout(handle),
};

export class FloatingTextService {
  private pool: FloatingTextEntry[] = [];
  private snapshot: FloatingTextEntry[] = [];
  private listeners = new Set<() => void>();
  private nextId = 1;
  private notifyScheduled = false;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;
  private eventUnsubs: Array<() => void> = [];

  constructor(
    private readonly deps: FloatingTextServiceDeps = defaultDeps,
    private readonly attachEventBus = false,
  ) {}

  spawn(text: string, type: FloatingTextType = 'custom', options: SpawnOptions = {}): void {
    this.ensureInitialized();

    const { x, y, priority = type === 'levelup' ? 'high' : 'normal' } = options;
    const position = this.resolvePosition(x, y);

    const entry: FloatingTextEntry = {
      id: this.nextId++,
      text,
      type,
      x: position.x,
      y: position.y,
      spawnTime: this.deps.now(),
      animateOffsetX: (this.deps.rng() - 0.5) * 20,
      priority,
    };

    this.pool.push(entry);
    this.trimPool();
    this.scheduleNotify();
  }

  getSnapshot(): FloatingTextEntry[] {
    return this.snapshot;
  }

  getServerSnapshot(): FloatingTextEntry[] {
    return [];
  }

  subscribe(listener: () => void): () => void {
    this.ensureInitialized();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.pool = [];
    this.snapshot = [];
    this.nextId = 1;
    this.notifyScheduled = false;
    if (this.expiryTimer) {
      this.deps.clearScheduledTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    for (const listener of this.listeners) {
      listener();
    }
  }

  dispose(): void {
    for (const unsub of this.eventUnsubs) {
      unsub();
    }
    this.eventUnsubs = [];
    this.initialized = false;
    this.reset();
  }

  private ensureInitialized(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    if (this.attachEventBus) {
      this.attachEventBusListeners();
    }
  }

  private attachEventBusListeners(): void {
    if (!eventBus?.on) return;

    this.eventUnsubs.push(
      eventBus.on(
        'combat:hit',
        (payload) => {
          floatDamage(payload.damage);
        },
        EventBusPriority.FX,
      ),
    );

    this.eventUnsubs.push(
      eventBus.on(
        'combat:victory',
        (payload) => {
          floatXP(payload.xpGained);
          if (payload.karmaGained > 0) {
            this.deps.scheduleTimeout(() => floatKarma(payload.karmaGained), 300);
          }
          if (payload.creditsGained > 0) {
            this.deps.scheduleTimeout(() => floatCredits(payload.creditsGained), 450);
          }
          if (payload.lootItemId) {
            const lootId = payload.lootItemId;
            this.deps.scheduleTimeout(() => floatItem(lootId), 600);
          }
        },
        EventBusPriority.FX,
      ),
    );

    this.eventUnsubs.push(
      eventBus.on('skill:level_up', (payload) => {
        floatSkill(payload.skill, payload.level);
      }),
    );

    this.eventUnsubs.push(
      eventBus.on('loot:reward', (payload) => {
        floatItem(payload.name);
      }),
    );

    // poem:collected — discovery language owns PoemRevealHost (+ optional store
    // history). Do not spawn a parallel "Стих собран!" float here.
  }

  private resolvePosition(x?: number, y?: number): { x: number; y: number } {
    if (typeof window === 'undefined') {
      return { x: x ?? 0, y: y ?? 0 };
    }

    return {
      x: x ?? window.innerWidth / 2 + (this.deps.rng() - 0.5) * 120,
      y: y ?? window.innerHeight * 0.35 + (this.deps.rng() - 0.5) * 60,
    };
  }

  private trimPool(): void {
    while (this.pool.length > MAX_POOL_SIZE) {
      const normalIndex = this.pool.findIndex((entry) => entry.priority !== 'high');
      if (normalIndex >= 0) {
        this.pool.splice(normalIndex, 1);
      } else {
        this.pool.shift();
      }
    }
  }

  private pruneExpired(now = this.deps.now()): boolean {
    const before = this.pool.length;
    this.pool = this.pool.filter((entry) => now - entry.spawnTime <= TEXT_LIFETIME_MS);
    return before !== this.pool.length;
  }

  private scheduleNotify(): void {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    this.deps.scheduleFrame(() => this.flushNotify());
  }

  private flushNotify(): void {
    this.notifyScheduled = false;
    this.pruneExpired();
    this.snapshot = [...this.pool];
    for (const listener of this.listeners) {
      listener();
    }
    this.scheduleExpiryCheck();
  }

  private scheduleExpiryCheck(): void {
    if (this.pool.length === 0) {
      if (this.expiryTimer) {
        this.deps.clearScheduledTimeout(this.expiryTimer);
        this.expiryTimer = null;
      }
      return;
    }

    const now = this.deps.now();
    const nextExpiryMs = Math.min(
      ...this.pool.map((entry) => Math.max(0, entry.spawnTime + TEXT_LIFETIME_MS - now)),
    );

    if (this.expiryTimer) {
      this.deps.clearScheduledTimeout(this.expiryTimer);
    }

    this.expiryTimer = this.deps.scheduleTimeout(() => {
      this.expiryTimer = null;
      if (this.pruneExpired()) {
        this.snapshot = [...this.pool];
        for (const listener of this.listeners) {
          listener();
        }
      }
      this.scheduleExpiryCheck();
    }, nextExpiryMs);
  }
}

export const floatingTextService = new FloatingTextService(defaultDeps, true);

registerHmrDispose(() => {
  floatingTextService.dispose();
});

export function spawnFloatingText(
  text: string,
  type: FloatingTextType = 'custom',
  x?: number,
  y?: number,
  priority?: FloatingTextPriority,
): void {
  floatingTextService.spawn(text, type, { x, y, priority });
}

export const floatXP = (amount: number) => spawnFloatingText(`${amount} XP`, 'xp');
export const floatKarma = (amount: number) =>
  spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Карма`, 'karma');
export const floatSkill = (skill: string, amount: number) =>
  spawnFloatingText(`${skill} +${amount}`, 'skill');
export const floatDamage = (amount: number) => spawnFloatingText(`${amount}`, 'damage');
export const floatHeal = (amount: number) => spawnFloatingText(`+${amount}`, 'heal');
export const floatItem = (name: string) => spawnFloatingText(name, 'item');
export const floatStress = (amount: number) =>
  spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Стресс`, 'stress');
export const floatEnergy = (amount: number) =>
  spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Энергия`, 'energy');
export const floatLevelUp = (level: number) =>
  spawnFloatingText(`Уровень ${level}!`, 'levelup', undefined, undefined, 'high');
export const floatCredits = (amount: number) => spawnFloatingText(`${amount} кредитов`, 'credits');
