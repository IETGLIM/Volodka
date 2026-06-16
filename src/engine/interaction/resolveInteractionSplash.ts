import type { TriggerZone } from '@/data/triggerZones';
import {
  getSplashPreset,
  NPC_SPLASH_PROFILES,
  SPLASH_BY_INTERACTION_TYPE,
  ZONE_SPLASH_PROFILES,
  type InteractionSplashPreset,
} from '@/data/interactionSplashes';
import { findNpcById } from '@/data/gameDataLoader';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { readQualityPresetId } from '@/engine/graphics/graphicsSettingsStorage';
import { resolveQualityPreset } from '@/engine/graphics/qualityPresets';
import type { CameraWaypointData } from '@/shared/types/camera';
import type { InteractionType } from '@/shared/types/game';

export type InteractionSplashSkipReason = 'reduced_motion' | 'low_quality' | 'repeat';

export interface ResolvedInteractionSplash {
  presetId: string;
  preset: InteractionSplashPreset;
  durationMs: number;
  waypoints: CameraWaypointData[];
  anchorPosition: [number, number, number];
  letterboxStyle: 'full' | 'thin' | 'none';
  textOverlay?: string;
  subtitle?: string;
  textAccentColor?: string;
}

export interface SplashResolveContext {
  flags: Record<string, boolean | undefined>;
}

export function isLowGraphicsQuality(): boolean {
  if (typeof window === 'undefined') return false;
  const selected = readQualityPresetId();
  if (selected === 'low') return true;
  const resolved = resolveQualityPreset(
    selected,
    window.innerWidth,
    window.devicePixelRatio ?? 1,
  );
  return resolved.id === 'low';
}

export function shouldSkipInteractionSplash(
  repeatSkipFlag: string | undefined,
  flags: Record<string, boolean | undefined>,
): InteractionSplashSkipReason | null {
  if (isEffectiveReducedMotion()) return 'reduced_motion';
  if (isLowGraphicsQuality()) return 'low_quality';
  if (repeatSkipFlag && flags[repeatSkipFlag]) return 'repeat';
  return null;
}

/** First interacted_* / examined_* flag on a zone — used to skip splash on repeat visits. */
export function deriveZoneRepeatSkipFlag(zone: TriggerZone): string | undefined {
  if (zone.splashRepeatSkipFlag) return zone.splashRepeatSkipFlag;
  for (const effect of zone.effects ?? []) {
    if (effect.type !== 'setFlag' || typeof effect.flag !== 'string') continue;
    if (effect.flag.startsWith('interacted_') || effect.flag.startsWith('examined_')) {
      return effect.flag;
    }
  }
  return undefined;
}

export function deriveNpcRepeatSkipFlag(npcId: string): string {
  return `splash_seen_npc_${npcId}`;
}

function resolveProfileIdForZone(zone: TriggerZone): string | undefined {
  if (zone.splashProfile) return zone.splashProfile;
  if (ZONE_SPLASH_PROFILES[zone.id]) return ZONE_SPLASH_PROFILES[zone.id];
  if (zone.propModelId) return 'prop_push_in';
  const byType = zone.interactionType
    ? SPLASH_BY_INTERACTION_TYPE[zone.interactionType]
    : undefined;
  return byType;
}

function zoneAnchorPosition(zone: TriggerZone): [number, number, number] {
  const offset = zone.propOffset ?? [0, 0, 0];
  return [
    zone.position[0] + offset[0],
    zone.position[1] + offset[1],
    zone.position[2] + offset[2],
  ];
}

function buildResolvedSplash(
  presetId: string,
  preset: InteractionSplashPreset,
  anchorPosition: [number, number, number],
): ResolvedInteractionSplash {
  return {
    presetId,
    preset,
    durationMs: preset.durationMs,
    waypoints: preset.waypoints,
    anchorPosition,
    letterboxStyle: preset.letterboxStyle ?? 'thin',
    textOverlay: preset.textOverlay,
    subtitle: preset.subtitle,
    textAccentColor: preset.textAccentColor,
  };
}

export function resolveZoneInteractionSplash(
  zone: TriggerZone,
  ctx: SplashResolveContext,
): ResolvedInteractionSplash | null {
  const profileId = resolveProfileIdForZone(zone);
  if (!profileId) return null;

  const preset = getSplashPreset(profileId);
  if (!preset) return null;

  const skip = shouldSkipInteractionSplash(deriveZoneRepeatSkipFlag(zone), ctx.flags);
  if (skip) return null;

  return buildResolvedSplash(profileId, preset, zoneAnchorPosition(zone));
}

export function resolveNpcInteractionSplash(
  npcId: string,
  ctx: SplashResolveContext,
  options?: { profileId?: string; metFlag?: string },
): ResolvedInteractionSplash | null {
  const profileId =
    options?.profileId
    ?? findNpcById(npcId)?.npcSplashProfile
    ?? NPC_SPLASH_PROFILES[npcId]
    ?? SPLASH_BY_INTERACTION_TYPE.talk;
  if (!profileId) return null;

  const preset = getSplashPreset(profileId);
  if (!preset) return null;

  const repeatFlag = options?.metFlag ?? deriveNpcRepeatSkipFlag(npcId);
  const skip = shouldSkipInteractionSplash(repeatFlag, ctx.flags);
  if (skip) return null;

  // Anchor at origin — camera hub adds live NPC world position (same as npc cutscenes).
  return buildResolvedSplash(profileId, preset, [0, 0, 0]);
}

/** Resolve preset id from interaction type alone (unit tests / tooling). */
export function resolveSplashProfileIdForInteractionType(
  interactionType: InteractionType | undefined,
): string | undefined {
  if (!interactionType) return undefined;
  return SPLASH_BY_INTERACTION_TYPE[interactionType];
}
