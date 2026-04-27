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

const DISTRICT_CHRONICLE_QUEST_ID = 'exploration_district_chronicle';
const DISTRICT_CHRONICLE_OBJECTIVE_ID = 'chronicle_whisper';

const MVD_BUREAU_QUEST_ID = 'exploration_mvd_bureau';
const MVD_BUREAU_OBJECTIVE_ID = 'bureau_stamp';

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

/** Район: линейный счётчик — три «заседания» у лавки (Gothic: устная хроника двора). */
export const DISTRICT_CHRONICLE_EXPLORATION_QUEST_GRAPH: ExplorationQuestGraph = {
  id: 'district_chronicle',
  questId: DISTRICT_CHRONICLE_QUEST_ID,
  initialNode: 'collecting',
  nodes: ['collecting', 'completed'],
  edges: [
    {
      id: 'district_chronicle_partial',
      from: 'collecting',
      to: 'collecting',
      trigger: { kind: 'interaction', interactionId: 'quest_district_chronicle' },
      when: (api) => {
        const cur = api.progress(DISTRICT_CHRONICLE_OBJECTIVE_ID);
        const target = api.objectiveTarget(DISTRICT_CHRONICLE_OBJECTIVE_ID);
        return cur + 1 < target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(DISTRICT_CHRONICLE_OBJECTIVE_ID);
        api.emitUi('Лавка запоминает чужие ноги. Ещё один фрагмент — в записи квеста.');
      },
    },
    {
      id: 'district_chronicle_done',
      from: 'collecting',
      to: 'completed',
      trigger: { kind: 'interaction', interactionId: 'quest_district_chronicle' },
      when: (api) => {
        const cur = api.progress(DISTRICT_CHRONICLE_OBJECTIVE_ID);
        const target = api.objectiveTarget(DISTRICT_CHRONICLE_OBJECTIVE_ID);
        return cur + 1 >= target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(DISTRICT_CHRONICLE_OBJECTIVE_ID);
        api.completeQuest();
        api.rememberCompletion(
          'Ты выслушал хронику двора — не как тикет, а как петлю, где один и тот же день крутится, пока кто-то не выйдет за грань.',
        );
        api.emitUi('Квест «Хроника двора» выполнен.');
        audioEngine.playSfx('loot', 0.12);
      },
    },
  ],
};

/** МВД: бюрократия как minigame без кода — три печати. */
export const MVD_BUREAU_EXPLORATION_QUEST_GRAPH: ExplorationQuestGraph = {
  id: 'mvd_bureau',
  questId: MVD_BUREAU_QUEST_ID,
  initialNode: 'stamping',
  nodes: ['stamping', 'done'],
  edges: [
    {
      id: 'mvd_bureau_partial',
      from: 'stamping',
      to: 'stamping',
      trigger: { kind: 'interaction', interactionId: 'quest_mvd_bureau' },
      when: (api) => {
        const cur = api.progress(MVD_BUREAU_OBJECTIVE_ID);
        const target = api.objectiveTarget(MVD_BUREAU_OBJECTIVE_ID);
        return cur + 1 < target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(MVD_BUREAU_OBJECTIVE_ID);
        api.emitUi('Печать хлопнула. Очередь сдвинулась на одну сиротскую ссылку вперёд.');
      },
    },
    {
      id: 'mvd_bureau_complete',
      from: 'stamping',
      to: 'done',
      trigger: { kind: 'interaction', interactionId: 'quest_mvd_bureau' },
      when: (api) => {
        const cur = api.progress(MVD_BUREAU_OBJECTIVE_ID);
        const target = api.objectiveTarget(MVD_BUREAU_OBJECTIVE_ID);
        return cur + 1 >= target;
      },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(MVD_BUREAU_OBJECTIVE_ID);
        api.completeQuest();
        api.rememberCompletion(
          'Ты закрыл петлю бумажного circuit breaker: печать, печать, печать — и человек снова допущен в реальность.',
        );
        api.emitUi('Квест «Бумажный circuit breaker» выполнен.');
        audioEngine.playSfx('loot', 0.1);
      },
    },
  ],
};

const ZAREMA_TV_QUEST_ID = 'exploration_zarema_tv_feed' as const;
const ZAREMA_TV_OBJECTIVE_ID = 'tv_log_ack' as const;

/** Квартира Заремы: осмотр «настенного лога» (экран с матрицей у северной стены). */
export const ZAREMA_TV_EXPLORATION_QUEST_GRAPH: ExplorationQuestGraph = {
  id: 'zarema_tv',
  questId: ZAREMA_TV_QUEST_ID,
  initialNode: 'idle',
  nodes: ['idle', 'done'],
  edges: [
    {
      id: 'zarema_tv_once',
      from: 'idle',
      to: 'done',
      trigger: { kind: 'interaction', interactionId: 'quest_zarema_tv' },
      run: (api) => {
        api.activateQuest();
        api.incrementObjective(ZAREMA_TV_OBJECTIVE_ID);
        api.completeQuest();
        api.rememberCompletion(
          'Секунда — и «лог» на стене сливается с дежурством: тикеты, Grafana, чужие голоса лифта.',
        );
        api.emitUi('Квест «Лог подъезда» выполнен.');
        audioEngine.playSfx('ui', 0.12);
      },
    },
  ],
};
