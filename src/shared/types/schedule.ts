import type { SceneId } from '@/data/types';

/** Одна строка дневного расписания NPC (часы суток 0–24, дробные допустимы). */
export interface ScheduleEntry {
  startHour: number;
  endHour: number;
  sceneId: SceneId;
  position: { x: number; y: number; z: number };
  /** Краткое описание для UI / отладки */
  activity: string;
  dialogueAvailable: boolean;
}
