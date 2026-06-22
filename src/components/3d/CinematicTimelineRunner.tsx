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
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
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
import type { CinematicTimelineDef } from '@/engine/cinematic/cinematicTimelineTypes';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';

const TIMELINE_OWNER = 'timeline' as const;

export function CinematicTimelineRunner() {
  const [active, setActive] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const stateRef = useRef<CinematicTimelineState | null>(null);
  const timelineIdRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prologueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prologueStoryOpenedRef = useRef(false);
  const sequenceStartedRef = useRef(false);
  const lastFootstepRef = useRef(-1);
  const audioCuePhaseRef = useRef<string | null>(null);
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
    store.setPlayerPosition([0, 0.01, -1.0]);
    store.setPlayerRotation(Math.PI);
    store.setCutscene(null, []);
    store.setFlag('woke_up', true);
    store.setFlag('read_poem_2', true);
    store.collectPoem('poem_2');
    setCinematicPresentationMode('third_person');
    eventBus.emit('intro:wakeup_complete', {});
    if (getActiveCinematicTimelineId() === 'intro_wakeup') {
      completeCinematicTimeline('intro_wakeup');
    }

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
      if (prologueStoryOpenedRef.current) return;

      const live = getGameStore();
      if (
        !shouldOpenAct1PrologueStory({
          currentNodeId: live.currentNodeId,
          showStoryOverlay: live.showStoryOverlay,
          visitedNodes: live.playerState.visitedNodes,
        })
      ) {
        clearPrologueTimer();
        return;
      }

      prologueStoryOpenedRef.current = true;
      clearPrologueTimer();
      prefetchStoryNodes(['start', 'explore_mode', 'room_table']);
      void import('@/components/game/FirstReadingCelebration');

      if (live.activeCutsceneId) {
        live.setCutscene(null, []);
        eventBus.emit('cutscene:overlay_end', {});
      }
      live.setCurrentNodeId('start');
      dispatchGameAction({ type: 'story/visitNode', nodeId: 'start' });
      enterSceneFreeExplorationHub('explore_mode');
    };

    if (!store.isCutsceneTriggered('act1_prologue')) {
      store.setCurrentNodeId('start');
      const unsubPrologueEnd = eventBus.on('cutscene:overlay_end', () => {
        openPrologueStory();
      });
      prologueTimerRef.current = setTimeout(() => {
        prologueTimerRef.current = null;
        unsubPrologueEnd();
        openPrologueStory();
      }, 9_000);
    } else {
      openPrologueStory();
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
    sequenceStartedRef.current = true;
    timelineIdRef.current = def.id;

    const state = createCinematicTimelineState(def, options);
    stateRef.current = state;
    startCinematicTimelineState(state);

    const hasActor = def.phases.some((p) => p.actor.mode !== 'none');
    setShowAvatar(hasActor);
    setActive(true);
    acquireCameraOwnership(TIMELINE_OWNER);

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

    lastFootstepRef.current = -1;
    audioCuePhaseRef.current = null;
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
      if (timelineId === 'intro_wakeup') finishIntroWake();
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
      // Small delay after first-frame to let the KCC controller settle.
      setTimeout(() => {
        if (sequenceStartedRef.current) return;
        if (getGameStore().activeCutsceneId !== 'intro_wakeup') return;
        startCinematicTimeline({ def: INTRO_WAKE_TIMELINE, options: {} });
      }, 200);
    };

    // If the cutscene is already active (component remounted after HMR, etc.),
    // wait for the next first-frame.
    if (getGameStore().activeCutsceneId === 'intro_wakeup') {
      unsubs.push(eventBus.on('canvas:first-frame', startIntroWakeWhenReady));
    } else {
      // Also listen for the cutscene being set after mount (New Game flow).
      const unsubCutscene = eventBus.on('scene:loaded', () => {
        if (getGameStore().activeCutsceneId === 'intro_wakeup' && !sequenceStartedRef.current) {
          startIntroWakeWhenReady();
        }
      });
      unsubs.push(unsubCutscene);
    }

    return () => {
      unsubs.forEach((u) => u());
      clearFallback();
      if (prologueTimerRef.current) clearTimeout(prologueTimerRef.current);
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

    if (result.isHandoff && timelineIdRef.current === 'intro_wakeup') {
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
      eventBus.emit('cinematic:timeline_phase', {
        timelineId: state.def.id,
        phaseId: result.phaseId,
        phaseIndex: result.phaseIndex,
      });
    }

    if (result.isComplete) {
      const id = timelineIdRef.current;
      if (id === 'intro_wakeup') finishIntroWake();
      else if (id) finishGenericTimeline(id);
    }
  });

  if (!active || !showAvatar) return null;

  return (
    <CinematicPlayerAvatar
      groupRef={playerGroupRef}
      currentAnimRef={currentAnimRef}
      rotationRef={modelRotationRef}
    />
  );
}
