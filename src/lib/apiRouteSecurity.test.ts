import { describe, expect, it } from 'vitest';
import {
  extractBearerToken,
  isFeatureFlagEnabled,
  isSafeBlobFilename,
} from '@/lib/apiRouteSecurity';

describe('apiRouteSecurity', () => {
  it('accepts only explicit opt-in feature flags', () => {
    expect(isFeatureFlagEnabled('1')).toBe(true);
    expect(isFeatureFlagEnabled(' true ')).toBe(false);
    expect(isFeatureFlagEnabled(undefined)).toBe(false);
  });

  it('extracts bearer tokens safely', () => {
    expect(extractBearerToken('Bearer secret-token')).toBe('secret-token');
    expect(extractBearerToken('bearer secret-token')).toBe('secret-token');
    expect(extractBearerToken('Basic abc')).toBe('');
    expect(extractBearerToken(null)).toBe('');
  });

  it('rejects unsafe blob filenames', () => {
    expect(isSafeBlobFilename('scene-preview.glb')).toBe(true);
    expect(isSafeBlobFilename('models/scene.glb')).toBe(false);
    expect(isSafeBlobFilename('../scene.glb')).toBe(false);
    expect(isSafeBlobFilename('')).toBe(false);
  });
});
