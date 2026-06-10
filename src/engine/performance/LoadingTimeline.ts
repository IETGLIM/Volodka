/**
 * Navigation → first-scene-playable timeline (Performance API marks/measures).
 */

export const LOADING_MARKS = {
  appStart: 'volodka:app-start',
  orchestratorMount: 'volodka:orchestrator-mount',
  gameDataReady: 'volodka:game-data-ready',
  canvasMounted: 'volodka:canvas-mounted',
  firstFrame: 'volodka:first-frame',
  firstScenePlayable: 'volodka:first-scene-playable',
} as const;

export type LoadingMarkName = (typeof LOADING_MARKS)[keyof typeof LOADING_MARKS];

export interface LoadingTimelineSnapshot {
  appStartMs: number;
  orchestratorMountMs: number | null;
  gameDataReadyMs: number | null;
  canvasMountedMs: number | null;
  firstFrameMs: number | null;
  firstScenePlayableMs: number | null;
}

let gameDataReadyFlag = false;

function navStart(): number {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return nav?.startTime ?? 0;
}

function markOnce(name: LoadingMarkName): void {
  if (performance.getEntriesByName(name, 'mark').length > 0) return;
  performance.mark(name);
}

export function markAppStart(): void {
  markOnce(LOADING_MARKS.appStart);
}

export function markOrchestratorMount(): void {
  markOnce(LOADING_MARKS.orchestratorMount);
}

export function markGameDataReady(): void {
  if (gameDataReadyFlag) return;
  gameDataReadyFlag = true;
  markOnce(LOADING_MARKS.gameDataReady);
  tryCompleteFirstScenePlayable();
}

export function markCanvasMounted(): void {
  markOnce(LOADING_MARKS.canvasMounted);
}

export function markFirstFrame(): void {
  markOnce(LOADING_MARKS.firstFrame);
  tryCompleteFirstScenePlayable();
}

function tryCompleteFirstScenePlayable(): void {
  if (!gameDataReadyFlag) return;
  if (performance.getEntriesByName(LOADING_MARKS.firstFrame, 'mark').length === 0) return;
  if (performance.getEntriesByName(LOADING_MARKS.firstScenePlayable, 'mark').length > 0) return;

  performance.mark(LOADING_MARKS.firstScenePlayable);
  try {
    performance.measure(
      'volodka:first-scene-playable-duration',
      LOADING_MARKS.appStart,
      LOADING_MARKS.firstScenePlayable,
    );
  } catch {
    /* appStart mark may be missing in tests */
  }

  if (import.meta.env.DEV) {
    const snap = getLoadingTimelineSnapshot();
    console.info(
      `[perf] First scene playable: ${snap.firstScenePlayableMs?.toFixed(0) ?? '?'} ms`,
    );
  }
}

function msSinceNav(markName: string): number | null {
  const entries = performance.getEntriesByName(markName, 'mark');
  if (entries.length === 0) return null;
  return entries[0].startTime - navStart();
}

export function getLoadingTimelineSnapshot(): LoadingTimelineSnapshot {
  return {
    appStartMs: msSinceNav(LOADING_MARKS.appStart) ?? 0,
    orchestratorMountMs: msSinceNav(LOADING_MARKS.orchestratorMount),
    gameDataReadyMs: msSinceNav(LOADING_MARKS.gameDataReady),
    canvasMountedMs: msSinceNav(LOADING_MARKS.canvasMounted),
    firstFrameMs: msSinceNav(LOADING_MARKS.firstFrame),
    firstScenePlayableMs: msSinceNav(LOADING_MARKS.firstScenePlayable),
  };
}

export function getFirstScenePlayableMs(): number | null {
  return msSinceNav(LOADING_MARKS.firstScenePlayable);
}
