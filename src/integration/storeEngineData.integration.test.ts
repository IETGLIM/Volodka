import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '@/store/gameStore';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { useGameStore } from '@/store/gameStore';
import { applyCombinedPatch } from '@/store/patchState';
import { createDefaultResetState } from '@/store/persistedState';
import { resetSliceMutationSchedulerForTests } from '@/store/combinedState';
import { getExplorationStoreState } from '@/store/stores/explorationStore';
import {
  disposeQuestTracker,
  reviveQuestTracker,
  resetQuestTrackerDefinitionCache,
  questTracker,
} from '@/engine/QuestTracker';
import {
  getQuestDefinitions,
  preloadNarrativeGameData,
} from '@/data/gameDataLoader';

async function flushStoreSubscriptions(): Promise<void> {
  useGameStore.setState({});
  await Promise.resolve();
  await Promise.resolve();
}

describe('store ↔ engine ↔ data integration', () => {
  beforeAll(async () => {
    await preloadNarrativeGameData();
  });

  beforeEach(() => {
    resetSliceMutationSchedulerForTests();
    resetQuestTrackerDefinitionCache();
    disposeQuestTracker();
    applyCombinedPatch(createDefaultResetState());
    useGameStore.setState({});
    reviveQuestTracker();
  });

  afterEach(() => {
    disposeQuestTracker();
  });

  it('loads real quest definitions that QuestTracker can resolve', () => {
    const incident = getQuestDefinitions().find((quest) => quest.id === 'incident_scroll_4729');
    expect(incident).toBeDefined();
    expect(
      incident?.objectives.some(
        (objective) => objective.id === 'visit_office' && objective.target === 'office_day',
      ),
    ).toBe(true);
    expect(questTracker.canActivateQuest('incident_scroll_4729')).toBe(true);
  });

  it('QuestTracker completes location_visited objectives from real quest data', async () => {
    dispatchGameAction({ type: 'quest/activate', questId: 'incident_scroll_4729' });

    const activeQuest = useGameStore
      .getState()
      .quests.find((quest) => quest.questId === 'incident_scroll_4729');
    expect(activeQuest?.status).toBe('active');

    getExplorationStoreState().setExplorationScene('office_day');
    await flushStoreSubscriptions();

    const quest = useGameStore
      .getState()
      .quests.find((entry) => entry.questId === 'incident_scroll_4729');
    expect(quest?.objectives.visit_office).toBe(true);
  });

  it('QuestTracker completes flag_set objectives when store flags change', async () => {
    dispatchGameAction({ type: 'quest/activate', questId: 'morning_ritual' });

    dispatchGameAction({
      type: 'player/setFlag',
      key: 'morning_ritual_terminal',
      value: true,
    });
    await flushStoreSubscriptions();

    const quest = useGameStore
      .getState()
      .quests.find((entry) => entry.questId === 'morning_ritual');
    expect(quest?.objectives.ritual_terminal).toBe(true);
  });
});
