/**
 * Данные графов побочных квестов обхода (узлы + рёбра).
 * Раннер: `dispatchExplorationQuestGraph` из `@/game/core/explorationQuestGraph`.
 */
import { audioEngine } from '@/engine/AudioEngine';
import type { ExplorationQuestGraph } from '@/game/core/explorationQuestGraph';

const HEARTH_QUEST_ID = 'exploration_zarema_hearth';
const HEARTH_OBJECTIVE_ID = 'hearth_moment';

const RACK_QUEST_ID = 'exploration_volodka_rack';
const RACK_FORCE_OBJECTIVE_ID = 'rack_force_nodes';

export function shuffleWireIndices(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/** Квест «Тёплый угол»: линейный счётчик цели; развилка «ещё не конец» / «завершить». */
export const HEARTH_EXPLORATION_QUEST_GRAPH: ExplorationQuestGraph = {
  id: 'hearth',
  questId: HEARTH_QUEST_ID,
  initialNode: 'collecting',
  nodes: ['collecting', 'completed'],
  edges: [
    {
      id: 'hearth_interact_partial',
      from: 'collecting',
      to: 'collecting',
      trigger: { kind: 'interaction', interactionId: 'quest_zarema_hearth' },
      when: (api) => {
        const cur = api.progress(HEARTH_OBJECTIVE_ID);
        const target = api.objectiveTarget(HEARTH_OBJECTIVE_ID);
        return cur + 1 < target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(HEARTH_OBJECTIVE_ID);
        api.emitUi('Ты отметил уютный угол — цель в журнале обновлена.');
      },
    },
    {
      id: 'hearth_interact_complete',
      from: 'collecting',
      to: 'completed',
      trigger: { kind: 'interaction', interactionId: 'quest_zarema_hearth' },
      when: (api) => {
        const cur = api.progress(HEARTH_OBJECTIVE_ID);
        const target = api.objectiveTarget(HEARTH_OBJECTIVE_ID);
        return cur + 1 >= target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(HEARTH_OBJECTIVE_ID);
        api.completeQuest();
        api.rememberCompletion(
          'Ты закрепил этот угол в памяти — как точку, куда можно вернуться мыслью.',
        );
        api.emitUi('Квест «Тёплый угол» выполнен.');
      },
    },
  ],
};

/** Ветка «форс» квеста «Разрыв синхронизации» (мини-игра узлов). Аудит — отдельный код в `volodkaRackQuestBranch`. */
export const RACK_FORCE_EXPLORATION_QUEST_GRAPH: ExplorationQuestGraph = {
  id: 'rack_force',
  questId: RACK_QUEST_ID,
  initialNode: 'force_idle',
  nodes: ['force_idle', 'force_done'],
  edges: [
    {
      id: 'rack_wire_fail',
      from: 'force_idle',
      to: 'force_idle',
      trigger: { kind: 'wire_hack_result', success: false },
      run: (api) => {
        api.emitUi('Сессия прервана. IDS всё ещё пишет в журнал «user cancelled».');
      },
    },
    {
      id: 'rack_wire_success_progress',
      from: 'force_idle',
      to: 'force_idle',
      trigger: { kind: 'wire_hack_result', success: true },
      when: (api) => {
        const cur = api.progress(RACK_FORCE_OBJECTIVE_ID);
        const target = api.objectiveTarget(RACK_FORCE_OBJECTIVE_ID);
        return cur + 1 < target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(RACK_FORCE_OBJECTIVE_ID);
      },
    },
    {
      id: 'rack_wire_success_complete',
      from: 'force_idle',
      to: 'force_done',
      trigger: { kind: 'wire_hack_result', success: true },
      when: (api) => {
        const cur = api.progress(RACK_FORCE_OBJECTIVE_ID);
        const target = api.objectiveTarget(RACK_FORCE_OBJECTIVE_ID);
        return cur + 1 >= target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(RACK_FORCE_OBJECTIVE_ID);
        api.completeQuest();
        api.rememberCompletion(
          'Ты свёл узлы в допустимую последовательность — алерты на секунду затихли, как будто город выдохнул.',
        );
        api.emitUi(
          'Квест «Разрыв синхронизации» закрыт веткой форса. Ветка честного аудита для этого прохождения больше не считается.',
        );
        audioEngine.playSfx('loot', 0.18);
      },
    },
  ],
};
