/* ─── Volodka RPG – Wake-Up 3D Cutscene ───
 *  The Cesium character rises by the bed, walks to the desk and sits at the
 *  monitors while the camera sweeps in from a far corner. Exactly 7.5 seconds,
 *  camera stays inside the room.
 *
 *  Triggered by 'intro:wakeup_sequence' (the main menu's «Новая игра»). On
 *  completion it leaves the cutscene phase and offers the first quest.
 *
 *  ROBUSTNESS: completion is guarded by BOTH the frame timer AND a wall-clock
 *  fallback, so the game can never get stuck in the cutscene phase even if the
 *  frame budget throttles this system under load. */

import { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';
import { getGameStore, useGameStore } from '@/store/gameStore';
import { setCinematicPresentationMode } from '@/engine/camera/cinematicPresentation';
import { CinematicPlayerAvatar } from './CinematicPlayerAvatar';

const PHASE_DURATIONS = {
  rise: 1.8,     // Rise / turn at the bed (upright)
  standing: 0.9, // Stand up beside the bed
  walking: 2.6,  // Walk to the desk
  sitting: 1.7,  // Pull up to the chair and sit at the monitors
  settle: 0.5,   // Brief settle before gameplay
};
const TOTAL_DURATION = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0); // 7.5
const FALLBACK_MS = (TOTAL_DURATION + 1.5) * 1000;

/* ── Scene bounds for volodka_room ([5,3,7]) — keep camera inside ── */
function clampToRoom(v: THREE.Vector3): THREE.Vector3 {
  v.x = Math.max(-2.3, Math.min(2.3, v.x));
  v.z = Math.max(-3.3, Math.min(3.3, v.z));
  v.y = Math.max(0.5, Math.min(2.8, v.y));
  return v;
}

/* ── Character positions ── */
const BED_POSITION = new THREE.Vector3(0.5, 0.01, 2.4);
const STAND_POSITION = new THREE.Vector3(0.3, 0.01, 1.5);
const DESK_POSITION = new THREE.Vector3(0.0, 0.01, -1.0);
const CHAIR_POSITION = new THREE.Vector3(0.0, 0.0, -1.3);

/* ── Camera waypoints (in-bounds) ── */
const FAR_CORNER = new THREE.Vector3(-2.2, 2.6, -3.0);
const CAMERA_WAYPOINTS = [
  { position: new THREE.Vector3(1.6, 1.2, 2.9), lookAt: new THREE.Vector3(0.5, 0.7, 2.3), fov: 50, duration: PHASE_DURATIONS.rise },
  { position: new THREE.Vector3(-1.7, 1.3, 1.7), lookAt: new THREE.Vector3(0.3, 0.9, 1.5), fov: 55, duration: PHASE_DURATIONS.standing },
  { position: new THREE.Vector3(1.5, 1.6, 1.0), lookAt: new THREE.Vector3(0.0, 0.8, -0.8), fov: 58, duration: PHASE_DURATIONS.walking },
  { position: new THREE.Vector3(1.9, 1.3, -0.5), lookAt: new THREE.Vector3(0.0, 0.7, -1.4), fov: 52, duration: PHASE_DURATIONS.sitting },
  { position: new THREE.Vector3(0.0, 1.7, 2.0), lookAt: new THREE.Vector3(0.0, 0.8, -1.0), fov: 55, duration: PHASE_DURATIONS.settle },
];

export function WakeUpSequence() {
  const [active, setActive] = useState(false);
  const elapsedRef = useRef(0);
  const playerGroupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const currentAnimRef = useRef('idle');
  const modelRotationRef = useRef(0);
  const phaseStartTimeRef = useRef(0);
  const currentWaypointRef = useRef(0);
  const prevWaypointRef = useRef<{ position: THREE.Vector3; lookAt: THREE.Vector3; fov: number } | null>(null);
  const completedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Idempotent completion → leave cutscene phase, offer the opening quest.
  const complete = (): void => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setActive(false);
    const store = getGameStore();
    // Continuity: leave the player at the desk where the cutscene ended, so
    // gameplay resumes seamlessly (no jump back to the bed spawn).
    store.setPlayerPosition([0, 0.01, -1.0]);
    store.setCutscene(null, []);
    store.setCurrentNodeId('explore_mode');
    store.setFlag('woke_up', true);
    setCinematicPresentationMode('first_person');
    store.openNarrativeOverlay('explore_mode', 'story');
    eventBus.emit('intro:wakeup_complete', {});
    eventBus.emit('camera:recenter', {});
    setTimeout(() => {
      eventBus.emit('story:quest_available', {
        questId: 'first_reading',
        questTitle: 'Первое чтение',
        questType: 'main',
      });
    }, 500);
  };

  useEffect(() => {
    const startSequence = () => {
      setActive(true);
      elapsedRef.current = 0;
      phaseStartTimeRef.current = 0;
      currentWaypointRef.current = 0;
      completedRef.current = false;
      currentAnimRef.current = 'idle';
      modelRotationRef.current = 0;
      setCinematicPresentationMode('third_person');
      prevWaypointRef.current = {
        position: FAR_CORNER.clone(),
        lookAt: CAMERA_WAYPOINTS[0].lookAt.clone(),
        fov: CAMERA_WAYPOINTS[0].fov,
      };
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(complete, FALLBACK_MS);
    };

    const unsubEvent = eventBus.on('intro:wakeup_sequence', startSequence);

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
      unsubStore();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  useFrameTick('misc', ({ delta }) => {
    if (!active) return;
    elapsedRef.current += delta;

    // ── Camera ──
    let acc = 0;
    let wpIndex = 0;
    for (let i = 0; i < CAMERA_WAYPOINTS.length; i++) {
      acc += CAMERA_WAYPOINTS[i].duration;
      if (elapsedRef.current < acc) {
        wpIndex = i;
        break;
      }
      wpIndex = Math.min(i, CAMERA_WAYPOINTS.length - 1);
    }
    if (wpIndex !== currentWaypointRef.current) {
      const prevIdx = Math.min(currentWaypointRef.current, CAMERA_WAYPOINTS.length - 1);
      prevWaypointRef.current = {
        position: CAMERA_WAYPOINTS[prevIdx].position.clone(),
        lookAt: CAMERA_WAYPOINTS[prevIdx].lookAt.clone(),
        fov: CAMERA_WAYPOINTS[prevIdx].fov,
      };
      currentWaypointRef.current = wpIndex;
      let phaseStart = 0;
      for (let i = 0; i < wpIndex; i++) phaseStart += CAMERA_WAYPOINTS[i].duration;
      phaseStartTimeRef.current = phaseStart;
    }
    const wp = CAMERA_WAYPOINTS[wpIndex];
    const prev = prevWaypointRef.current;
    const t = Math.min(1, (elapsedRef.current - phaseStartTimeRef.current) / wp.duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    if (prev) {
      camera.position.lerpVectors(prev.position, wp.position, ease);
      const lookTarget = new THREE.Vector3().lerpVectors(prev.lookAt, wp.lookAt, ease);
      clampToRoom(camera.position);
      camera.lookAt(lookTarget);
    } else {
      camera.position.copy(clampToRoom(wp.position.clone()));
      camera.lookAt(wp.lookAt);
    }
    (camera as THREE.PerspectiveCamera).fov = wp.fov;
    camera.updateProjectionMatrix();

    // ── Character choreography (upright throughout — no horizontal pose) ──
    const group = playerGroupRef.current;
    if (group) {
      const total = elapsedRef.current;
      const d = PHASE_DURATIONS;
      if (total < d.rise) {
        // Sit up on the bed edge and turn toward the room (slight forward lean).
        const pt = total / d.rise;
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.copy(BED_POSITION);
        group.position.y = 0.45 - 0.44 * e;
        group.rotation.set(0.35 * (1 - e), 0.5 * (1 - e) - 0.0 * e, 0);
        currentAnimRef.current = 'idle';
      } else if (total < d.rise + d.standing) {
        const pt = (total - d.rise) / d.standing;
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(BED_POSITION, STAND_POSITION, e);
        group.position.y = 0.01;
        group.rotation.set(0, 0, 0);
        currentAnimRef.current = 'idle';
      } else if (total < d.rise + d.standing + d.walking) {
        const pt = (total - d.rise - d.standing) / d.walking;
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(STAND_POSITION, DESK_POSITION, e);
        group.position.y = 0.01;
        group.rotation.set(0, Math.PI, 0);
        currentAnimRef.current = 'walk';
      } else {
        const pt = Math.min(1, (total - d.rise - d.standing - d.walking) / (d.sitting + d.settle));
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(DESK_POSITION, CHAIR_POSITION, e);
        group.position.y = 0.01;
        group.rotation.set(0, Math.PI, 0);
        currentAnimRef.current = 'idle';
      }
      modelRotationRef.current = group.rotation.y;
    }

    if (elapsedRef.current >= TOTAL_DURATION) complete();
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
