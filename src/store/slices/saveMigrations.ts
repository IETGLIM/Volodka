/* Save format migrations — bump SAVE_VERSION and add a step when breaking changes ship. */

import { SAVE_VERSION } from '@/shared/validation/saveSchema';

export type SaveMigrationStep = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migration from version N upgrades stored data to version N + 1.
 * Register new steps when SAVE_VERSION is incremented.
 */
const MIGRATIONS: Partial<Record<number, SaveMigrationStep>> = {
  // Example when bumping to v2:
  // 1: (data) => ({ ...data, newField: 'default' }),
};

function readSaveVersion(data: Record<string, unknown>): number {
  const raw = data.saveVersion;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0
    ? Math.floor(raw)
    : 0;
}

/**
 * Apply sequential migrations until `saveVersion` matches SAVE_VERSION.
 * Returns the same reference when already current; otherwise a shallow-cloned object.
 */
export function migrateSaveData(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed;
  }

  let data = parsed as Record<string, unknown>;
  let version = readSaveVersion(data);

  if (version >= SAVE_VERSION) {
    return data;
  }

  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    data = step ? step({ ...data }) : { ...data };
    version += 1;
    data.saveVersion = version;
  }

  return data;
}
