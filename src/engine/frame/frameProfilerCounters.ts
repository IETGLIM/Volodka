/**
 * Dev-only counters reset at the start of each frame budget pass.
 *
 * [roadmap:ARCH-07] Removed dead `installFrameProfilerInstrumentation` that
 * set `globalThis.__volodka_frame_profiler_subscribe` (never read by anything).
 * `wrapStoreSubscribe` below is the actual mechanism used in
 * `bindApplicationLayers.ts`.
 */

let zustandNotificationsThisFrame = 0;
let reactRendersThisFrame = 0;

export function resetFrameProfilerCounters(): void {
  zustandNotificationsThisFrame = 0;
  reactRendersThisFrame = 0;
}

export function incrementZustandNotification(): void {
  zustandNotificationsThisFrame++;
}

export function incrementReactRender(): void {
  reactRendersThisFrame++;
}

export function getZustandNotificationsThisFrame(): number {
  return zustandNotificationsThisFrame;
}

export function getReactRendersThisFrame(): number {
  return reactRendersThisFrame;
}

type SubscribeFn = <TState>(
  listener: (state: TState, prevState: TState) => void,
) => () => void;

export function wrapStoreSubscribe<T extends SubscribeFn>(base: T): T {
  if (!import.meta.env.DEV) return base;
  function wrapped<TState>(
    listener: (state: TState, prevState: TState) => void,
  ): () => void {
    return base((state: TState, prevState: TState) => {
      incrementZustandNotification();
      listener(state, prevState);
    });
  }
  return wrapped as T;
}
