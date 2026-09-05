import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadingManager } from 'three';
import {
  attachAssetLoadingManager,
  assetFailureKindLabelRu,
  clearRuntimeDiagnostics,
  getRuntimeDiagnosticsSnapshot,
  markRapierStatus,
  recordAssetFailure,
  subscribeRuntimeDiagnostics,
} from './runtimeDiagnostics';

describe('runtimeDiagnostics', () => {
  beforeEach(() => {
    clearRuntimeDiagnostics();
    markRapierStatus('pending');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('стартует без отказов и с физикой в статусе pending', () => {
    const snap = getRuntimeDiagnosticsSnapshot();
    expect(snap.totalFailures).toBe(0);
    expect(snap.failures).toHaveLength(0);
    expect(snap.rapier).toBe('pending');
  });

  it('регистрирует отказ и дедуплицирует по ключу kind+url', () => {
    recordAssetFailure('gltf', '/models/a.glb');
    recordAssetFailure('gltf', '/models/a.glb');
    recordAssetFailure('gltf', '/models/a.glb');

    const snap = getRuntimeDiagnosticsSnapshot();
    expect(snap.totalFailures).toBe(3);
    expect(snap.failures).toHaveLength(1);
    expect(snap.failures[0]?.count).toBe(3);
  });

  it('разные URL не сливаются в одну запись', () => {
    recordAssetFailure('texture', '/textures/a.webp');
    recordAssetFailure('texture', '/textures/b.webp');

    const snap = getRuntimeDiagnosticsSnapshot();
    expect(snap.failures).toHaveLength(2);
    expect(snap.totalFailures).toBe(2);
  });

  it('клир сбрасывает счётчики, но сохраняет подписку', () => {
    const listener = vi.fn();
    const unsub = subscribeRuntimeDiagnostics(listener);

    recordAssetFailure('audio', '/sfx/beep.ogg');
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    clearRuntimeDiagnostics();
    expect(getRuntimeDiagnosticsSnapshot().totalFailures).toBe(0);
    expect(listener).toHaveBeenCalled();

    unsub();
    listener.mockClear();
    recordAssetFailure('audio', '/sfx/other.ogg');
    expect(listener).not.toHaveBeenCalled();
  });

  it('отписка прекращает уведомления и глотает исключения слушателя', () => {
    const throwing = vi.fn(() => {
      throw new Error('HUD сломан');
    });
    const unsub = subscribeRuntimeDiagnostics(throwing);

    expect(() => recordAssetFailure('other', 'ktx2:transcoder-init')).not.toThrow();
    expect(throwing).toHaveBeenCalled();

    unsub();
    throwing.mockClear();
    recordAssetFailure('other', 'ktx2:transcoder-init-2');
    expect(throwing).not.toHaveBeenCalled();
  });

  it('markRapierStatus публикует переходы статуса физики', () => {
    const listener = vi.fn();
    const unsub = subscribeRuntimeDiagnostics(listener);

    markRapierStatus('external');
    expect(getRuntimeDiagnosticsSnapshot().rapier).toBe('external');

    // повторная установка того же статуса не уведомляет
    listener.mockClear();
    markRapierStatus('external');
    expect(listener).not.toHaveBeenCalled();

    markRapierStatus('failed');
    expect(getRuntimeDiagnosticsSnapshot().rapier).toBe('failed');
    expect(listener).toHaveBeenCalled();

    unsub();
  });

  it('attachAssetLoadingManager классифицирует отказы по расширению и зовёт прежние хендлеры', () => {
    const manager = new LoadingManager();
    const prevOnError = vi.fn();
    const prevOnItemError = vi.fn();
    manager.onError = prevOnError;
    manager.onItemError = prevOnItemError;

    attachAssetLoadingManager(manager);

    manager.onError('/models/environments/cafe/props_lod0.glb');
    manager.onItemError('/textures/polyhaven/wood_floor/wood_floor_diff_1k.webp');
    manager.onError('/audio/ambient/rain.mp3');
    manager.onError('/api/mystery');

    const snap = getRuntimeDiagnosticsSnapshot();
    expect(snap.totalFailures).toBe(4);
    const kinds = snap.failures.map((f) => f.kind).sort();
    expect(kinds).toEqual(['audio', 'gltf', 'other', 'texture']);

    expect(prevOnError).toHaveBeenCalledTimes(3);
    expect(prevOnItemError).toHaveBeenCalledTimes(1);
  });

  it('повторный attach не двойно-считает отказы (идемпотентность)', () => {
    // В тестовом воркере модуль мог быть импортирован в jsdom-окружении —
    // проверяем инвариант, не зависящий от среды: двойной attach безопасен.
    const manager = new LoadingManager();
    attachAssetLoadingManager(manager);
    attachAssetLoadingManager(manager);

    manager.onError('/models/dup.glb');
    manager.onError('/models/dup.glb');

    const snap = getRuntimeDiagnosticsSnapshot();
    expect(snap.totalFailures).toBe(2);
    expect(snap.failures).toHaveLength(1);
  });

  it('буфер отказов ограничен — старые записи вытесняются', () => {
    for (let i = 0; i < 40; i++) {
      recordAssetFailure('other', `/overflow/${i}`);
    }
    const snap = getRuntimeDiagnosticsSnapshot();
    expect(snap.failures.length).toBeLessThanOrEqual(32);
    expect(snap.totalFailures).toBe(40);
    // самые свежие записи обязаны остаться в буфере
    const urls = snap.failures.map((f) => f.url);
    expect(urls).toContain('/overflow/39');
  });

  it('русские подписи категорий отказов', () => {
    expect(assetFailureKindLabelRu('gltf')).toBe('модели');
    expect(assetFailureKindLabelRu('texture')).toBe('текстуры');
    expect(assetFailureKindLabelRu('audio')).toBe('звук');
    expect(assetFailureKindLabelRu('other')).toBe('ресурсы');
  });
});
