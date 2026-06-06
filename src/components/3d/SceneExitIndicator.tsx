
/* ─── Volodka RPG – Scene exit indicators with proximity detection ─── */

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneExit, SceneId } from '@/shared/types/game';
import { useSceneExitState } from '@/store/selectors';
import { getSceneExits } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { isInteractionLocked } from './InteractionSystemBridge';
import { TRIGGER_ZONES } from '@/data/triggerZones';

/* ─── Global E-key debounce: shared with InteractiveTriggers ─── */
// We use (window as any).__volodka_ekey_consumed for the shared debounce flag
// to avoid double-fire when a trigger zone and exit marker overlap at the same door.

/* ─── Constants ─── */
const EXIT_PROXIMITY_RANGE = 2.5; // Distance to show subtle foot glow
const EXIT_COOLDOWN = 1.5; // Seconds between allowed transitions

/** Small ground ring — fixed size, not scene-scale */
const FOOT_RING_INNER = 0.28;
const FOOT_RING_OUTER = 0.4;

interface SceneExitIndicatorProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Renders exit markers at scene boundaries and triggers scene transitions */
export function SceneExitIndicator({ livePlayerPositionRef }: SceneExitIndicatorProps) {
  const { sceneId, playerFlags, playerKarma } = useSceneExitState();

  const exits = useMemo(() => getSceneExits(sceneId, playerFlags, playerKarma), [sceneId, playerFlags, playerKarma]);

  return (
    <group>
      {exits.map((exit, idx) => (
        <ExitMarker
          key={`${exit.targetScene}-${idx}`}
          exit={exit}
          sceneId={sceneId}
          livePlayerPositionRef={livePlayerPositionRef}
        />
      ))}
    </group>
  );
}

/** Single exit marker with glowing visual, proximity detection, and E-key interaction */
function ExitMarker({
  exit,
  sceneId,
  livePlayerPositionRef,
}: {
  exit: SceneExit;
  sceneId: SceneId;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const footRingMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const showIndicatorRef = useRef(false);
  const _exitPosRef = useRef(new THREE.Vector3()); // P3-FIX: pre-allocated for proximity calc
  const [showIndicator, setShowIndicator] = useState(false);
  const cooldownRef = useRef(0);
  const pulsePhaseRef = useRef(0);
  const triggeredRef = useRef(false);

  // E-key handler: listen for interact key press via window keydown
  // CRITICAL: Must check globalEKeyConsumed to prevent double-fire when a
  // trigger zone (e.g., room_door) and exit marker overlap at the same door.
  // Without this check, pressing E near a door triggers BOTH the examine
  // panel AND the scene transition, causing instant teleportation.
  //
  // BUG FIX: Also check if there's a trigger zone overlapping this exit.
  // If a trigger zone exists at the same position (e.g., room_door at the
  // corridor exit), the trigger zone should handle E presses — it shows
  // the examine panel / story dialogue before transitioning. The exit
  // marker should NOT trigger an immediate transition that bypasses the
  // door interaction.
  const hasOverlappingTriggerZone = TRIGGER_ZONES.some(z =>
    z.sceneId === sceneId &&
    Math.abs(z.position[0] - exit.position[0]) < 1.5 &&
    Math.abs(z.position[2] - exit.position[2]) < 1.5
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      if (e.repeat) return;
      if (!showIndicatorRef.current) return;
      if (cooldownRef.current > 0) return;
      // Don't interact if in an active interaction
      if (isInteractionLocked()) return;
      // CRITICAL: If a trigger zone overlaps this exit, defer to it.
      // The trigger zone shows the examine/story panel, which may then
      // trigger the scene transition. Without this, pressing E near a
      // door immediately teleports without showing the door interaction.
      if (hasOverlappingTriggerZone) return;
      // CRITICAL: Respect the global E-key debounce from InteractiveTriggers.
      if ((window as any).__volodka_ekey_consumed) return;

      // Mark as consumed for this E press (200ms debounce)
      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => { (window as any).__volodka_ekey_consumed = false; }, 200);

      // Trigger transition
      cooldownRef.current = EXIT_COOLDOWN;
      requestSceneTransition(exit.targetScene, exit.spawnAt);
    };

    const handleInteractPress = () => {
      if (!showIndicatorRef.current) return;
      if (cooldownRef.current > 0) return;
      if (isInteractionLocked()) return;
      if (hasOverlappingTriggerZone) return;
      if ((window as any).__volodka_ekey_consumed) return;

      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => { (window as any).__volodka_ekey_consumed = false; }, 200);

      cooldownRef.current = EXIT_COOLDOWN;
      requestSceneTransition(exit.targetScene, exit.spawnAt);
    };
    window.addEventListener('keydown', handleKeyDown);
    const unsubInteract = eventBus.on('interact:press', handleInteractPress);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubInteract();
    };
  }, [exit.targetScene, exit.spawnAt, exit.label, hasOverlappingTriggerZone]);

  // E-key handler is registered via useEffect above
  // The proximity-based state tracking is handled in useFrame below
  useFrame((_, delta) => {
    cooldownRef.current = Math.max(0, cooldownRef.current - delta);

    const playerPos = livePlayerPositionRef.current;
    _exitPosRef.current.set(exit.position[0], exit.position[1], exit.position[2]);
    const dist = playerPos.distanceTo(_exitPosRef.current);

    const isNear = dist < EXIT_PROXIMITY_RANGE;
    if (isNear !== showIndicatorRef.current) {
      showIndicatorRef.current = isNear;
      setShowIndicator(isNear);
    }

    if (isNear) {
      pulsePhaseRef.current += delta * 2.5;
      const pulse = 0.22 + Math.sin(pulsePhaseRef.current) * 0.1;
      if (footRingMatRef.current) {
        footRingMatRef.current.opacity = pulse;
      }
      if (glowRef.current) {
        glowRef.current.intensity = 0.35 + Math.sin(pulsePhaseRef.current) * 0.15;
      }
    }

    if (dist > EXIT_PROXIMITY_RANGE + 0.5) {
      triggeredRef.current = false;
    }
  });

  const markerColor = exit.requiredFlag ? '#ff7755' : '#22eebb';

  return (
    <group position={exit.position}>
      {showIndicator && (
        <>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[FOOT_RING_INNER, FOOT_RING_OUTER, 24]} />
            <meshBasicMaterial
              ref={footRingMatRef}
              color={markerColor}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight
            ref={glowRef}
            color={markerColor}
            intensity={0.4}
            distance={3}
            position={[0, 0.4, 0]}
          />
        </>
      )}
    </group>
  );
}
