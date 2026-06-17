import type { TriggerZone } from '@/data/triggerZones';
import {
  getSplashPreset,
  getNpcSplashProfileId,
  SPLASH_BY_INTERACTION_TYPE,
  ZONE_SPLASH_PROFILES,
  type InteractionSplashPreset,
} from '@/data/interactionSplashes';
import { findNpcById } from '@/data/gameDataLoader';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { readQualityPresetId } from '@/engine/graphics/graphicsSettingsStorage';
import { getSessionAutoResolvedTier } from '@/engine/graphics/autoQualitySession';
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
    getSessionAutoResolvedTier(),
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

/** Whether a trigger zone supports player [E] interaction (not enter-only toasts). */
export function isInteractableTriggerZone(zone: TriggerZone): boolean {
  return !!(
    zone.interactionType
    || zone.linkedDialogueNodeId
    || zone.linkedStoryNodeId
    || zone.linkedMinigame
    || zone.linkedNpcId
  );
}

/** Infer interaction verb when zone data omits interactionType. */
export function inferZoneInteractionType(zone: TriggerZone): InteractionType {
  if (zone.interactionType) return zone.interactionType;
  if (zone.linkedNpcId) return 'talk';
  if (zone.linkedMinigame) return 'hack';

  const label = zone.interactionLabel?.toLowerCase() ?? '';
  if (label.includes('поговор') || label.includes('спрос') || label.includes('встрет')) {
    return 'talk';
  }
  if (label.includes('прочит') || label.includes('скач')) return 'read';
  if (label.includes('взять') || label.includes('дост') || label.includes('забра')) return 'take';
  if (label.includes('взлом') || label.includes('почин') || label.includes('диагност')) return 'hack';
  if (
    label.includes('откры')
    || label.includes('спуст')
    || label.includes('заглян')
    || label.includes('войти')
  ) {
    return 'open';
  }
  if (
    label.includes('использ')
    || label.includes('настро')
    || label.includes('погре')
    || label.includes('присест')
  ) {
    return 'use';
  }
  if (
    label.includes('осмотр')
    || label.includes('прислуш')
    || label.includes('всмотр')
    || label.includes('обойти')
    || label.includes('слушать')
  ) {
    return 'examine';
  }

  if (zone.examineData) return 'examine';
  if (zone.linkedStoryNodeId) return 'open';
  if (zone.linkedDialogueNodeId) return 'talk';
  return 'default';
}

function resolveProfileIdForZone(zone: TriggerZone): string | undefined {
  if (zone.splashProfile) return zone.splashProfile;
  if (ZONE_SPLASH_PROFILES[zone.id]) return ZONE_SPLASH_PROFILES[zone.id];
  if (zone.propModelId) return 'prop_push_in';
  if (zone.linkedNpcId) {
    const npcProfile =
      getNpcSplashProfileId(zone.linkedNpcId)
      ?? findNpcById(zone.linkedNpcId)?.npcSplashProfile;
    if (npcProfile) return npcProfile;
  }
  const interactionType = inferZoneInteractionType(zone);
  return SPLASH_BY_INTERACTION_TYPE[interactionType];
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
  const repeatFlag = options?.metFlag ?? deriveNpcRepeatSkipFlag(npcId);
  const skip = shouldSkipInteractionSplash(repeatFlag, ctx.flags);
  if (skip) return null;

  const profileId =
    options?.profileId
    ?? getNpcSplashProfileId(npcId)
    ?? findNpcById(npcId)?.npcSplashProfile
    ?? SPLASH_BY_INTERACTION_TYPE.talk;
  if (!profileId) return null;

  const preset = getSplashPreset(profileId);
  if (!preset) return null;

  // Anchor at origin — camera hub adds live NPC world position (same as npc cutscenes).
  return buildResolvedSplash(profileId, preset, [0, 0, 0]);
}

/** Resolve preset id from interaction type alone (unit tests / tooling). */
export function resolveSplashProfileIdForInteractionType(
  interactionType: InteractionType | undefined,
): string | undefined {
  if (!interactionType) return SPLASH_BY_INTERACTION_TYPE.default;
  return SPLASH_BY_INTERACTION_TYPE[interactionType];
}

export interface InteractionSplashCoverageReport {
  interactableZoneCount: number;
  wiredZoneCount: number;
  unwiredZoneIds: string[];
  npcCount: number;
  wiredNpcCount: number;
  unwiredNpcIds: string[];
}

/** Audit splash wiring for trigger zones and NPC registry (tests / tooling). */
export function auditInteractionSplashCoverage(
  zones: readonly TriggerZone[],
  npcIds: readonly string[],
): InteractionSplashCoverageReport {
  const interactable = zones.filter(isInteractableTriggerZone);
  const unwiredZoneIds = interactable
    .filter((zone) => !resolveZoneInteractionSplash(zone, { flags: {} }))
    .map((zone) => zone.id);

  const unwiredNpcIds = npcIds.filter(
    (npcId) => !resolveNpcInteractionSplash(npcId, { flags: {} }),
  );

  return {
    interactableZoneCount: interactable.length,
    wiredZoneCount: interactable.length - unwiredZoneIds.length,
    unwiredZoneIds,
    npcCount: npcIds.length,
    wiredNpcCount: npcIds.length - unwiredNpcIds.length,
    unwiredNpcIds,
  };
}
