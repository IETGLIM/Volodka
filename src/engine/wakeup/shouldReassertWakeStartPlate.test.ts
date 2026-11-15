import { describe, expect, it } from 'vitest';
import {
  choiceLogContainsNode,
  shouldReassertWakeStartPlate,
  type WakeStartPlateReassertState,
} from './shouldReassertWakeStartPlate';

function state(partial: Partial<WakeStartPlateReassertState> = {}): WakeStartPlateReassertState {
  return {
    currentNodeId: 'start',
    diegeticNodeId: null,
    timelineStillIntro: false,
    choiceLog: [],
    ...partial,
  };
}

function loggedStartChoice(): string {
  return JSON.stringify({
    n: 'start',
    t: 'Осмотреться по сторонам',
    k: 'story',
    ts: 1,
    a: 1,
  });
}

describe('shouldReassertWakeStartPlate', () => {
  it('reopens when the start plate vanished before any choice', () => {
    expect(shouldReassertWakeStartPlate(state())).toBe(true);
  });

  it('reopens after hub promotion to explore_mode when the player has not chosen', () => {
    expect(
      shouldReassertWakeStartPlate(state({ currentNodeId: 'explore_mode' })),
    ).toBe(true);
  });

  it('leaves a live start plate alone', () => {
    expect(
      shouldReassertWakeStartPlate(state({ diegeticNodeId: 'start' })),
    ).toBe(false);
  });

  it('waits while the intro timeline is still active', () => {
    expect(
      shouldReassertWakeStartPlate(state({ timelineStillIntro: true })),
    ).toBe(false);
  });

  it('does not rewind a player who already left the wake nodes', () => {
    expect(
      shouldReassertWakeStartPlate(state({ currentNodeId: 'room_terminal_wake' })),
    ).toBe(false);
  });

  it('does not rewind a start choice that already entered explore_mode', () => {
    expect(
      shouldReassertWakeStartPlate(state({
        currentNodeId: 'explore_mode',
        diegeticNodeId: null,
        choiceLog: [loggedStartChoice()],
      })),
    ).toBe(false);
  });

  it('still reopens when the log only contains a different node', () => {
    expect(
      shouldReassertWakeStartPlate(state({
        currentNodeId: 'explore_mode',
        choiceLog: [JSON.stringify({ n: 'room_table', t: 'x', k: 'story', ts: 1, a: 1 })],
      })),
    ).toBe(true);
  });
});

describe('choiceLogContainsNode', () => {
  it('finds a start choice and ignores corrupt rows', () => {
    expect(choiceLogContainsNode(null, 'start')).toBe(false);
    expect(choiceLogContainsNode(['not-json', loggedStartChoice()], 'start')).toBe(true);
    expect(choiceLogContainsNode(['not-json'], 'start')).toBe(false);
  });
});
