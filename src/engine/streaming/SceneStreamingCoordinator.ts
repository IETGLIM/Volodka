/**
 * Координатор стриминга чанков 3D-обхода (чистый TS).
 * Без `streaming` в `SceneConfig` для текущей сцены — полный no-op.
 * @see docs/scene-streaming-spec.md
 */

import type { SceneId } from '@/data/types';
import type { SceneStreamingProfile, StreamingChunkId } from '@/config/scenes';
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

export class SceneStreamingCoordinator implements SceneStreamingCoordinatorApi {
  private readonly bus: Bus;
  private readonly getStreamingProfile: GetStreamingProfile;

  private currentSceneId: SceneId | null = null;
  private readonly activeChunks = new Set<StreamingChunkId>();
  private readonly unloadingChunks = new Set<StreamingChunkId>();
  private readonly pendingActivation = new Set<StreamingChunkId>();
  private prefetchQueueLength = 0;

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
      this.bus.on('streaming:chunk_activated', (p) => this.onChunkActivated(p.chunkId)),
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
    return {
      activeSceneId: this.currentSceneId,
      activeChunkIds: [...this.activeChunks],
      unloadingChunkIds: [...this.unloadingChunks],
      pendingActivationChunkIds: [...this.pendingActivation],
      prefetchQueueLength: this.prefetchQueueLength,
      budgetTextureBytesApprox: 0,
      rapierActiveBodiesApprox: undefined,
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
  }

  private onChunkActivated(chunkId: StreamingChunkId): void {
    const profile = this.profileForCurrentScene();
    if (!profile) return;
    if (!chunkBelongsToProfile(profile, chunkId)) return;
    if (!this.pendingActivation.has(chunkId)) return;

    this.pendingActivation.delete(chunkId);
    this.activeChunks.add(chunkId);
    this.unloadingChunks.delete(chunkId);
  }

  private onChunkDeactivated(chunkId: StreamingChunkId): void {
    const profile = this.profileForCurrentScene();
    if (!profile) return;
    if (!chunkBelongsToProfile(profile, chunkId)) return;

    this.unloadingChunks.delete(chunkId);
    this.activeChunks.delete(chunkId);
    this.pendingActivation.delete(chunkId);
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
