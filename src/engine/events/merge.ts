/** Merge multiple domain event maps into one flat EventMap. */
export type MergeEventMaps<T extends readonly Record<string, unknown>[]> = T extends readonly [
  infer Head extends Record<string, unknown>,
  ...infer Tail extends readonly Record<string, unknown>[],
]
  ? Head & MergeEventMaps<Tail>
  : object;

/** Extract keys belonging to a domain prefix (e.g. `photo:` → PhotoEventKey). */
export type DomainEventKeys<
  Map extends Record<string, unknown>,
  Prefix extends string,
> = Extract<keyof Map, `${Prefix}${string}`>;
