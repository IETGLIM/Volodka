/**
 * Координатор стриминга чанков 3D-обхода (чистый TS).
 * Без `streaming` в `SceneConfig` для текущей сцены — полный no-op.
 * @see docs/scene-streaming-spec.md
 */

import type { SceneId } from '@/data/types';
import type { SceneStreamingProfile } from '@/config/scenes';
import type { StreamingChunkId } from '@/data/streamingChunkId';
import { SCENE_CONFIG } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { retainGltfModelUrl, releaseGltfModelUrl } from '@/lib/gltfModelCache';
import { collectPrefetchGltfUrlsForScene } from '@/lib/streamingPrefetchAssets';

export type StreamingPrefetchReason = 'scene_enter' | 'portal_hint' | 'manual';

export type StreamingPrefetchQueueEntry = {
  /** Сцена, для которой подгружаем соседний контент (манифест `streaming`). */
  targetSceneId: SceneId;
  reason: StreamingPrefetchReason;
  /** Сцена, из профиля которой взяты соседи (источник prefetch). */
  sourceSceneId: SceneId;
};

export type StreamingDebugSnapshot = {
  /** Последняя сцена из `scene:enter`; `null` до первого входа. */
  activeSceneId: SceneId | null;
  activeChunkIds: readonly StreamingChunkId[];
  unloadingChunkIds: readonly StreamingChunkId[];
  pendingActivationChunkIds: readonly StreamingChunkId[];
  prefetchQueueLength: number;
  /** Первые цели prefetch (для HUD / отладки). */
  prefetchTargetsPreview: readonly SceneId[];
  budgetTextureBytesApprox: number;
  rapierActiveBodiesApprox?: number;
};

export type GetStreamingProfile = (sceneId: SceneId) => SceneStreamingProfile | undefined;

export interface SceneStreamingCoordinatorApi {
  prefetch(sceneId: SceneId, reason: StreamingPrefetchReason): void;
  activateChunk(chunkId: StreamingChunkId): void;
  deactivateChunk(chunkId: StreamingChunkId): void;
  getDebugSnapshot(): StreamingDebugSnapshot;
  /**
   * Снимает голову очереди prefetch и вызывает `retainGltfModelUrl` для URL целевой сцены.
   * Перед следующим `scene:enter` warm-retain снимается (`releaseGltfModelUrl` по счётчикам).
   * @returns true если была обработана хотя бы одна цель.
   */
  drainPrefetchHeadApplyRetain(): boolean;
}

type Bus = {
  emit: typeof eventBus.emit;
  on: typeof eventBus.on;
};

const defaultGetProfile: GetStreamingProfile = (sceneId) => SCENE_CONFIG[sceneId]?.streaming;

function chunkBelongsToProfile(profile: SceneStreamingProfile, chunkId: StreamingChunkId): boolean {
  const chunks = profile.chunks;
  if (!chunks?.length) return false;
  return chunks.some((c) => c.id === chunkId);
}

/** Сумма оценочных байт ассетов чанка (текстуры + геометрия из манифеста профиля). */
function sumChunkManifestBytes(
  profile: SceneStreamingProfile,
  chunkId: StreamingChunkId
): number {
  const chunk = profile.chunks?.find((c) => c.id === chunkId);
  if (!chunk?.assets?.length) return 0;
  let n = 0;
  for (const a of chunk.assets) {
    n += a.estimatedTextureBytes ?? 0;
    n += a.estimatedGeometryBytes ?? 0;
  }
  return n;
}

export class SceneStreamingCoordinator implements SceneStreamingCoordinatorApi {
  private readonly bus: Bus;
  private readonly getStreamingProfile: GetStreamingProfile;

  private currentSceneId: SceneId | null = null;
  private readonly activeChunks = new Set<StreamingChunkId>();
  private readonly unloadingChunks = new Set<StreamingChunkId>();
  private readonly pendingActivation = new Set<StreamingChunkId>();
  /** FIFO: соседние `SceneId` для мягкого prefetch (счётчики/HUD; обработчик retain — по мере появления). */
  private readonly prefetchQueue: StreamingPrefetchQueueEntry[] = [];
  /** Сколько раз prefetch вызвал `retainGltfModelUrl` по URL (для симметричного release при смене сцены). */
  private readonly prefetchWarmRefCount = new Map<string, number>();
  /** Последний переданный `StreamingChunk` / шиной heuristic для `rapierBodyCount` по чанку. */
  private readonly lastRapierBodyCountByChunk = new Map<StreamingChunkId, number>();

  private unsubscribers: Array<() => void> = [];
  private attached = false;

  constructor(
    bus: Bus = eventBus,
    getStreamingProfile: GetStreamingProfile = defaultGetProfile
  ) {
    this.bus = bus;
    this.getStreamingProfile = getStreamingProfile;
  }

  /** Подписка на `scene:*` и `streaming:chunk_activated` / `deactivated`. Идемпотентна. */
  attach(): void {
    if (this.attached) return;
    this.attached = true;

    this.unsubscribers.push(
      this.bus.on('scene:enter', (p) => {
        this.releasePrefetchWarmRetains();
        this.currentSceneId = p.sceneId;
        this.clearChunkState();
        this.prefetchQueue.length = 0;
        this.enqueueNeighborsForScene(p.sceneId, 'scene_enter');
      }),
      this.bus.on('scene:exit', () => {
        // `scene:enter` следует в том же стеке и обновит `currentSceneId`; здесь только сбрасываем чанки старой сцены.
        this.clearChunkState();
      }),
      this.bus.on('streaming:chunk_activated', (p) => this.onChunkActivated(p)),
      this.bus.on('streaming:chunk_deactivated', (p) => this.onChunkDeactivated(p.chunkId))
    );
  }

  detach(): void {
    for (const u of this.unsubscribers) {
      try {
        u();
      } catch {
        // ignore
      }
    }
    this.unsubscribers = [];
    this.attached = false;
    this.releasePrefetchWarmRetains();
    this.clearChunkState();
    this.prefetchQueue.length = 0;
    this.currentSceneId = null;
  }

  drainPrefetchHeadApplyRetain(): boolean {
    const entry = this.prefetchQueue.shift();
    if (!entry) return false;

    const urls = collectPrefetchGltfUrlsForScene(entry.targetSceneId);
    for (const url of urls) {
      retainGltfModelUrl(url);
      this.prefetchWarmRefCount.set(url, (this.prefetchWarmRefCount.get(url) ?? 0) + 1);
    }

    this.bus.emit('streaming:prefetch_warm_applied', {
      targetSceneId: entry.targetSceneId,
      urls,
    });
    return true;
  }

  private releasePrefetchWarmRetains(): void {
    for (const [url, n] of this.prefetchWarmRefCount) {
      for (let i = 0; i < n; i++) {
        releaseGltfModelUrl(url);
      }
    }
    this.prefetchWarmRefCount.clear();
  }

  prefetch(sceneId: SceneId, reason: StreamingPrefetchReason): void {
    this.enqueueNeighborsForScene(sceneId, reason);
  }

  /** Добавляет в очередь соседей из `SceneConfig.streaming.neighborSceneIds` для `sceneId` (без дубликатов цели). */
  private enqueueNeighborsForScene(sceneId: SceneId, reason: StreamingPrefetchReason): void {
    const profile = this.getStreamingProfile(sceneId);
    if (!profile?.neighborSceneIds?.length) return;

    const seen = new Set<SceneId>();
    for (const e of this.prefetchQueue) {
      seen.add(e.targetSceneId);
    }
    if (this.currentSceneId) {
      seen.add(this.currentSceneId);
    }

    for (const n of profile.neighborSceneIds) {
      if (seen.has(n)) continue;
      seen.add(n);
      this.prefetchQueue.push({ targetSceneId: n, reason, sourceSceneId: sceneId });
    }
  }

  activateChunk(chunkId: StreamingChunkId): void {
    const profile = this.profileForCurrentScene();
    if (!profile || !this.currentSceneId) return;
    if (!chunkBelongsToProfile(profile, chunkId)) return;
    if (this.unloadingChunks.has(chunkId)) return;
    if (this.activeChunks.has(chunkId)) return;
    if (this.pendingActivation.has(chunkId)) return;

    this.pendingActivation.add(chunkId);
    this.bus.emit('streaming:chunk_activation_requested', {
      chunkId,
      sceneId: this.currentSceneId,
    });
  }

  deactivateChunk(chunkId: StreamingChunkId): void {
    const profile = this.profileForCurrentScene();
    if (!profile || !this.currentSceneId) return;
    if (!chunkBelongsToProfile(profile, chunkId)) return;

    if (this.pendingActivation.has(chunkId) && !this.activeChunks.has(chunkId)) {
      this.pendingActivation.delete(chunkId);
      this.bus.emit('streaming:chunk_deactivation_requested', {
        chunkId,
        sceneId: this.currentSceneId,
      });
      return;
    }

    if (!this.activeChunks.has(chunkId)) return;

    this.activeChunks.delete(chunkId);
    this.unloadingChunks.add(chunkId);
    this.bus.emit('streaming:chunk_deactivation_requested', {
      chunkId,
      sceneId: this.currentSceneId,
    });
  }

  getDebugSnapshot(): StreamingDebugSnapshot {
    const profile = this.profileForCurrentScene();
    let budgetTextureBytesApprox = 0;
    if (profile) {
      for (const id of this.activeChunks) {
        budgetTextureBytesApprox += sumChunkManifestBytes(profile, id);
      }
    }

    let rapierSum = 0;
    let rapierAny = false;
    for (const id of this.activeChunks) {
      const v = this.lastRapierBodyCountByChunk.get(id);
      if (v != null) {
        rapierAny = true;
        rapierSum += v;
      }
    }

    return {
      activeSceneId: this.currentSceneId,
      activeChunkIds: [...this.activeChunks],
      unloadingChunkIds: [...this.unloadingChunks],
      pendingActivationChunkIds: [...this.pendingActivation],
      prefetchQueueLength: this.prefetchQueue.length,
      prefetchTargetsPreview: this.prefetchQueue.slice(0, 8).map((e) => e.targetSceneId),
      budgetTextureBytesApprox,
      rapierActiveBodiesApprox: rapierAny ? rapierSum : undefined,
    };
  }

  private profileForCurrentScene(): SceneStreamingProfile | undefined {
    if (!this.currentSceneId) return undefined;
    return this.getStreamingProfile(this.currentSceneId);
  }

  private clearChunkState(): void {
    this.activeChunks.clear();
    this.unloadingChunks.clear();
    this.pendingActivation.clear();
    this.lastRapierBodyCountByChunk.clear();
  }

  /**
   * Подтверждение монтирования чанка в React (после кадра для Rapier).
   * Поддерживает два пути: (1) `activateChunk` → pending → сюда; (2) только React (`StreamingChunk`) без явного activate — типично для текущего `volodka_room`.
   */
  private onChunkActivated(payload: {
    chunkId: StreamingChunkId;
    rapierBodyCount?: number;
  }): void {
    const chunkId = payload.chunkId;
    const profile = this.profileForCurrentScene();
    if (!profile) return;
    if (!chunkBelongsToProfile(profile, chunkId)) return;

    if (this.pendingActivation.has(chunkId)) {
      this.pendingActivation.delete(chunkId);
    }
    this.unloadingChunks.delete(chunkId);
    this.activeChunks.add(chunkId);

    if (payload.rapierBodyCount != null && Number.isFinite(payload.rapierBodyCount)) {
      this.lastRapierBodyCountByChunk.set(chunkId, Math.max(0, Math.floor(payload.rapierBodyCount)));
    }
  }

  private onChunkDeactivated(chunkId: StreamingChunkId): void {
    const profile = this.profileForCurrentScene();
    if (!profile) return;
    if (!chunkBelongsToProfile(profile, chunkId)) return;

    this.unloadingChunks.delete(chunkId);
    this.activeChunks.delete(chunkId);
    this.pendingActivation.delete(chunkId);
    this.lastRapierBodyCountByChunk.delete(chunkId);
  }
}

let singleton: SceneStreamingCoordinator | null = null;

/** Экземпляр по умолчанию (игра). */
export function getSceneStreamingCoordinator(): SceneStreamingCoordinator {
  if (!singleton) {
    singleton = new SceneStreamingCoordinator();
  }
  return singleton;
}

/**
 * Однократный старт подписок для рантайма. Повторный вызов — no-op.
 * В паре с `disposeSceneStreamingCoordinator` при размонтировании рантайма / в тестах.
 */
export function startSceneStreamingCoordinator(): void {
  getSceneStreamingCoordinator().attach();
}

/** Отписка и сброс синглтона (уход из игры, StrictMode, изолированные тесты с синглтоном). */
export function disposeSceneStreamingCoordinator(): void {
  singleton?.detach();
  singleton = null;
}
