import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: {
    playSfx: vi.fn(),
    playStinger: vi.fn(),
  },
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    mode: 'exploration',
    exploration: { currentSceneId: 'volodka_room' },
  }),
}));

vi.mock('@/engine/core/combatStartGate', () => ({
  deferCombatStartIfTransitionBusy: vi.fn(() => false),
}));

import {
  cancelEncounterPresentation,
  ENCOUNTER_PRESENTATION_MS,
  isEncounterPresentationActive,
  registerEncounterCommitHandler,
  startEncounter,
} from './encounterPresentation';

describe('encounterPresentation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cancelEncounterPresentation();
  });

  afterEach(() => {
    cancelEncounterPresentation();
    vi.useRealTimers();
  });

  it('runs presentation beat then commits combat', () => {
    const commit = vi.fn();
    registerEncounterCommitHandler(commit);

    const starts: string[] = [];
    const ends: string[] = [];
    eventBus.on('encounter:presentation_start', () => starts.push('start'));
    eventBus.on('encounter:presentation_end', () => ends.push('end'));

    expect(startEncounter({ source: 'creep', enemyType: 'system_daemon', encounterName: 'Test' })).toBe(true);
    expect(isEncounterPresentationActive()).toBe(true);
    expect(starts).toEqual(['start']);
    expect(ends).toEqual([]);

    vi.advanceTimersByTime(ENCOUNTER_PRESENTATION_MS);

    expect(isEncounterPresentationActive()).toBe(false);
    expect(ends).toEqual(['end']);
    expect(commit).toHaveBeenCalledWith({
      source: 'creep',
      enemyType: 'system_daemon',
      encounterName: 'Test',
    });
  });

  it('cancelEncounterPresentation aborts pending commit', () => {
    const commit = vi.fn();
    registerEncounterCommitHandler(commit);

    startEncounter({ source: 'story', enemyType: 'shadow_agent' });
    cancelEncounterPresentation();

    vi.advanceTimersByTime(ENCOUNTER_PRESENTATION_MS);
    expect(commit).not.toHaveBeenCalled();
    expect(isEncounterPresentationActive()).toBe(false);
  });
});
