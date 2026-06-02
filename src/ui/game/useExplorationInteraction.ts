import { useCallback, useMemo, useState } from 'react';
import type { MutableRefObject } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { explorationInteractionRegistry } from '@/game/interactions/registerBaseInteractions';
import { getItemById } from '@/data/items';
import { getWorldItemsForScene } from '@/data/triggerZones';
import type { NPCDefinition, NPCState, TriggerState, TriggerZone } from '@/data/rpgTypes';
import type { SceneId } from '@/data/types';
import type { InteractiveObjectConfig } from '@/config/scenes';
import { useGameStore } from '@/state';
import { emitInteractionFeedback } from '@/lib/interactionFeedback';
import { getExplorationRadialMenuActions } from '@/lib/explorationRadialMenuActions';
import { resolveExplorationInteractionPriority } from '@/lib/explorationPrimaryInteraction';
import type { RadialMenuAction } from './RadialMenu';

const WORLD_LAYOUT_PICKUP_RADIUS = 1.42;

interface PlayerRefPosition {
  x: number;
  y: number;
  z: number;
  rotation?: number;
}

interface UseExplorationInteractionParams {
  sceneId: SceneId;
  playerInputLocked: boolean;
  explorationBriefingOpen: boolean;
  setExplorationBriefingOpen: (open: boolean) => void;
  playerPositionRef: MutableRefObject<PlayerRefPosition>;
  sceneTriggers: TriggerZone[];
  triggerStates: Record<string, TriggerState>;
  sceneInteractiveObjects: InteractiveObjectConfig[];
  sceneNPCs: NPCDefinition[];
  npcStates: Record<string, NPCState>;
  hasItem: (itemId: string, quantity?: number) => boolean;
  timeOfDay: number;
  onNPCInteraction: (npcId: string) => void;
  handleTriggerEnter: (triggerId: string) => void;
  handleTriggerStateChange: (triggerId: string, state: TriggerState) => void;
}

export function useExplorationInteraction({
  sceneId,
  playerInputLocked,
  explorationBriefingOpen,
  setExplorationBriefingOpen,
  playerPositionRef,
  sceneTriggers,
  triggerStates,
  sceneInteractiveObjects,
  sceneNPCs,
  npcStates,
  hasItem,
  timeOfDay,
  onNPCInteraction,
  handleTriggerEnter,
  handleTriggerStateChange,
}: UseExplorationInteractionParams) {
  const [radialObject, setRadialObject] = useState<InteractiveObjectConfig | null>(null);
  const [availableInteractionIds, setAvailableInteractionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const radialMenuActions = useMemo((): RadialMenuAction[] => {
    if (!radialObject) return [];
    return getExplorationRadialMenuActions(sceneId, radialObject, hasItem);
  }, [sceneId, radialObject, hasItem]);

  const radialMenuAnchorLabel = useMemo(() => {
    if (!radialObject) return undefined;
    const parts = [`${radialObject.type} · ${radialObject.id}`];
    if (radialObject.itemId) parts.push(`item: ${radialObject.itemId}`);
    return parts.join(' · ');
  }, [radialObject]);

  const tryPickupNearestWorldLayoutItem = useCallback((): boolean => {
    const pos = playerPositionRef.current;
    if (!pos) return false;
    const st = useGameStore.getState();
    const defs = getWorldItemsForScene(sceneId);
    let best: (typeof defs)[0] | null = null;
    let bestD = WORLD_LAYOUT_PICKUP_RADIUS;
    for (const def of defs) {
      const row = st.exploration.worldItems.find((w) => w.id === def.id);
      if (row?.collected) continue;
      const dx = pos.x - def.position.x;
      const dy = pos.y - def.position.y;
      const dz = pos.z - def.position.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < bestD) {
        bestD = d;
        best = def;
      }
    }
    if (!best) return false;
    const hasRow = st.exploration.worldItems.some((w) => w.id === best.id);
    if (!hasRow) {
      st.addWorldItem({
        id: best.id,
        itemId: best.itemId,
        position: { x: best.position.x, y: best.position.y, z: best.position.z },
        sceneId: best.sceneId as SceneId,
        collected: false,
      });
    }
    st.collectWorldItem(best.id);
    st.addItem(best.itemId, 1);
    const meta = getItemById(best.itemId);
    eventBus.emit('ui:exploration_message', {
      text: meta ? `В инвентарь: ${meta.name}` : 'Предмет подобран.',
    });
    return true;
  }, [playerPositionRef, sceneId]);

  const handlePlayerInteraction = useCallback(() => {
    if (playerInputLocked) return;
    if (explorationBriefingOpen) {
      setExplorationBriefingOpen(false);
      return;
    }

    if (tryPickupNearestWorldLayoutItem()) {
      emitInteractionFeedback('success', 'loot');
      return;
    }

    if (radialObject) {
      setRadialObject(null);
      return;
    }

    const currentPos = playerPositionRef.current;
    if (!currentPos) return;

    const target = resolveExplorationInteractionPriority({
      playerPosition: currentPos,
      sceneTriggers,
      triggerStates,
      sceneInteractiveObjects,
      sceneNPCs,
      npcStates,
      availableInteractionIds,
    });

    if (target.kind === 'registry') {
      const st = useGameStore.getState();
      const ran = explorationInteractionRegistry.tryExecute(target.interactionId, {
        setGameMode: st.setGameMode,
        onNPCInteraction,
        activateQuest: st.activateQuest,
        incrementQuestObjective: st.incrementQuestObjective,
        completeQuest: st.completeQuest,
        isQuestActive: st.isQuestActive,
        isQuestCompleted: st.isQuestCompleted,
        getQuestProgress: st.getQuestProgress,
      });
      if (ran) {
        emitInteractionFeedback('success', 'registry');
        return;
      }
      emitInteractionFeedback('fail', 'registry');
      return;
    }

    if (target.kind === 'story_trigger') {
      const trigger = sceneTriggers.find((t) => t.id === target.triggerId);
      if (!trigger) return;
      handleTriggerEnter(trigger.id);
      if (trigger.oneTime) {
        handleTriggerStateChange(trigger.id, {
          id: trigger.id,
          triggered: true,
          triggeredAt: Date.now(),
        });
      }
      emitInteractionFeedback('success', 'trigger');
      return;
    }

    if (target.kind === 'world_object') {
      setRadialObject(target.object);
      emitInteractionFeedback('success', 'object');
      return;
    }

    if (target.kind === 'npc') {
      const nearestNPC = sceneNPCs.find((n) => n.id === target.npcId);
      if (!nearestNPC) return;
      const entry = getCurrentScheduleEntry(nearestNPC.id, timeOfDay);
      if (entry && !entry.dialogueAvailable) {
        eventBus.emit('ui:exploration_message', { text: 'Персонаж сейчас недоступен' });
        emitInteractionFeedback('fail', 'npc');
        return;
      }
      onNPCInteraction(nearestNPC.id);
      emitInteractionFeedback('success', 'npc');
      return;
    }

    emitInteractionFeedback('fail');
  }, [
    playerInputLocked,
    explorationBriefingOpen,
    setExplorationBriefingOpen,
    tryPickupNearestWorldLayoutItem,
    radialObject,
    playerPositionRef,
    sceneTriggers,
    triggerStates,
    sceneInteractiveObjects,
    sceneNPCs,
    npcStates,
    availableInteractionIds,
    onNPCInteraction,
    timeOfDay,
    handleTriggerEnter,
    handleTriggerStateChange,
  ]);

  const onInteractionAvailabilityChange = useCallback((ids: ReadonlySet<string>) => {
    setAvailableInteractionIds(ids);
  }, []);

  return {
    radialObject,
    setRadialObject,
    radialMenuActions,
    radialMenuAnchorLabel,
    availableInteractionIds,
    onInteractionAvailabilityChange,
    handlePlayerInteraction,
  };
}
