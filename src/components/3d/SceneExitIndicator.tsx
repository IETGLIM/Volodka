'use client';

/* ─── Volodka RPG – Scene exit indicators with proximity detection ─── */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneExit, SceneId } from '@/shared/types/game';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { getSceneExits } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { isInteractionLocked } from './InteractionSystemBridge';
import { TRIGGER_ZONES } from '@/data/triggerZones';

/* ─── Global E-key debounce: shared with InteractiveTriggers ─── */
// We use (window as any).__volodka_ekey_consumed for the shared debounce flag
// to avoid double-fire when a trigger zone and exit marker overlap at the same door.

/* ─── Constants ─── */
const EXIT_PROXIMITY_RANGE = 2.5; // Distance to show indicator
const EXIT_TRIGGER_RANGE = 1.5; // Distance for E-key prompt highlight
const EXIT_COOLDOWN = 1.5; // Seconds between allowed transitions

interface SceneExitIndicatorProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Renders exit markers at scene boundaries and triggers scene transitions */
export function SceneExitIndicator({ livePlayerPositionRef }: SceneExitIndicatorProps) {
  // P3-FIX: useShallow for flags object selector — without it, playerState.flags
  // returns a new object reference on every store update, causing unnecessary re-renders.
  const { sceneId, playerFlags, playerKarma } = useGameStore(
    useShallow((s) => ({
      sceneId: s.exploration.currentSceneId,
      playerFlags: s.playerState.flags,
      playerKarma: s.playerState.karma,
    })),
  );

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
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const showIndicatorRef = useRef(false);
  const _exitPosRef = useRef(new THREE.Vector3()); // P3-FIX: pre-allocated for proximity calc
  const [showIndicator, setShowIndicator] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cooldownRef = useRef(0);
  const timeRef = useRef(0);
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
      eventBus.emit('scene:transition', {
        targetScene: exit.targetScene,
        spawnAt: exit.spawnAt,
      });
      eventBus.emit('ui:exploration_message', {
        text: `Переход: ${exit.label.replace('→ ', '')}`,
      });
    };

    // EventBus listener for mobile interact button — same logic as KeyE
    // but triggered via EventBus instead of synthetic keyboard event
    const handleInteractPress = () => {
      if (!showIndicatorRef.current) return;
      if (cooldownRef.current > 0) return;
      if (isInteractionLocked()) return;
      if (hasOverlappingTriggerZone) return;
      if ((window as any).__volodka_ekey_consumed) return;

      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => { (window as any).__volodka_ekey_consumed = false; }, 200);

      cooldownRef.current = EXIT_COOLDOWN;
      eventBus.emit('scene:transition', {
        targetScene: exit.targetScene,
        spawnAt: exit.spawnAt,
      });
      eventBus.emit('ui:exploration_message', {
        text: `Переход: ${exit.label.replace('→ ', '')}`,
      });
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
    timeRef.current += delta;
    cooldownRef.current = Math.max(0, cooldownRef.current - delta);

    // Bob animation for the marker
    if (meshRef.current) {
      meshRef.current.position.y =
        exit.position[1] + Math.sin(timeRef.current * 2) * 0.15;
      meshRef.current.rotation.y += delta * 0.8;
    }

    // Proximity detection
    const playerPos = livePlayerPositionRef.current;
    // P3-FIX: Reuse pre-allocated temp vector instead of creating new THREE.Vector3 every frame.
    // new THREE.Vector3(...exit.position) was allocating a new object 60x/sec per exit marker.
    _exitPosRef.current.set(exit.position[0], exit.position[1], exit.position[2]);
    const dist = playerPos.distanceTo(_exitPosRef.current);

    const isNear = dist < EXIT_PROXIMITY_RANGE;
    if (isNear !== showIndicatorRef.current) {
      showIndicatorRef.current = isNear;
      setShowIndicator(isNear);
    }

    const isVeryClose = dist < EXIT_TRIGGER_RANGE;

    // Show "very close" hover state
    if (isVeryClose !== isHovered) {
      setIsHovered(isVeryClose);
    }

    // NOTE: Auto-trigger has been REMOVED.
    // Scene transitions now REQUIRE the player to press E near the exit.
    // This prevents accidental transitions when walking near doors.

    if (dist > EXIT_TRIGGER_RANGE + 0.5) {
      triggeredRef.current = false;
    }
  });

  // Determine glow color based on whether it's story-gated — brighter for visibility
  const markerColor = exit.requiredFlag ? '#ff7755' : '#22eebb';
  const emissiveColor = exit.requiredFlag ? '#ff5533' : '#00ccaa';

  return (
    <group position={exit.position}>
      {/* Glowing marker mesh — floating diamond/portal shape */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={emissiveColor}
          emissiveIntensity={isHovered ? 2.5 : 1.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Ground ring indicator — brighter glow ring */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.35, 0.65, 24]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={emissiveColor}
          emissiveIntensity={0.9}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Point light for glow effect — brighter for visibility */}
      <pointLight
        ref={glowRef}
        color={markerColor}
        intensity={isHovered ? 3.5 : 1.5}
        distance={5}
        position={[0, 0.5, 0]}
      />

      {/* Vertical beam — brighter for visibility */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={emissiveColor}
          emissiveIntensity={1.8}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Label indicator */}
      {showIndicator && (
        <Html
          position={[0, 2.2, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: markerColor,
              padding: '6px 14px',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              border: `1.5px solid ${markerColor}88`,
              textShadow: `0 0 10px ${markerColor}88, 0 0 4px ${markerColor}44`,
              fontFamily: 'monospace',
              letterSpacing: '0.02em',
            }}
          >
            {exit.label}
          </div>
        </Html>
      )}

      {/* "Press E" or "Walk in" indicator when very close */}
      {isHovered && (
        <Html
          position={[0, 2.7, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.92)',
              color: '#ffe066',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              border: '1.5px solid rgba(255,224,102,0.5)',
              boxShadow: '0 0 10px rgba(255,224,102,0.3)',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            [E] Войти
          </div>
        </Html>
      )}
    </group>
  );
}
