/* ─── Volodka RPG – selector memoization utilities ─── */

type MemoEntry<R> = {
  deps: readonly unknown[];
  result: R;
};

function depsEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((d, i) => Object.is(d, b[i]));
}

/**
 * Creates a memoized getter that reuses the last result when dependency
 * values are referentially equal (Object.is).
 */
export function createMemoSelector<D extends readonly unknown[], R>(
  getDeps: () => D,
  compute: (...deps: D) => R,
): () => R {
  let cache: MemoEntry<R> | null = null;

  return () => {
    const deps = getDeps();
    if (cache && depsEqual(cache.deps, deps)) {
      return cache.result;
    }
    const result = compute(...deps);
    cache = { deps, result };
    return result;
  };
}

/**
 * Cache a derived value keyed on a single source reference (e.g. store array).
 * Returns the cached result when `source` is the same reference as last call.
 */
export function memoizeBySourceRef<S, R>(
  source: S,
  cache: { source: S | null; result: R | null },
  compute: (source: S) => R,
): R {
  if (cache.source === source && cache.result !== null) {
    return cache.result;
  }
  const result = compute(source);
  cache.source = source;
  cache.result = result;
  return result;
}
