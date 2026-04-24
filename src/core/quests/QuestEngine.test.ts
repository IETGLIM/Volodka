import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMemoryStore } from '@/core/memory/memoryStore';
import { introQuest } from '@/game/quests/introQuest';

import { handleInteractionForQuests, startQuestWithLog } from './QuestEngine';
import { useQuestStore } from './questStore';

describe('QuestEngine + questStore', () => {
  beforeEach(() => {
    useQuestStore.setState({ quests: {} });
    useMemoryStore.setState({ memories: [], relationships: {} });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts intro quest and completes interact objective after npc_intro interaction', () => {
    startQuestWithLog(introQuest);
    expect(useQuestStore.getState().quests.intro_quest?.status).toBe('active');
    expect(useQuestStore.getState().quests.intro_quest?.objectives[0]?.completed).toBe(false);

    handleInteractionForQuests('npc_intro');

    const q = useQuestStore.getState().quests.intro_quest;
    expect(q?.status).toBe('completed');
    expect(q?.objectives[0]?.completed).toBe(true);
  });

  it('increments partial interact progress before completion', () => {
    useQuestStore.getState().startQuest({
      id: 'multi_hit',
      title: 'Multi',
      description: 'Hit thrice',
      status: 'inactive',
      objectives: [
        {
          id: 'hits',
          description: 'Interact',
          type: 'interact',
          targetId: 'quest_zarema_hearth',
          requiredCount: 3,
          completed: false,
        },
      ],
    });

    handleInteractionForQuests('quest_zarema_hearth');
    expect(useQuestStore.getState().quests.multi_hit?.objectives[0]?.currentCount).toBe(1);
    expect(useQuestStore.getState().quests.multi_hit?.status).toBe('active');

    handleInteractionForQuests('quest_zarema_hearth');
    handleInteractionForQuests('quest_zarema_hearth');
    expect(useQuestStore.getState().quests.multi_hit?.status).toBe('completed');
  });

  it('does not advance when interaction id does not match', () => {
    startQuestWithLog(introQuest);
    handleInteractionForQuests('wrong_interaction');
    const q = useQuestStore.getState().quests.intro_quest;
    expect(q?.status).toBe('active');
    expect(q?.objectives[0]?.completed).toBe(false);
  });

  it('ignores quests that are not active in the store', () => {
    useQuestStore.setState({
      quests: {
        paused_q: {
          id: 'paused_q',
          title: 'Paused',
          description: '',
          status: 'inactive',
          objectives: [
            {
              id: 'o1',
              description: 'Hit',
              type: 'interact',
              targetId: 'npc_intro',
              completed: false,
            },
          ],
        },
      },
    });
    handleInteractionForQuests('npc_intro');
    expect(useQuestStore.getState().quests.paused_q?.status).toBe('inactive');
  });

  it('skips already completed objectives', () => {
    startQuestWithLog(introQuest);
    const store = useQuestStore.getState();
    store.completeObjective('intro_quest', store.quests.intro_quest!.objectives[0]!.id);
    handleInteractionForQuests('npc_intro');
    const q = useQuestStore.getState().quests.intro_quest;
    expect(q?.objectives[0]?.completed).toBe(true);
    expect(q?.status).toBe('completed');
  });
});
