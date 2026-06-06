/* ─── Volodka RPG – Wake-Up 3D Cutscene ───
 *  Animated opening sequence: Volodka wakes up, gets out of bed,
 *  walks to his monitor, and sits down at the desk.
 *  Camera follows with cinematic angles.
 *
 *  Triggered by 'intro:wakeup_sequence' event from IntroScreen.
 *  Emits 'intro:wakeup_complete' when the animation finishes. */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';

/* ── Sequence timing (seconds) ── */
const PHASE_DURATIONS = {
  lying: 1.5,    // Lying in bed, camera close-up
  sittingUp: 1.2, // Sitting up on the bed edge
  standing: 0.8,  // Standing up
  walking: 2.5,   // Walking to desk
  sitting: 1.0,   // Sitting down at desk
  settle: 1.0,    // Brief pause at desk
};
const TOTAL_DURATION = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

/* ── Key positions in volodka_room scene space ── */
const BED_POSITION = new THREE.Vector3(0.5, 0.01, 2.5);   // On the bed
const BED_EDGE = new THREE.Vector3(0.3, 0.01, 1.8);       // Sitting on edge
const STAND_POSITION = new THREE.Vector3(0.3, 0.01, 1.5);  // Standing beside bed
const DESK_POSITION = new THREE.Vector3(0.0, 0.01, -1.0);  // At the desk
const CHAIR_POSITION = new THREE.Vector3(0.0, 0.0, -1.3);  // Seated at desk
const DESK_LOOK_TARGET = new THREE.Vector3(0.0, 0.8, -1.5); // Looking at monitor

/* ── Camera waypoints for cinematic angles ── */
const CAMERA_WAYPOINTS = [
  // Close-up on Volodka in bed (fade from black)
  {
    position: new THREE.Vector3(1.8, 0.6, 3.2),
    lookAt: new THREE.Vector3(0.5, 0.3, 2.5),
    fov: 45,
    duration: PHASE_DURATIONS.lying,
  },
  // Pull back as he sits up
  {
    position: new THREE.Vector3(2.0, 1.2, 3.5),
    lookAt: new THREE.Vector3(0.3, 0.6, 1.8),
    fov: 50,
    duration: PHASE_DURATIONS.sittingUp,
  },
  // Side angle as he stands
  {
    position: new THREE.Vector3(-1.5, 1.0, 2.0),
    lookAt: new THREE.Vector3(0.3, 0.8, 1.5),
    fov: 55,
    duration: PHASE_DURATIONS.standing,
  },
  // Follow behind as he walks to desk
  {
    position: new THREE.Vector3(0.0, 1.5, 2.5),
    lookAt: new THREE.Vector3(0.0, 0.8, 0.0),
    fov: 60,
    duration: PHASE_DURATIONS.walking,
  },
  // Side view as he sits down
  {
    position: new THREE.Vector3(2.0, 1.3, -0.5),
    lookAt: new THREE.Vector3(0.0, 0.5, -1.3),
    fov: 50,
    duration: PHASE_DURATIONS.sitting,
  },
  // Pull back to exploration distance
  {
    position: new THREE.Vector3(0.0, 1.8, 3.0),
    lookAt: new THREE.Vector3(0.0, 0.8, -1.0),
    fov: 55,
    duration: PHASE_DURATIONS.settle,
  },
];

export function WakeUpSequence() {
  const [active, setActive] = useState(false);
  const elapsedRef = useRef(0);
  const playerGroupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const currentAnimRef = useRef('idle');
  const rotationRef = useRef(0);
  const markerRef = useRef<THREE.Mesh>(null);
  const phaseStartTimeRef = useRef(0);
  const currentWaypointRef = useRef(0);
  const prevWaypointRef = useRef<{
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov: number;
  } | null>(null);

  // ── Listen for wakeup sequence trigger ──
  useEffect(() => {
    const unsub = eventBus.on('intro:wakeup_sequence', () => {
      setActive(true);
      elapsedRef.current = 0;
      phaseStartTimeRef.current = 0;
      currentWaypointRef.current = 0;
      prevWaypointRef.current = null;
    });
    return unsub;
  }, []);

  // ── Stop when exploration mode starts ──
  const mode = useGameStore((s) => s.mode);
  useEffect(() => {
    if (active && mode === 'exploration') {
      setActive(false);
    }
  }, [active, mode]);

  // ── Cinematic camera animation ──
  useFrame((_, delta) => {
    if (!active) return;
    elapsedRef.current += delta;

    // Determine which waypoint we're on
    let accumulatedTime = 0;
    let wpIndex = 0;
    for (let i = 0; i < CAMERA_WAYPOINTS.length; i++) {
      accumulatedTime += CAMERA_WAYPOINTS[i].duration;
      if (elapsedRef.current < accumulatedTime) {
        wpIndex = i;
        break;
      }
      wpIndex = Math.min(i, CAMERA_WAYPOINTS.length - 1);
    }

    if (wpIndex !== currentWaypointRef.current) {
      prevWaypointRef.current = currentWaypointRef.current >= 0
        ? {
            position: CAMERA_WAYPOINTS[Math.min(currentWaypointRef.current, CAMERA_WAYPOINTS.length - 1)].position.clone(),
            lookAt: CAMERA_WAYPOINTS[Math.min(currentWaypointRef.current, CAMERA_WAYPOINTS.length - 1)].lookAt.clone(),
            fov: CAMERA_WAYPOINTS[Math.min(currentWaypointRef.current, CAMERA_WAYPOINTS.length - 1)].fov,
          }
        : null;
      currentWaypointRef.current = wpIndex;
      // Calculate phase-local time
      let phaseStart = 0;
      for (let i = 0; i < wpIndex; i++) phaseStart += CAMERA_WAYPOINTS[i].duration;
      phaseStartTimeRef.current = phaseStart;
    }

    const wp = CAMERA_WAYPOINTS[wpIndex];
    const prev = prevWaypointRef.current;
    const phaseElapsed = elapsedRef.current - phaseStartTimeRef.current;
    const t = Math.min(1, phaseElapsed / wp.duration);
    // Smooth ease in-out
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    if (prev) {
      camera.position.lerpVectors(prev.position, wp.position, ease);
      const lookTarget = new THREE.Vector3().lerpVectors(prev.lookAt, wp.lookAt, ease);
      camera.lookAt(lookTarget);
    } else {
      camera.position.copy(wp.position);
      camera.lookAt(wp.lookAt);
    }

    (camera as THREE.PerspectiveCamera).fov = wp.fov;
    camera.updateProjectionMatrix();

    // ── Animate player model through phases ──
    if (playerGroupRef.current) {
      const group = playerGroupRef.current;
      const totalTime = elapsedRef.current;

      if (totalTime < PHASE_DURATIONS.lying) {
        // Phase 1: Lying in bed
        group.position.copy(BED_POSITION);
        group.position.y = 0.01;
        group.rotation.set(0, Math.PI * 0.25, 0);
      } else if (totalTime < PHASE_DURATIONS.lying + PHASE_DURATIONS.sittingUp) {
        // Phase 2: Sitting up on bed edge
        const pt = (totalTime - PHASE_DURATIONS.lying) / PHASE_DURATIONS.sittingUp;
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(BED_POSITION, BED_EDGE, e);
        group.rotation.set(0, Math.PI * 0.25 * (1 - e), 0);
      } else if (totalTime < PHASE_DURATIONS.lying + PHASE_DURATIONS.sittingUp + PHASE_DURATIONS.standing) {
        // Phase 3: Standing up
        const pt = (totalTime - PHASE_DURATIONS.lying - PHASE_DURATIONS.sittingUp) / PHASE_DURATIONS.standing;
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(BED_EDGE, STAND_POSITION, e);
        group.rotation.set(0, 0, 0);
      } else if (totalTime < PHASE_DURATIONS.lying + PHASE_DURATIONS.sittingUp + PHASE_DURATIONS.standing + PHASE_DURATIONS.walking) {
        // Phase 4: Walking to desk
        const pt = (totalTime - PHASE_DURATIONS.lying - PHASE_DURATIONS.sittingUp - PHASE_DURATIONS.standing) / PHASE_DURATIONS.walking;
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(STAND_POSITION, DESK_POSITION, e);
        // Add slight walking bob
        group.position.y += Math.sin(pt * Math.PI * 6) * 0.03;
        group.rotation.set(0, Math.PI, 0); // Face desk
      } else {
        // Phase 5-6: Sitting at desk + settle
        const pt = Math.min(1, (totalTime - PHASE_DURATIONS.lying - PHASE_DURATIONS.sittingUp - PHASE_DURATIONS.standing - PHASE_DURATIONS.walking) / (PHASE_DURATIONS.sitting + PHASE_DURATIONS.settle));
        const e = pt < 0.5 ? 2 * pt * pt : 1 - Math.pow(-2 * pt + 2, 2) / 2;
        group.position.lerpVectors(DESK_POSITION, CHAIR_POSITION, e);
        group.rotation.set(0, Math.PI, 0); // Face desk
      }
    }

    // ── Complete sequence ──
    if (elapsedRef.current >= TOTAL_DURATION) {
      setActive(false);
      eventBus.emit('intro:wakeup_complete', {});
    }
  });

  if (!active) return null;

  return (
    <group ref={playerGroupRef}>
      {/* Invisible marker at bed position for reference */}
      <mesh ref={markerRef} visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      <ProceduralPlayerModelAdaptive
        modelScale={0.9}
        karmaGlow="#00ff88"
        currentAnimRef={currentAnimRef}
        rotationRef={rotationRef}
      />
    </group>
  );
}
