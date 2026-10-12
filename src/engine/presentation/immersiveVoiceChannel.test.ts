import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getImmersiveVoiceOwner,
  onImmersiveVoiceFreed,
  onImmersiveVoiceThoughtPreempted,
  releaseImmersiveVoiceChannel,
  requestImmersiveVoiceChannel,
  resetImmersiveVoiceChannelForTests,
} from '@/engine/presentation/immersiveVoiceChannel';

/** Single-lane immersive voice channel (v4.48.13) — thoughts wait for the
 *  Голос, voice preempts thoughts, releases notify waiters. */
describe('immersiveVoiceChannel', () => {
  beforeEach(() => {
    resetImmersiveVoiceChannelForTests();
  });

  it('grants the first request and reports the owner', () => {
    expect(getImmersiveVoiceOwner()).toBeNull();
    expect(requestImmersiveVoiceChannel('thought')).toBe(true);
    expect(getImmersiveVoiceOwner()).toBe('thought');
  });

  it('denies a thought while a voice line holds the lane (stay queued)', () => {
    expect(requestImmersiveVoiceChannel('voice')).toBe(true);
    // The overlay keeps the thought queued — the request is refused.
    expect(requestImmersiveVoiceChannel('thought')).toBe(false);
    expect(getImmersiveVoiceOwner()).toBe('voice');
  });

  it('voice preempts an active thought and notifies it', () => {
    const preempted = vi.fn();
    onImmersiveVoiceThoughtPreempted(preempted);

    expect(requestImmersiveVoiceChannel('thought')).toBe(true);
    expect(requestImmersiveVoiceChannel('voice')).toBe(true);
    expect(preempted).toHaveBeenCalledTimes(1);
    expect(getImmersiveVoiceOwner()).toBe('voice');
  });

  it('thought cannot preempt an active voice line', () => {
    expect(requestImmersiveVoiceChannel('voice')).toBe(true);
    expect(requestImmersiveVoiceChannel('thought')).toBe(false);
    expect(getImmersiveVoiceOwner()).toBe('voice');
  });

  it('only the current owner can release, and freeing notifies waiters', () => {
    const freed = vi.fn();
    onImmersiveVoiceFreed(freed);

    requestImmersiveVoiceChannel('voice');
    // Stale release from the competing overlay is ignored.
    expect(releaseImmersiveVoiceChannel('thought')).toBe(false);
    expect(getImmersiveVoiceOwner()).toBe('voice');
    expect(freed).not.toHaveBeenCalled();

    expect(releaseImmersiveVoiceChannel('voice')).toBe(true);
    expect(getImmersiveVoiceOwner()).toBeNull();
    expect(freed).toHaveBeenCalledWith({ previous: 'voice' });
  });

  it('re-granting the same owner twice is idempotent', () => {
    expect(requestImmersiveVoiceChannel('voice')).toBe(true);
    expect(requestImmersiveVoiceChannel('voice')).toBe(true);
    expect(getImmersiveVoiceOwner()).toBe('voice');
  });

  it('unsubscribing stops freed notifications', () => {
    const freed = vi.fn();
    const unsub = onImmersiveVoiceFreed(freed);
    requestImmersiveVoiceChannel('voice');
    unsub();
    releaseImmersiveVoiceChannel('voice');
    expect(freed).not.toHaveBeenCalled();
  });
});
