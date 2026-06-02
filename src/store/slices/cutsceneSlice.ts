/* ─── Volodka RPG – Cutscene Slice ─── */
/* Cutscene camera state: active cutscene ID and waypoint data.
 *
 * NOTE: triggeredCutscenes uses string[] instead of Set<string>
 * to ensure Zustand store serializability (Set is non-serializable
 * and causes issues with save/load and devtools). */

import type { StateCreator } from 'zustand';
import type { CameraWaypointData } from '@/shared/types/game';

/* ─── Slice types ─── */

export interface CutsceneSliceState {
  activeCutsceneId: string | null;
  cutsceneWaypoints: CameraWaypointData[];
  /** IDs of cutscenes that have already been triggered (serializable array, not Set) */
  triggeredCutscenes: string[];
}

export interface CutsceneSliceActions {
  setCutscene: (cutsceneId: string | null, waypoints?: CameraWaypointData[]) => void;
  markCutsceneTriggered: (cutsceneId: string) => void;
  /** Check if a cutscene has already been triggered */
  isCutsceneTriggered: (cutsceneId: string) => boolean;
}

export type CutsceneSlice = CutsceneSliceState & CutsceneSliceActions;

/* ─── Slice creator ─── */

export const createCutsceneSlice: StateCreator<
  CutsceneSlice,
  [],
  [],
  CutsceneSlice
> = (set, get) => ({
  /* ── Initial state ── */
  activeCutsceneId: null,
  cutsceneWaypoints: [],
  triggeredCutscenes: [],

  /* ── Actions ── */

  setCutscene: (cutsceneId, waypoints) =>
    set({
      activeCutsceneId: cutsceneId,
      cutsceneWaypoints: waypoints ?? [],
    }),

  markCutsceneTriggered: (cutsceneId: string) => {
    set((state) => {
      if (state.triggeredCutscenes.includes(cutsceneId)) return state;
      return { triggeredCutscenes: [...state.triggeredCutscenes, cutsceneId] };
    });
  },

  isCutsceneTriggered: (cutsceneId: string) => {
    return get().triggeredCutscenes.includes(cutsceneId);
  },
});
