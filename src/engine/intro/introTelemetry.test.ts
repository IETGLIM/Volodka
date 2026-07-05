import { describe, expect, it, beforeEach, vi } from 'vitest';
import { introTelemetry } from '@/engine/intro/introTelemetry';

describe('introTelemetry', () => {
  beforeEach(() => {
    introTelemetry.reset();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('records skip vs complete and ignores duplicate finish', () => {
    const reporter = vi.fn();
    (
      globalThis as typeof globalThis & { __volodkaIntroTelemetry?: (event: unknown) => void }
    ).__volodkaIntroTelemetry = reporter;

    introTelemetry.markStarted();
    introTelemetry.markFinished('complete');
    introTelemetry.markFinished('skip');

    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'complete', skipped: false }),
    );
  });
});
