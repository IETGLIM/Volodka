import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TriggerZone } from '@/data/triggerZones';

const toggleInteractiveObject = vi.fn();
const openLinkedDialogue = vi.fn(async () => {});

vi.mock('@/store/gameStore', () => ({
  useGameStore: {
    getState: () => ({
      interactiveObjectStates: {},
      playerState: { progression: { currentAct: 1 } },
      toggleInteractiveObject,
      pushNotification: vi.fn(),
      activateQuest: vi.fn(),
    }),
  },
}));

vi.mock('@/shared/gamePhase', () => ({
  readGamePhase: () => 'exploration',
}));

vi.mock('@/data/gameDataLoader', () => ({
  getTriggerZones: () => mockZones,
  findNpcById: () => null,
  getItemDefinition: () => null,
}));

vi.mock('@/engine/interaction/narrativeOpenHelpers', () => ({
  openLinkedDialogue: (...args: unknown[]) => openLinkedDialogue(...args),
  openLinkedStory: vi.fn(),
  tryOpenDialogue: vi.fn(),
  tryOpenStory: vi.fn(),
}));

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: { playStinger: vi.fn() },
}));

import { InteractionController } from './InteractionController';

let mockZones: TriggerZone[] = [];

const examineZone: TriggerZone = {
  id: 'room_window',
  sceneId: 'volodka_room',
  position: [0, 0, 0],
  size: [1, 1, 1],
  isOneTime: true,
  linkedDialogueNodeId: 'explore_room_window',
  examineData: {
    title: 'Окно',
    description: 'test',
    detailText: 'test',
  },
};

describe('InteractionController one-time examine zones', () => {
  beforeEach(() => {
    toggleInteractiveObject.mockClear();
    openLinkedDialogue.mockClear();
    mockZones = [examineZone];
  });

  it('defers one-time burn until Examine Continue for linked content', () => {
    const setExamineOpen = vi.fn();
    const setExamineData = vi.fn();
    const setExamineHasLinkedContent = vi.fn();
    let pendingZone: TriggerZone | null = null;

    const controller = new InteractionController({
      startCombatFromStory: vi.fn(),
      minigameSetters: {} as never,
      ui: {
        setExamineOpen,
        setExamineData,
        setExamineHasLinkedContent,
      },
      getPendingTriggerZone: () => pendingZone,
      setPendingTriggerZone: (zone) => {
        pendingZone = zone;
      },
    });

    controller.handleObjectInteract('room_window');

    expect(toggleInteractiveObject).not.toHaveBeenCalled();
    expect(setExamineOpen).toHaveBeenCalledWith(true);
    expect(pendingZone?.id).toBe('room_window');

    controller.handleExamineContinue();

    expect(toggleInteractiveObject).toHaveBeenCalledWith('room_window');
    expect(openLinkedDialogue).toHaveBeenCalledWith('explore_room_window');

    controller.dispose();
  });
});
