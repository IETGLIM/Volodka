/* ─── Volodka RPG – NPC daily schedules ─── */
/* Defines where each NPC is at any given hour of the day.
 * Each NPC follows a daily routine with schedule entries that
 * map time ranges to scenes, positions, and activities.
 *
 * Act-conditional schedules override the base schedule when
 * story flags or quest completions change NPC behavior. */

import type { ScheduleEntry } from '@/shared/types/game';
import { CHK_NPC_SCHEDULES } from './chkTolpa/schedules';

/* ─── NPC Schedule Type ─── */

export interface NPCSchedule {
  id: string;
  npcId: string;
  entries: ScheduleEntry[];
}

/** An act-conditional schedule override that replaces the base schedule
 *  when all required flags are set. First matching override wins. */
export interface ActScheduleOverride {
  /** Unique ID for this override */
  id: string;
  /** Which NPC this applies to */
  npcId: string;
  /** Minimum act (1-5) required for this override to activate */
  minAct: number;
  /** Quest IDs that must be completed for this override to activate */
  requiredCompletedQuests?: string[];
  /** Story flags that must be set for this override to activate */
  requiredFlags?: string[];
  /** Story flags that must NOT be set (e.g. override until rescue completes) */
  excludedFlags?: string[];
  /** The replacement schedule entries */
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

/** Максим — лидер сопротивления. Ночные улицы и операции на заводе. */
const MAXIM_SCHEDULE: NPCSchedule = {
  id: 'schedule_maxim',
  npcId: 'maxim',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'abandoned_factory', position: [-2.0, 0, -1.5], activity: 'work' },
    { startHour: 6, endHour: 12, sceneId: 'home_evening', position: [0.5, 0, 0.5], activity: 'sleep' },
    { startHour: 12, endHour: 18, sceneId: 'abandoned_factory', position: [-1.5, 0, -1.0], activity: 'work' },
    { startHour: 18, endHour: 20, sceneId: 'cafe_evening', position: [-1.0, 0, 1.0], activity: 'talk' },
    { startHour: 20, endHour: 24, sceneId: 'street_night', position: [-2.0, 0, -1.5], activity: 'walk' },
  ],
};

/** Жека — старый хакер завода. Почти живёт на заброшенной фабрике. */
const ZEKA_SCHEDULE: NPCSchedule = {
  id: 'schedule_zeka',
  npcId: 'zeka',
  entries: [
    { startHour: 0, endHour: 8, sceneId: 'abandoned_factory', position: [1.0, 0, -1.0], activity: 'work' },
    { startHour: 8, endHour: 12, sceneId: 'street_night', position: [0.5, 0, -1.0], activity: 'walk' },
    { startHour: 12, endHour: 14, sceneId: 'cafe_evening', position: [1.5, 0, 0.5], activity: 'rest' },
    { startHour: 14, endHour: 20, sceneId: 'abandoned_factory', position: [1.0, 0, -1.0], activity: 'work' },
    { startHour: 20, endHour: 24, sceneId: 'abandoned_factory', position: [0.5, 0, 0.0], activity: 'work' },
  ],
};

/** Аня — хакер сопротивления. Координирует операции из кафе и с улицы. */
const ANYA_SCHEDULE: NPCSchedule = {
  id: 'schedule_anya',
  npcId: 'anya',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'street_night', position: [0.5, 0, 2.0], activity: 'work' },
    { startHour: 6, endHour: 10, sceneId: 'home_evening', position: [0.0, 0, 0.5], activity: 'sleep' },
    { startHour: 10, endHour: 14, sceneId: 'cafe_evening', position: [0.5, 0, 2.0], activity: 'work' },
    { startHour: 14, endHour: 18, sceneId: 'office_day', position: [2.0, 0, 1.0], activity: 'work' },
    { startHour: 18, endHour: 22, sceneId: 'cafe_evening', position: [0.0, 0, 1.5], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [0.5, 0, 2.0], activity: 'walk' },
  ],
};

/**
 * Viktor's daily schedule — old hacker, nocturnal.
 * Sleeps during day, active at night in abandoned factory.
 */
const VIKTOR_SCHEDULE: NPCSchedule = {
  id: 'schedule_viktor',
  npcId: 'viktor',
  entries: [
    { startHour: 0, endHour: 4, sceneId: 'abandoned_factory', position: [-4.0, 0, 2.0], activity: 'work' },
    { startHour: 4, endHour: 8, sceneId: 'volodka_room', position: [-3.0, 0, 3.0], activity: 'sleep' },
    { startHour: 8, endHour: 16, sceneId: 'abandoned_factory', position: [-4.0, 0, 2.0], activity: 'work' },
    { startHour: 16, endHour: 20, sceneId: 'street_night', position: [-2.0, 0, -1.0], activity: 'walk' },
    { startHour: 20, endHour: 22, sceneId: 'cafe_evening', position: [-1.0, 0, 2.0], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'abandoned_factory', position: [-4.0, 0, 2.0], activity: 'work' },
  ],
};

/**
 * Kira's daily schedule — street informant.
 * Flits between street, cafe, and office gathering intel.
 */
const KIRA_SCHEDULE: NPCSchedule = {
  id: 'schedule_kira',
  npcId: 'kira',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'street_winter', position: [3.0, 0, -4.0], activity: 'rest' },
    { startHour: 6, endHour: 9, sceneId: 'street_night', position: [3.0, 0, -4.0], activity: 'walk' },
    { startHour: 9, endHour: 13, sceneId: 'office_day', position: [1.0, 0, -2.0], activity: 'work' },
    { startHour: 13, endHour: 17, sceneId: 'cafe_evening', position: [2.0, 0, 1.0], activity: 'talk' },
    { startHour: 17, endHour: 21, sceneId: 'street_night', position: [3.0, 0, -4.0], activity: 'walk' },
    { startHour: 21, endHour: 24, sceneId: 'cafe_evening', position: [2.0, 0, 1.0], activity: 'talk' },
  ],
};

/**
 * Boris's daily schedule — factory worker.
 * Day shifts at the factory, evening wanderings.
 */
const BORIS_SCHEDULE: NPCSchedule = {
  id: 'schedule_boris',
  npcId: 'boris',
  entries: [
    { startHour: 0, endHour: 6, sceneId: 'home_evening', position: [0.0, 0, -5.0], activity: 'sleep' },
    { startHour: 6, endHour: 8, sceneId: 'volodka_corridor', position: [2.0, 0, 1.0], activity: 'walk' },
    { startHour: 8, endHour: 16, sceneId: 'abandoned_factory', position: [0.0, 0, -5.0], activity: 'work' },
    { startHour: 16, endHour: 19, sceneId: 'street_winter', position: [0.0, 0, -3.0], activity: 'walk' },
    { startHour: 19, endHour: 22, sceneId: 'cafe_evening', position: [0.0, 0, -1.0], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'park_day', position: [-2.0, 0, 2.0], activity: 'read' },
  ],
};

/**
 * Tamara's daily schedule — librarian.
 * Guarding the library by day, researching by night.
 */
const TAMARA_SCHEDULE: NPCSchedule = {
  id: 'schedule_tamara',
  npcId: 'tamara',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'home_evening', position: [2.0, 0, 3.0], activity: 'sleep' },
    { startHour: 7, endHour: 8, sceneId: 'volodka_corridor', position: [0, 0, 1.5], activity: 'walk' },
    { startHour: 8, endHour: 14, sceneId: 'library_day', position: [2.0, 0, 3.0], activity: 'work' },
    { startHour: 14, endHour: 18, sceneId: 'library_day', position: [-2.0, 0, -2.0], activity: 'read' },
    { startHour: 18, endHour: 20, sceneId: 'cafe_evening', position: [0.5, 0, 0.5], activity: 'talk' },
    { startHour: 20, endHour: 24, sceneId: 'home_evening', position: [2.0, 0, 3.0], activity: 'rest' },
  ],
};

/**
 * Grisha's daily schedule — rooftop dweller.
 * Always on rooftops, watching the city below.
 */
const GRISHA_SCHEDULE: NPCSchedule = {
  id: 'schedule_grisha',
  npcId: 'grisha',
  entries: [
    { startHour: 0, endHour: 5, sceneId: 'rooftop_edge', position: [-3.0, 0, -5.0], activity: 'sleep' },
    { startHour: 5, endHour: 8, sceneId: 'rooftop_edge', position: [-3.0, 0, 1.0], activity: 'rest' },
    { startHour: 8, endHour: 16, sceneId: 'rooftop_edge', position: [2.0, 0, -3.0], activity: 'walk' },
    { startHour: 16, endHour: 20, sceneId: 'rooftop_edge', position: [-3.0, 0, -5.0], activity: 'talk' },
    { startHour: 20, endHour: 22, sceneId: 'rooftop_edge', position: [3.0, 0, -4.0], activity: 'rest' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [2.0, 0, -3.0], activity: 'walk' },
  ],
};

/* ─── All schedules (core 7 + expanded 5 + new 5) ─── */

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
  MAXIM_SCHEDULE,
  ZEKA_SCHEDULE,
  ANYA_SCHEDULE,
  VIKTOR_SCHEDULE,
  KIRA_SCHEDULE,
  BORIS_SCHEDULE,
  TAMARA_SCHEDULE,
  GRISHA_SCHEDULE,
  ...CHK_NPC_SCHEDULES,
];

/**
 * All NPC schedules keyed by NPC ID.
 * Convenience lookup for quick access.
 */
export const NPC_SCHEDULES_MAP: Record<string, NPCSchedule> = Object.fromEntries(
  NPC_SCHEDULES.map((s) => [s.npcId, s]),
);

/* ─── Act-conditional schedule overrides ─── */
/* These replace the base schedule when story conditions are met.
 * The ScheduleEngine checks these overrides before falling back to base. */

export const ACT_SCHEDULE_OVERRIDES: ActScheduleOverride[] = [
  /* ── Act 3: Zarema arrested → held in guild detention (until rescued) ── */
  {
    id: 'override_zarema_act3_captured',
    npcId: 'zarema',
    minAct: 3,
    requiredFlags: ['zarema_arrested'],
    excludedFlags: ['zarema_rescued'],
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'office_day', position: [4.5, 0, -4.0], activity: 'rest' },
    ],
  },

  /* ── Act 3: Maria is more active in the streets, less hiding ── */
  {
    id: 'override_maria_act3',
    npcId: 'maria',
    minAct: 3,
    entries: [
      { startHour: 0, endHour: 6, sceneId: 'street_night', position: [-2.0, 0, 1.0], activity: 'walk' },
      { startHour: 6, endHour: 10, sceneId: 'cafe_evening', position: [-1.0, 0, 2.5], activity: 'talk' },
      { startHour: 10, endHour: 14, sceneId: 'office_day', position: [2.0, 0, 1.0], activity: 'work' },
      { startHour: 14, endHour: 18, sceneId: 'abandoned_factory', position: [1.0, 0, -1.0], activity: 'work' },
      { startHour: 18, endHour: 22, sceneId: 'street_night', position: [-3.0, 0, 2.0], activity: 'walk' },
      { startHour: 22, endHour: 24, sceneId: 'rooftop_edge', position: [0.0, 0, -2.0], activity: 'rest' },
    ],
  },

  /* ── Act 3: Dmitry defected → hangs out in the factory with the resistance ── */
  {
    id: 'override_dmitry_act3_defected',
    npcId: 'office_dmitry',
    minAct: 3,
    requiredCompletedQuests: ['dmitry_defection'],
    entries: [
      { startHour: 0, endHour: 6, sceneId: 'abandoned_factory', position: [-1.0, 0, 2.0], activity: 'sleep' },
      { startHour: 6, endHour: 8, sceneId: 'abandoned_factory', position: [0.5, 0, 1.5], activity: 'work' },
      { startHour: 8, endHour: 12, sceneId: 'cafe_evening', position: [-2.0, 0, 0.5], activity: 'talk' },
      { startHour: 12, endHour: 18, sceneId: 'abandoned_factory', position: [0.5, 0, 1.0], activity: 'work' },
      { startHour: 18, endHour: 22, sceneId: 'street_night', position: [-2.0, 0, 0.0], activity: 'walk' },
      { startHour: 22, endHour: 24, sceneId: 'abandoned_factory', position: [-1.0, 0, 2.0], activity: 'rest' },
    ],
  },

  /* ── Act 4: Alexander is under pressure → stays late at office ── */
  {
    id: 'override_alexander_act4',
    npcId: 'office_alexander',
    minAct: 4,
    entries: [
      { startHour: 0, endHour: 4, sceneId: 'office_day', position: [3.5, 0, -1.0], activity: 'work' },
      { startHour: 4, endHour: 7, sceneId: 'street_night', position: [2.0, 0, -1.0], activity: 'walk' },
      { startHour: 7, endHour: 8, sceneId: 'home_evening', position: [-1.0, 0, 0.5], activity: 'rest' },
      { startHour: 8, endHour: 22, sceneId: 'office_day', position: [3.5, 0, -1.0], activity: 'work' },
      { startHour: 22, endHour: 24, sceneId: 'cafe_evening', position: [1.5, 0, -1.0], activity: 'talk' },
    ],
  },

  /* ── Act 4: Lena goes full resistance → rarely at home ── */
  {
    id: 'override_lena_act4',
    npcId: 'lena',
    minAct: 4,
    entries: [
      { startHour: 0, endHour: 6, sceneId: 'abandoned_factory', position: [0, 0, 3.5], activity: 'work' },
      { startHour: 6, endHour: 8, sceneId: 'street_night', position: [-1.5, 0, 1.0], activity: 'walk' },
      { startHour: 8, endHour: 12, sceneId: 'abandoned_factory', position: [1.0, 0, 2.0], activity: 'work' },
      { startHour: 12, endHour: 14, sceneId: 'cafe_evening', position: [-0.5, 0, 2.0], activity: 'talk' },
      { startHour: 14, endHour: 18, sceneId: 'office_day', position: [2.5, 0, 1.0], activity: 'work' },
      { startHour: 18, endHour: 24, sceneId: 'abandoned_factory', position: [0, 0, 3.5], activity: 'work' },
    ],
  },

  /* ── Act 4: Albert joins the resistance meetings ── */
  {
    id: 'override_albert_act4',
    npcId: 'albert',
    minAct: 4,
    entries: [
      { startHour: 0, endHour: 7, sceneId: 'zarema_albert_room', position: [-1.5, 0, 1.0], activity: 'sleep' },
      { startHour: 7, endHour: 9, sceneId: 'cafe_evening', position: [-2.5, 0, -3.0], activity: 'read' },
      { startHour: 9, endHour: 14, sceneId: 'abandoned_factory', position: [-1.0, 0, 3.0], activity: 'talk' },
      { startHour: 14, endHour: 18, sceneId: 'library_day', position: [2.0, 0, -1.0], activity: 'read' },
      { startHour: 18, endHour: 22, sceneId: 'abandoned_factory', position: [-1.0, 0, 3.0], activity: 'talk' },
      { startHour: 22, endHour: 24, sceneId: 'street_night', position: [1.0, 0, -2.0], activity: 'walk' },
    ],
  },

  /* ── Act 5: Sergey defends the vault → always at office ── */
  {
    id: 'override_sergey_act5',
    npcId: 'sergey',
    minAct: 5,
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'office_day', position: [2.5, 0, -1.0], activity: 'work' },
    ],
  },

  /* ── Act 3+: CHK on crisis duty — forest sanctuary 24/7 ── */
  {
    id: 'override_chk_ru_sanctuary',
    npcId: 'chk_ru',
    minAct: 3,
    requiredFlags: ['tolpa_sanctuary_active'],
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'chk_forest_zorge', position: [-1.8, 0, 0.5], activity: 'talk' },
    ],
  },
  {
    id: 'override_chk_based_sanctuary',
    npcId: 'chk_based',
    minAct: 3,
    requiredFlags: ['tolpa_sanctuary_active'],
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'chk_forest_zorge', position: [1.5, 0, 1.2], activity: 'talk' },
    ],
  },
  {
    id: 'override_chk_smert_sanctuary',
    npcId: 'chk_smert',
    minAct: 3,
    requiredFlags: ['tolpa_sanctuary_active'],
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'chk_forest_zorge', position: [0.3, 0, -1.8], activity: 'read' },
    ],
  },
  {
    id: 'override_chk_stalker_sanctuary',
    npcId: 'chk_stalker',
    minAct: 3,
    requiredFlags: ['tolpa_sanctuary_active'],
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'chk_forest_zorge', position: [-2.5, 0, -2.0], activity: 'walk' },
    ],
  },
  {
    id: 'override_chk_elis_sanctuary',
    npcId: 'chk_elis',
    minAct: 3,
    requiredFlags: ['tolpa_sanctuary_active'],
    entries: [
      { startHour: 0, endHour: 24, sceneId: 'chk_forest_zorge', position: [-1.4, 0, -1.0], activity: 'talk' },
    ],
  },
];
