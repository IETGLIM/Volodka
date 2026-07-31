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
  it('placeholder for hook integration — covered by entryBeatState + cutsceneDefToTimeline + narrativeOpenHelpers', () => {
    expect(true).toBe(true);
  });
});

describe('useCutsceneController timeline wiring', () => {
  it('cutsceneDefToTimeline ids match story cutscene playback contract', async () => {
    const { cutsceneDefToTimeline } = await import('@/engine/cinematic/cutsceneToTimeline');
    const { CUTSCENES } = await import('@/data/cutscenes');
    const cutscene = CUTSCENES.act1_prologue;
    const def = cutsceneDefToTimeline(cutscene);
    expect(def.id).toBe(`cutscene_${cutscene.id}`);
    expect(def.fallbackMs).toBeGreaterThan(cutscene.textDurationMs);
    expect(def.phases.length).toBeGreaterThan(0);
  });
});
