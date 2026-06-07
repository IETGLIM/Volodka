import { describe, it, expect, beforeEach } from 'vitest';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  getInteractionState,
  getInteractionTargetNPCId,
  resetInteractionSession,
  writeInteractionSession,
} from '@/engine/interaction/interactionSession';

describe('interactionSession transitions', () => {
  beforeEach(() => {
    resetInteractionSession();
  });

  it('allows the happy-path staged flow', () => {
    expect(writeInteractionSession(InteractionState.Approach, 'zarema')).toBe(true);
    expect(writeInteractionSession(InteractionState.Cutscene, 'zarema')).toBe(true);
    expect(writeInteractionSession(InteractionState.Align, 'zarema')).toBe(true);
    expect(writeInteractionSession(InteractionState.Lock, 'zarema')).toBe(true);
    expect(writeInteractionSession(InteractionState.Dialogue, 'zarema')).toBe(true);
    expect(writeInteractionSession(InteractionState.Exit, 'zarema')).toBe(true);
    expect(writeInteractionSession(InteractionState.Idle, null)).toBe(true);
    expect(getInteractionState()).toBe(InteractionState.Idle);
    expect(getInteractionTargetNPCId()).toBeNull();
  });

  it('rejects skipping staged phases from Idle', () => {
    expect(writeInteractionSession(InteractionState.Dialogue, null)).toBe(false);
    expect(getInteractionState()).toBe(InteractionState.Idle);
    expect(getInteractionTargetNPCId()).toBeNull();
  });

  it('rejects Approach → Dialogue without cutscene/align/lock', () => {
    writeInteractionSession(InteractionState.Approach, 'zarema');
    expect(writeInteractionSession(InteractionState.Dialogue, 'zarema')).toBe(false);
    expect(getInteractionState()).toBe(InteractionState.Approach);
  });

  it('allows emergency reset to Idle from active states', () => {
    writeInteractionSession(InteractionState.Approach, 'zarema');
    expect(writeInteractionSession(InteractionState.Idle, null)).toBe(true);
    expect(getInteractionState()).toBe(InteractionState.Idle);
  });

  it('allows idempotent same-state writes', () => {
    writeInteractionSession(InteractionState.Approach, 'zarema');
    expect(writeInteractionSession(InteractionState.Approach, 'zarema')).toBe(true);
  });
});
