/**
 * R3F runner — single orchestrator for camera + actor + overlay during cinematics.
 * Replaces ad-hoc WakeUpSequence / FollowCamera cutscene / CutsceneOverlay wiring.
 */

import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { getGameStore } from '@/store/gameStore';
import { prefetchStoryNodes } from '@/data/gameDataLoader';
import { openDiegeticNarrative } from '@/engine/scene/narrativeOverlay';
import { setCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { setCinematicPresentationMode } from '@/engine/camera/cinematicPresentation';
import {
  acquireCameraOwnership,
  canWriteCamera,
  releaseCameraOwnership,
} from '@/engine/camera/cameraOwnerState';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import {
  BED_POSITION,
  WAKEUP_CAMERA_START,
} from '@/engine/wakeup/wakeUpCinematic';
import { shouldOpenAct1PrologueStory } from '@/engine/wakeup/shouldOpenAct1PrologueStory';
import {
  completeCinematicTimeline,
  getActiveCinematicTimelineId,
  skipCinematicTimeline,
  startCinematicTimeline,
  stopCinematicTimeline,
} from '@/engine/cinematic/cinematicTimelineOrchestrator';
import {
  createCinematicTimelineState,
  skipCinematicTimelineState,
  startCinematicTimelineState,
  setCinematicTimelineAnchor,
  updateCinematicTimelineState,
  type CinematicTimelineState,
} from '@/engine/cinematic/cinematicTimelineController';
import { INTRO_WAKE_TIMELINE } from '@/engine/cinematic/introWakeTimeline';
import { setCinematicLightCue } from '@/engine/cinematic/cinematicLightStaging';
import type { CinematicTimelineDef } from '@/engine/cinematic/cinematicTimelineTypes';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';

const TIMELINE_OWNER = 'timeline' as const;

export function CinematicTimelineRunner() {
  const [active, setActive] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const stateRef = useRef<CinematicTimelineState | null>(null);
  const timelineIdRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introWakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prologueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prologueUnsubRef = useRef<(() => void) | null>(null);
  const prologueStoryOpenedRef = useRef(false);
  const sequenceStartedRef = useRef(false);
  const handoffEmittedRef = useRef(false);
  const lastFootstepRef = useRef(-1);
  const audioCuePhaseRef = useRef<string | null>(null);
  const lightCuePhaseRef = useRef<string | null>(null);
  const lastReportedPhaseRef = useRef<string | null>(null);
  const playerGroupRef = useRef<THREE.Group>(null);
  const currentAnimRef = useRef('idle');
  const modelRotationRef = useRef(0);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  const clearFallback = (): void => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const finishIntroWake = (): void => {
    releaseCameraOwnership(TIMELINE_OWNER);
    setActive(false);
    setShowAvatar(false);
    stateRef.current = null;
    timelineIdRef.current = null;
    sequenceStartedRef.current = false;
    clearFallback();

    const store = getGameStore();
    // Face the desk (monitors at Z=-2.35) instead of the door (Z=+3.5).
    // Rotation 0 = facing -Z in Three.js.
    store.setPlayerPosition([0, 0.01, -1.3]);
    store.setPlayerRotation(0);
    store.setCutscene(null, []);
    store.setFlag('woke_up', true);
    // NOTE: poem_2 and read_poem_2 are NO LONGER auto-granted on wake-up.
    // The player must interact with the desk (interacted_desk) and then
    // examine the bookshelf (which collects poem_2) to complete the
    // first_reading quest. This restores meaningful player agency — see
    // act1.ts first_reading objectives.
    setCinematicPresentationMode('third_person');
    eventBus.emit('intro:wakeup_complete', {});

    // CRITICAL: Emit scene:loaded for the current scene. During "New Game",
    // there is no scene transition (we stay in volodka_room), so scene:loaded
    // never fires naturally. Without this, useSceneLoadedGate returns false
    // forever, and ScenePropDressing, TriggerZoneProps, SceneInteriorAssets,
    // and NPCSystemWrapper never mount — canvas stays black.
    eventBus.emit('scene:loaded', {
      sceneId: 'volodka_room',
      fromSceneId: 'volodka_room',
    });

    // Activate the first quest after the wake-up cinematic so the player
    // has a clear goal: explore the room, then head to the sync.
    dispatchGameAction({ type: 'quest/activate', questId: 'first_reading' });
    // Activate the morning sync quest — this is the main goal after wake-up.
    // The 5-minute timer starts ticking; player must reach the terminal.
    dispatchGameAction({ type: 'quest/activate', questId: 'morning_sync' });

    const clearPrologueTimer = (): void => {
      if (prologueTimerRef.current) {
        clearTimeout(prologueTimerRef.current);
        prologueTimerRef.current = null;
      }
    };

    const openPrologueStory = (): void => {
      // ALWAYS clean up the cutscene:overlay_end subscription and the 9s
      // fallback timer the first time we run, regardless of which path
      // triggered this call (early overlay_end fire OR the 9s timeout).
      // Without this, the early-fire path leaked one EventBus subscription
      // per New Game cycle (the unsub was only invoked from the timeout
      // fallback). The ref is nulled after invocation so subsequent calls
      // are no-ops.
      if (prologueUnsubRef.current) {
        prologueUnsubRef.current();
        prologueUnsubRef.current = null;
      }
      clearPrologueTimer();

      if (prologueStoryOpenedRef.current) return;

      const live = getGameStore();
      if (
        !shouldOpenAct1PrologueStory({
          currentNodeId: live.currentNodeId,
          showStoryOverlay: live.showStoryOverlay,
          visitedNodes: live.playerState.visitedNodes,
        })
      ) {
        return;
      }

      prologueStoryOpenedRef.current = true;
      prefetchStoryNodes(['start', 'explore_mode', 'room_table']);
      void import('@/components/game/FirstReadingCelebration');

      if (live.activeCutsceneId) {
        live.setCutscene(null, []);
        eventBus.emit('cutscene:overlay_end', {});
      }
      live.setCurrentNodeId('start');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'start' });
      // Show the 'start' node as a diegetic HUD dialogue so the player
      // actually reads the opening narration and makes their first choice.
      // Previously this immediately entered the explore hub, silently
      // skipping the start node text. The hub is now entered naturally
      // when the player picks "Подняться и осмотреться" → explore_mode.
      setCinematicHoldActive(false);
      forceEmitInteractionEnd();
      openDiegeticNarrative('start', 'story');
    };

    // Arm prologue listener BEFORE completeCinematicTimeline — otherwise the
    // overlay_end emit is dropped and the player waits the full 9s fallback
    // (meanwhile free to examine props and miss the start beat).
    if (!store.isCutsceneTriggered('act1_prologue')) {
      store.setCurrentNodeId('start');
      prologueUnsubRef.current = eventBus.on('cutscene:overlay_end', () => {
        openPrologueStory();
      });
      prologueTimerRef.current = setTimeout(() => {
        openPrologueStory();
      }, 9_000);
    } else {
      openPrologueStory();
    }

    if (getActiveCinematicTimelineId() === 'intro_wakeup') {
      completeCinematicTimeline('intro_wakeup');
    }
  };

  const finishGenericTimeline = (timelineId: string): void => {
    releaseCameraOwnership(TIMELINE_OWNER);
    setActive(false);
    setShowAvatar(false);
    stateRef.current = null;
    timelineIdRef.current = null;
    clearFallback();
    completeCinematicTimeline(timelineId);
  };

  /**
   * Clean up the runner's local state (camera ownership, avatar, refs) WITHOUT
   * calling completeCinematicTimeline. Used by onSkippedComplete — the
   * orchestrator's watchdog has ALREADY called completeCinematicTimeline(id,
   * true), which is what fired this event. Calling finishGenericTimeline here
   * would re-invoke completeCinematicTimeline (a no-op due to the
   * activeTimelineId guard, but confusing and fragile). This helper does only
   * the local cleanup. Without it, non-intro timelines skipped by the orphan
   * watchdog would leak stateRef, active=true, and camera ownership —
   * producing dual avatars and a stuck camera on the next frame-sim resume.
   */
  const cleanupRunnerState = (): void => {
    releaseCameraOwnership(TIMELINE_OWNER);
    setActive(false);
    setShowAvatar(false);
    stateRef.current = null;
    timelineIdRef.current = null;
    clearFallback();
  };

  const beginTimeline = (
    def: CinematicTimelineDef,
    options: { anchor?: [number, number, number]; npcId?: string; skipMotion?: boolean },
  ): void => {
    if (options.skipMotion ?? isEffectiveReducedMotion()) {
      if (def.id === 'intro_wakeup') finishIntroWake();
      else finishGenericTimeline(def.id);
      return;
    }

    if (sequenceStartedRef.current && timelineIdRef.current === def.id) return;

    // Acquire camera ownership BEFORE committing any runner state. Timeline
    // ownership is priority 4 — if a cutscene (priority 5) is active,
    // acquisition fails. Previously we ignored the return value, leaving
    // stateRef set and active=true with no camera control — the timeline
    // ran blind until the fallback timer (up to 31s) fired. Bail out
    // cleanly instead: stop the orchestrator state so the watchdog doesn't
    // fire, and let the caller decide whether to retry.
    const acquired = acquireCameraOwnership(TIMELINE_OWNER);
    if (!acquired) {
      // Stop the orchestrator-side state so the orphan watchdog doesn't
      // fire later for a timeline that never actually started.
      stopCinematicTimeline(def.id);
      return;
    }

    sequenceStartedRef.current = true;
    timelineIdRef.current = def.id;

    const state = createCinematicTimelineState(def, options);
    stateRef.current = state;
    startCinematicTimelineState(state);

    const hasActor = def.phases.some((p) => p.actor.mode !== 'none');
    setShowAvatar(hasActor);
    setActive(true);

    if (def.id === 'intro_wakeup') {
      const store = getGameStore();
      store.setPlayerPosition([BED_POSITION.x, BED_POSITION.y, BED_POSITION.z]);
      store.setPlayerRotation(Math.PI);
      camera.position.copy(WAKEUP_CAMERA_START.position);
      camera.lookAt(WAKEUP_CAMERA_START.lookAt);
      camera.fov = WAKEUP_CAMERA_START.fov;
      camera.updateProjectionMatrix();
      state.prevCamera.position.copy(WAKEUP_CAMERA_START.position);
      state.prevCamera.lookAt.copy(WAKEUP_CAMERA_START.lookAt);
      state.prevCamera.fov = WAKEUP_CAMERA_START.fov;
      audioEngine.playStinger('mystery');
    }

    if (def.fallbackMs) {
      clearFallback();
      fallbackTimerRef.current = setTimeout(() => {
        if (def.id === 'intro_wakeup') finishIntroWake();
        else finishGenericTimeline(def.id);
      }, def.fallbackMs);
    }

    handoffEmittedRef.current = false;
    lastFootstepRef.current = -1;
    audioCuePhaseRef.current = null;
    lightCuePhaseRef.current = null;
    lastReportedPhaseRef.current = null;
  };

  useEffect(() => {
    const onStart = ({
      def,
      options,
    }: {
      def: CinematicTimelineDef;
      options: { anchor?: [number, number, number]; npcId?: string; skipMotion?: boolean };
    }) => {
      beginTimeline(def, options);
    };

    const onSkip = ({ timelineId }: { timelineId: string }) => {
      const state = stateRef.current;
      if (!state || timelineIdRef.current !== timelineId) return;
      skipCinematicTimelineState(state);
      if (timelineId === 'intro_wakeup') finishIntroWake();
      else finishGenericTimeline(timelineId);
    };

    const onStop = ({ timelineId }: { timelineId: string }) => {
      if (timelineIdRef.current !== timelineId) return;
      releaseCameraOwnership(TIMELINE_OWNER);
      setActive(false);
      setShowAvatar(false);
      stateRef.current = null;
      timelineIdRef.current = null;
      clearFallback();
    };

    const onIntroWakeLegacy = () => {
      startCinematicTimeline({ def: INTRO_WAKE_TIMELINE, options: {} });
    };

    const onIntroSkipLegacy = () => {
      skipCinematicTimeline();
    };

    const onSkippedComplete = ({
      timelineId,
      skipped,
    }: {
      timelineId: string;
      skipped?: boolean;
    }) => {
      if (!skipped) return;
      if (timelineId === 'intro_wakeup') {
        finishIntroWake();
      } else if (timelineIdRef.current === timelineId) {
        // Non-intro timelines skipped via the orphan watchdog (or any other
        // path that calls completeCinematicTimeline(id, true)) must still
        // clean up the runner's local state. Previously this branch was
        // missing — stateRef, active, and camera ownership leaked, causing
        // dual avatars and a stuck camera on the next timeline.
        cleanupRunnerState();
      }
    };

    const unsubs = [
      eventBus.on('cinematic:timeline_start', onStart),
      eventBus.on('cinematic:timeline_skip', onSkip),
      eventBus.on('cinematic:timeline_stop', onStop),
      eventBus.on('intro:wakeup_sequence', onIntroWakeLegacy),
      eventBus.on('intro:wakeup_skip', onIntroSkipLegacy),
      eventBus.on('cinematic:timeline_complete', onSkippedComplete),
    ];

    // Start the intro wake-up timeline AFTER the first frame renders.
    // Previously this fired immediately on mount — before the RigidBody
    // existed, causing the character to fly above the floor. Waiting for
    // canvas:first-frame ensures the physics world is initialized and the
    // KCC controller has been created.
    const startIntroWakeWhenReady = () => {
      if (sequenceStartedRef.current) return;
      if (getGameStore().activeCutsceneId !== 'intro_wakeup') return;
      // Coalesce canvas:first-frame / scene:loaded / poll into one pending start.
      if (introWakeTimerRef.current) return;
      // Small delay after first-frame to let the KCC controller settle.
      introWakeTimerRef.current = setTimeout(() => {
        introWakeTimerRef.current = null;
        if (sequenceStartedRef.current) return;
        if (getGameStore().activeCutsceneId !== 'intro_wakeup') return;
        startCinematicTimeline({ def: INTRO_WAKE_TIMELINE, options: {} });
      }, 200);
    };

    // ALWAYS listen for both events — the useEffect deps are [camera]
    // which doesn't change, so we can't rely on re-mount to pick up
    // activeCutsceneId changes. Listen for canvas:first-frame (fires
    // when the canvas renders its first frame after mount/scene change)
    // AND scene:loaded (fires when a scene finishes loading). Also
    // poll for the cutscene being set (New Game flow sets it after
    // the component is already mounted).
    unsubs.push(eventBus.on('canvas:first-frame', startIntroWakeWhenReady));
    unsubs.push(eventBus.on('scene:loaded', startIntroWakeWhenReady));

    // Also poll — the New Game flow sets activeCutsceneId via the store
    // which may not trigger any event the component listens to.
    const pollInterval = setInterval(() => {
      if (!sequenceStartedRef.current && getGameStore().activeCutsceneId === 'intro_wakeup') {
        startIntroWakeWhenReady();
      }
    }, 500);
    unsubs.push(() => clearInterval(pollInterval));

    return () => {
      unsubs.forEach((u) => u());
      clearFallback();
      if (introWakeTimerRef.current) {
        clearTimeout(introWakeTimerRef.current);
        introWakeTimerRef.current = null;
      }
      if (prologueTimerRef.current) clearTimeout(prologueTimerRef.current);
      // Also tear down the prologue EventBus subscription if neither the
      // overlay_end early-fire path nor the 9s timeout ever ran (e.g. the
      // component unmounted mid-cutscene). Without this, the subscription
      // would leak on unmount.
      if (prologueUnsubRef.current) {
        prologueUnsubRef.current();
        prologueUnsubRef.current = null;
      }
      // Orphaned timeline hold: remount (Strict Mode / canvas churn) must not
      // leave activeTimelineId set with an empty stateRef — start would no-op.
      const orphanId = timelineIdRef.current;
      if (orphanId && getActiveCinematicTimelineId() === orphanId) {
        stopCinematicTimeline(orphanId);
        cleanupRunnerState();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable camera ref
  }, [camera]);

  useFrameTick('misc', ({ delta }) => {
    const state = stateRef.current;
    if (!active || !state || !canWriteCamera(TIMELINE_OWNER)) return;

    if (state.npcId) {
      const npcGroup = getNPCGroup(state.npcId);
      if (npcGroup) setCinematicTimelineAnchor(state, npcGroup.position);
    }

    const result = updateCinematicTimelineState(state, delta, camera);
    if (!result) return;

    const overlay = result.overlay;
    if (overlay && overlay.letterboxStyle !== 'none') {
      eventBus.emit('cutscene:overlay', {
        text: overlay.text ?? '',
        subtitle: overlay.subtitle,
        accentColor: overlay.accentColor ?? '#44ffff',
        durationMs: state.def.phases[state.phaseIndex]?.duration
          ? state.def.phases[state.phaseIndex].duration * 1000
          : 2000,
        type: overlay.text ? 'character_intro' : 'story_moment',
        letterboxStyle: overlay.letterboxStyle ?? 'thin',
        showEmbers: overlay.showEmbers ?? false,
        glitchIntensity: overlay.glitchIntensity ?? 0,
        fadeInMs: overlay.fadeInMs ?? 300,
        fadeOutMs: overlay.fadeOutMs ?? 500,
        // CRITICAL: mark this overlay as managed by the cinematic timeline.
        // Without this, CutsceneOverlay's auto-dismiss timer would clear
        // activeCutsceneId after the first phase's duration, killing the
        // entire 29-second wake-up cinematic after ~4 seconds.
        managedByTimeline: true,
      });
    }

    const phase = state.def.phases[state.phaseIndex];
    if (phase?.audioCue && audioCuePhaseRef.current !== phase.id) {
      audioCuePhaseRef.current = phase.id;
      switch (phase.audioCue) {
        case 'notify':
          audioEngine.playSfx('notify');
          break;
        case 'ui_open':
          if (result.phaseLocalT > 0.55) audioEngine.playSfx('ui_open');
          break;
        case 'footstep': {
          const step = Math.floor(result.phaseLocalT * 5);
          if (step !== lastFootstepRef.current) {
            lastFootstepRef.current = step;
            audioEngine.playFootstep('wood');
          }
          break;
        }
        case 'mystery':
          audioEngine.playStinger('mystery');
          break;
        default: {
          const _exhaustive: never = phase.audioCue;
          break;
        }
      }
    }

    if (phase?.lightCue && lightCuePhaseRef.current !== phase.id) {
      lightCuePhaseRef.current = phase.id;
      setCinematicLightCue(phase.lightCue, Math.max(1.2, phase.duration));
    }

    if (result.isHandoff && timelineIdRef.current === 'intro_wakeup' && !handoffEmittedRef.current) {
      handoffEmittedRef.current = true;
      eventBus.emit('intro:wakeup_handoff', {});
      eventBus.emit('cinematic:intro_handoff', { timelineId: 'intro_wakeup' });
    }

    if (result.actor && playerGroupRef.current) {
      currentAnimRef.current = result.actor.clip;
      modelRotationRef.current = result.actor.facingY;
      const group = playerGroupRef.current;
      group.position.copy(result.actor.position);
      if (result.actor.rotation) {
        group.rotation.copy(result.actor.rotation);
      }
    }

    if (result.phaseId !== lastReportedPhaseRef.current) {
      lastReportedPhaseRef.current = result.phaseId;

      const phase = state.def.phases[state.phaseIndex];
      if (phase?.cameraShake) {
        eventBus.emit('cutscene:camera_shake', {
          intensity: phase.cameraShake.intensity,
          frequency: phase.cameraShake.frequency,
        });
      }

      eventBus.emit('cinematic:timeline_phase', {
        timelineId: state.def.id,
        phaseId: result.phaseId,
        phaseIndex: result.phaseIndex,
        lightCue: phase?.lightCue,
      });
    }

    if (result.isComplete) {
      const id = timelineIdRef.current;
      if (id === 'intro_wakeup') finishIntroWake();
      else if (id) finishGenericTimeline(id);
    }
  }, { phase: 'pre_physics', label: 'CinematicTimelineRunner' });

  if (!active || !showAvatar) return null;

  return (
    <CinematicPlayerAvatar
      groupRef={playerGroupRef}
      currentAnimRef={currentAnimRef}
      rotationRef={modelRotationRef}
    />
  );
}
