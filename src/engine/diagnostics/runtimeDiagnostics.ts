/**
 * Runtime asset/physics diagnostics — prod-safe singleton.
 *
 * Purpose (v4.14.1): answer «куда делись текстуры / что с физикой» НА УСТРОЙСТВЕ
 * игрока. Сбои (устаревший деплой, CSP, 404 после prune) невидимы из песочницы —
 * поэтому движок сам собирает факты: ошибки загрузки GLB/текстур через
 * THREE.DefaultLoadingManager, статус инициализации Rapier WASM.
 * HUD-часть (AssetDiagnosticsBadge) показывает данные по F8.
 *
 * Инкрементальные гарантии:
 *  - только read-only наблюдение: ничего не бросает, ничего не блокирует;
 *  - DOM-хук ставится один раз (идемпотентно), существующие обработчики
 *    DefaultLoadingManager сохраняются и вызываются дальше;
 *  - буфер отказов ограничен (MAX_FAILURES) — без утечек при долгой сессии.
 */

import { DefaultLoadingManager, type LoadingManager } from 'three';

export type AssetFailureKind = 'gltf' | 'texture' | 'audio' | 'other';

export type RapierStatus = 'pending' | 'external' | 'inline' | 'failed';

export interface AssetFailureRecord {
  kind: AssetFailureKind;
  /** Публичный URL или синтетический ключ (например «ktx2:transcoder-init»). */
  url: string;
  count: number;
  lastAt: number;
}

export interface RuntimeDiagnosticsSnapshot {
  totalFailures: number;
  failures: readonly AssetFailureRecord[];
  rapier: RapierStatus;
}

const MAX_FAILURES = 32;

const failureByKey = new Map<string, AssetFailureRecord>();
let totalFailures = 0;
let rapierStatus: RapierStatus = 'pending';

const listeners = new Set<() => void>();

function classify(url: string): AssetFailureKind {
  const clean = url.split(/[?#]/)[0] ?? url;
  if (/\.(glb|gltf)$/i.test(clean)) return 'gltf';
  if (/\.(png|jpe?g|webp|ktx2|hdr|exr|basis|dds)$/i.test(clean)) return 'texture';
  if (/\.(mp3|ogg|wav|m4a|flac)$/i.test(clean)) return 'audio';
  return 'other';
}

function notify(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      // слушатель HUD не должен ронять движок
    }
  }
}

/** Зарегистрировать отказ загрузки ресурса (дедуп по ключу). */
export function recordAssetFailure(kind: AssetFailureKind, url: string): void {
  const key = `${kind}:${url}`;
  const existing = failureByKey.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastAt = Date.now();
  } else {
    const record: AssetFailureRecord = { kind, url, count: 1, lastAt: Date.now() };
    if (failureByKey.size >= MAX_FAILURES) {
      // выкидываем самую старую запись — буфер остаётся ограниченным
      let oldestKey: string | null = null;
      let oldestAt = Number.POSITIVE_INFINITY;
      for (const [k, v] of failureByKey) {
        if (v.lastAt < oldestAt) {
          oldestAt = v.lastAt;
          oldestKey = k;
        }
      }
      if (oldestKey) failureByKey.delete(oldestKey);
    }
    failureByKey.set(key, record);
  }
  totalFailures += 1;
  notify();
}

/** Статус инициализации физики (вызывается из rapierCompat.init). */
export function markRapierStatus(status: RapierStatus): void {
  if (rapierStatus === status) return;
  rapierStatus = status;
  notify();
}

/** Снимок диагностики для HUD. */
export function getRuntimeDiagnosticsSnapshot(): RuntimeDiagnosticsSnapshot {
  return {
    totalFailures,
    failures: [...failureByKey.values()],
    rapier: rapierStatus,
  };
}

/** Сбросить накопленные отказы (кнопка «Очистить» в панели). */
export function clearRuntimeDiagnostics(): void {
  failureByKey.clear();
  totalFailures = 0;
  notify();
}

/** Подписка HUD на изменения; возвращает отписку. */
export function subscribeRuntimeDiagnostics(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const KIND_LABEL_RU: Record<AssetFailureKind, string> = {
  gltf: 'модели',
  texture: 'текстуры',
  audio: 'звук',
  other: 'ресурсы',
};

/** Русская подпись категории отказа (для HUD). */
export function assetFailureKindLabelRu(kind: AssetFailureKind): string {
  return KIND_LABEL_RU[kind];
}

let managerHooked = false;

/** Менеджеры, на которые уже навешан сбор (защита от двойной цепочки хендлеров). */
const attachedManagers = new WeakSet<LoadingManager>();

/**
 * Навесить сбор отказов на THREE LoadingManager (идемпотентно).
 * Повторный вызов на том же менеджере — no-op, иначе обёртки сцепились бы
 * и каждый отказ считался бы дважды. Существующий onError сохраняется
 * и вызывается после нашего. Примечание: в three.js onError — это и есть
 * per-item callback (его вызывает manager.itemError()); отдельного
 * «onItemError»-свойства у LoadingManager нет.
 */
export function attachAssetLoadingManager(manager: LoadingManager): void {
  if (attachedManagers.has(manager)) return;
  attachedManagers.add(manager);

  const prevOnError = manager.onError;
  manager.onError = (url: string) => {
    recordAssetFailure(classify(url), url);
    prevOnError?.(url);
  };

  managerHooked = true;
}

/** Ставился ли уже хук на менеджер по умолчанию (для тестов/отладки). */
export function isDefaultManagerHooked(): boolean {
  return managerHooked;
}

// Модуль импортируется только в клиентском бандле (HUD/движок),
// но защита от SSR/тестов обязательна.
if (typeof window !== 'undefined') {
  attachAssetLoadingManager(DefaultLoadingManager);
}
