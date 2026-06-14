/* ─── Volodka RPG – Wake-Up AAA Cinematic ───
 *  Third-person intro: terminal → rise → walk to desk → FP handoff.
 *  Trigger: intro_wakeup cutscene / intro:wakeup_sequence (New Game).
 */

import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { getGameStore, useGameStore } from '@/store/gameStore';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { setCinematicPresentationMode } from '@/engine/camera/cinematicPresentation';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';
import {
  applyHandoffCamera,
  BED_POSITION,
  CHAIR_POSITION,
  choreographyPhase,
  DESK_POSITION,
  easeInOutCubic,
  handoffStartTime,
  lerpWakeCamera,
  STAND_POSITION,
  WAKEUP_CAMERA_START,
  WAKEUP_CAMERA_WAYPOINTS,
  WAKEUP_FALLBACK_MS,
  WAKEUP_PHASE,
} from '@/engine/wakeup/wakeUpCinematic';
import {
  acquireCameraOwnership,
  canWriteCamera,
  releaseCameraOwnership,
} from '@/engine/camera/cameraOwnerState';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

export function WakeUpSequence() {
  const [active, setActive] = useState(false);
  const elapsedRef = useRef(0);
  const playerGroupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const currentAnimRef = useRef('idle');
  const modelRotationRef = useRef(0);
  const phaseStartTimeRef = useRef(0);
  const currentWaypointRef = useRef(0);
  const prevWaypointRef = useRef<{ position: THREE.Vector3; lookAt: THREE.Vector3; fov: number } | null>(null);
  const completedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handoffStartedRef = useRef(false);
  const handoffFromRef = useRef({ position: new THREE.Vector3(), lookAt: new THREE.Vector3(), fov: 54 });
  const lastFootstepRef = useRef(-1);
  const audioCueRef = useRef({ terminal: false, sit: false });

  const activeRef = useRef(false);
  const sequenceStartedRef = useRef(false);

  const finishGameplay = (): void => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setActive(false);
    activeRef.current = false;
    releaseCameraOwnership('wakeUp');
    handoffStartedRef.current = false;
    sequenceStartedRef.current = false;

    const store = getGameStore();
    store.setPlayerPosition([0, 0.01, -1.0]);
    store.setPlayerRotation(Math.PI);
    store.setCutscene(null, []);
    store.setFlag('woke_up', true);
    store.setFlag('read_poem_2', true);
    store.collectPoem('poem_2');
    setCinematicPresentationMode('first_person');
    eventBus.emit('intro:wakeup_complete', {});
    eventBus.emit('camera:recenter', {});

    const openPrologueStory = (): void => {
      const live = getGameStore();
      if (live.activeCutsceneId) {
        live.setCutscene(null, []);
        eventBus.emit('cutscene:overlay_end', {});
      }
      if (!live.narrativeKind) {
        live.setNarrativeKind('story');
      }
      live.setCurrentNodeId('start');
      openNarrativeOverlay('start', 'story');
    };

    if (!store.isCutsceneTriggered('act1_prologue')) {
      store.setCurrentNodeId('start');
      const unsubPrologueEnd = eventBus.on('cutscene:overlay_end', () => {
        unsubPrologueEnd();
        openPrologueStory();
      });
      setTimeout(() => {
        unsubPrologueEnd();
        const live = getGameStore();
        if (live.showStoryOverlay && live.currentNodeId === 'start') return;
        if (live.currentNodeId === 'explore_mode') return;
        openPrologueStory();
      }, 9_000);
    } else {
      openPrologueStory();
    }
  };

  const beginHandoff = (): void => {
    if (handoffStartedRef.current) return;
    handoffStartedRef.current = true;
    handoffFromRef.current.position.copy(camera.position);
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);
    handoffFromRef.current.lookAt.copy(camera.position).add(lookDir);
    handoffFromRef.current.fov = camera.fov;
    eventBus.emit('intro:wakeup_handoff', {});
  };

  useEffect(() => {
    const startSequence = () => {
      if (sequenceStartedRef.current && activeRef.current) return;
      sequenceStartedRef.current = true;
      setActive(true);
      activeRef.current = true;
      acquireCameraOwnership('wakeUp');
      elapsedRef.current = 0;
      phaseStartTimeRef.current = 0;
      currentWaypointRef.current = 0;
      completedRef.current = false;
      handoffStartedRef.current = false;
      lastFootstepRef.current = -1;
      audioCueRef.current = { terminal: false, sit: false };
      currentAnimRef.current = 'idle';
      modelRotationRef.current = Math.PI;

      const store = getGameStore();
      store.setPlayerPosition([BED_POSITION.x, BED_POSITION.y, BED_POSITION.z]);
      store.setPlayerRotation(Math.PI);
      setCinematicPresentationMode('third_person');

      prevWaypointRef.current = {
        position: WAKEUP_CAMERA_START.position.clone(),
        lookAt: WAKEUP_CAMERA_START.lookAt.clone(),
        fov: WAKEUP_CAMERA_START.fov,
      };

      camera.position.copy(WAKEUP_CAMERA_START.position);
      camera.lookAt(WAKEUP_CAMERA_START.lookAt);
      camera.fov = WAKEUP_CAMERA_START.fov;
      camera.updateProjectionMatrix();

      audioEngine.playStinger('mystery');

      if (isEffectiveReducedMotion()) {
        finishGameplay();
        return;
      }

      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(finishGameplay, WAKEUP_FALLBACK_MS);
    };

    const skipToEnd = () => {
      if (!activeRef.current || completedRef.current) return;
      elapsedRef.current = handoffStartTime();
      beginHandoff();
    };

    const unsubEvent = eventBus.on('intro:wakeup_sequence', startSequence);
    const unsubSkip = eventBus.on('intro:wakeup_skip', skipToEnd);

    if (getGameStore().activeCutsceneId === 'intro_wakeup') {
      startSequence();
    }

    const unsubStore = useGameStore.subscribe(
      (state) => state.activeCutsceneId,
      (cutsceneId, prevId) => {
        if (cutsceneId === 'intro_wakeup' && prevId !== 'intro_wakeup') {
          startSequence();
        }
      },
    );

    return () => {
      unsubEvent();
      unsubSkip();
      unsubStore();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [camera]);

  useFrameTick('misc', ({ delta }) => {
    if (!active || !canWriteCamera('wakeUp')) return;
    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    if (!audioCueRef.current.terminal && elapsed > 0.35) {
      audioCueRef.current.terminal = true;
      audioEngine.playSfx('notify');
    }

    const handoffAt = handoffStartTime();
    if (elapsed >= handoffAt) {
      if (!handoffStartedRef.current) beginHandoff();
      const ht = (elapsed - handoffAt) / WAKEUP_PHASE.handoff;
      applyHandoffCamera(
        ht,
        handoffFromRef.current.position,
        handoffFromRef.current.lookAt,
        handoffFromRef.current.fov,
        camera,
      );
      currentAnimRef.current = 'idle';
      if (ht >= 1) finishGameplay();
      return;
    }

    // ── Camera waypoints (pre-handoff) ──
    let acc = 0;
    let wpIndex = 0;
    for (let i = 0; i < WAKEUP_CAMERA_WAYPOINTS.length; i++) {
      acc += WAKEUP_CAMERA_WAYPOINTS[i].duration;
      if (elapsed < acc) {
        wpIndex = i;
        break;
      }
      wpIndex = Math.min(i, WAKEUP_CAMERA_WAYPOINTS.length - 1);
    }

    if (wpIndex !== currentWaypointRef.current) {
      const prevIdx = Math.min(currentWaypointRef.current, WAKEUP_CAMERA_WAYPOINTS.length - 1);
      prevWaypointRef.current = {
        position: WAKEUP_CAMERA_WAYPOINTS[prevIdx].position.clone(),
        lookAt: WAKEUP_CAMERA_WAYPOINTS[prevIdx].lookAt.clone(),
        fov: WAKEUP_CAMERA_WAYPOINTS[prevIdx].fov,
      };
      currentWaypointRef.current = wpIndex;
      let phaseStart = 0;
      for (let i = 0; i < wpIndex; i++) phaseStart += WAKEUP_CAMERA_WAYPOINTS[i].duration;
      phaseStartTimeRef.current = phaseStart;
    }

    const wp = WAKEUP_CAMERA_WAYPOINTS[wpIndex];
    const prev = prevWaypointRef.current;
    const segT = Math.min(1, (elapsed - phaseStartTimeRef.current) / wp.duration);
    const lookTarget = new THREE.Vector3();

    if (prev) {
      camera.fov = lerpWakeCamera(prev.position, prev.lookAt, prev.fov, wp, segT, camera.position, lookTarget);
      camera.lookAt(lookTarget);
    } else {
      camera.position.copy(wp.position);
      camera.lookAt(wp.lookAt);
      camera.fov = wp.fov;
    }
    camera.updateProjectionMatrix();

    // ── Character choreography ──
    const group = playerGroupRef.current;
    if (group) {
      const { phase, localT } = choreographyPhase(elapsed);
      const e = easeInOutCubic(localT);

      if (phase === 'terminal') {
        group.position.copy(BED_POSITION);
        group.position.y = 0.42;
        group.rotation.set(0.55, 0.35, 0);
        currentAnimRef.current = 'idle';
      } else if (phase === 'bed') {
        group.position.copy(BED_POSITION);
        group.position.y = 0.42 - 0.4 * e;
        group.rotation.set(0.4 * (1 - e), 0.45 * (1 - e), 0);
        currentAnimRef.current = 'idle';
      } else if (phase === 'stand') {
        group.position.lerpVectors(BED_POSITION, STAND_POSITION, e);
        group.position.y = 0.01;
        group.rotation.set(0, Math.PI * 0.85 * (1 - e) + Math.PI * e, 0);
        currentAnimRef.current = 'idle';
      } else if (phase === 'walk') {
        group.position.lerpVectors(STAND_POSITION, DESK_POSITION, e);
        group.position.y = 0.01;
        group.rotation.set(0, Math.PI, 0);
        currentAnimRef.current = 'walk';
        const step = Math.floor(localT * 5);
        if (step !== lastFootstepRef.current) {
          lastFootstepRef.current = step;
          audioEngine.playFootstep('wood');
        }
      } else {
        group.position.lerpVectors(DESK_POSITION, CHAIR_POSITION, e);
        group.position.y = 0.01;
        group.rotation.set(0, Math.PI, 0);
        currentAnimRef.current = 'idle';
        if (!audioCueRef.current.sit && localT > 0.55) {
          audioCueRef.current.sit = true;
          audioEngine.playSfx('ui_open');
        }
      }
      modelRotationRef.current = group.rotation.y;
    }
  });

  if (!active) return null;

  return (
    <CinematicPlayerAvatar
      groupRef={playerGroupRef}
      currentAnimRef={currentAnimRef}
      rotationRef={modelRotationRef}
    />
  );
}
