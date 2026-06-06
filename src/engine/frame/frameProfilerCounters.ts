/** Dev-only counters reset at the start of each frame budget pass. */

let zustandNotificationsThisFrame = 0;
let reactRendersThisFrame = 0;
let instrumentationInstalled = false;

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

/** Patch Zustand subscribe once in dev to count listener invocations per frame. */
export function installFrameProfilerInstrumentation(
  subscribe: (listener: (state: unknown, prevState: unknown) => void) => () => void,
): void {
  if (instrumentationInstalled || !import.meta.env.DEV) return;
  instrumentationInstalled = true;

  const originalSubscribe = subscribe;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__volodka_frame_profiler_subscribe = (
    listener: (state: unknown, prevState: unknown) => void,
  ) =>
    originalSubscribe((state, prevState) => {
      incrementZustandNotification();
      listener(state, prevState);
    });
}

export function wrapStoreSubscribe<T>(
  subscribe: (
    listener: (state: T, prevState: T) => void,
  ) => () => void,
): (listener: (state: T, prevState: T) => void) => () => void {
  if (!import.meta.env.DEV) return subscribe;
  return (listener) =>
    subscribe((state, prevState) => {
      incrementZustandNotification();
      listener(state, prevState);
    });
}
