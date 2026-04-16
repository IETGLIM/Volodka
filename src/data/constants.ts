// ============================================
// RUNTIME CONSTANTS
// Separated from types.ts to avoid circular dependencies
// ============================================

import type { PlayerSkills, Collections, GameStatistics, PlayerState, NPCRelation } from './types';

export const INITIAL_SKILLS: PlayerSkills = {
  writing: 10,
  perception: 15,
  empathy: 20,
  imagination: 25,
  logic: 15,
  coding: 10,
  persuasion: 5,
  intuition: 10,
  resilience: 15,
  introspection: 10,
  skillPoints: 0,
};

export const INITIAL_COLLECTIONS: Collections = {
  poems: [],
  memories: [],
  secrets: [],
  achievements: [],
  endings: [],
};

export const INITIAL_STATISTICS: GameStatistics = {
  choicesMade: 0,
  poemsCreated: 0,
  npcsMet: 0,
  locationsVisited: 0,
  timeInDreams: 0,
  moralChoices: [],
};

export const INITIAL_STATE: PlayerState = {
  mood: 50,
  creativity: 30,
  stability: 60,
  energy: 5,
  karma: 50,
  selfEsteem: 40,
  stress: 0,
  panicMode: false,
  poemsCollected: [],
  path: 'none',
  act: 1,
  visitedNodes: [],
  playTime: 0,
  skills: INITIAL_SKILLS,
  collections: INITIAL_COLLECTIONS,
  flags: {},
  statistics: INITIAL_STATISTICS,
  panicTimers: [],
};

export const INITIAL_NPC_RELATIONS: NPCRelation[] = [
  { 
    id: 'maria', 
    name: 'Виктория', 
    value: 0, 
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  { 
    id: 'alexey', 
    name: 'Алексей', 
    value: 0, 
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  { 
    id: 'friend', 
    name: 'Денис', 
    value: 0, 
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  {
    id: 'vera',
    name: 'Вера',
    value: 0,
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
  {
    id: 'stranger',
    name: 'Незнакомец',
    value: 0,
    stage: 'stranger',
    trust: 0,
    respect: 0,
    intimacy: 0,
    flags: {},
    interactions: []
  },
];
