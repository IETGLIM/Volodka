import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { TriggerZone } from '@/data/triggerZones';
import {
  deriveZoneRepeatSkipFlag,
  resolveNpcInteractionSplash,
  resolveSplashProfileIdForInteractionType,
  resolveZoneInteractionSplash,
  shouldSkipInteractionSplash,
} from '@/engine/interaction/resolveInteractionSplash';
import * as accessibilitySettings from '@/engine/accessibility/accessibilitySettings';
import * as graphicsStorage from '@/engine/graphics/graphicsSettingsStorage';

const baseZone = (overrides: Partial<TriggerZone> = {}): TriggerZone => ({
  id: 'room_desk',
  sceneId: 'volodka_room',
  position: [0, 0.55, -2.35],
  size: [1, 1, 1],
  interactionType: 'examine',
  propModelId: 'ai3dgen_encrypted_scroll',
  effects: [{ type: 'setFlag', flag: 'interacted_desk', flagValue: true }],
  ...overrides,
});

describe('resolveInteractionSplash', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerWidth: 1920,
      devicePixelRatio: 2,
    });
    vi.spyOn(accessibilitySettings, 'isEffectiveReducedMotion').mockReturnValue(false);
    vi.spyOn(graphicsStorage, 'readQualityPresetId').mockReturnValue('high');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('shouldSkipInteractionSplash', () => {
    it('skips when reduced motion is enabled', () => {
      vi.spyOn(accessibilitySettings, 'isEffectiveReducedMotion').mockReturnValue(true);
      expect(shouldSkipInteractionSplash('interacted_desk', {})).toBe('reduced_motion');
    });

    it('skips when quality preset is low', () => {
      vi.spyOn(graphicsStorage, 'readQualityPresetId').mockReturnValue('low');
      expect(shouldSkipInteractionSplash(undefined, {})).toBe('low_quality');
    });

    it('skips on repeat when interacted flag is already set', () => {
      expect(
        shouldSkipInteractionSplash('interacted_desk', { interacted_desk: true }),
      ).toBe('repeat');
    });

    it('does not skip on first visit', () => {
      expect(shouldSkipInteractionSplash('interacted_desk', {})).toBeNull();
    });
  });

  describe('deriveZoneRepeatSkipFlag', () => {
    it('reads interacted_* from zone effects', () => {
      expect(deriveZoneRepeatSkipFlag(baseZone())).toBe('interacted_desk');
    });

    it('prefers explicit splashRepeatSkipFlag', () => {
      expect(
        deriveZoneRepeatSkipFlag(baseZone({ splashRepeatSkipFlag: 'custom_flag' })),
      ).toBe('custom_flag');
    });
  });

  describe('resolveZoneInteractionSplash', () => {
    it('resolves catalog profile for prop zones', () => {
      const splash = resolveZoneInteractionSplash(baseZone(), { flags: {} });
      expect(splash?.presetId).toBe('encrypted_scroll');
      expect(splash?.durationMs).toBeGreaterThanOrEqual(800);
      expect(splash?.durationMs).toBeLessThanOrEqual(2500);
    });

    it('returns null when repeat flag is set', () => {
      const splash = resolveZoneInteractionSplash(baseZone(), {
        flags: { interacted_desk: true },
      });
      expect(splash).toBeNull();
    });

    it('honours splashProfile override', () => {
      const splash = resolveZoneInteractionSplash(
        baseZone({ splashProfile: 'server_fragment' }),
        { flags: {} },
      );
      expect(splash?.presetId).toBe('server_fragment');
    });
  });

  describe('resolveNpcInteractionSplash', () => {
    it('resolves albert template from catalog', () => {
      const splash = resolveNpcInteractionSplash(
        'albert',
        { flags: {} },
        { profileId: 'albert_cafe' },
      );
      expect(splash?.presetId).toBe('albert_cafe');
      expect(splash?.textOverlay).toBe('Альберт');
    });

    it('skips repeat when met flag is already set', () => {
      const splash = resolveNpcInteractionSplash(
        'albert',
        { flags: { met_albert: true } },
        { metFlag: 'met_albert' },
      );
      expect(splash).toBeNull();
    });
  });

  describe('resolveSplashProfileIdForInteractionType', () => {
    it('maps examine to close-up preset', () => {
      expect(resolveSplashProfileIdForInteractionType('examine')).toBe('examine_close_up');
    });

    it('maps talk to npc orbit preset', () => {
      expect(resolveSplashProfileIdForInteractionType('talk')).toBe('npc_orbit');
    });
  });
});
