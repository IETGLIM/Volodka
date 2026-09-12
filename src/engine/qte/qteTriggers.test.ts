import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import type { TriggerZone } from '@/data/triggerZones';
import {
  attachQteTriggerListeners,
  detachQteTriggerListeners,
  startQteMinigameGate,
} from './qteTriggers';

const dispatchGameAction = vi.fn();
const isLocked = vi.fn(() => false);

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

vi.mock('@/engine/player/playerLocomotionGate', () => ({
  isGameplayOverlayLocomotionLocked: () => isLocked(),
}));

/** Минимальная зона с терминалом для старта гейта. */
function makeZone(overrides?: Partial<TriggerZone>): TriggerZone {
  return {
    id: 'zone_test_terminal',
    sceneId: 'volodka_room',
    position: [0, 0, 0],
    size: [1, 1, 1],
    linkedMinigame: 'codebreaker',
    linkedQte: { eventType: 'press', duration: 2400, difficulty: 'normal' },
    ...overrides,
  } as TriggerZone;
}

/** Подписка-ловушка на событие (навешивается ДО эмитта).
 *  Возвращает живую ссылку: payload читается через getter, а не снапшотится. */
function collect<T>(event: Parameters<typeof eventBus.on>[0]): {
  readonly payload: T | null;
  unsub: () => void;
} {
  const box: { payload: T | null } = { payload: null };
  const unsub = eventBus.on(event, (payload: unknown) => {
    box.payload = payload as T;
  });
  return {
    get payload() {
      return box.payload;
    },
    unsub,
  };
}

/** Полный пайплайн: слушатели триггеров навешены (как в игре). */
function attachTriggers(): void {
  attachQteTriggerListeners();
}

const CREEP_PAYLOAD = {
  creepId: 'creep_1',
  enemyType: 'system_daemon' as const,
  enemyName: 'Дрон-перехватчик',
  x: 0,
  y: 0,
  z: 0,
  xpGained: 5,
  karmaGained: 0,
  creditsGained: 10,
};

describe('qteTriggers (v4.31 — контентный слой QTE)', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    isLocked.mockClear();
    isLocked.mockReturnValue(false);
    detachQteTriggerListeners();
  });

  afterEach(() => {
    detachQteTriggerListeners();
    vi.restoreAllMocks();
  });

  it('зона без linkedQte открывает миниигру напрямую, без QTE', () => {
    const start = collect<unknown>('qte:start');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone({ linkedQte: undefined }));

    expect(start.payload).toBeNull();
    expect(open.payload).toEqual({ gameType: 'codebreaker' });
    start.unsub();
    open.unsub();
  });

  it('зона без linkedMinigame — no-op (нечего открывать)', () => {
    const start = collect<unknown>('qte:start');
    const open = collect<unknown>('minigame:open');

    startQteMinigameGate(makeZone({ linkedMinigame: undefined }));

    expect(start.payload).toBeNull();
    expect(open.payload).toBeNull();
    start.unsub();
    open.unsub();
  });

  it('linkedQte эмитит qte:start со спецификацией зоны, миниигра ждёт closed', () => {
    attachTriggers();
    const start = collect<{
      id: string;
      eventType: string;
      duration: number;
      difficulty: string;
      context: Record<string, unknown>;
    }>('qte:start');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone());

    expect(start.payload).not.toBeNull();
    expect(start.payload?.eventType).toBe('press');
    expect(start.payload?.duration).toBe(2400);
    expect(start.payload?.difficulty).toBe('normal');
    expect(start.payload?.context['kind']).toBe('hack_gate');
    expect(start.payload?.context['gameType']).toBe('codebreaker');
    // Миниигра открывается только на qte:closed, не раньше.
    expect(open.payload).toBeNull();
    start.unsub();
    open.unsub();
  });

  it('занятый экран (гейт) — миниигра сразу, без QTE', () => {
    isLocked.mockReturnValue(true);
    const start = collect<unknown>('qte:start');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone());

    expect(start.payload).toBeNull();
    expect(open.payload).toEqual({ gameType: 'codebreaker' });
    start.unsub();
    open.unsub();
  });

  it('успех: награда на resolve, миниигра только на closed', () => {
    attachTriggers();
    const start = collect<{ id: string }>('qte:start');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone());

    const id = start.payload?.id;
    expect(id).toBeTruthy();
    expect(open.payload).toBeNull();

    eventBus.emit('qte:resolve', { id: id as string, result: 'success' });

    expect(dispatchGameAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'player/addXp', amount: 2 }),
    );
    expect(dispatchGameAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notification/push',
        notificationType: 'skill',
      }),
    );
    // Экран результата ещё держится — миниигры нет.
    expect(open.payload).toBeNull();

    eventBus.emit('qte:closed', { id: id as string, result: 'success' });
    expect(open.payload).toEqual({ gameType: 'codebreaker' });

    start.unsub();
    open.unsub();
  });

  it('провал: помехи + уведомление, миниигра всё равно открывается (graceful degradation)', () => {
    attachTriggers();
    const start = collect<{ id: string }>('qte:start');
    const glitch = collect<{ duration: number; intensity: number }>('fx:glitch');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone());
    const id = start.payload?.id ?? '';
    eventBus.emit('qte:resolve', { id, result: 'failure' });

    expect(glitch.payload).toEqual({ duration: 350, intensity: 0.6 });
    expect(dispatchGameAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'notification/push', notificationType: 'stress' }),
    );
    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'player/addXp' }),
    );

    eventBus.emit('qte:closed', { id, result: 'failure' });
    expect(open.payload).toEqual({ gameType: 'codebreaker' });

    start.unsub();
    glitch.unsub();
    open.unsub();
  });

  it('cancelled (Escape): без наград и помех, миниигра открывается на closed', () => {
    attachTriggers();
    const start = collect<{ id: string }>('qte:start');
    const glitch = collect<unknown>('fx:glitch');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone());
    const id = start.payload?.id ?? '';

    eventBus.emit('qte:resolve', { id, result: 'cancelled' });
    expect(dispatchGameAction).not.toHaveBeenCalled();
    expect(glitch.payload).toBeNull();

    eventBus.emit('qte:closed', { id, result: 'cancelled' });
    expect(open.payload).toEqual({ gameType: 'codebreaker' });

    start.unsub();
    glitch.unsub();
    open.unsub();
  });

  it('чужие qte-сессии (без нашего контекста) игнорируются', () => {
    attachTriggers();
    const open = collect<unknown>('minigame:open');

    eventBus.emit('qte:resolve', { id: 'foreign_session', result: 'success' });
    eventBus.emit('qte:closed', { id: 'foreign_session', result: 'success' });

    expect(dispatchGameAction).not.toHaveBeenCalled();
    expect(open.payload).toBeNull();
    open.unsub();
  });

  it('повторный closed не открывает миниигру дважды (контекст чистится)', () => {
    attachTriggers();
    const start = collect<{ id: string }>('qte:start');
    let openCount = 0;
    const unsubOpen = eventBus.on('minigame:open', () => {
      openCount += 1;
    });

    startQteMinigameGate(makeZone());
    const id = start.payload?.id ?? '';
    eventBus.emit('qte:closed', { id, result: 'success' });
    eventBus.emit('qte:closed', { id, result: 'success' });

    expect(openCount).toBe(1);
    start.unsub();
    unsubOpen();
  });

  it('финишер: успех даёт XP и karma-уведомление', () => {
    attachTriggers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // < 0.65 — запуск
    const start = collect<{ id: string; eventType: string }>('qte:start');

    eventBus.emit('combat:creep_finished', CREEP_PAYLOAD);

    expect(start.payload).not.toBeNull();
    expect(start.payload?.eventType).toBe('press');

    const id = start.payload?.id as string;
    eventBus.emit('qte:resolve', { id, result: 'success' });
    expect(dispatchGameAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'player/addXp', amount: 3 }),
    );
    expect(dispatchGameAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'notification/push', notificationType: 'karma' }),
    );
    start.unsub();
  });

  it('финишер: кулдаун блокирует повторный запуск сразу после предыдущего', () => {
    attachTriggers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const first = collect<{ id: string }>('qte:start');

    eventBus.emit('combat:creep_finished', CREEP_PAYLOAD);
    expect(first.payload).not.toBeNull();
    first.unsub();

    // Вторая ловушка — ПОСЛЕ первого эмитта (иначе поймает его же: шина broadcast).
    const second = collect<{ id: string }>('qte:start');
    eventBus.emit('combat:creep_finished', { ...CREEP_PAYLOAD, creepId: 'creep_2' });
    expect(second.payload).toBeNull();
    second.unsub();
  });

  it('финишер: RNG-промах пропускает запуск', () => {
    attachTriggers();
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // > 0.65 — мимо
    const start = collect<unknown>('qte:start');

    eventBus.emit('combat:creep_finished', CREEP_PAYLOAD);

    expect(start.payload).toBeNull();
    start.unsub();
  });

  it('detach снимает слушатели: closed после detach не открывает миниигру', () => {
    attachTriggers();
    const start = collect<{ id: string }>('qte:start');
    const open = collect<{ gameType: string }>('minigame:open');

    startQteMinigameGate(makeZone());
    const id = start.payload?.id ?? '';
    detachQteTriggerListeners();

    eventBus.emit('qte:closed', { id, result: 'success' });
    expect(open.payload).toBeNull();
    start.unsub();
    open.unsub();
  });
});
