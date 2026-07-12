/** DEV-only Zustand subscribe wrapper — bound from bootstrap to avoid store→engine import. */

type SubscribeFn = <TState>(
  listener: (state: TState, prevState: TState) => void,
) => () => void;

let wrapSubscribe: <T extends SubscribeFn>(base: T) => T = (base) => base;

export function bindStoreSubscribeProfiler(
  wrap: <T extends SubscribeFn>(base: T) => T,
): void {
  wrapSubscribe = wrap;
}

export function wrapStoreSubscribeIfDev<T extends SubscribeFn>(base: T): T {
  return wrapSubscribe(base);
}
