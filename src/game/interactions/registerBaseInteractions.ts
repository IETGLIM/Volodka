'use client';

import { InteractionRegistry } from '@/core/interaction/InteractionRegistry';
import { checkDialogueCondition } from '@/core/dialogue/dialogueConditions';
import { rememberExplorationQuestCompleted } from '@/core/memory/MemoryEngine';
import { startQuestWithLog } from '@/core/quests/QuestEngine';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { eventBus } from '@/engine/EventBus';
import { introQuest } from '@/game/quests/introQuest';
import { useGameStore } from '@/store/gameStore';
import { useWireHackOverlayStore } from '@/store/wireHackOverlayStore';
import { audioEngine } from '@/engine/AudioEngine';

/** Singleton used by exploration (`RPGGameCanvas`). */
export const explorationInteractionRegistry = new InteractionRegistry();

let didRegisterBase = false;

const HEARTH_QUEST_ID = 'exploration_zarema_hearth';
const HEARTH_OBJECTIVE_ID = 'hearth_moment';

const VOLODKA_RACK_QUEST_ID = 'exploration_volodka_rack';
const VOLODKA_RACK_OBJECTIVE_ID = 'rack_force_nodes';

function shuffleWireIndices(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

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
      startQuestWithLog(introQuest);
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
        const hq = QUEST_DEFINITIONS[HEARTH_QUEST_ID];
        rememberExplorationQuestCompleted(
          HEARTH_QUEST_ID,
          hq?.title ?? 'Тёплый угол',
          'Ты закрепил этот угол в памяти — как точку, куда можно вернуться мыслью.',
        );
        eventBus.emit('ui:exploration_message', { text: 'Квест «Тёплый угол» выполнен.' });
      } else {
        eventBus.emit('ui:exploration_message', { text: 'Ты отметил уютный угол — цель в журнале обновлена.' });
      }
    },
  });

  /** Пример: память + раппорт (`checkDialogueCondition`) — доступно реестру / будущим зонам. */
  registry.register({
    id: 'zarema_resonance_ping',
    type: 'event',
    condition: () =>
      checkDialogueCondition('hasMemory("met_npc") && relationship(zarema_home) > 42'),
    execute: () => {
      eventBus.emit('ui:exploration_message', {
        text: 'Где-то в комнате отзывается эхо прошлого разговора — память держит дверь чуть приоткрытой.',
      });
    },
  });

  /** Мини-игра взлома у стойки мониторов (`HackingWireMinigameOverlay` + квест «Разрыв синхронизации»). */
  registry.register({
    id: 'volodka_rack_hack',
    type: 'event',
    condition: () => {
      const st = useGameStore.getState();
      if (st.completedQuestIds.includes(VOLODKA_RACK_QUEST_ID)) return false;
      const audit = st.getQuestProgress(VOLODKA_RACK_QUEST_ID)?.rack_audit_panels ?? 0;
      /** Начат честный аудит — форс отключается до завершения квеста по аудиту. */
      if (audit > 0) return false;
      return true;
    },
    execute: (ctx) => {
      const { activateQuest, incrementQuestObjective, completeQuest, getQuestProgress, isQuestActive } = ctx;
      if (!activateQuest || !incrementQuestObjective || !completeQuest || !getQuestProgress || !isQuestActive) {
        return;
      }
      const sequence = shuffleWireIndices();
      useWireHackOverlayStore.getState().openWireHack({
        title: 'МАТРИЦА УЗЛОВ · rack-01',
        sequence,
        onFinished: (success) => {
          useWireHackOverlayStore.getState().closeWireHack();
          if (!success) {
            eventBus.emit('ui:exploration_message', {
              text: 'Сессия прервана. IDS всё ещё пишет в журнал «user cancelled».',
            });
            return;
          }
          if (!isQuestActive(VOLODKA_RACK_QUEST_ID)) {
            activateQuest(VOLODKA_RACK_QUEST_ID);
          }
          incrementQuestObjective(VOLODKA_RACK_QUEST_ID, VOLODKA_RACK_OBJECTIVE_ID);
          const prog = getQuestProgress(VOLODKA_RACK_QUEST_ID);
          const cur = prog[VOLODKA_RACK_OBJECTIVE_ID] ?? 0;
          const def = QUEST_DEFINITIONS[VOLODKA_RACK_QUEST_ID];
          const obj = def?.objectives.find((o) => o.id === VOLODKA_RACK_OBJECTIVE_ID);
          const target = obj?.targetValue ?? 1;
          if (cur >= target) {
            completeQuest(VOLODKA_RACK_QUEST_ID);
            rememberExplorationQuestCompleted(
              VOLODKA_RACK_QUEST_ID,
              def?.title ?? 'Разрыв синхронизации',
              'Ты свёл узлы в допустимую последовательность — алерты на секунду затихли, как будто город выдохнул.',
            );
            eventBus.emit('ui:exploration_message', {
              text: 'Квест «Разрыв синхронизации» закрыт веткой форса. Ветка честного аудита для этого прохождения больше не считается.',
            });
            audioEngine.playSfx('loot', 0.18);
          }
        },
      });
    },
  });
}
