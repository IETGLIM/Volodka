import { describe, expect, it, beforeEach } from 'vitest';
import {
  acquireCameraOwnership,
  canFollowCameraDriveFrame,
  canWriteCamera,
  getCameraOwner,
  releaseCameraOwnership,
  resetCameraOwnershipForTests,
  shouldFollowCameraYield,
} from './cameraOwnerState';

describe('cameraOwnerState', () => {
  beforeEach(() => {
    resetCameraOwnershipForTests();
  });

  it('defaults to followCamera', () => {
    expect(getCameraOwner()).toBe('followCamera');
    expect(canWriteCamera('followCamera')).toBe(true);
  });

  it('respects priority when acquiring ownership', () => {
    expect(acquireCameraOwnership('followCamera')).toBe(true);
    expect(acquireCameraOwnership('transition')).toBe(true);
    expect(getCameraOwner()).toBe('transition');

    expect(acquireCameraOwnership('followCamera')).toBe(false);
    expect(acquireCameraOwnership('cutscene')).toBe(true);
    expect(getCameraOwner()).toBe('cutscene');

    expect(acquireCameraOwnership('wakeUp')).toBe(false);
    expect(acquireCameraOwnership('cinematicFreeze')).toBe(false);
  });

  it('releases ownership back to followCamera', () => {
    acquireCameraOwnership('cutscene');
    releaseCameraOwnership('cutscene');
    expect(getCameraOwner()).toBe('followCamera');
  });

  it('only releases when caller is current owner', () => {
    acquireCameraOwnership('cutscene');
    releaseCameraOwnership('wakeUp');
    expect(getCameraOwner()).toBe('cutscene');
  });

  it('shouldFollowCameraYield when timeline owns', () => {
    acquireCameraOwnership('timeline');
    expect(shouldFollowCameraYield()).toBe(true);
    expect(canFollowCameraDriveFrame()).toBe(false);
  });

  it('shouldFollowCameraYield when wakeUp owns', () => {
    acquireCameraOwnership('wakeUp');
    expect(shouldFollowCameraYield()).toBe(true);
    expect(canFollowCameraDriveFrame()).toBe(false);
  });

  it('does not yield when cutscene owns (FollowCamera drives cutscene)', () => {
    acquireCameraOwnership('cutscene');
    expect(shouldFollowCameraYield()).toBe(false);
    expect(canFollowCameraDriveFrame()).toBe(true);
    expect(canWriteCamera('cutscene')).toBe(true);
    expect(canWriteCamera('followCamera')).toBe(false);
  });
});
