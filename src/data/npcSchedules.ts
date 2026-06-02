/* ─── Volodka RPG – NPC daily schedules ─── */
/* Defines where each NPC is at any given hour of the day.
 * Each NPC follows a daily routine with schedule entries that
 * map time ranges to scenes, positions, and activities. */

import type { ScheduleEntry, SceneId } from '@/shared/types/game';

/* ─── NPC Schedule Type ─── */

export interface NPCSchedule {
  id: string;
  npcId: string;
  entries: ScheduleEntry[];
}

/* ─── Individual NPC Schedules ─── */

/**
 * Albert's daily schedule — philosopher at the café.
 * Cafe during the day, park in the afternoon, home at night.
 */
const ALBERT_SCHEDULE: NPCSchedule = {
  id: 'schedule_albert',
  npcId: 'albert',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'zarema_albert_room', position: [-1.5, 0, 1.0], activity: 'sleep' },
    { startHour: 7, endHour: 8, sceneId: 'home_evening', position: [0, 0, -2.0], activity: 'rest' },
    { startHour: 8, endHour: 9, sceneId: 'volodka_corridor', position: [0, 0, 3.0], activity: 'walk' },
    { startHour: 9, endHour: 14, sceneId: 'cafe_evening', position: [-2.5, 0, -3.0], activity: 'read' },
    { startHour: 14, endHour: 15, sceneId: 'park_day', position: [2.0, 0, -1.0], activity: 'walk' },
    { startHour: 15, endHour: 22, sceneId: 'cafe_evening', position: [-2.5, 0, -3.0], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [1.0, 0, -2.0], activity: 'walk' },
  ],
};

/**
 * Zarema's daily schedule — caring neighbour.
 * Home in the morning, cafe midday, park afternoon, home evening.
 */
const ZAREMA_SCHEDULE: NPCSchedule = {
  id: 'schedule_zarema',
  npcId: 'zarema',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'zarema_albert_room', position: [1.5, 0, 1.0], activity: 'sleep' },
    { startHour: 6, endHour: 7, sceneId: 'zarema_albert_room', position: [1.5, 0, 1.0], activity: 'rest' },
    { startHour: 7, endHour: 10, sceneId: 'home_evening', position: [1.5, 0, 2.0], activity: 'work' },
    { startHour: 10, endHour: 11, sceneId: 'volodka_corridor', position: [1.0, 0, 2.0], activity: 'walk' },
    { startHour: 11, endHour: 13, sceneId: 'cafe_evening', position: [1.0, 0, 1.5], activity: 'talk' },
    { startHour: 13, endHour: 16, sceneId: 'park_day', position: [-1.0, 0, 3.0], activity: 'walk' },
    { startHour: 16, endHour: 18, sceneId: 'library_day', position: [2.0, 0, -1.0], activity: 'read' },
    { startHour: 18, endHour: 22, sceneId: 'home_evening', position: [1.5, 0, 2.0], activity: 'work' },
    { startHour: 22, endHour: 24, sceneId: 'zarema_albert_room', position: [1.5, 0, 1.0], activity: 'rest' },
  ],
};

/**
 * Café barista's daily schedule.
 * At the cafe all day — opens early, closes late.
 */
const CAFE_BARISTA_SCHEDULE: NPCSchedule = {
  id: 'schedule_cafe_barista',
  npcId: 'cafe_barista',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'street_night', position: [-1.0, 0, -3.0], activity: 'sleep' },
    { startHour: 7, endHour: 8, sceneId: 'street_night', position: [0, 0, -1.0], activity: 'walk' },
    { startHour: 8, endHour: 22, sceneId: 'cafe_evening', position: [0, 0, -4.0], activity: 'work' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [0.5, 0, -2.0], activity: 'walk' },
  ],
};

/**
 * Alexander's daily schedule — IT guild leader.
 * Office during the day, cafe in the evening.
 */
const ALEXANDER_SCHEDULE: NPCSchedule = {
  id: 'schedule_office_alexander',
  npcId: 'office_alexander',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'street_night', position: [2.0, 0, -1.0], activity: 'sleep' },
    { startHour: 6, endHour: 7, sceneId: 'street_night', position: [1.0, 0, -2.0], activity: 'walk' },
    { startHour: 7, endHour: 8, sceneId: 'home_evening', position: [-1.0, 0, 0.5], activity: 'rest' },
    { startHour: 8, endHour: 13, sceneId: 'office_day', position: [3.0, 0, -2.0], activity: 'work' },
    { startHour: 13, endHour: 14, sceneId: 'cafe_evening', position: [1.5, 0, -1.0], activity: 'rest' },
    { startHour: 14, endHour: 20, sceneId: 'office_day', position: [3.5, 0, -1.0], activity: 'work' },
    { startHour: 20, endHour: 22, sceneId: 'office_day', position: [4.0, 0, -1.5], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [1.5, 0, -1.5], activity: 'walk' },
  ],
};

/**
 * Colleague's daily schedule — nervous office worker.
 * Office during the day, occasionally at the cafe or library.
 */
const COLLEAGUE_SCHEDULE: NPCSchedule = {
  id: 'schedule_office_colleague',
  npcId: 'office_colleague',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'volodka_corridor', position: [-1.0, 0, 1.0], activity: 'sleep' },
    { startHour: 7, endHour: 8, sceneId: 'volodka_corridor', position: [0.5, 0, 2.0], activity: 'walk' },
    { startHour: 8, endHour: 12, sceneId: 'office_day', position: [1.0, 0, 0.5], activity: 'work' },
    { startHour: 12, endHour: 13, sceneId: 'cafe_evening', position: [0.5, 0, 1.0], activity: 'rest' },
    { startHour: 13, endHour: 16, sceneId: 'office_day', position: [1.0, 0, 0.5], activity: 'work' },
    { startHour: 16, endHour: 18, sceneId: 'library_day', position: [-1.0, 0, 1.0], activity: 'read' },
    { startHour: 18, endHour: 19, sceneId: 'cafe_evening', position: [0.5, 0, 1.0], activity: 'talk' },
    { startHour: 19, endHour: 21, sceneId: 'street_night', position: [-1.5, 0, -1.0], activity: 'walk' },
    { startHour: 21, endHour: 24, sceneId: 'volodka_corridor', position: [-1.0, 0, 1.0], activity: 'rest' },
  ],
};

/**
 * Maria's daily schedule — mysterious stranger.
 * Appears in the street at night, park during dawn.
 * Rarely in the same spot twice; shadows are her home.
 */
const MARIA_SCHEDULE: NPCSchedule = {
  id: 'schedule_maria',
  npcId: 'maria',
  entries: [
    { startHour: 0, endHour: 4, sceneId: 'rooftop_edge', position: [0.0, 0, -2.0], activity: 'rest' },
    { startHour: 4, endHour: 6, sceneId: 'street_night', position: [-3.0, 0, 2.0], activity: 'walk' },
    { startHour: 6, endHour: 10, sceneId: 'library_day', position: [1.0, 0, 1.5], activity: 'read' },
    { startHour: 10, endHour: 12, sceneId: 'park_day', position: [-2.0, 0, 1.0], activity: 'walk' },
    { startHour: 12, endHour: 15, sceneId: 'street_night', position: [-2.5, 0, -1.5], activity: 'walk' },
    { startHour: 15, endHour: 18, sceneId: 'cafe_evening', position: [-1.0, 0, 2.5], activity: 'rest' },
    { startHour: 18, endHour: 21, sceneId: 'abandoned_factory', position: [1.0, 0, -1.0], activity: 'work' },
    { startHour: 21, endHour: 24, sceneId: 'street_night', position: [-3.0, 0, 2.0], activity: 'walk' },
  ],
};

/* ─── Dmitry's schedule — senior developer (included for completeness) ─── */
const DMITRY_SCHEDULE: NPCSchedule = {
  id: 'schedule_office_dmitry',
  npcId: 'office_dmitry',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'street_night', position: [-2.0, 0, 0.0], activity: 'sleep' },
    { startHour: 6, endHour: 7, sceneId: 'street_night', position: [-1.0, 0, -1.0], activity: 'walk' },
    { startHour: 7, endHour: 9, sceneId: 'cafe_evening', position: [-1.5, 0, 1.0], activity: 'read' },
    { startHour: 9, endHour: 12, sceneId: 'office_day', position: [-2.0, 0, 1.5], activity: 'work' },
    { startHour: 12, endHour: 13, sceneId: 'park_day', position: [0.0, 0, 2.0], activity: 'walk' },
    { startHour: 13, endHour: 18, sceneId: 'office_day', position: [-1.5, 0, 2.0], activity: 'work' },
    { startHour: 18, endHour: 20, sceneId: 'abandoned_factory', position: [0.0, 0, 0.0], activity: 'work' },
    { startHour: 20, endHour: 22, sceneId: 'cafe_evening', position: [-2.0, 0, 0.5], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [-2.0, 0, 0.0], activity: 'walk' },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   EXPANDED NPC SCHEDULES — Vera, Sergey, Lena, Oleg, Kate
   ────────────────────────────────────────────────────────────────────────── */

/** Вера — archive keeper. Library most of the day, home evenings. */
const VERA_SCHEDULE: NPCSchedule = {
  id: 'schedule_vera',
  npcId: 'vera',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'home_evening', position: [-1.0, 0, 3.0], activity: 'sleep' },
    { startHour: 7, endHour: 8, sceneId: 'home_evening', position: [0, 0, 2.0], activity: 'rest' },
    { startHour: 8, endHour: 9, sceneId: 'volodka_corridor', position: [0, 0, 2.5], activity: 'walk' },
    { startHour: 9, endHour: 13, sceneId: 'library_day', position: [-1.0, 0, 3.0], activity: 'read' },
    { startHour: 13, endHour: 14, sceneId: 'cafe_evening', position: [1.0, 0, 1.0], activity: 'rest' },
    { startHour: 14, endHour: 18, sceneId: 'library_day', position: [-1.0, 0, 3.0], activity: 'work' },
    { startHour: 18, endHour: 20, sceneId: 'park_day', position: [1.0, 0, 2.0], activity: 'walk' },
    { startHour: 20, endHour: 24, sceneId: 'home_evening', position: [-1.0, 0, 3.0], activity: 'rest' },
  ],
};

/** Сергей — sysadmin. Night shift in office, sleeps mornings. */
const SERGEY_SCHEDULE: NPCSchedule = {
  id: 'schedule_sergey',
  npcId: 'sergey',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'office_day', position: [2.5, 0, -1.0], activity: 'work' },
    { startHour: 6, endHour: 7, sceneId: 'street_night', position: [0, 0, -1.0], activity: 'walk' },
    { startHour: 7, endHour: 13, sceneId: 'home_evening', position: [1.0, 0, 1.0], activity: 'sleep' },
    { startHour: 13, endHour: 14, sceneId: 'cafe_evening', position: [0.5, 0, 0.5], activity: 'rest' },
    { startHour: 14, endHour: 18, sceneId: 'office_day', position: [2.5, 0, -1.0], activity: 'work' },
    { startHour: 18, endHour: 20, sceneId: 'abandoned_factory', position: [1.5, 0, -0.5], activity: 'work' },
    { startHour: 20, endHour: 22, sceneId: 'cafe_evening', position: [1.0, 0, 0.0], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'office_day', position: [2.5, 0, -1.0], activity: 'work' },
  ],
};

/** Лена — hacker from the Network. Nocturnal, appears in abandoned factory and streets. */
const LENA_SCHEDULE: NPCSchedule = {
  id: 'schedule_lena',
  npcId: 'lena',
  entries: [
    { startHour: 0, endHour: 5, sceneId: 'abandoned_factory', position: [0, 0, 3.5], activity: 'work' },
    { startHour: 5, endHour: 8, sceneId: 'rooftop_edge', position: [0.5, 0, -1.5], activity: 'rest' },
    { startHour: 8, endHour: 12, sceneId: 'home_evening', position: [0.5, 0, 0.5], activity: 'sleep' },
    { startHour: 12, endHour: 14, sceneId: 'street_night', position: [-1.5, 0, 1.0], activity: 'walk' },
    { startHour: 14, endHour: 18, sceneId: 'library_day', position: [1.5, 0, 0.5], activity: 'read' },
    { startHour: 18, endHour: 20, sceneId: 'cafe_evening', position: [-0.5, 0, 2.0], activity: 'talk' },
    { startHour: 20, endHour: 24, sceneId: 'abandoned_factory', position: [0, 0, 3.5], activity: 'work' },
  ],
};

/** Олег — guild guard. Patrols office and factory. */
const OLEG_SCHEDULE: NPCSchedule = {
  id: 'schedule_oleg',
  npcId: 'oleg',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'office_day', position: [4.0, 0, 0], activity: 'work' },
    { startHour: 6, endHour: 7, sceneId: 'street_night', position: [0, 0, -1.0], activity: 'walk' },
    { startHour: 7, endHour: 8, sceneId: 'home_evening', position: [0.5, 0, 0.5], activity: 'rest' },
    { startHour: 8, endHour: 13, sceneId: 'office_day', position: [4.0, 0, 0], activity: 'work' },
    { startHour: 13, endHour: 14, sceneId: 'cafe_evening', position: [1.0, 0, 0.5], activity: 'rest' },
    { startHour: 14, endHour: 18, sceneId: 'abandoned_factory', position: [2.0, 0, 0.5], activity: 'work' },
    { startHour: 18, endHour: 22, sceneId: 'office_day', position: [4.0, 0, 0], activity: 'work' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [1.0, 0, -1.5], activity: 'walk' },
  ],
};

/** Катя — librarian. Library all day, cafe evenings. */
const KATE_SCHEDULE: NPCSchedule = {
  id: 'schedule_kate',
  npcId: 'kate',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'home_evening', position: [-2.0, 0, -2.0], activity: 'sleep' },
    { startHour: 7, endHour: 8, sceneId: 'volodka_corridor', position: [0, 0, 1.5], activity: 'walk' },
    { startHour: 8, endHour: 13, sceneId: 'library_day', position: [-2.0, 0, -2.0], activity: 'work' },
    { startHour: 13, endHour: 14, sceneId: 'park_day', position: [0.5, 0, 1.5], activity: 'walk' },
    { startHour: 14, endHour: 18, sceneId: 'library_day', position: [-2.0, 0, -2.0], activity: 'read' },
    { startHour: 18, endHour: 20, sceneId: 'cafe_evening', position: [0.5, 0, 1.0], activity: 'talk' },
    { startHour: 20, endHour: 24, sceneId: 'home_evening', position: [-2.0, 0, -2.0], activity: 'rest' },
  ],
};

/* ─── All schedules (core 7 + expanded 5) ─── */

export const NPC_SCHEDULES: NPCSchedule[] = [
  ALBERT_SCHEDULE,
  ZAREMA_SCHEDULE,
  CAFE_BARISTA_SCHEDULE,
  ALEXANDER_SCHEDULE,
  COLLEAGUE_SCHEDULE,
  MARIA_SCHEDULE,
  DMITRY_SCHEDULE,
  VERA_SCHEDULE,
  SERGEY_SCHEDULE,
  LENA_SCHEDULE,
  OLEG_SCHEDULE,
  KATE_SCHEDULE,
];

/**
 * All NPC schedules keyed by NPC ID.
 * Convenience lookup for quick access.
 */
export const NPC_SCHEDULES_MAP: Record<string, NPCSchedule> = Object.fromEntries(
  NPC_SCHEDULES.map((s) => [s.npcId, s]),
);
