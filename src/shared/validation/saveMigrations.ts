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
 * v2 → v3: Convert poem power cooldowns from real-time ms to in-game hours.
 * Old saves have `cooldownMs` field and `lastUsed` as epoch timestamp.
 * New saves have `cooldownHours` field and `lastUsed` as game hours (0–24 float).
 */
function migrateV2toV3(data: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...data, saveVersion: 3 };

  const MS_PER_GAME_HOUR = 240_000;
  const poemPowers = next.poemPowers;
  if (poemPowers && typeof poemPowers === 'object' && !Array.isArray(poemPowers)) {
    const migrated: Record<string, Record<string, unknown>> = {};
    for (const [poemId, entry] of Object.entries(poemPowers as Record<string, unknown>)) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'lastUsed' in entry) {
        const e = entry as Record<string, unknown>;
        const isOldSave = typeof e.lastUsed === 'number' && e.lastUsed > 100;
        const cooldownMs = typeof e.cooldownMs === 'number' ? e.cooldownMs : 60_000;
        migrated[poemId] = {
          lastUsed: isOldSave ? 0 : (typeof e.lastUsed === 'number' ? e.lastUsed : 0),
          cooldownHours: cooldownMs / MS_PER_GAME_HOUR,
        };
      }
    }
    next.poemPowers = migrated;
  }

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
