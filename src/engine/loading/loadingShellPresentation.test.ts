import { describe, expect, it } from 'vitest';
import { resolveLoadingShellDuration } from '@/engine/loading/loadingShellPresentation';
import { LOADING_EXIT_MS } from '@/shared/constants/transitionTimings';

describe('loadingShellPresentation', () => {
  it('returns zero duration when reduced motion is enabled', () => {
    expect(resolveLoadingShellDuration(true)).toBe(0);
  });

  it('returns LOADING_EXIT_MS in seconds when motion is allowed', () => {
    expect(resolveLoadingShellDuration(false)).toBe(LOADING_EXIT_MS / 1000);
  });
});
