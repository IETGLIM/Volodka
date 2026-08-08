/* ─── Volodka RPG – NPC Emotional Reaction Engine ───
 *
 * Event subscription hub that bridges game events to NPC emotional reactions.
 * Subscribes to weather, combat, poem, and outfit change events and
 * dispatches `npc:emotion_triggered` events to nearby NPCs.
 *
 * This module is mounted by `useNpcEmotionalReactionSystem` (React hook)
 * which subscribes to the NPC frame batch for proximity checks and
 * manages EventBus subscriptions.
 */

import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';
import { getNPCGroup, getRegisteredNPCIds } from '@/engine/interaction/npcRegistry';
import { getInteractionState } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { getGameSnapshot } from '@/engine/StateDispatcher';
import { findNpcById } from '@/data/allNpcDefinitions';
import type { SocialPerceptionTag } from '@/data/clothingCatalog';
import {
  setNpcEmotion,
  clearNpcEmotion,
  getNpcEmotion,
  resolveOutfitEmotion,
  resolveEmotionTrigger,
  getKarmaEmotionModifier,
  decayNpcEmotions,
} from '@/engine/npc/npcEmotionalReactions';
import {
  setHeadTrackingEmotion,
} from '@/engine/npc/headTracking';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/* ─── Configuration ─── */

/** Distance radius for NPC reaction to game events (m). */
export const NPC_EMOTION_RADIUS_M = 6;

/** Distance radius for outfit-based perception reactions (m). */
export const NPC_PERCEPTION_RADIUS_M = 5;

/** Default duration for proximity-triggered curiosity (ms). */
// const _PROXIMITY_EMOTION_DURATION = 5000; // reserved — currently unused

/* ─── EventBus subscription management ─── */

let _unsubs: (() => void)[] = [];

registerHmrDispose(() => {
  for (const unsub of _unsubs) unsub();
  _unsubs = [];
});

/** Subscribe to game events that trigger NPC emotional reactions. */
export function subscribeNpcEmotionEvents(): void {
  // Clear any previous subscriptions
  for (const unsub of _unsubs) unsub();
  _unsubs = [];

  // ── Weather: rain → annoyed, cold → annoyed ──
  _unsubs.push(eventBus.on('weather:changed', ({ weatherType, temperature }) => {
    if (weatherType === 'rain') {
      triggerNearbyNpcEmotion('weather_rain');
    }
    if (temperature < 5) {
      triggerNearbyNpcEmotion('weather_cold');
    }
  }));

  // ── Rain start/stop ──
  _unsubs.push(eventBus.on('weather:rain', ({ active }) => {
    if (active) {
      triggerNearbyNpcEmotion('weather_rain');
    }
  }));

  // ── Combat nearby → alarmed ──
  _unsubs.push(eventBus.on('combat:start', () => {
    triggerNearbyNpcEmotion('combat_nearby');
  }));

  // ── Combat hit → alarmed for nearby NPCs ──
  _unsubs.push(eventBus.on('combat:hit', () => {
    triggerNearbyNpcEmotion('combat_nearby');
  }));

  // ── Combat end → clear alarmed ──
  _unsubs.push(eventBus.on('combat:end', () => {
    clearNearbyNpcEmotion('combat_nearby');
  }));

  // ── Poem reading → contemplative ──
  _unsubs.push(eventBus.on('poem:power_used', () => {
    triggerNearbyNpcEmotion('poem_reading');
  }));

  // ── Poem world event → contemplative ──
  _unsubs.push(eventBus.on('poem:world_event', () => {
    triggerNearbyNpcEmotion('poem_reading');
  }));
}

/** Unsubscribe all NPC emotion event subscriptions. */
export function unsubscribeNpcEmotionEvents(): void {
  for (const unsub of _unsubs) unsub();
  _unsubs = [];
}

/* ─── Near-NPC dispatch ─── */

/**
 * Trigger an emotional reaction on all NPCs within the emotion radius
 * around the player position. Emits `npc:emotion_triggered` on the bus.
 */
export function triggerNearbyNpcEmotion(
  triggerSource: string,
  playerPosition?: THREE.Vector3,
): void {
  const trigger = resolveEmotionTrigger(triggerSource);
  if (!trigger) return;

  const registeredIds = getRegisteredNPCIds();
  const radiusSq = NPC_EMOTION_RADIUS_M * NPC_EMOTION_RADIUS_M;

  for (const npcId of registeredIds) {
    // Skip NPC if they're the current interaction target
    const interactionTarget = getInteractionState() !== InteractionState.Idle;

    // If no player position provided, trigger for all NPCs regardless of distance
    if (playerPosition) {
      const group = getNPCGroup(npcId);
      if (!group) continue;

      const distSq = group.position.distanceToSquared(playerPosition);
      if (distSq > radiusSq) continue;
    }

    // Skip interaction target during active dialogue
    if (interactionTarget) continue;

    setNpcEmotion(npcId, trigger.emotion, trigger.source, trigger.duration);
    setHeadTrackingEmotion(npcId, trigger.emotion);

    eventBus.emit('npc:emotion_triggered', {
      npcId,
      emotion: trigger.emotion,
      source: trigger.source,
      duration: trigger.duration,
    });
  }
}

/**
 * Clear emotional overrides triggered by a specific source for nearby NPCs.
 */
export function clearNearbyNpcEmotion(
  _source: string,
  playerPosition?: THREE.Vector3,
): void {
  // _source is accepted for API symmetry with triggerNearbyNpcEmotion but is
  // not used — clearNpcEmotion(npcId) clears the NPC's emotion regardless of
  // the original trigger source. Kept as a parameter to preserve the call-site
  // signature (eventBus.on('combat:end', ...) passes 'combat_nearby').
  const registeredIds = getRegisteredNPCIds();
  const radiusSq = NPC_EMOTION_RADIUS_M * NPC_EMOTION_RADIUS_M;

  for (const npcId of registeredIds) {
    if (playerPosition) {
      const group = getNPCGroup(npcId);
      if (!group) continue;

      const distSq = group.position.distanceToSquared(playerPosition);
      if (distSq > radiusSq) continue;
    }

    clearNpcEmotion(npcId);
    setHeadTrackingEmotion(npcId, 'neutral');

    eventBus.emit('npc:emotion_decayed', {
      npcId,
      previousEmotion: 'neutral',
    });
  }
}

/**
 * Trigger outfit-based perception emotions on nearby NPCs.
 * Called when the player changes their clothing/outfit.
 */
export function triggerOutfitPerceptionEmotions(
  perceptionTags: SocialPerceptionTag[],
  playerPosition: THREE.Vector3,
): void {
  if (perceptionTags.length === 0) return;

  const emotion = resolveOutfitEmotion(perceptionTags);
  if (emotion === 'neutral') return;

  const triggerKey = `outfit_${perceptionTags[0]}`;
  const trigger = resolveEmotionTrigger(triggerKey);
  const duration = trigger?.duration ?? 5000;

  const registeredIds = getRegisteredNPCIds();
  const radiusSq = NPC_PERCEPTION_RADIUS_M * NPC_PERCEPTION_RADIUS_M;

  for (const npcId of registeredIds) {
    const group = getNPCGroup(npcId);
    if (!group) continue;

    const distSq = group.position.distanceToSquared(playerPosition);
    if (distSq > radiusSq) continue;

    // Some NPCs may have personality overrides that affect outfit reactions
    const def = findNpcById(npcId);
    if (def) {
      // Officials and guards react more strongly to 'official' perception
      // Workers react more strongly to 'worker' perception
      const effectiveDuration = duration;
      setNpcEmotion(npcId, emotion, triggerKey, effectiveDuration);
      setHeadTrackingEmotion(npcId, emotion);

      eventBus.emit('npc:emotion_triggered', {
        npcId,
        emotion,
        source: triggerKey,
        duration: effectiveDuration,
      });
    }
  }
}

/**
 * Per-frame proximity tick: NPCs within 5m become curious when the player
 * is nearby, unless they already have a stronger emotion active.
 */
export function tickNpcProximityEmotions(
  playerPosition: THREE.Vector3,
  now: number,
): void {
  // Skip during active interaction
  if (getInteractionState() !== InteractionState.Idle) return;

  const snap = getGameSnapshot();
  if (snap.mode !== 'exploration') return;

  // Decay expired emotions first
  decayNpcEmotions(now);

  const registeredIds = getRegisteredNPCIds();
  const proximitySq = NPC_PERCEPTION_RADIUS_M * NPC_PERCEPTION_RADIUS_M;

  for (const npcId of registeredIds) {
    const group = getNPCGroup(npcId);
    if (!group) continue;

    const distSq = group.position.distanceToSquared(playerPosition);

    if (distSq <= proximitySq) {
      // Priority: event-driven > karma > proximity-curious.
      // Only override when the NPC is currently neutral.
      const currentEmotion = getNpcEmotion(npcId, now);
      if (currentEmotion === 'neutral') {
        const karmaEmotion = getKarmaEmotionModifier(snap.playerState.karma);
        const effectiveEmotion = karmaEmotion ?? 'curious';
        const source = karmaEmotion
          ? (snap.playerState.karma >= 65 ? 'karma_high' : 'karma_low')
          : 'player_proximity';
        const duration = karmaEmotion ? 5000 : (resolveEmotionTrigger('player_proximity')?.duration ?? 5000);
        setNpcEmotion(npcId, effectiveEmotion, source, duration);
        setHeadTrackingEmotion(npcId, effectiveEmotion);
      }
    }
  }
}
