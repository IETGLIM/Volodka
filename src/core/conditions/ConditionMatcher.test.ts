import { describe, it, expect } from 'vitest';
import {
  explorationHourToNarrativeTimeOfDay,
  narrativeTimeInRange,
} from '@/core/conditions/timeOfDay';
import {
  matchRequiredSkills,
  matchChoiceCondition,
  matchDialogueCondition,
  matchConsequenceCondition,
} from '@/core/conditions/ConditionMatcher';
import type { PlayerState } from '@/data/types';
import { INITIAL_PLAYER_ENERGY } from '@/lib/energyConfig';

const basePlayer = {
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
  path: 'none' as const,
  act: 1 as const,
  visitedNodes: ['n1'],
  playTime: 0,
  skills: {
    writing: 20,
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
  flags: { f1: true },
  statistics: {
    choicesMade: 0,
    poemsCreated: 0,
    npcsMet: 0,
    locationsVisited: 0,
    timeInDreams: 0,
    moralChoices: [],
  },
  panicTimers: [],
} as unknown as PlayerState;

describe('timeOfDay', () => {
  it('maps exploration hour to narrative phase', () => {
    expect(explorationHourToNarrativeTimeOfDay(20)).toBe('evening');
    expect(explorationHourToNarrativeTimeOfDay(3)).toBe('dawn');
    expect(explorationHourToNarrativeTimeOfDay(30)).toBe('morning');
  });

  it('narrativeTimeInRange respects min/max', () => {
    expect(narrativeTimeInRange('evening', 'afternoon', 'night')).toBe(true);
    expect(narrativeTimeInRange('morning', 'evening', 'night')).toBe(false);
    expect(narrativeTimeInRange(undefined, 'morning', undefined)).toBe(false);
  });
});

describe('matchRequiredSkills', () => {
  it('passes when skills meet mins', () => {
    const r = matchRequiredSkills([{ skill: 'writing', min: 15 }], basePlayer.skills);
    expect(r).toEqual({ ok: true });
  });

  it('fails when below min', () => {
    const r = matchRequiredSkills([{ skill: 'writing', min: 90 }], basePlayer.skills);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.have).toBe(20);
  });
});

describe('matchChoiceCondition', () => {
  it('honors visitedNode and quest fields', () => {
    const ctx = {
      playerState: basePlayer,
      npcRelations: [],
      flags: {},
      inventory: [],
      visitedNodes: ['n1'],
      skills: basePlayer.skills,
      activeQuestIds: ['q1'],
      completedQuestIds: [],
      narrativeTimeOfDay: explorationHourToNarrativeTimeOfDay(20),
    };
    expect(
      matchChoiceCondition({ visitedNode: 'n1', questActive: 'q1' }, ctx).met,
    ).toBe(true);
    expect(matchChoiceCondition({ visitedNode: 'missing' }, ctx).met).toBe(false);
  });

  it('honors equippedAnyOf when context lists items', () => {
    const ctx = {
      playerState: basePlayer,
      npcRelations: [],
      flags: {},
      inventory: [],
      visitedNodes: [],
      skills: basePlayer.skills,
      activeQuestIds: [],
      completedQuestIds: [],
      equippedItemIds: ['boots_rare'],
    };
    expect(matchChoiceCondition({ equippedAnyOf: ['boots_rare'] }, ctx).met).toBe(true);
    expect(matchChoiceCondition({ equippedAnyOf: ['cloak'] }, ctx).met).toBe(false);
  });
});

describe('matchDialogueCondition', () => {
  it('respects minSkill and maxKarma', () => {
    const ctx = {
      playerState: basePlayer,
      npcRelations: [],
      flags: {},
      inventory: [],
      visitedNodes: [],
      skills: basePlayer.skills,
      activeQuestIds: [],
      completedQuestIds: [],
    };
    expect(matchDialogueCondition({ minSkill: { skill: 'writing', value: 15 } }, ctx)).toBe(true);
    expect(matchDialogueCondition({ minSkill: { skill: 'writing', value: 99 } }, ctx)).toBe(false);
    expect(matchDialogueCondition({ maxKarma: 60 }, ctx)).toBe(true);
    expect(matchDialogueCondition({ maxKarma: 40 }, ctx)).toBe(false);
  });

  it('requires dialogueVisitedNodeIds for completedDialogue', () => {
    const ctx = {
      playerState: basePlayer,
      npcRelations: [],
      flags: {},
      inventory: [],
      visitedNodes: [],
      skills: basePlayer.skills,
      activeQuestIds: [],
      completedQuestIds: [],
      dialogueVisitedNodeIds: ['dlg_a'],
    };
    expect(matchDialogueCondition({ completedDialogue: 'dlg_a' }, ctx)).toBe(true);
    expect(matchDialogueCondition({ completedDialogue: 'missing' }, ctx)).toBe(false);
  });
});

describe('matchConsequenceCondition', () => {
  it('combines minStat and nested choiceCondition', () => {
    const ctx = {
      playerState: basePlayer,
      npcRelations: [],
      flags: { gate: true },
      inventory: [],
      visitedNodes: ['n1'],
      skills: basePlayer.skills,
      activeQuestIds: [],
      completedQuestIds: [],
    };
    expect(
      matchConsequenceCondition(
        { minStat: { stat: 'mood', value: 40 }, choiceCondition: { hasFlag: 'gate' } },
        ctx,
      ),
    ).toBe(true);
    expect(
      matchConsequenceCondition({ minStat: { stat: 'mood', value: 99 } }, ctx),
    ).toBe(false);
  });

  it('checks questCompleted', () => {
    const ctx = {
      playerState: basePlayer,
      npcRelations: [],
      flags: {},
      inventory: [],
      visitedNodes: [],
      skills: basePlayer.skills,
      activeQuestIds: [],
      completedQuestIds: ['q_done'],
    };
    expect(matchConsequenceCondition({ questCompleted: 'q_done' }, ctx)).toBe(true);
    expect(matchConsequenceCondition({ questCompleted: 'other' }, ctx)).toBe(false);
  });
});
