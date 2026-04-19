'use client';

import { InteractionRegistry } from '@/core/interaction/InteractionRegistry';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';

/** Singleton used by exploration (`RPGGameCanvas`). */
export const explorationInteractionRegistry = new InteractionRegistry();

let didRegisterBase = false;

const HEARTH_QUEST_ID = 'exploration_zarema_hearth';
const HEARTH_OBJECTIVE_ID = 'hearth_moment';

function hearthObjectiveTarget(): number {
  const q = QUEST_DEFINITIONS[HEARTH_QUEST_ID];
  const obj = q?.objectives.find((o) => o.id === HEARTH_OBJECTIVE_ID);
  return obj?.targetValue ?? 1;
}

/**
 * Registers default `InteractionRegistry` entries (idempotent).
 * Dialogue UI is opened via `onNPCInteraction` → `useDialogueFlow` (same path as E on NPC mesh).
 */
export function registerBaseInteractions(registry: InteractionRegistry = explorationInteractionRegistry): void {
  if (didRegisterBase) return;
  didRegisterBase = true;

  registry.register({
    id: 'npc_intro',
    type: 'dialogue',
    execute: (ctx) => {
      ctx.setGameMode('dialogue');
      ctx.onNPCInteraction?.('zarema_home');
    },
  });

  registry.register({
    id: 'quest_zarema_hearth',
    type: 'event',
    condition: () => !useGameStore.getState().completedQuestIds.includes(HEARTH_QUEST_ID),
    execute: (ctx) => {
      const { activateQuest, incrementQuestObjective, completeQuest, getQuestProgress, isQuestActive } = ctx;
      if (!activateQuest || !incrementQuestObjective || !completeQuest || !getQuestProgress || !isQuestActive) return;

      if (!isQuestActive(HEARTH_QUEST_ID)) {
        activateQuest(HEARTH_QUEST_ID);
      }
      incrementQuestObjective(HEARTH_QUEST_ID, HEARTH_OBJECTIVE_ID);
      const prog = getQuestProgress(HEARTH_QUEST_ID);
      const current = prog[HEARTH_OBJECTIVE_ID] ?? 0;
      const target = hearthObjectiveTarget();
      if (current >= target) {
        completeQuest(HEARTH_QUEST_ID);
        eventBus.emit('ui:exploration_message', { text: 'Квест «Тёплый угол» выполнен.' });
      } else {
        eventBus.emit('ui:exploration_message', { text: 'Ты отметил уютный угол — цель в журнале обновлена.' });
      }
    },
  });
}
