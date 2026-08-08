/* ─── NPC bark hook — speech bubble state machine, ambient barks, activity hints ─── */

import { useRef, useState, useEffect } from 'react';
import type { NPCDefinition } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { computeBark } from '@/engine/npc/npcBarkResolver';
import { formatNpcActivityHint } from '@/engine/npc/npcActivityPresentation';
import { npcTierHasProximityBark, npcTierHasNameLabels, type NpcRenderTier } from '@/engine/npc/npcRenderTier';

/* ─── Speech bubble timing ─── */
const THINKING_DURATION = 1.2; // seconds before bark text appears
const BARK_VISIBLE_DURATION = 5.0; // seconds bark text is shown
const BARK_FADE_DURATION = 0.5; // seconds for fade-out

type BarkPhase = 'hidden' | 'thinking' | 'speaking' | 'fading';

interface UseNpcBarkParams {
  npcId: string;
  definition: NPCDefinition;
  renderTier: NpcRenderTier;
  interactionState: InteractionState;
  activity: string;
}

interface UseNpcBarkResult {
  barkPhase: BarkPhase;
  barkText: string;
  barkOpacity: number;
  activityBarkText: string | null;
  activityBarkOpacity: number;
  updateBarkFrame: (delta: number, dist: number) => void;
}

export function useNpcBark({
  npcId,
  definition,
  renderTier,
  interactionState,
  activity,
}: UseNpcBarkParams): UseNpcBarkResult {
  // Proximity bark refs
  const barkCooldownRef = useRef(0);
  const hasBarkedRef = useRef(false);

  // Speech bubble state
  const [barkPhase, setBarkPhase] = useState<BarkPhase>('hidden');
  const [barkText, setBarkText] = useState('');
  const [barkOpacity, setBarkOpacity] = useState(1);
  const barkTimerRef = useRef(0);
  // Ref mirror of barkPhase so ambient-bark subscription can read the current
  // phase without re-subscribing on every phase transition.
  const barkPhaseRef = useRef<BarkPhase>('hidden');
  useEffect(() => { barkPhaseRef.current = barkPhase; }, [barkPhase]);

  // Bark opacity ref for throttled updates during fading
  const barkOpacityRef = useRef(1);
  const barkOpacityUpdateTimerRef = useRef(0);

  // Schedule-aware activity bark state — shows activity text when in proximity
  const [activityBarkText, setActivityBarkText] = useState<string | null>(null);
  const [activityBarkOpacity, setActivityBarkOpacity] = useState(0);
  const activityBarkOpacityRef = useRef(0);
  const activityBarkUpdateTimerRef = useRef(0);

  // ── Ambient bark subscription ──
  // The npcAmbientBarkSystem emits `npc:ambient_bark` when the player is
  // within 4 m and not interacting with this NPC. We surface the text via
  // the existing speech-bubble machinery (same path as proximity bark) so
  // the visual treatment is consistent. Skipped when an interaction is
  // already in progress or a bark is already showing.
  useEffect(() => {
    const unsub = eventBus.on('npc:ambient_bark', (payload) => {
      if (payload.npcId !== npcId) return;
      // Don't interrupt an existing bark (proximity or ambient).
      if (barkPhaseRef.current !== 'hidden') return;
      // Don't fire during active interaction — the dialogue UI owns the
      // player's attention.
      if (interactionState !== InteractionState.Idle) return;
      setBarkText(payload.text);
      setBarkPhase('thinking');
      setBarkOpacity(1);
      barkOpacityRef.current = 1;
      barkTimerRef.current = 0;
    });
    return unsub;
  }, [npcId, interactionState]);

  const updateBarkFrame = (delta: number, dist: number): void => {
    // ── Schedule-aware activity bark ──
    // Shows activity text above NPC head when player is within proximity
    // and not in active dialogue. Uses formatNpcActivityHint for localized labels.
    if (interactionState === InteractionState.Idle && npcTierHasNameLabels(renderTier)) {
      const hint = formatNpcActivityHint(activity) ?? null;
      const inRange = dist < 4.0;
      const shouldShow = inRange && hint !== null;

      // Update text when activity changes
      if (hint !== activityBarkText) {
        setActivityBarkText(hint);
      }

      // Fade in/out based on proximity
      const targetOpacity = shouldShow ? Math.min(1, (4.0 - dist) / 2.5) * 0.75 : 0;
      activityBarkOpacityRef.current += (targetOpacity - activityBarkOpacityRef.current) * Math.min(1, delta * 4);

      // Throttle React state updates
      activityBarkUpdateTimerRef.current += delta;
      if (activityBarkUpdateTimerRef.current > 0.1) {
        activityBarkUpdateTimerRef.current = 0;
        const newOp = activityBarkOpacityRef.current;
        setActivityBarkOpacity((prev) => Math.abs(prev - newOp) > 0.04 ? newOp : prev);
      }
    } else {
      // Hide during active dialogue
      if (activityBarkOpacityRef.current > 0) {
        activityBarkOpacityRef.current = 0;
        setActivityBarkOpacity(0);
      }
    }

    // Proximity bark — skip during active interaction
    if (npcTierHasProximityBark(renderTier) && interactionState === InteractionState.Idle) {
      barkCooldownRef.current -= delta;
      if (dist < 3.0 && !hasBarkedRef.current && barkCooldownRef.current <= 0 && barkPhase === 'hidden') {
        hasBarkedRef.current = true;
        barkCooldownRef.current = 15;
        const bark = computeBark(definition);
        if (bark) {
          setBarkText(bark);
          setBarkPhase('thinking');
          barkTimerRef.current = 0;
        }
      }
      if (dist > 5.0) {
        hasBarkedRef.current = false;
      }
    }

    // Speech bubble phase timer
    if (barkPhase !== 'hidden') {
      barkTimerRef.current += delta;
      if (barkPhase === 'thinking' && barkTimerRef.current >= THINKING_DURATION) {
        setBarkPhase('speaking');
        barkTimerRef.current = 0;
        eventBus.emit('ui:exploration_message', { text: barkText });
      } else if (barkPhase === 'speaking' && barkTimerRef.current >= BARK_VISIBLE_DURATION) {
        setBarkPhase('fading');
        barkTimerRef.current = 0;
      } else if (barkPhase === 'fading' && barkTimerRef.current >= BARK_FADE_DURATION) {
        setBarkPhase('hidden');
        barkTimerRef.current = 0;
        setBarkText('');
        barkOpacityRef.current = 1;
        setBarkOpacity(1);
      }

      if (barkPhase === 'fading') {
        barkOpacityRef.current = Math.max(0, 1 - barkTimerRef.current / BARK_FADE_DURATION);
        // Throttle bark opacity React state updates to ~10fps
        barkOpacityUpdateTimerRef.current += delta;
        if (barkOpacityUpdateTimerRef.current > 0.1) {
          barkOpacityUpdateTimerRef.current = 0;
          const newBarkOpacity = barkOpacityRef.current;
          setBarkOpacity((prev) => Math.abs(prev - newBarkOpacity) > 0.05 ? newBarkOpacity : prev);
        }
      }
    }
  };

  return {
    barkPhase,
    barkText,
    barkOpacity,
    activityBarkText,
    activityBarkOpacity,
    updateBarkFrame,
  };
}
