'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { setExplorationCameraOrbitYawRad } from '@/lib/explorationCameraOrbitBridge';
import { useGamePhaseStore } from '@/store/gamePhaseStore';
import { explorationNarrativeTeleport } from '@/lib/explorationNarrativeTeleport';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { setIntroCutscenePlayerPose } from '@/lib/introCutscenePlayerBridge';
import {
  INTRO_OPENING_CAM_KEYFRAMES,
  INTRO_OPENING_END_SCENE_ID,
  INTRO_OPENING_FINISH_SEC,
  INTRO_OPENING_ZAREMA_SPAWN,
  INTRO_ELEVATOR_OVERLAY_END_SEC,
  INTRO_ELEVATOR_OVERLAY_START_SEC,
  sampleIntroPlayerPose,
} from '@/lib/introVolodkaOpeningCutscene';
import { IntroElevatorShaftVisual } from '@/components/game/exploration/IntroElevatorShaftVisual';

const INTRO_CAMERA_R3F_PRIORITY = 55;

const tmpCam = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpScratch = new THREE.Vector3();

function sampleCamera(elapsed: number): { cam: THREE.Vector3; look: THREE.Vector3 } {
  const kf = INTRO_OPENING_CAM_KEYFRAMES;
  if (elapsed <= kf[0].tSec) {
    tmpCam.set(...kf[0].cam);
    tmpLook.set(...kf[0].look);
    return { cam: tmpCam, look: tmpLook };
  }
  if (elapsed >= kf[kf.length - 1].tSec) {
    const last = kf[kf.length - 1];
    tmpCam.set(...last.cam);
    tmpLook.set(...last.look);
    return { cam: tmpCam, look: tmpLook };
  }
  let i = 0;
  while (i < kf.length - 1 && kf[i + 1].tSec < elapsed) i += 1;
  const a = kf[i];
  const b = kf[i + 1];
  const span = Math.max(1e-4, b.tSec - a.tSec);
  const u = THREE.MathUtils.clamp((elapsed - a.tSec) / span, 0, 1);
  tmpScratch.set(...a.cam);
  tmpCam.copy(tmpScratch);
  tmpScratch.set(...b.cam);
  tmpCam.lerp(tmpScratch, u);
  tmpScratch.set(...a.look);
  tmpLook.copy(tmpScratch);
  tmpScratch.set(...b.look);
  tmpLook.lerp(tmpScratch, u);
  return { cam: tmpCam, look: tmpLook };
}

/**
 * Вводное 3D-интро после текстового IntroScreen: стол → коридор к лифту → оверлей спуска 10→3 → квартира Заремы и Альберта.
 */
export function IntroCutsceneCinematicDirector() {
  const phase = useGamePhaseStore((s) => s.phase);
  const introElevatorOverlay = useGamePhaseStore((s) => s.introElevatorOverlay);
  const { camera } = useThree();
  const startMsRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const setIntroCaption = useGamePhaseStore((s) => s.setIntroCaption);
  const setIntroElevatorOverlay = useGamePhaseStore((s) => s.setIntroElevatorOverlay);
  const completeIntroCutscene = useGamePhaseStore((s) => s.completeIntroCutscene);
  const lastCaptionSentRef = useRef<string | undefined>(undefined);
  const lastElevatorOverlayRef = useRef<boolean | undefined>(undefined);
  const playedAmbientRef = useRef(false);
  const playedLiftRef = useRef(false);

  useEffect(() => {
    if (phase !== 'intro_cutscene') {
      startMsRef.current = null;
      setIntroCutscenePlayerPose(null);
      return;
    }
    finishedRef.current = false;
    lastCaptionSentRef.current = undefined;
    lastElevatorOverlayRef.current = undefined;
    playedAmbientRef.current = false;
    playedLiftRef.current = false;
    startMsRef.current = performance.now();
    return () => {
      setIntroCutscenePlayerPose(null);
    };
  }, [phase]);

  useFrame(() => {
    if (phase !== 'intro_cutscene' || startMsRef.current == null) return;
    if (finishedRef.current) return;

    const elapsed = (performance.now() - startMsRef.current) / 1000;
    const { cam, look } = sampleCamera(elapsed);
    camera.position.copy(cam);
    camera.lookAt(look);
    const dx = camera.position.x - look.x;
    const dz = camera.position.z - look.z;
    setExplorationCameraOrbitYawRad(Math.atan2(dx, dz));

    const { pose, horizontalSpeed } = sampleIntroPlayerPose(elapsed);
    setIntroCutscenePlayerPose({ ...pose, horizontalSpeed });

    if (!playedAmbientRef.current && elapsed > 0.35) {
      playedAmbientRef.current = true;
      audioEngine.playSfx('radio_static', 0.12);
    }

    const elevatorOn = elapsed >= INTRO_ELEVATOR_OVERLAY_START_SEC && elapsed < INTRO_ELEVATOR_OVERLAY_END_SEC;
    if (lastElevatorOverlayRef.current !== elevatorOn) {
      lastElevatorOverlayRef.current = elevatorOn;
      setIntroElevatorOverlay(elevatorOn);
    }
    if (elevatorOn && !playedLiftRef.current) {
      playedLiftRef.current = true;
      audioEngine.playSfx('ui', 0.22);
    }

    const kf = INTRO_OPENING_CAM_KEYFRAMES;
    let derivedCaption: string | null | undefined;
    for (const k of kf) {
      if (elapsed + 1e-3 < k.tSec) break;
      if (k.caption !== undefined) {
        derivedCaption = k.caption === '' ? null : k.caption;
      }
    }
    const serialized = derivedCaption === undefined ? '__keep__' : derivedCaption ?? '__null__';
    if (lastCaptionSentRef.current !== serialized) {
      lastCaptionSentRef.current = serialized;
      if (derivedCaption !== undefined) {
        setIntroCaption(derivedCaption);
      }
    }

    if (elapsed >= INTRO_OPENING_FINISH_SEC) {
      finishedRef.current = true;
      setIntroCutscenePlayerPose(null);
      setIntroCaption(null);
      setIntroElevatorOverlay(false);
      explorationNarrativeTeleport(INTRO_OPENING_END_SCENE_ID, { ...INTRO_OPENING_ZAREMA_SPAWN });
      completeIntroCutscene();
      eventBus.emit('ui:exploration_message', {
        text: 'Третий этаж. Зарема с Альбертом — тут хотя бы Grafana не орёт в подъезд.',
      });
    }
  }, INTRO_CAMERA_R3F_PRIORITY);

  if (phase !== 'intro_cutscene') return null;

  return <IntroElevatorShaftVisual active={introElevatorOverlay} />;
}
