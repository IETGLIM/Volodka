import { describe, expect, it } from 'vitest';
import { buildErrorCode } from './buildErrorRecoveryContext';

describe('buildErrorCode', () => {
  it('returns a stable support prefix with digest', () => {
    const code = buildErrorCode(new Error('Test failure'));
    expect(code).toMatch(/^VK-[A-Z0-9]+-[A-Z0-9]+$/);
  });
});
