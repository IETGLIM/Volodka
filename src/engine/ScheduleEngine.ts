import type { ScheduleEntry } from '@/shared/types/schedule';

export type { ScheduleEntry };

/** Карточки `*_home` в `npcDefinitions` делят с `zarema` / `albert` одно логическое расписание. */
const SCHEDULE_NPC_ID_ALIASES: Readonly<Record<string, string>> = {
  zarema_home: 'zarema',
  albert_home: 'albert',
};

export function resolveScheduleNpcId(npcId: string): string {
  return SCHEDULE_NPC_ID_ALIASES[npcId] ?? npcId;
}

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
 * Ключевые NPC: Альберт (бар «Синяя яма» + сосед), Зарема, Тимур, Виктория на кухне.
 * «Володька» — ИГРОК; отдельного NPC с таким id нет, слот закрыт комментарием в данных.
 *
 * Рутины: несколько непересекающихся окон [start, end) — смена **sceneId**, **position**, **activity**.
 * Диалог недоступен при `sleep` (иконка 😴 в `NPC.tsx`).
 */
const NPC_SCHEDULES: Record<string, ScheduleEntry[]> = {
  /** Альберт: ночь дома → утро в комнате → офис → кофе → библиотека / парк → вечер у подъезда → сон. */
  albert: [
    {
      startHour: 23,
      endHour: 7,
      sceneId: 'zarema_albert_room',
      position: { x: 2.2, y: 0, z: -1.1 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
    {
      startHour: 7,
      endHour: 9,
      sceneId: 'zarema_albert_room',
      position: { x: 1.2, y: 0, z: 0.4 },
      activity: 'rest',
      dialogueAvailable: true,
    },
    {
      startHour: 9,
      endHour: 12,
      sceneId: 'office_morning',
      position: { x: -2.5, y: 0, z: -1.2 },
      activity: 'work',
      dialogueAvailable: true,
    },
    {
      startHour: 12,
      endHour: 16,
      sceneId: 'library',
      position: { x: -4, y: 0, z: 2 },
      activity: 'read',
      dialogueAvailable: true,
    },
    {
      startHour: 16,
      endHour: 18,
      sceneId: 'memorial_park',
      position: { x: 3, y: 0, z: -4 },
      activity: 'walk',
      dialogueAvailable: true,
    },
    {
      startHour: 18,
      endHour: 23,
      sceneId: 'cafe_evening',
      position: { x: 0.6, y: 0, z: -3.4 },
      activity: 'work',
      dialogueAvailable: true,
    },
  ],
  /** Зарема: сон дома → подъезд / соседи → парк и книги → кафе → вечер на улице → дом отдохнуть. */
  zarema: [
    {
      startHour: 23,
      endHour: 7,
      sceneId: 'zarema_albert_room',
      position: { x: -1.9, y: 0, z: 0.6 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
    {
      startHour: 7,
      endHour: 10,
      sceneId: 'street_night',
      position: { x: -1.2, y: 0, z: 3.2 },
      activity: 'talk',
      dialogueAvailable: true,
    },
    {
      startHour: 10,
      endHour: 12,
      sceneId: 'home_evening',
      position: { x: 3.5, y: 0, z: -2 },
      activity: 'talk',
      dialogueAvailable: true,
    },
    {
      startHour: 12,
      endHour: 14,
      sceneId: 'memorial_park',
      position: { x: -2.5, y: 0, z: -5 },
      activity: 'walk',
      dialogueAvailable: true,
    },
    {
      startHour: 14,
      endHour: 16,
      sceneId: 'library',
      position: { x: 5, y: 0, z: -3 },
      activity: 'read',
      dialogueAvailable: true,
    },
    {
      startHour: 16,
      endHour: 19,
      sceneId: 'cafe_evening',
      position: { x: -1.6, y: 0, z: -2.2 },
      activity: 'work',
      dialogueAvailable: true,
    },
    {
      startHour: 19,
      endHour: 21,
      sceneId: 'street_night',
      position: { x: -3, y: 0, z: -1.5 },
      activity: 'walk',
      dialogueAvailable: true,
    },
    {
      startHour: 21,
      endHour: 23,
      sceneId: 'zarema_albert_room',
      position: { x: -0.8, y: 0, z: -0.6 },
      activity: 'rest',
      dialogueAvailable: true,
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
  /** Тимур: ударник кавер-группы, завсегдатай бара «Синяя яма»; днём — Зелёнка / район. */
  pit_timur: [
    {
      startHour: 22,
      endHour: 10,
      sceneId: 'district',
      position: { x: 2.2, y: 0, z: 1.2 },
      activity: 'sleep',
      dialogueAvailable: false,
    },
    {
      startHour: 10,
      endHour: 14,
      sceneId: 'green_zone',
      position: { x: -1.5, y: 0, z: 0.8 },
      activity: 'walk',
      dialogueAvailable: true,
    },
    {
      startHour: 14,
      endHour: 23,
      sceneId: 'cafe_evening',
      position: { x: 3.4, y: 0, z: -3.8 },
      activity: 'talk',
      dialogueAvailable: true,
    },
  ],
};

export function getCurrentScheduleEntry(npcId: string, timeOfDay: number): ScheduleEntry | null {
  const key = resolveScheduleNpcId(npcId);
  const rows = NPC_SCHEDULES[key];
  if (!rows?.length) return null;
  for (const row of rows) {
    if (isHourInRange(timeOfDay, row.startHour, row.endHour)) {
      return row;
    }
  }
  return null;
}
