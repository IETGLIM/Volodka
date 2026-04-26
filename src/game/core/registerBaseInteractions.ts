import { InteractionRegistry } from '@/game/interactions/InteractionRegistry';
import { checkDialogueCondition } from '@/game/dialogue/dialogueConditions';
import { startQuestWithLog } from '@/game/quests/QuestEngine';
import { eventBus } from '@/engine/EventBus';
import { introQuest } from '@/game/quests/introQuest';
import { useGameStore } from '@/state';
import { useWireHackOverlayStore } from '@/state/wireHackOverlayStore';
import { useExplorationRackConsoleStore } from '@/state/explorationRackConsoleStore';
import {
  VOLODKA_RACK_CONSOLE_DISMISS_LABEL,
  VOLODKA_RACK_CONSOLE_HEADLINE,
  VOLODKA_RACK_CONSOLE_LINES,
  VOLODKA_RACK_CONSOLE_PROCEED_LABEL,
} from '@/lib/volodkaRackConsoleCopy';
import { dispatchExplorationQuestGraph } from '@/game/core/explorationQuestGraph';
import {
  HEARTH_EXPLORATION_QUEST_GRAPH,
  RACK_FORCE_EXPLORATION_QUEST_GRAPH,
  shuffleWireIndices,
} from '@/game/quests/explorationQuestGraphs';

/** Singleton used by exploration (`RPGGameCanvas`). */
export const explorationInteractionRegistry = new InteractionRegistry();

let didRegisterBase = false;

const HEARTH_QUEST_ID = HEARTH_EXPLORATION_QUEST_GRAPH.questId;
const VOLODKA_RACK_QUEST_ID = RACK_FORCE_EXPLORATION_QUEST_GRAPH.questId;

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
      dispatchExplorationQuestGraph(
        HEARTH_EXPLORATION_QUEST_GRAPH,
        { kind: 'interaction', interactionId: 'quest_zarema_hearth' },
        ctx,
      );
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
      const sequence = shuffleWireIndices();
      const openWireHack = () => {
        useWireHackOverlayStore.getState().openWireHack({
          title: 'МАТРИЦА УЗЛОВ · rack-01',
          sequence,
          onFinished: (success) => {
            useWireHackOverlayStore.getState().closeWireHack();
            dispatchExplorationQuestGraph(
              RACK_FORCE_EXPLORATION_QUEST_GRAPH,
              { kind: 'wire_hack_result', success },
              ctx,
            );
          },
        });
      };
      useExplorationRackConsoleStore.getState().openSession({
        headline: VOLODKA_RACK_CONSOLE_HEADLINE,
        lines: VOLODKA_RACK_CONSOLE_LINES,
        proceedLabel: VOLODKA_RACK_CONSOLE_PROCEED_LABEL,
        dismissLabel: VOLODKA_RACK_CONSOLE_DISMISS_LABEL,
        onProceed: openWireHack,
      });
    },
  });
}
