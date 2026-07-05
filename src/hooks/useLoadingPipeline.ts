import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  loadingPipeline,
  type LoadingPipelineSnapshot,
  type LoadingStageId,
} from '@/engine/loading/LoadingPipeline';

function subscribe(onStoreChange: () => void): () => void {
  return loadingPipeline.subscribe(onStoreChange);
}

function getSnapshot(): LoadingPipelineSnapshot {
  return loadingPipeline.getSnapshot();
}

export type LoadingPipelineMeta = Pick<
  LoadingPipelineSnapshot,
  'stage' | 'message' | 'error' | 'errorCode'
>;

let cachedMetaSnapshot: LoadingPipelineMeta = {
  stage: 'boot_start',
  message: '',
};

function getMetaSnapshot(): LoadingPipelineMeta {
  const snap = loadingPipeline.getSnapshot();
  if (
    cachedMetaSnapshot.stage === snap.stage &&
    cachedMetaSnapshot.message === snap.message &&
    cachedMetaSnapshot.error === snap.error &&
    cachedMetaSnapshot.errorCode === snap.errorCode
  ) {
    return cachedMetaSnapshot;
  }
  cachedMetaSnapshot = {
    stage: snap.stage,
    message: snap.message,
    error: snap.error,
    errorCode: snap.errorCode,
  };
  return cachedMetaSnapshot;
}

/** Full pipeline snapshot — re-renders on every emit (including sub-progress pct). */
export function useLoadingPipeline(): LoadingPipelineSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Stage, message, and error fields — skips re-renders when only pct changes. */
export function useLoadingPipelineMeta(): LoadingPipelineMeta {
  return useSyncExternalStore(subscribe, getMetaSnapshot, getMetaSnapshot);
}

const PROGRESS_SNAP_EPSILON = 0.25;
const PROGRESS_MIN_STEP = 0.35;

/**
 * Smooth displayed progress via rAF — target pct from pipeline, minimal React updates.
 * Animation runs only while catching up to the target.
 */
export function useAnimatedLoadingProgress(): number {
  const initial = loadingPipeline.getSnapshot().pct;
  const [displayPct, setDisplayPct] = useState(initial);
  const displayRef = useRef(initial);
  const targetRef = useRef(initial);
  const rafRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const tick = useCallback(() => {
    const target = targetRef.current;
    const current = displayRef.current;

    if (Math.abs(current - target) <= PROGRESS_SNAP_EPSILON) {
      if (current !== target) {
        displayRef.current = target;
        setDisplayPct(target);
      }
      stop();
      return;
    }

    const step = Math.max(PROGRESS_MIN_STEP, Math.abs(target - current) * 0.12);
    const next = Math.min(
      100,
      Math.max(0, current + Math.sign(target - current) * step),
    );
    displayRef.current = next;
    setDisplayPct(next);
    rafRef.current = requestAnimationFrame(tick);
  }, [stop]);

  const scheduleTick = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    targetRef.current = loadingPipeline.getSnapshot().pct;
    displayRef.current = targetRef.current;
    setDisplayPct(targetRef.current);

    return loadingPipeline.subscribe((snap) => {
      if (snap.pct === targetRef.current) return;
      targetRef.current = snap.pct;
      scheduleTick();
    });
  }, [scheduleTick]);

  useEffect(() => stop, [stop]);

  return Math.round(displayPct);
}

/** Subscribe to a single pipeline stage transition. */
export function useLoadingPipelineStage(): LoadingStageId {
  return useLoadingPipelineMeta().stage;
}
