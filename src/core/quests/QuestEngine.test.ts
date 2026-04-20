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
});
