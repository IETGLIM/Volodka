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

export type StreamingPrefetchReason = 'scene_enter' | 'portal_hint' | 'manual';

export type StreamingDebugSnapshot = {
  /** Последняя сцена из `scene:enter`; `null` до первого входа. */
  activeSceneId: SceneId | null;
  activeChunkIds: readonly StreamingChunkId[];
  unloadingChunkIds: readonly StreamingChunkId[];
  pendingActivationChunkIds: readonly StreamingChunkId[];
  prefetchQueueLength: number;
  budgetTextureBytesApprox: number;
  rapierActiveBodiesApprox?: number;
};

export type GetStreamingProfile = (sceneId: SceneId) => SceneStreamingProfile | undefined;

export interface SceneStreamingCoordinatorApi {
  prefetch(sceneId: SceneId, reason: StreamingPrefetchReason): void;
  activateChunk(chunkId: StreamingChunkId): void;
  deactivateChunk(chunkId: StreamingChunkId): void;
  getDebugSnapshot(): StreamingDebugSnapshot;
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
  private prefetchQueueLength = 0;
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
        this.currentSceneId = p.sceneId;
        this.clearChunkState();
        this.prefetchQueueLength = 0;
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
    this.clearChunkState();
    this.currentSceneId = null;
  }

  prefetch(sceneId: SceneId, _reason: StreamingPrefetchReason): void {
    const profile = this.getStreamingProfile(sceneId);
    if (!profile) return;
    // v0.1: только счётчик очереди для HUD/тестов; реальная очередь — в следующих PR.
    this.prefetchQueueLength += profile.neighborSceneIds.length;
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
      prefetchQueueLength: this.prefetchQueueLength,
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
