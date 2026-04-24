import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DialogueContext } from '@/engine/DialogueEngine';
import {
  applyDialogueEffects,
  clearAllMemories,
  evaluateAllConditions,
  evaluateCondition,
  processDialogueChoice,
  startDialogue,
} from '@/engine/DialogueEngine';
import { eventBus } from '@/engine/EventBus';
import type { DialogueNode } from '@/data/rpgTypes';
import type { NPCRelation, PlayerState } from '@/data/types';
import { INITIAL_PLAYER_ENERGY } from '@/lib/energyConfig';

function makePlayer(over: Partial<PlayerState> = {}): PlayerState {
  return {
    mood: 50,
    creativity: 50,
    stability: 50,
    energy: INITIAL_PLAYER_ENERGY,
    karma: 50,
    selfEsteem: 50,
    stress: 10,
    panicMode: false,
    characterLevel: 1,
    experience: 0,
    experienceToNextLevel: 100,
    poemsCollected: [],
    path: 'none',
    act: 1,
    visitedNodes: ['story_a'],
    playTime: 0,
    skills: {
      writing: 40,
      perception: 10,
      empathy: 10,
      imagination: 10,
      logic: 10,
      coding: 10,
      persuasion: 5,
      intuition: 10,
      resilience: 10,
      introspection: 10,
      skillPoints: 0,
    },
    collections: { poems: [], memories: [], secrets: [], achievements: [], endings: [] },
    flags: { bonus: true },
    statistics: {
      choicesMade: 0,
      poemsCreated: 0,
      npcsMet: 0,
      locationsVisited: 0,
      timeInDreams: 0,
      moralChoices: [],
    },
    panicTimers: [],
    ...over,
  } as PlayerState;
}

const npc1: NPCRelation = {
  id: 'npc1',
  name: 'One',
  value: 60,
  stage: 'friend',
  trust: 1,
  respect: 50,
  intimacy: 0,
  flags: {},
  interactions: [],
};

function ctx(over: Partial<DialogueContext> = {}): DialogueContext {
  const playerState = makePlayer();
  return {
    playerState,
    npcRelations: [npc1],
    flags: playerState.flags,
    inventory: ['key'],
    visitedNodes: playerState.visitedNodes,
    skills: playerState.skills,
    ...over,
  };
}

describe('DialogueEngine — условия и граф', () => {
  beforeEach(() => {
    clearAllMemories();
    eventBus.clear();
  });

  afterEach(() => {
    clearAllMemories();
    eventBus.clear();
    vi.restoreAllMocks();
  });

  it('evaluateCondition checks hasFlag and minKarma', () => {
    const c = ctx();
    expect(evaluateCondition({ hasFlag: 'bonus' }, c)).toBe(true);
    expect(evaluateCondition({ hasFlag: 'nope' }, c)).toBe(false);
    expect(evaluateCondition({ minKarma: 40 }, c)).toBe(true);
    expect(evaluateCondition({ minKarma: 80 }, c)).toBe(false);
  });

  it('evaluateCondition uses visitedNode from story context', () => {
    expect(evaluateCondition({ visitedNode: 'story_a' }, ctx())).toBe(true);
    expect(evaluateCondition({ visitedNode: 'other' }, ctx())).toBe(false);
  });

  it('evaluateAllConditions is true for empty list', () => {
    expect(evaluateAllConditions(undefined, ctx())).toBe(true);
    expect(evaluateAllConditions([], ctx())).toBe(true);
  });

  it('evaluateAllConditions requires every clause', () => {
    const c = ctx();
    expect(
      evaluateAllConditions([{ hasFlag: 'bonus' }, { minKarma: 40 }], c),
    ).toBe(true);
    expect(
      evaluateAllConditions([{ hasFlag: 'bonus' }, { minKarma: 99 }], c),
    ).toBe(false);
  });

  it('startDialogue records node in NPC memory for completedDialogue checks', () => {
    const c = ctx();
    const root: DialogueNode = {
      id: 'root_node',
      text: 'Hi',
      choices: [],
    };
    startDialogue('npc1', root, c);
    expect(evaluateCondition({ completedDialogue: 'root_node' }, c)).toBe(true);
    expect(evaluateCondition({ completedDialogue: 'other' }, c)).toBe(false);
  });

  it('processDialogueChoice blocks when condition fails', () => {
    const nodes: Record<string, DialogueNode> = {
      next: { id: 'next', text: 'N', choices: [] },
    };
    const res = processDialogueChoice(
      {
        text: 'Go',
        next: 'next',
        condition: { hasFlag: 'absent' },
      },
      nodes,
      ctx(),
      'npc1',
    );
    expect(res.blocked).toBe(true);
    expect(res.nextNodeId).toBeNull();
  });

  it('processDialogueChoice follows next and emits dialogue:choice_made', () => {
    const heard: string[] = [];
    eventBus.on('dialogue:choice_made', (p) => heard.push(p.nextNodeId));
    const nodes: Record<string, DialogueNode> = {
      b: { id: 'b', text: 'B', choices: [] },
    };
    const res = processDialogueChoice(
      { text: 'To B', next: 'b' },
      nodes,
      ctx(),
      'npc1',
    );
    expect(res.blocked).not.toBe(true);
    expect(res.nextNodeId).toBe('b');
    expect(heard).toEqual(['b']);
  });

  it('processDialogueChoice skillCheck uses successNext when roll passes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const nodes: Record<string, DialogueNode> = {
      ok: { id: 'ok', text: 'OK', choices: [] },
      fail: { id: 'fail', text: 'F', choices: [] },
    };
    const res = processDialogueChoice(
      {
        text: 'Roll',
        next: 'ok',
        skillCheck: {
          skill: 'writing',
          difficulty: 10,
          successNext: 'ok',
          failNext: 'fail',
        },
      },
      nodes,
      ctx(),
      'npc1',
    );
    expect(res.skillCheckResult?.success).toBe(true);
    expect(res.nextNodeId).toBe('ok');
  });

  it('applyDialogueEffects calls store actions for flags and stats', () => {
    const actions = {
      addStat: vi.fn(),
      addStress: vi.fn(),
      reduceStress: vi.fn(),
      setFlag: vi.fn(),
      unsetFlag: vi.fn(),
      updateNPCRelation: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      activateQuest: vi.fn(),
      updateQuestObjective: vi.fn(),
      collectPoem: vi.fn(),
      addSkill: vi.fn(),
    };
    applyDialogueEffects(
      [
        { mood: 2, setFlag: 'done' },
        { stress: -3 },
        { questStart: 'q1' },
      ],
      actions,
    );
    expect(actions.addStat).toHaveBeenCalledWith('mood', 2);
    expect(actions.setFlag).toHaveBeenCalledWith('done');
    expect(actions.reduceStress).toHaveBeenCalledWith(3);
    expect(actions.activateQuest).toHaveBeenCalledWith('q1');
  });
});
