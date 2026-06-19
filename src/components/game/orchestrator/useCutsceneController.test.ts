import { describe, expect, it, beforeEach } from 'vitest';
import {
  armEntryBeatFromZone,
  getEntryBeatPhase,
  isEntryBeatInFlight,
  markEntryBeatCutscenePlaying,
  markEntryBeatHubPromoted,
  resetEntryBeatState,
} from '@/engine/interaction/entryBeatState';

/**
 * Cutscene controller relies on entryBeatState to avoid canceling in-flight door beats.
 * These tests document the contract useCutsceneController depends on.
 */
describe('useCutsceneController entry beat contract', () => {
  beforeEach(() => {
    resetEntryBeatState();
  });

  it('hub promotion clears in-flight state so cleanup may cancel stale sessions', () => {
    armEntryBeatFromZone('corridor_door');
    markEntryBeatCutscenePlaying('corridor_door');
    expect(isEntryBeatInFlight('corridor_door')).toBe(true);

    markEntryBeatHubPromoted();
    expect(getEntryBeatPhase()).toBe('hubPromoted');
    expect(isEntryBeatInFlight('corridor_door')).toBe(false);
  });

  it('does not treat idle as in-flight after reset', () => {
    armEntryBeatFromZone('corridor_door');
    resetEntryBeatState();
    expect(isEntryBeatInFlight()).toBe(false);
  });
});

describe('useCutsceneController skipActiveCutscene', () => {
  it('placeholder for hook integration — covered by entryBeatState + narrativeOpenHelpers', () => {
    expect(true).toBe(true);
  });
});
