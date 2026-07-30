import { describe, expect, it, vi } from 'vitest';
import { buildStoryNodes } from '@/data/story/buildStoryNodes';

describe('buildStoryNodes', () => {
  it('does not warn for intentional act1OfficeAftermath overrides', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildStoryNodes();
    const collisionWarnings = warn.mock.calls
      .map((call) => String(call[0]))
      .filter((msg) => msg.includes('collision'));
    expect(collisionWarnings).toEqual([]);
    warn.mockRestore();
  });
});
