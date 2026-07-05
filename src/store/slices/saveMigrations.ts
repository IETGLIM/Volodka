/**
 * Save format migrations — bump SAVE_VERSION and add a step when breaking changes ship.
 *
 * [roadmap:SAVE-01] [roadmap:TEST-01] The migration framework is now tested
 * (see saveMigrations.test.ts — 13 tests covering edge cases + sequential
 * application + data preservation). The MIGRATIONS table is intentionally
 * empty: SAVE_VERSION=1, no breaking changes shipped yet. When the first
 * breaking change ships:
 * 1. Bump SAVE_VERSION in saveSchema.ts (1 → 2)
 * 2. Add a migration step here: `1: (data) => ({ ...data, newField: 'default' })`
 * 3. Add a test case in saveMigrations.test.ts exercising the real migration
 * The framework handles the rest — sequential application, edge cases,
 * data preservation are all proven by the existing tests.
 */

import { SAVE_VERSION } from '@/shared/validation/saveSchema';

export type SaveMigrationStep = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migration from version N upgrades stored data to version N + 1.
 * Register new steps when SAVE_VERSION is incremented.
 *
 * Keys are the SOURCE version (the version being migrated FROM).
 * Example: when bumping SAVE_VERSION from 1 to 2, add `1: (data) => ...`
 * which transforms v1 saves into v2 saves.
 */
const MIGRATIONS: Partial<Record<number, SaveMigrationStep>> = {
  // No migrations yet — SAVE_VERSION=1 is the initial release.
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
