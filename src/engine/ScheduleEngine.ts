import type { ScheduleEntry } from '@/shared/types/schedule';

export type { ScheduleEntry };

/**
 * Проверка попадания часа в интервал [start, end).
 * Если start > end — интервал через полночь (например 22 → 6).
 */
export function isHourInRange(timeOfDay: number, startHour: number, endHour: number): boolean {
  const t = ((timeOfDay % 24) + 24) % 24;
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return t >= startHour && t < endHour;
  }
  return t >= startHour || t < endHour;
}

/**
 * Ключевые NPC: Альберт (сосед Володьки), Зарема, Виктория на кухне, бариста.
 * «Володька» — ИГРОК; отдельного NPC с таким id нет, слот закрыт комментарием в данных.
 */
const NPC_SCHEDULES: Record<string, ScheduleEntry[]> = {
  /** Альберт: днём дома, вечером у подъезда «на связи». */
  albert: [
    {
      startHour: 8,
      endHour: 18,
      sceneId: 'zarema_albert_room',
      position: { x: 2.2, y: 0, z: -0.8 },
      activity: 'rest',
      dialogueAvailable: true,
    },
    {
      startHour: 18,
      endHour: 23,
      sceneId: 'street_night',
      position: { x: 2, y: 0, z: 0 },
      activity: 'walk',
      dialogueAvailable: true,
    },
    {
      startHour: 23,
      endHour: 8,
      sceneId: 'street_night',
      position: { x: 2, y: 0, z: 0 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
  ],
  zarema: [
    {
      startHour: 9,
      endHour: 17,
      sceneId: 'cafe_evening',
      position: { x: 1.5, y: 0, z: -2 },
      activity: 'walk',
      dialogueAvailable: true,
    },
    {
      startHour: 17,
      endHour: 23,
      sceneId: 'street_night',
      position: { x: -2, y: 0, z: 0 },
      activity: 'talk',
      dialogueAvailable: true,
    },
    {
      startHour: 23,
      endHour: 9,
      sceneId: 'zarema_albert_room',
      position: { x: -1.8, y: 0, z: 0.8 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
  ],
  /** «Мария» в данных — `kitchen_maria` (Виктория). */
  kitchen_maria: [
    {
      startHour: 7,
      endHour: 22,
      sceneId: 'kitchen_night',
      position: { x: -2, y: 0, z: 0 },
      activity: 'talk',
      dialogueAvailable: true,
    },
    {
      startHour: 22,
      endHour: 7,
      sceneId: 'kitchen_night',
      position: { x: -2, y: 0, z: 0 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
  ],
  cafe_barista: [
    {
      startHour: 8,
      endHour: 22,
      sceneId: 'cafe_evening',
      position: { x: 0, y: 0, z: -3 },
      activity: 'talk',
      dialogueAvailable: true,
    },
    {
      startHour: 22,
      endHour: 8,
      sceneId: 'cafe_evening',
      position: { x: 0, y: 0, z: -3 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
  ],
};

export function getCurrentScheduleEntry(npcId: string, timeOfDay: number): ScheduleEntry | null {
  const rows = NPC_SCHEDULES[npcId];
  if (!rows?.length) return null;
  for (const row of rows) {
    if (isHourInRange(timeOfDay, row.startHour, row.endHour)) {
      return row;
    }
  }
  return null;
}
