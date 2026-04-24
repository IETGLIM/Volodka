"use client";

import { memo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import type { NPCDefinition, NPCState } from "@/data/rpgTypes";
import type { SceneId } from "@/data/types";
import { getNpcExplorationPosition } from "@/data/npcDefinitions";
import { getCurrentScheduleEntry } from "@/engine/ScheduleEngine";
import { eventBus } from "@/engine/EventBus";
import { useGameStore } from "@/state/gameStore";
import {
  NPC_BARK_COOLDOWN_MS,
  NPC_BARK_RADIUS_XZ,
  distanceXZ,
  npcProximityBarkText,
  relationValueForNpc,
} from "@/lib/npcProximityBarks";

const FRAME_STRIDE = 4;

interface NpcProximityBarksProps {
  sceneId: SceneId;
  timeOfDay: number;
  npcs: NPCDefinition[];
  npcStates: Record<string, NPCState>;
  playerPositionRef: RefObject<{ x: number; y: number; z: number; rotation?: number } | null>;
  isDialogueActive: boolean;
}

/**
 * При первом входе игрока в радиус по XZ — тост + лёгкий SFX (как «живой» NPC).
 */
export const NpcProximityBarks = memo(function NpcProximityBarks({
  sceneId,
  timeOfDay,
  npcs,
  npcStates,
  playerPositionRef,
  isDialogueActive,
}: NpcProximityBarksProps) {
  const wasInRangeRef = useRef<Record<string, boolean>>({});
  const lastBarkAtRef = useRef<Record<string, number>>({});
  const frameRef = useRef(0);

  useEffect(() => {
    wasInRangeRef.current = {};
    lastBarkAtRef.current = {};
  }, [sceneId]);

  useFrame(() => {
    if (isDialogueActive) return;

    frameRef.current += 1;
    if (frameRef.current % FRAME_STRIDE !== 0) return;

    const pos = playerPositionRef.current;
    if (!pos) return;

    const store = useGameStore.getState();
    const relations = store.npcRelations;

    for (const npc of npcs) {
      const entry = getCurrentScheduleEntry(npc.id, timeOfDay);
      if (entry && !entry.dialogueAvailable) {
        wasInRangeRef.current[npc.id] = false;
        continue;
      }

      const npcPos = getNpcExplorationPosition(
        npc,
        sceneId,
        timeOfDay,
        npcStates[npc.id]?.position,
      );
      const near = distanceXZ(pos, npcPos) < NPC_BARK_RADIUS_XZ;
      const prev = wasInRangeRef.current[npc.id] ?? false;
      wasInRangeRef.current[npc.id] = near;

      if (!near || prev) continue;

      const now = performance.now();
      const last = lastBarkAtRef.current[npc.id] ?? 0;
      if (now - last < NPC_BARK_COOLDOWN_MS) continue;

      lastBarkAtRef.current[npc.id] = now;
      const rel = relationValueForNpc(npc.id, relations);
      const text = npcProximityBarkText(npc.name, rel);
      eventBus.emit("ui:exploration_message", { text });
      eventBus.emit("sound:play", { type: "ui", volume: 0.12 });
    }
  });

  return null;
});
