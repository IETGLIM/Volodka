
/* ─── Volodka RPG – Interaction Highlight ───
 *  When the player presses E on an interactive object, this component
 *  renders a brief bright glow effect at the object's position.
 *  The glow fades over ~1 second, giving clear visual feedback.
 */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';

interface HighlightInstance {
  id: number;
  position: [number, number, number];
  size: [number, number, number];
  /** Time remaining (seconds) — counts down each frame */
  timeRemaining: number;
}

const HIGHLIGHT_DURATION = 1.0; // seconds
const HIGHLIGHT_MAX_OPACITY = 0.45;
const HIGHLIGHT_GLOW_INTENSITY = 2.5;

/**
 * Renders a brief 3D glow effect on interacted objects.
 * Listens for 'object:highlight' events from the EventBus.
 */
export function InteractionHighlight() {
  const [highlights, setHighlights] = useState<HighlightInstance[]>([]);
  const idCounterRef = useRef(0);

  // Listen for highlight events
  useEffect(() => {
    const unsub = eventBus.on('object:highlight', ({ position, size }) => {
      const id = idCounterRef.current++;
      const newHighlight: HighlightInstance = {
        id,
        position,
        size,
        timeRemaining: HIGHLIGHT_DURATION,
      };

      setHighlights((prev) => [...prev, newHighlight]);
    });

    return unsub;
  }, []);

  // Per-frame update: count down timers and remove expired highlights
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    let anyExpired = false;

    const updated = highlights
      .map((h) => ({
        ...h,
        timeRemaining: h.timeRemaining - dt,
      }))
      .filter((h) => {
        if (h.timeRemaining <= 0) {
          anyExpired = true;
          return false;
        }
        return true;
      });

    // Only update state if something changed (expired highlight removed)
    if (anyExpired) {
      setHighlights(updated);
    } else if (updated.length > 0) {
      // Still active highlights — update their remaining time for rendering
      setHighlights(updated);
    }
  });

  if (highlights.length === 0) return null;

  return (
    <group>
      {highlights.map((h) => {
        const progress = 1 - h.timeRemaining / HIGHLIGHT_DURATION; // 0 → 1
        const opacity = HIGHLIGHT_MAX_OPACITY * (1 - progress);
        const glowIntensity = HIGHLIGHT_GLOW_INTENSITY * (1 - progress);

        if (opacity <= 0.01) return null;

        // Scale pulse effect — brief expand then settle
        const scalePulse = 1 + Math.sin(progress * Math.PI) * 0.06;

        return (
          <group key={h.id} position={h.position}>
            {/* Bright emissive box that matches the object's size */}
            <mesh position={[0, h.size[1] / 2, 0]} scale={scalePulse}>
              <boxGeometry
                args={[
                  h.size[0] + 0.06,
                  h.size[1] + 0.06,
                  h.size[2] + 0.06,
                ]}
              />
              <meshBasicMaterial
                color="#00ffee"
                transparent
                opacity={opacity * 0.7}
                side={THREE.FrontSide}
                depthWrite={false}
              />
            </mesh>

            {/* Outer glow shell — larger, more transparent */}
            <mesh position={[0, h.size[1] / 2, 0]}>
              <boxGeometry
                args={[
                  h.size[0] + 0.3,
                  h.size[1] + 0.3,
                  h.size[2] + 0.3,
                ]}
              />
              <meshBasicMaterial
                color="#00ffee"
                transparent
                opacity={opacity * 0.12}
                side={THREE.BackSide}
                depthWrite={false}
              />
            </mesh>

            {/* Ground ring glow */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
              <ringGeometry
                args={[
                  Math.max(h.size[0], h.size[2]) / 2 - 0.1,
                  Math.max(h.size[0], h.size[2]) / 2 + 0.25,
                  32,
                ]}
              />
              <meshBasicMaterial
                color="#00ffee"
                transparent
                opacity={opacity * 0.5}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Point light for real-time glow on nearby surfaces */}
            <pointLight
              position={[0, h.size[1] / 2, 0]}
              color="#00ffee"
              intensity={glowIntensity}
              distance={Math.max(h.size[0], h.size[2]) + 4}
              decay={2}
            />
          </group>
        );
      })}
    </group>
  );
}
