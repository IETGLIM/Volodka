/* ─── Volodka RPG – Versioned save migrations ─── */
/* Runs BEFORE Zod validation on load. Each migrator upgrades fromVersion → fromVersion+1.
 * Bump SAVE_VERSION in saveSchema when adding a migrator; reject unknown/future majors loudly. */

export type SaveMigrationResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

/** Upgrade fromVersion → fromVersion + 1. Must set saveVersion on the result. */
type SaveMigrator = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * v1 → v2: lift soft Zod transforms into an explicit migration step.
 * Legacy activeTTLFlags were stored as an array; normalize to a keyed map.
 */
function migrateV1toV2(data: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...data, saveVersion: 2 };

  const flags = next.activeTTLFlags;
  if (Array.isArray(flags)) {
    const map: Record<string, unknown> = {};
    for (const entry of flags) {
      if (
        entry &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        typeof (entry as { key?: unknown }).key === 'string'
      ) {
        const key = (entry as { key: string }).key;
        map[key] = entry;
      }
    }
    next.activeTTLFlags = map;
  }

  return next;
}

/**
 * v2 → v3: persist Thought Cabinet state (acquiredThoughtIds / equippedThoughtIds).
 * Previously these lived only in the live player store and were silently dropped on
 * save/load — equipped thought bonuses vanished after reload (CRITICAL data loss).
 * v2 saves get empty arrays (matching the previous lossy behavior) so nothing breaks.
 */
function migrateV2toV3(data: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...data, saveVersion: 3 };
  if (!Array.isArray(next.acquiredThoughtIds)) next.acquiredThoughtIds = [];
  if (!Array.isArray(next.equippedThoughtIds)) next.equippedThoughtIds = [];
  return next;
}

/** Migrators keyed by the version they upgrade FROM. */
const MIGRATORS: Readonly<Record<number, SaveMigrator>> = {
  1: migrateV1toV2,
  2: migrateV2toV3,
};

function readSaveVersion(data: Record<string, unknown>): number | null {
  if (data.saveVersion === undefined || data.saveVersion === null) {
    return 1;
  }
  if (typeof data.saveVersion !== 'number' || !Number.isInteger(data.saveVersion)) {
    return null;
  }
  return data.saveVersion;
}

/**
 * Apply ordered migrators until `targetVersion` (normally SAVE_VERSION).
 * Unknown / future major versions fail with a Russian error string (matches validateSaveData).
 */
export function migrateSave(raw: unknown, targetVersion: number): SaveMigrationResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      error: 'Сохранение повреждено: ожидался объект сохранения.',
    };
  }

  let data: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  const version = readSaveVersion(data);

  if (version === null || version < 1) {
    return {
      success: false,
      error: `Неизвестная версия сохранения: ${String(data.saveVersion)}.`,
    };
  }

  if (version > targetVersion) {
    return {
      success: false,
      error: `Сохранение из будущей версии игры (v${version}, поддерживается v${targetVersion}). Обновите игру.`,
    };
  }

  let current = version;
  while (current < targetVersion) {
    const migrator = MIGRATORS[current];
    if (!migrator) {
      return {
        success: false,
        error: `Нет миграции с версии ${current} на ${current + 1}.`,
      };
    }
    data = migrator(data);
    current += 1;
    data.saveVersion = current;
  }

  return { success: true, data };
}
