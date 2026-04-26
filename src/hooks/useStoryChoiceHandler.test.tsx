import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoryChoice, PlayerSkills } from '@/data/types';
import { useStoryChoiceHandler } from './useStoryChoiceHandler';
import { eventBus } from '@/engine/EventBus';
import { coreLoop } from '@/engine/CoreLoop';
import { useGameStore } from '@/state/gameStore';

function createBaseParams() {
  const state = useGameStore.getState();
  return {
    currentNodeId: state.currentNodeId,
    playerState: state.playerState,
    playerSkills: { writing: 50, empathy: 25 } as PlayerSkills,
    energySystem: {
      canAfford: vi.fn(() => true),
      consumeEnergy: vi.fn(() => true),
    },
    showEffectNotif: vi.fn(),
    setCurrentNode: vi.fn(),
    addStat: vi.fn(),
    addStress: vi.fn(),
    reduceStress: vi.fn(),
    collectPoem: vi.fn(),
    setFlag: vi.fn(),
    unsetFlag: vi.fn(),
    updateNPCRelation: vi.fn(),
    activateQuest: vi.fn(),
    completeQuest: vi.fn(),
    incrementQuestObjective: vi.fn(),
    updateQuestObjective: vi.fn(),
    addSkill: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    openDialogueFromStory: vi.fn(),
  };
}

describe('useStoryChoiceHandler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useGameStore.setState({ currentNodeId: 'start', choiceLog: [] });
    vi.spyOn(coreLoop, 'processChoiceCycle').mockImplementation(() => ({
      effects: [],
      unlocks: [],
      consequences: [],
    }));
  });

  it('shows energy warning and stops when energy is insufficient', () => {
    const params = createBaseParams();
    params.energySystem.canAfford = vi.fn(() => false);

    const { result } = renderHook(() => useStoryChoiceHandler(params));

    act(() => {
      result.current.handleChoice({ text: 'Выбор', next: 'node_2' });
    });

    expect(params.showEffectNotif).toHaveBeenCalledWith(
      expect.stringContaining('Не хватает энергии'),
      'energy',
      expect.any(Number),
    );
    expect(params.setCurrentNode).not.toHaveBeenCalled();
  });

  it('handles skill check success path', () => {
    const params = createBaseParams();
    const emitSpy = vi.spyOn(eventBus, 'emit');
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const { result } = renderHook(() => useStoryChoiceHandler(params));
    const choice: StoryChoice = {
      text: 'Проверка',
      next: 'unused',
      skillCheck: {
        skill: 'writing',
        difficulty: 40,
        successNext: 'success_node',
        failNext: 'fail_node',
        successEffect: { mood: 5 },
      },
    };

    act(() => {
      result.current.handleChoice(choice);
    });

    expect(params.setCurrentNode).toHaveBeenCalledWith('success_node');
    expect(params.addStat).toHaveBeenCalledWith('mood', 5);
    expect(emitSpy).toHaveBeenCalledWith('skill:check', expect.objectContaining({ success: true }));
    const log = useGameStore.getState().choiceLog;
    expect(log.length).toBe(1);
    expect(log[0].kind).toBe('skill');
    expect(log[0].toNodeId).toBe('success_node');
  });

  it('opens embedded NPC dialogue and defers story node until dialogue closes', () => {
    const params = createBaseParams();
    const { result } = renderHook(() => useStoryChoiceHandler(params));

    act(() => {
      result.current.handleChoice({
        text: 'Поговорить с коллегой',
        next: 'next_node',
        dialogueNpcId: 'office_colleague',
      });
    });

    expect(params.openDialogueFromStory).toHaveBeenCalledWith({
      npcId: 'office_colleague',
      nextNodeId: 'next_node',
      fromNodeId: 'start',
      choiceText: 'Поговорить с коллегой',
    });
    expect(params.setCurrentNode).not.toHaveBeenCalled();
    expect(useGameStore.getState().choiceLog.length).toBe(0);
  });

  it('appends story choice to choice log after transition', () => {
    const params = createBaseParams();
    const { result } = renderHook(() => useStoryChoiceHandler(params));

    act(() => {
      result.current.handleChoice({ text: 'Сделать шаг', next: 'node_b' });
    });

    expect(params.setCurrentNode).toHaveBeenCalledWith('node_b');
    const log = useGameStore.getState().choiceLog;
    expect(log.length).toBe(1);
    expect(log[0].choiceText).toBe('Сделать шаг');
    expect(log[0].fromNodeId).toBe('start');
    expect(log[0].toNodeId).toBe('node_b');
    expect(log[0].kind).toBe('story');
  });
});
