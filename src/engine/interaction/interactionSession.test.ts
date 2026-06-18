import { describe, it, expect, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import {
  getInteractionState,
  getInteractionTargetNPCId,
  resetInteractionSession,
  shouldKeepFirstPersonExplorationCamera,
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

  it('resets to Idle on scene:transition_start', () => {
    writeInteractionSession(InteractionState.Approach, 'zarema');
    writeInteractionSession(InteractionState.Cutscene, 'zarema');
    writeInteractionSession(InteractionState.Align, 'zarema');
    writeInteractionSession(InteractionState.Lock, 'zarema');
    eventBus.emit('scene:transition_start', {
      fromSceneId: 'volodka_room',
      targetScene: 'volodka_corridor',
      spawnAt: [0, 0, 0],
    });
    expect(getInteractionState()).toBe(InteractionState.Idle);
    expect(getInteractionTargetNPCId()).toBeNull();
  });

  it('keeps first-person camera during approach and splash cutscene only', () => {
    expect(shouldKeepFirstPersonExplorationCamera()).toBe(true);

    writeInteractionSession(InteractionState.Approach, 'solnysh');
    expect(shouldKeepFirstPersonExplorationCamera()).toBe(true);

    writeInteractionSession(InteractionState.Cutscene, 'solnysh');
    expect(shouldKeepFirstPersonExplorationCamera()).toBe(true);

    writeInteractionSession(InteractionState.Align, 'solnysh');
    expect(shouldKeepFirstPersonExplorationCamera()).toBe(false);
  });
});
