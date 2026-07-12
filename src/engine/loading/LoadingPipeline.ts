/**
 * Unified loading pipeline — single source of truth for boot → first playable progress.
 * Stages emit { stage, pct, message } to subscribers (LoadingScreen, dev overlay).
 */

import { eventBus } from '@/engine/EventBus';
import { LOADING_PLAYABLE_HOLD_MS } from '@/shared/constants/transitionTimings';

/** Ordered boot milestones — single source of truth for stage order and pct. */
const LOADING_STAGES = [
  { id: 'boot_start', pct: 0 },
  { id: 'boot_data', pct: 12 },
  { id: 'game_page', pct: 22 },
  { id: 'orchestrator', pct: 28 },
  { id: 'narrative_data', pct: 48 },
  { id: 'physics_wasm', pct: 62 },
  { id: 'combat_ui', pct: 68 },
  { id: 'canvas_init', pct: 82 },
  { id: 'first_frame', pct: 94 },
  { id: 'playable', pct: 97 },
  { id: 'complete', pct: 100 },
] as const;

type LoadingProgressStageId = (typeof LOADING_STAGES)[number]['id'];

export type LoadingStageId = LoadingProgressStageId | 'error';

export interface LoadingPipelineSnapshot {
  stage: LoadingStageId;
  pct: number;
  message: string;
  error?: string;
  /** Short support reference derived from the error payload. */
  errorCode?: string;
}

type Listener = (snapshot: LoadingPipelineSnapshot) => void;

/** Deterministic support code for loading failures (e.g. BOOT-3FA1). */
export function deriveLoadingErrorCode(error: unknown, message: string): string {
  const seed = error instanceof Error ? `${error.name}:${message}` : message;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) >>> 0;
  }
  return `BOOT-${(hash & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

type LoadingPipelineEventTarget = Pick<typeof eventBus, 'on'>;

const STAGE_PCT: Record<LoadingStageId, number> = {
  ...Object.fromEntries(LOADING_STAGES.map((stage) => [stage.id, stage.pct])),
  error: 0,
} as Record<LoadingStageId, number>;

const STAGE_MESSAGES: Record<LoadingStageId, string> = {
  boot_start: 'Инициализация ядра...',
  boot_data: 'Загрузка механик мира...',
  game_page: 'Подключение интерфейса...',
  orchestrator: 'Запуск оркестратора...',
  narrative_data: 'Загрузка сюжета и квестов...',
  physics_wasm: 'Инициализация физики...',
  combat_ui: 'Подготовка боевых систем...',
  canvas_init: 'Инициализация 3D...',
  first_frame: 'Первый кадр...',
  playable: 'Готово',
  complete: 'Готово',
  error: 'Ошибка загрузки',
};

function createInitialSnapshot(): LoadingPipelineSnapshot {
  return { stage: 'boot_start', pct: 0, message: STAGE_MESSAGES.boot_start };
}

export class LoadingPipeline {
  private snapshot: LoadingPipelineSnapshot = createInitialSnapshot();
  private readonly listeners = new Set<Listener>();
  private readonly firstFrameUnsubscribe: () => void;
  private firstFramePlayableRaf = 0;
  private completeTimer: ReturnType<typeof setTimeout> | null = null;
  private playableEnteredAt: number | null = null;

  constructor(private readonly events: LoadingPipelineEventTarget = eventBus) {
    this.firstFrameUnsubscribe = this.events.on('canvas:first-frame', this.onCanvasFirstFrame);
  }

  /** Advance to a pipeline stage. Idempotent — never regresses pct. */
  reportStage(stage: LoadingStageId, message?: string): void {
    if (stage === 'complete') {
      if (this.snapshot.stage === 'complete') return;
      if (this.snapshot.stage !== 'playable') return;
      const elapsed = Date.now() - (this.playableEnteredAt ?? 0);
      if (elapsed < LOADING_PLAYABLE_HOLD_MS) {
        this.scheduleCompleteAfterPlayableHold();
        return;
      }
      this.setStage('complete', message);
      return;
    }

    if (stage === 'error') return;

    const nextPct = STAGE_PCT[stage];
    if (nextPct < this.snapshot.pct) return;
    this.setStage(stage, message);
  }

  /** Sub-progress within current stage (pct is clamped between prev stage and next). */
  reportSubProgress(fraction: number, message?: string): void {
    const idx = LOADING_STAGES.findIndex((stage) => stage.id === this.snapshot.stage);
    const floor = idx > 0 ? LOADING_STAGES[idx]!.pct : 0;
    const ceiling =
      idx >= 0 && idx < LOADING_STAGES.length - 1
        ? LOADING_STAGES[idx + 1]!.pct
        : 100;
    const pct = Math.round(floor + (ceiling - floor) * Math.min(1, Math.max(0, fraction)));
    if (pct <= this.snapshot.pct && !message) return;
    this.snapshot = {
      ...this.snapshot,
      pct: Math.max(this.snapshot.pct, pct),
      message: message ?? this.snapshot.message,
    };
    this.emit();
  }

  reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const errorCode = deriveLoadingErrorCode(error, message);
    if (
      this.snapshot.stage === 'error' &&
      this.snapshot.error === message &&
      this.snapshot.errorCode === errorCode
    ) {
      return;
    }

    this.clearFirstFrameFinalize();
    this.playableEnteredAt = null;
    this.snapshot = {
      stage: 'error',
      pct: this.snapshot.pct,
      message: STAGE_MESSAGES.error,
      error: message,
      errorCode,
    };
    this.emit();
    eventBus.emit('boot:failed', { reason: message, errorCode });
  }

  getSnapshot(): LoadingPipelineSnapshot {
    return this.snapshot;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.clearFirstFrameFinalize();
    this.playableEnteredAt = null;
    this.snapshot = createInitialSnapshot();
    this.emit();
  }

  /** Tear down timers, bus subscription, and listeners (for tests / discarded instances). */
  dispose(): void {
    this.clearFirstFrameFinalize();
    this.firstFrameUnsubscribe();
    this.playableEnteredAt = null;
    this.snapshot = createInitialSnapshot();
    this.listeners.clear();
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.snapshot);
  }

  private clearFirstFrameFinalize(): void {
    if (this.firstFramePlayableRaf) {
      cancelAnimationFrame(this.firstFramePlayableRaf);
      this.firstFramePlayableRaf = 0;
    }
    if (this.completeTimer !== null) {
      clearTimeout(this.completeTimer);
      this.completeTimer = null;
    }
  }

  private setStage(stage: LoadingStageId, message?: string): void {
    if (stage === 'playable') {
      this.playableEnteredAt = Date.now();
    } else if (stage !== 'complete') {
      this.playableEnteredAt = null;
    }

    this.snapshot = {
      stage,
      pct: STAGE_PCT[stage],
      message: message ?? STAGE_MESSAGES[stage],
      error: undefined,
      errorCode: undefined,
    };
    this.emit();
  }

  private scheduleCompleteAfterPlayableHold(): void {
    if (this.snapshot.stage !== 'playable' || this.completeTimer !== null) return;
    const elapsed = Date.now() - (this.playableEnteredAt ?? 0);
    const delay = Math.max(0, LOADING_PLAYABLE_HOLD_MS - elapsed);
    this.completeTimer = setTimeout(() => {
      this.completeTimer = null;
      if (this.snapshot.stage === 'playable') {
        this.setStage('complete');
      }
    }, delay);
  }

  private onCanvasFirstFrame = (): void => {
    if (
      this.snapshot.stage === 'complete' ||
      this.snapshot.stage === 'error' ||
      this.snapshot.stage === 'playable' ||
      this.firstFramePlayableRaf
    ) {
      return;
    }

    this.clearFirstFrameFinalize();
    this.setStage('first_frame');

    this.firstFramePlayableRaf = requestAnimationFrame(() => {
      this.firstFramePlayableRaf = 0;
      if (this.snapshot.stage !== 'first_frame') return;
      this.setStage('playable');
      this.scheduleCompleteAfterPlayableHold();
    });
  };
}

export function createLoadingPipeline(events: LoadingPipelineEventTarget = eventBus): LoadingPipeline {
  return new LoadingPipeline(events);
}

/** App-wide boot pipeline instance. Tests should use createLoadingPipeline(). */
export const loadingPipeline = createLoadingPipeline();
