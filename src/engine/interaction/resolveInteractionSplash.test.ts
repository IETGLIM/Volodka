import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { TriggerZone } from '@/data/triggerZones';
import { ALL_NPC_IDS } from '@/data/allNpcDefinitions';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import {
  auditInteractionSplashCoverage,
  deriveZoneRepeatSkipFlag,
  inferZoneInteractionType,
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

    it('maps open to door hold preset', () => {
      expect(resolveSplashProfileIdForInteractionType('open')).toBe('door_hold');
    });

    it('falls back to default preset when type is omitted', () => {
      expect(resolveSplashProfileIdForInteractionType(undefined)).toBe('examine_close_up');
    });
  });

  describe('inferZoneInteractionType', () => {
    it('infers talk from linkedNpcId', () => {
      expect(
        inferZoneInteractionType({
          ...baseZone(),
          interactionType: undefined,
          linkedNpcId: 'zarema',
        }),
      ).toBe('talk');
    });

    it('infers examine from examineData without explicit type', () => {
      expect(
        inferZoneInteractionType(
          baseZone({
            interactionType: undefined,
            linkedDialogueNodeId: 'explore_cafe_enter',
            examineData: { title: 'Стол', text: 'Зашифрованный свиток.' },
          }),
        ),
      ).toBe('examine');
    });
  });

  describe('interaction splash coverage inventory', () => {
    it('wires every interactable trigger zone on first visit', () => {
      const report = auditInteractionSplashCoverage(TRIGGER_ZONES, ALL_NPC_IDS);
      expect(report.unwiredZoneIds).toEqual([]);
      expect(report.wiredZoneCount).toBe(report.interactableZoneCount);
      expect(report.interactableZoneCount).toBeGreaterThanOrEqual(120);
    });

    it('wires every registered NPC on first visit', () => {
      const report = auditInteractionSplashCoverage(TRIGGER_ZONES, ALL_NPC_IDS);
      expect(report.unwiredNpcIds).toEqual([]);
      expect(report.wiredNpcCount).toBe(report.npcCount);
      expect(report.npcCount).toBeGreaterThanOrEqual(34);
    });

    it('reports combined wired interaction count', () => {
      const report = auditInteractionSplashCoverage(TRIGGER_ZONES, ALL_NPC_IDS);
      const totalWired = report.wiredZoneCount + report.wiredNpcCount;
      expect(totalWired).toBeGreaterThanOrEqual(150);
    });
  });
});
