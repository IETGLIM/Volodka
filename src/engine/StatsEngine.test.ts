import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { statsEngine } from '@/engine/StatsEngine';
import { eventBus } from '@/engine/EventBus';
import type { PlayerState } from '@/data/types';
import { INITIAL_PLAYER_ENERGY, MAX_PLAYER_ENERGY } from '@/lib/energyConfig';

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
    visitedNodes: [],
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
    flags: {},
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

describe('StatsEngine', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('processStatChange clamps core stats to 0–100', () => {
    const p = makePlayer({ mood: 50 });
    const up = statsEngine.processStatChange('mood', 80, p);
    expect(up.newValue).toBe(100);
    const down = statsEngine.processStatChange('mood', -200, { ...p, mood: 5 });
    expect(down.newValue).toBe(0);
  });

  it('processStatChange clamps energy to MAX_PLAYER_ENERGY', () => {
    const p = makePlayer({ energy: MAX_PLAYER_ENERGY - 1 });
    const r = statsEngine.processStatChange('energy', 999, p);
    expect(r.newValue).toBe(MAX_PLAYER_ENERGY);
  });

  it('processStatChange emits stat:changed', () => {
    const payloads: Array<{ newValue: number }> = [];
    eventBus.on('stat:changed', (p) => {
      payloads.push({ newValue: p.newValue });
    });
    statsEngine.processStatChange('stability', -5, makePlayer({ stability: 40 }));
    expect(payloads).toHaveLength(1);
    expect(payloads[0]!.newValue).toBe(35);
  });

  it('processStatChange emits stress:threshold when crossing upward', () => {
    const levels: number[] = [];
    eventBus.on('stress:threshold', (p) => levels.push(p.level));
    statsEngine.processStatChange('stress', 20, makePlayer({ stress: 60 }));
    expect(levels).toContain(75);
  });

  it('getDerivedEffects marks sociallyBlocked when self-esteem low', () => {
    const d = statsEngine.getDerivedEffects(makePlayer({ selfEsteem: 10 }));
    expect(d.sociallyBlocked).toBe(true);
    expect(d.blockedChoices.some((b) => b.condition.includes('selfEsteem'))).toBe(true);
  });

  it('getDerivedEffects sets energyLevel exhausted near zero', () => {
    const low = Math.max(1, Math.ceil(MAX_PLAYER_ENERGY * 0.05));
    const d = statsEngine.getDerivedEffects(makePlayer({ energy: low }));
    expect(d.energyLevel).toBe('exhausted');
  });

  it('isChoiceConditionMet delegates to flags and quests', () => {
    const p = makePlayer();
    const ok = statsEngine.isChoiceConditionMet(
      { hasFlag: 'door_open', questActive: 'q_x' },
      p,
      { door_open: true },
      [],
      [],
      ['n0'],
      ['q_x'],
      [],
    );
    expect(ok.met).toBe(true);

    const bad = statsEngine.isChoiceConditionMet({ hasFlag: 'missing' }, p, {}, [], [], [], [], []);
    expect(bad.met).toBe(false);
    expect(bad.reason).toBeDefined();
  });

  it('getBlockedChoices matches getDerivedEffects.blockedChoices', () => {
    const p = makePlayer({ stress: 95 });
    expect(statsEngine.getBlockedChoices(p)).toEqual(statsEngine.getDerivedEffects(p).blockedChoices);
  });
});
