/* ─── Normalized TTL flag map (key → flag) ─── */

export interface ActiveTTLFlag {
  key: string;
  poemId: string;
  expiryTimestamp: number;
}

export type ActiveTTLFlagMap = Record<string, ActiveTTLFlag>;

export function createEmptyActiveTTLFlagMap(): ActiveTTLFlagMap {
  return {};
}

export function activeTTLFlagKeys(map: ActiveTTLFlagMap | undefined | null): string[] {
  if (!map) return [];
  return Object.keys(map);
}

/** Legacy saves stored flags as an array — normalize to a keyed map (last entry wins). */
export function normalizeActiveTTLFlagsFromSave(
  input: ActiveTTLFlagMap | ActiveTTLFlag[] | undefined | null,
): ActiveTTLFlagMap {
  if (!input) return createEmptyActiveTTLFlagMap();
  if (Array.isArray(input)) {
    const map = createEmptyActiveTTLFlagMap();
    for (const flag of input) {
      if (flag?.key) {
        map[flag.key] = {
          key: flag.key,
          poemId: flag.poemId ?? '',
          expiryTimestamp: flag.expiryTimestamp,
        };
      }
    }
    return map;
  }
  return input;
}

export function partitionExpiredActiveTTLFlags(
  map: ActiveTTLFlagMap,
  now: number,
): { expired: ActiveTTLFlag[]; active: ActiveTTLFlagMap } {
  const expired: ActiveTTLFlag[] = [];
  const active = createEmptyActiveTTLFlagMap();

  for (const flag of Object.values(map)) {
    if (now >= flag.expiryTimestamp) {
      expired.push(flag);
    } else {
      active[flag.key] = flag;
    }
  }

  return { expired, active };
}
