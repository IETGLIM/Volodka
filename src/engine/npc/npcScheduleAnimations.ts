/* ─── Volodka RPG – NPC Schedule-Driven Behavior Animations ───
 *
 * Links NPC schedules (sceneId + activity) to specific activity animations:
 *   - Office worker → typing animation
 *   - Cafe barista → pouring/wiping animation
 *   - Park NPC → sitting on bench, reading animation
 *   - Night NPC → yawning, shivering animation
 *   - Corridor walker → purposeful stride animation
 *   - Sleeping NPC → lying down, deep breath animation
 *
 * At least 6 schedule-to-animation mappings provided.
 * These clip overrides are merged with emotion-driven overrides in
 * `useNpcVisualBehavior` — emotion takes priority when active.
 */

import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import type { SceneId } from '@/config/sceneDefinitions';

/* ─── Schedule context for animation resolution ─── */

export interface NpcScheduleContext {
  /** The current schedule activity (work, read, rest, walk, talk, sleep). */
  readonly activity: string;
  /** The scene where the NPC is currently scheduled. */
  readonly sceneId: SceneId | string;
  /** The hour of the day (0-24) for time-dependent animations. */
  readonly hour?: number;
}

/* ─── Schedule → animation clip override mappings ─── */

/**
 * Map schedule context to specific clip overrides.
 * Each mapping includes the schedule conditions and the resulting overrides.
 */
interface ScheduleAnimationMapping {
  /** Scene id pattern that triggers this mapping (exact match or prefix). */
  readonly sceneIdPattern: string;
  /** Activity that triggers this mapping. */
  readonly activity: string;
  /** Time range (optional) — only active within these hours. */
  readonly hourRange?: readonly [number, number];
  /** The clip overrides to apply. */
  readonly clipOverrides: NpcAnimationClipOverrides;
}

const SCHEDULE_ANIMATION_MAPPINGS: readonly ScheduleAnimationMapping[] = [
  /* ── 1. Office worker → typing animation ── */
  {
    sceneIdPattern: 'volodka_corridor',
    activity: 'work',
    clipOverrides: { sit: 'working', idle: 'idle_working' },
  },

  /* ── 2. Cafe barista → pouring/wiping animation ── */
  {
    sceneIdPattern: 'cafe_evening',
    activity: 'work',
    clipOverrides: { idle: 'idle_working', sit: 'working' },
  },

  /* ── 3. Park NPC → sitting on bench, reading animation ── */
  {
    sceneIdPattern: 'park_day',
    activity: 'read',
    clipOverrides: { sit: 'sitting', idle: 'idle_relaxed' },
  },

  /* ── 4. Night NPC → yawning/shivering animation ── */
  {
    sceneIdPattern: 'street_night',
    activity: 'walk',
    hourRange: [22, 5],
    clipOverrides: { walk: 'walk_tired', idle: 'idle_bored' },
  },

  /* ── 5. Corridor walker → purposeful stride ── */
  {
    sceneIdPattern: 'volodka_corridor',
    activity: 'walk',
    clipOverrides: { walk: 'walk_purposeful' },
  },

  /* ── 6. Sleeping NPC → lying down animation ── */
  {
    sceneIdPattern: 'home_evening',
    activity: 'sleep',
    clipOverrides: { idle: 'sleeping', sit: 'sleeping' },
  },

  /* ── 7. Cafe talker → social idle ── */
  {
    sceneIdPattern: 'cafe_evening',
    activity: 'talk',
    clipOverrides: { idle: 'idle_social', sit: 'sitting' },
  },

  /* ── 8. Room rest → relaxed idle ── */
  {
    sceneIdPattern: 'zarema_albert_room',
    activity: 'rest',
    clipOverrides: { sit: 'sitting', idle: 'idle_relaxed' },
  },
];

/* ─── Resolution logic ─── */

/** Check if an hour falls within a range, handling overnight ranges (e.g. 22→5). */
function hourInRange(hour: number, range: readonly [number, number]): boolean {
  const [start, end] = range;
  if (start <= end) {
    return hour >= start && hour <= end;
  }
  // Overnight range (e.g. 22→5 means 22:00–05:00)
  return hour >= start || hour <= end;
}

/** Check if a sceneId matches a pattern (exact match or prefix). */
function sceneMatchesPattern(sceneId: string, pattern: string): boolean {
  if (sceneId === pattern) return true;
  // Prefix match: pattern like 'cafe_' matches 'cafe_evening', 'cafe_day', etc.
  if (pattern.endsWith('_') && sceneId.startsWith(pattern)) return true;
  // General prefix match
  if (sceneId.startsWith(pattern)) return true;
  return false;
}

/**
 * Resolve schedule-driven clip overrides for an NPC based on
 * their current scene, activity, and optionally time of day.
 *
 * Returns the first matching mapping's clip overrides, or undefined
 * if no mapping matches.
 */
export function resolveScheduleAnimationOverrides(
  ctx: NpcScheduleContext,
): NpcAnimationClipOverrides | undefined {
  for (const mapping of SCHEDULE_ANIMATION_MAPPINGS) {
    // Activity must match exactly
    if (mapping.activity !== ctx.activity) continue;

    // Scene must match the pattern
    if (!sceneMatchesPattern(ctx.sceneId, mapping.sceneIdPattern)) continue;

    // Hour range must match (if specified)
    if (mapping.hourRange && ctx.hour !== undefined) {
      if (!hourInRange(ctx.hour, mapping.hourRange)) continue;
    }

    return mapping.clipOverrides;
  }

  return undefined;
}

/**
 * Merge schedule-driven overrides with existing activity overrides.
 * Schedule overrides take priority over generic activity overrides
 * but are overridden by emotion-driven overrides (handled elsewhere).
 */
export function mergeScheduleClipOverrides(
  scheduleOverrides: NpcAnimationClipOverrides | undefined,
  activityOverrides: NpcAnimationClipOverrides | undefined,
): NpcAnimationClipOverrides | undefined {
  if (!scheduleOverrides && !activityOverrides) return undefined;
  if (!scheduleOverrides) return activityOverrides;
  if (!activityOverrides) return scheduleOverrides;
  // Schedule overrides take priority, activity fills in gaps
  return { ...activityOverrides, ...scheduleOverrides };
}
