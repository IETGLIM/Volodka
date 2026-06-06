/* ─── ТОЛПА / ЧК — NPC schedules (night forest gatherings) ─── */

import type { NPCSchedule } from '@/data/npcSchedules';

/** Day jobs — professionals in the city */
const CHK_RU_DAY: NPCSchedule = {
  id: 'schedule_chk_ru',
  npcId: 'chk_ru',
  entries: [
    { startHour: 0, endHour: 8, sceneId: 'street_night', position: [2.0, 0, -1.0], activity: 'sleep' },
    { startHour: 8, endHour: 19, sceneId: 'office_day', position: [-2.0, 0, 1.5], activity: 'work' },
    { startHour: 19, endHour: 24, sceneId: 'chk_forest_zorge', position: [-1.8, 0, 0.5], activity: 'talk' },
  ],
};

const CHK_BASED_DAY: NPCSchedule = {
  id: 'schedule_chk_based',
  npcId: 'chk_based',
  entries: [
    { startHour: 0, endHour: 7, sceneId: 'street_night', position: [1.0, 0, -2.0], activity: 'sleep' },
    { startHour: 7, endHour: 18, sceneId: 'office_day', position: [2.5, 0, -2.0], activity: 'work' },
    { startHour: 18, endHour: 24, sceneId: 'chk_forest_zorge', position: [1.5, 0, 1.2], activity: 'talk' },
  ],
};

const CHK_SMERT_DAY: NPCSchedule = {
  id: 'schedule_chk_smert',
  npcId: 'chk_smert',
  entries: [
    { startHour: 0, endHour: 9, sceneId: 'street_night', position: [-1.0, 0, 0.5], activity: 'sleep' },
    { startHour: 9, endHour: 18, sceneId: 'office_day', position: [0.5, 0, 2.0], activity: 'work' },
    { startHour: 18, endHour: 24, sceneId: 'chk_forest_zorge', position: [0.3, 0, -1.8], activity: 'read' },
  ],
};

const CHK_STALKER_DAY: NPCSchedule = {
  id: 'schedule_chk_stalker',
  npcId: 'chk_stalker',
  entries: [
    { startHour: 0, endHour: 10, sceneId: 'street_night', position: [0.0, 0, -3.0], activity: 'sleep' },
    { startHour: 10, endHour: 17, sceneId: 'office_day', position: [-1.5, 0, -1.0], activity: 'work' },
    { startHour: 17, endHour: 24, sceneId: 'chk_forest_zorge', position: [-2.5, 0, -2.0], activity: 'walk' },
  ],
};

const CHK_ELIS_DAY: NPCSchedule = {
  id: 'schedule_chk_elis',
  npcId: 'chk_elis',
  entries: [
    { startHour: 0, endHour: 8, sceneId: 'street_night', position: [-2.0, 0, 1.0], activity: 'sleep' },
    { startHour: 8, endHour: 18, sceneId: 'office_day', position: [1.0, 0, 0.5], activity: 'work' },
    { startHour: 18, endHour: 24, sceneId: 'chk_forest_zorge', position: [-1.4, 0, -1.0], activity: 'talk' },
  ],
};

/** Rotating guests — different evening slots */
const CHK_GUEST_DEVOPS: NPCSchedule = {
  id: 'schedule_chk_guest_devops',
  npcId: 'chk_guest_devops',
  entries: [
    { startHour: 0, endHour: 20, sceneId: 'street_night', position: [0, 0, 0], activity: 'sleep' },
    { startHour: 20, endHour: 22, sceneId: 'chk_forest_zorge', position: [2.0, 0, 0.5], activity: 'talk' },
    { startHour: 22, endHour: 24, sceneId: 'street_night', position: [0.5, 0, -1.0], activity: 'walk' },
  ],
};

const CHK_GUEST_ANALYST: NPCSchedule = {
  id: 'schedule_chk_guest_analyst',
  npcId: 'chk_guest_analyst',
  entries: [
    { startHour: 0, endHour: 21, sceneId: 'cafe_evening', position: [1.0, 0, 1.0], activity: 'read' },
    { startHour: 21, endHour: 23, sceneId: 'chk_forest_zorge', position: [2.0, 0, 0.5], activity: 'talk' },
    { startHour: 23, endHour: 24, sceneId: 'street_night', position: [0, 0, -2.0], activity: 'walk' },
  ],
};

export const CHK_NPC_SCHEDULES: NPCSchedule[] = [
  CHK_RU_DAY,
  CHK_BASED_DAY,
  CHK_SMERT_DAY,
  CHK_STALKER_DAY,
  CHK_ELIS_DAY,
  CHK_GUEST_DEVOPS,
  CHK_GUEST_ANALYST,
];
