import { beforeEach, describe, expect, it } from 'vitest';
import {
  armEntryBeatFromZone,
  consumeEntryBeatFromZone,
  getEntryBeatPhase,
  isEntryBeatInFlight,
  markEntryBeatCutscenePlaying,
  markEntryBeatHubPromoted,
  resetEntryBeatState,
} from './entryBeatState';

describe('entryBeatState', () => {
  beforeEach(() => {
    resetEntryBeatState();
  });

  it('arms from zone and consumes into playingCutscene', () => {
    armEntryBeatFromZone('corridor_door');
    expect(getEntryBeatPhase()).toBe('pendingFromZone');
    expect(isEntryBeatInFlight('corridor_door')).toBe(true);

    expect(consumeEntryBeatFromZone()).toBe('corridor_door');
    expect(getEntryBeatPhase()).toBe('playingCutscene');
    expect(consumeEntryBeatFromZone()).toBeNull();
  });

  it('marks cutscene playing and hub promoted', () => {
    armEntryBeatFromZone('corridor_door');
    markEntryBeatCutscenePlaying('corridor_door');
    expect(getEntryBeatPhase()).toBe('playingCutscene');

    markEntryBeatHubPromoted();
    expect(getEntryBeatPhase()).toBe('hubPromoted');
    expect(isEntryBeatInFlight()).toBe(false);
  });
});
