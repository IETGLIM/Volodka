/* ─── Volodka RPG – NPC Emotional Reaction System ───
 *
 * Gives NPCs context-aware emotional reactions based on game events:
 *   - Player proximity: NPCs look at player, shift posture when nearby
 *   - Weather changes: NPCs react to rain (hunch shoulders), cold (rub hands)
 *   - Combat nearby: NPCs look alarmed, back away
 *   - Poem reading: NPCs become contemplative (pause current activity)
 *   - Player outfit: NPCs react to social perception tags
 *
 * Each emotion maps to an animation override, head tracking intensity,
 * and bark probability change. Emotions are temporary — they decay back
 * to `neutral` after a configurable duration.
 */

import type { NpcEmotion } from '@/engine/npc/npcEmotionTypes';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import type { SocialPerceptionTag } from '@/data/clothingCatalog';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/* ─── Emotion → animation/behavior mapping ─── */

export interface EmotionBehaviorMapping {
  /** Clip override to apply when this emotion is active. */
  clipOverride?: NpcAnimationClipOverrides;
  /** Alternative animation state (e.g. contemplative → sit). */
  animStateOverride?: NPCAnimationState;
  /** Head tracking intensity multiplier (1.0 = normal, 0 = disabled). */
  headTrackingIntensity: number;
  /** Bark probability multiplier (1.0 = normal, 2.0 = twice as likely). */
  barkProbabilityMultiplier: number;
  /** Suggested animation clip name for the idle pose. */
  idleVariant: string;
}

const EMOTION_BEHAVIOR_MAP: Record<NpcEmotion, EmotionBehaviorMapping> = {
  neutral: {
    clipOverride: undefined,
    animStateOverride: undefined,
    headTrackingIntensity: 1.0,
    barkProbabilityMultiplier: 1.0,
    idleVariant: 'idle',
  },
  curious: {
    clipOverride: { idle: 'idle_alert' },
    animStateOverride: undefined,
    headTrackingIntensity: 1.4,
    barkProbabilityMultiplier: 1.2,
    idleVariant: 'idle_alert',
  },
  alarmed: {
    clipOverride: { idle: 'idle_alert' },
    animStateOverride: undefined,
    headTrackingIntensity: 0.3,
    barkProbabilityMultiplier: 1.6,
    idleVariant: 'idle_alert',
  },
  contemplative: {
    clipOverride: { idle: 'idle_relaxed' },
    animStateOverride: 'sit',
    headTrackingIntensity: 0.6,
    barkProbabilityMultiplier: 0.5,
    idleVariant: 'idle_relaxed',
  },
  annoyed: {
    clipOverride: { idle: 'idle_bored' },
    animStateOverride: undefined,
    headTrackingIntensity: 0.2,
    barkProbabilityMultiplier: 2.0,
    idleVariant: 'idle_bored',
  },
  respectful: {
    clipOverride: { idle: 'idle_social' },
    animStateOverride: undefined,
    headTrackingIntensity: 1.6,
    barkProbabilityMultiplier: 1.3,
    idleVariant: 'idle_social',
  },
  fearful: {
    clipOverride: { idle: 'idle_bored' },
    animStateOverride: undefined,
    headTrackingIntensity: 0.0,
    barkProbabilityMultiplier: 1.8,
    idleVariant: 'idle_bored',
  },
};

/** Resolve the behavior mapping for a given emotion. */
export function resolveEmotionBehavior(emotion: NpcEmotion): EmotionBehaviorMapping {
  return EMOTION_BEHAVIOR_MAP[emotion];
}

/* ─── Per-NPC emotional state ─── */

interface NpcEmotionEntry {
  emotion: NpcEmotion;
  source: string;
  /** Timestamp when this emotion was triggered (ms). */
  triggeredAt: number;
  /** Duration in ms before this emotion decays back to neutral. */
  duration: number;
}

const _npcEmotionMap = new Map<string, NpcEmotionEntry>();

registerHmrDispose(() => {
  _npcEmotionMap.clear();
});

/** Get the current active emotion for an NPC (returns 'neutral' if none). */
export function getNpcEmotion(npcId: string, now?: number): NpcEmotion {
  const entry = _npcEmotionMap.get(npcId);
  if (!entry) return 'neutral';

  const currentTime = now ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (currentTime - entry.triggeredAt >= entry.duration) {
    _npcEmotionMap.delete(npcId);
    return 'neutral';
  }

  return entry.emotion;
}

/** Trigger an emotional reaction on an NPC. */
export function setNpcEmotion(
  npcId: string,
  emotion: NpcEmotion,
  source: string,
  duration: number,
): void {
  _npcEmotionMap.set(npcId, {
    emotion,
    source,
    triggeredAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    duration,
  });
}

/** Clear an NPC's emotional override (e.g. when dialogue starts). */
export function clearNpcEmotion(npcId: string): void {
  _npcEmotionMap.delete(npcId);
}

/** Clear all NPC emotional states. */
export function clearAllNpcEmotions(): void {
  _npcEmotionMap.clear();
}

/** Decay all expired emotional states. Call periodically from the frame system. */
export function decayNpcEmotions(now?: number): void {
  const currentTime = now ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
  for (const [npcId, entry] of _npcEmotionMap) {
    if (currentTime - entry.triggeredAt >= entry.duration) {
      _npcEmotionMap.delete(npcId);
    }
  }
}

/* ─── Outfit → emotion mapping ─── */

/** Social perception tags → NPC emotion mapping. */
const OUTFIT_EMOTION_MAP: Record<SocialPerceptionTag, NpcEmotion> = {
  official: 'respectful',
  shabby: 'annoyed',
  cyberpunk_chic: 'curious',
  casual: 'neutral',
  worker: 'neutral',
  suspicious: 'alarmed',
};

/** Resolve the dominant NPC emotion from the player's outfit perception tags. */
export function resolveOutfitEmotion(tags: SocialPerceptionTag[]): NpcEmotion {
  if (tags.length === 0) return 'neutral';

  // Priority order: suspicious > official > shabby > cyberpunk_chic > worker/casual
  const priority: SocialPerceptionTag[] = ['suspicious', 'official', 'shabby', 'cyberpunk_chic', 'worker', 'casual'];
  for (const tag of priority) {
    if (tags.includes(tag)) {
      return OUTFIT_EMOTION_MAP[tag];
    }
  }

  return 'neutral';
}

/* ─── Event source → emotion mapping ─── */

export interface NpcEmotionTrigger {
  /** The game event source that triggered this emotion. */
  source: string;
  /** The emotion to apply. */
  emotion: NpcEmotion;
  /** Duration in ms. */
  duration: number;
}

/** Pre-defined emotion triggers for common game events. */
export const EMOTION_TRIGGERS: Record<string, NpcEmotionTrigger> = {
  weather_rain: { source: 'weather_rain', emotion: 'annoyed', duration: 15000 },
  weather_cold: { source: 'weather_cold', emotion: 'annoyed', duration: 12000 },
  combat_nearby: { source: 'combat_nearby', emotion: 'alarmed', duration: 8000 },
  poem_reading: { source: 'poem_reading', emotion: 'contemplative', duration: 10000 },
  player_proximity: { source: 'player_proximity', emotion: 'curious', duration: 5000 },
  outfit_official: { source: 'outfit_official', emotion: 'respectful', duration: 6000 },
  outfit_shabby: { source: 'outfit_shabby', emotion: 'annoyed', duration: 4000 },
  outfit_suspicious: { source: 'outfit_suspicious', emotion: 'alarmed', duration: 8000 },
  outfit_cyberpunk: { source: 'outfit_cyberpunk', emotion: 'curious', duration: 5000 },
};

/** Resolve an emotion trigger from an event source string. */
export function resolveEmotionTrigger(source: string): NpcEmotionTrigger | undefined {
  return EMOTION_TRIGGERS[source];
}

/* ─── Merged clip overrides for emotion + activity ─── */

/**
 * Merge emotion-driven clip overrides with activity-driven overrides.
 * Emotion overrides take priority when an emotion is active.
 */
export function mergeEmotionClipOverrides(
  emotion: NpcEmotion,
  activityOverrides: NpcAnimationClipOverrides | undefined,
): NpcAnimationClipOverrides | undefined {
  const emotionBehavior = resolveEmotionBehavior(emotion);
  const emotionOverride = emotionBehavior.clipOverride;

  if (!emotionOverride && !activityOverrides) return undefined;
  if (!emotionOverride) return activityOverrides;
  if (!activityOverrides) return emotionOverride;

  // Emotion overrides take priority, activity fills in gaps
  return { ...activityOverrides, ...emotionOverride };
}
