
/* ─── Volodka RPG – Proximity Reactivity Renderer ───
 *  Renders visual effects based on player proximity to ProximityEffects.
 *  - light_glow: pointLight whose intensity scales with player proximity
 *  - sound_trigger: emits events to audio engine when player enters/leaves radius
 *  - visual_disturb: triggers glitch effects via eventBus
 *  - npc_attention: emits npc:animation events to make NPCs look at the player
 */

import { useRef, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import {
  getProximityEffectsForScene,
  computeProximityFactor,
  type ProximityEffect,
} from '@/engine/ProximityReactivity';
import { eventBus } from '@/engine/EventBus';

interface ProximityReactivityRendererProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export function ProximityReactivityRenderer({
  livePlayerPositionRef,
}: ProximityReactivityRendererProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const effects = getProximityEffectsForScene(sceneId);

  // Track which sound effects the player is currently inside
  const activeSoundEffectsRef = useRef<Set<string>>(new Set());

  return (
    <group key={`proximity:${sceneId}`}>
      {effects.map((effect) => (
        <ProximityEffectRenderer
          key={`${sceneId}:${effect.id}`}
          effect={effect}
          livePlayerPositionRef={livePlayerPositionRef}
          activeSoundEffectsRef={activeSoundEffectsRef}
        />
      ))}
    </group>
  );
}

function ProximityEffectRenderer({
  effect,
  livePlayerPositionRef,
  activeSoundEffectsRef,
}: {
  effect: ProximityEffect;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  activeSoundEffectsRef: React.MutableRefObject<Set<string>>;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const wasInsideRef = useRef(false);
  const currentFactorRef = useRef(0);

  useFrameTick('interaction', () => {
    const playerPos = livePlayerPositionRef.current;
    const factor = computeProximityFactor(
      [playerPos.x, playerPos.y, playerPos.z],
      effect.position,
      effect.radius,
    );

    currentFactorRef.current = factor;

    switch (effect.type) {
      case 'light_glow': {
        if (lightRef.current) {
          const minIntensity = Number(effect.config.minIntensity) || 0.2;
          const maxIntensity = Number(effect.config.maxIntensity) || 1.0;
          const speed = Number(effect.config.speed) || 2;
          // Smooth interpolation with time-based oscillation for "breathing" effect
          const breathe = Math.sin(Date.now() * 0.001 * speed) * 0.15 + 0.85;
          const targetIntensity = THREE.MathUtils.lerp(minIntensity, maxIntensity, factor) * breathe;
          lightRef.current.intensity = THREE.MathUtils.lerp(
            lightRef.current.intensity,
            targetIntensity,
            0.1,
          );
        }
        break;
      }

      case 'sound_trigger': {
        const isInside = factor > 0;
        if (isInside && !wasInsideRef.current) {
          // Player entered the radius — trigger sound
          activeSoundEffectsRef.current.add(effect.id);
          eventBus.emit('sound:play', {
            type: String(effect.config.soundType || 'ambient'),
          });
        } else if (!isInside && wasInsideRef.current) {
          // Player left the radius — stop sound
          activeSoundEffectsRef.current.delete(effect.id);
        }
        wasInsideRef.current = isInside;
        break;
      }

      case 'visual_disturb': {
        if (factor > 0.3) {
          // Trigger subtle glitch effect based on proximity
          const intensity = factor * Number(effect.config.intensity || 0.5);
          eventBus.emit('fx:glitch', {
            intensity: intensity * 0.3,
            duration: 0.05,
          });
        }
        break;
      }

      case 'npc_attention': {
        // Make NPCs turn their heads toward the player when near
        if (factor > 0.1) {
          eventBus.emit('npc:animation', {
            npcId: String(effect.config.npcId || ''),
            state: factor > 0.5 ? 'listen' : 'idle',
          });
        }
        break;
      }
    }
  });

  // Cleanup sound effects on unmount
  useEffect(() => {
    const soundEffects = activeSoundEffectsRef.current;
    const effectId = effect.id;
    return () => {
      soundEffects.delete(effectId);
    };
  }, [effect.id, activeSoundEffectsRef]);

  // Render a pointLight for light_glow effects, invisible helper for others
  if (effect.type === 'light_glow') {
    return (
      <pointLight
        ref={lightRef}
        position={effect.position}
        color={String(effect.config.color || '#ffffff')}
        intensity={Number(effect.config.minIntensity) || 0.2}
        distance={Number(effect.config.distance) || 5}
      />
    );
  }

  // For other effect types, no visual rendering needed (effects are emitted via eventBus)
  return null;
}
