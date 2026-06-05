
/* ─── Volodka RPG – Interactive triggers with glow ring, particle burst, pulse tooltip,
     NPC staged interaction routing, and centralized prompt stacking ─── */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getGameStore } from '@/store/gameStore';
import { useCurrentSceneId, useInteractionOverlay, useTimeOfDay } from '@/store/selectors';
import { TRIGGER_ZONES, type TriggerZone, INTERACTION_LABELS } from '@/data/triggerZones';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { eventBus } from '@/engine/EventBus';
import { isInteractionLocked } from './InteractionSystemBridge';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Maximum number of visible [E] prompts at once */
const MAX_VISIBLE_PROMPTS = 2;

/** Maximum number of sparkle particles per trigger zone (InstancedMesh pool size) */
const MAX_PARTICLES = 8;

/** Global E-key debounce: prevents multiple triggers from firing on the same key press.
 *  Shared via window.__volodka_ekey_consumed so SceneExitIndicator can also check it. */
let globalEKeyConsumed = false;

/** Prompt data for centralized overlay */
interface PromptData {
  id: string;
  label: string;
  distance: number;
  type: 'zone' | 'npc';
}

interface InteractiveTriggersProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Trigger zones and "Press E" indicators with centralized prompt management */
export function InteractiveTriggers({ livePlayerPositionRef }: InteractiveTriggersProps) {
  const { sceneId, gameMode, showStoryOverlay } = useInteractionOverlay();
  const zones = TRIGGER_ZONES.filter((z) => z.sceneId === sceneId);

  // Hide all prompts when not in exploration mode or when story overlay is active
  const isOverlayBlocking = gameMode !== 'exploration' || showStoryOverlay;

  // Shared ref: which prompt IDs are allowed to show (closest MAX_VISIBLE_PROMPTS)
  const allowedIdsRef = useRef<Set<string>>(new Set());
  // Track all currently near prompt entries for centralized rendering
  const promptsMapRef = useRef<Map<string, PromptData>>(new Map());
  // React state for rendering the overlay (updated less frequently than frame)
  const [visiblePrompts, setVisiblePrompts] = useState<PromptData[]>([]);
  const frameCountRef = useRef(0);

  // Pre-allocated temp Vector3 — avoids per-frame allocation in useFrame (P0-2.2)
  const tempVecRef = useRef(new THREE.Vector3());

  // Compute allowed IDs and reconcile visible prompts every few frames
  useFrame(() => {
    // Don't show any prompts when overlays (dialogue/story/panels) are active
    if (isOverlayBlocking) {
      if (promptsMapRef.current.size > 0) {
        promptsMapRef.current.clear();
        setVisiblePrompts([]);
      }
      return;
    }

    const playerPos = livePlayerPositionRef.current;
    const entries: PromptEntry[] = [];

    // Check trigger zones — reuse tempVecRef instead of new Vector3 per zone
    for (const zone of zones) {
      tempVecRef.current.set(...zone.position);
      const dist = playerPos.distanceTo(tempVecRef.current);
      const range = Math.max(zone.size[0], zone.size[2]) / 2 + 1.0;
      if (dist < range && !isInteractionLocked()) {
        entries.push({ id: zone.id, distance: dist });
      }
    }

    // Check NPCs — only those in the current scene, using schedule-driven positions
    const timeOfDay = getGameStore().exploration.timeOfDay;
    const npcIdsInScene = getNPCsForScene(sceneId, timeOfDay);
    for (const npcId of npcIdsInScene) {
      const npc = NPC_DEFINITIONS.find((n) => n.id === npcId);
      if (!npc) continue;
      const entry = getCurrentScheduleEntry(npcId, timeOfDay);
      const npcPosArr = entry?.position ?? npc.defaultPosition;
      tempVecRef.current.set(...npcPosArr);
      const dist = playerPos.distanceTo(tempVecRef.current);
      if (dist < 3.0 && !isInteractionLocked()) {
        entries.push({ id: `npc_${npcId}`, distance: dist });
      }
    }

    entries.sort((a, b) => a.distance - b.distance);
    allowedIdsRef.current = new Set(entries.slice(0, MAX_VISIBLE_PROMPTS).map((e) => e.id));

    // Reconcile visible prompts for overlay rendering (every 3 frames for perf)
    frameCountRef.current++;
    if (frameCountRef.current % 3 !== 0) return;

    const promptEntries = Array.from(promptsMapRef.current.values());
    promptEntries.sort((a, b) => a.distance - b.distance);
    const top3 = promptEntries.slice(0, MAX_VISIBLE_PROMPTS);

    setVisiblePrompts((prev) => {
      if (prev.length !== top3.length) return top3;
      if (prev.some((p, i) => p.id !== top3[i]?.id)) return top3;
      return prev; // no change, skip re-render
    });
  });

  // Callbacks for children to register/unregister their prompt data
  const registerPrompt = useCallback((data: PromptData) => {
    promptsMapRef.current.set(data.id, data);
  }, []);

  const unregisterPrompt = useCallback((id: string) => {
    promptsMapRef.current.delete(id);
  }, []);

  return (
    <group>
      {zones.map((zone) => (
        <TriggerZoneComponent
          key={zone.id}
          zone={zone}
          livePlayerPositionRef={livePlayerPositionRef}
          allowedIdsRef={allowedIdsRef}
          registerPrompt={registerPrompt}
          unregisterPrompt={unregisterPrompt}
        />
      ))}

      {/* NPC proximity triggers — separate from static trigger zones */}
      <NPCProximityTriggers
        livePlayerPositionRef={livePlayerPositionRef}
        allowedIdsRef={allowedIdsRef}
        registerPrompt={registerPrompt}
        unregisterPrompt={unregisterPrompt}
      />

      {/* Centralized prompt overlay — limited to closest, cinematic style */}
      {/* Screen-edge indicator for off-screen interactables */}
      {visiblePrompts.length > 0 && !isOverlayBlocking && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          {/* Subtle screen-edge glow to indicate nearby interactables */}
          <div
            style={{
              position: 'fixed',
              inset: '0',
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 80px 15px rgba(0, 255, 238, 0.04)',
              zIndex: UI_LAYERS.WORLD_LABELS,
            }}
          />
          {/* Prompt container — bottom center, cinematic style */}
          <div
            style={{
              position: 'fixed',
              bottom: '140px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: UI_LAYERS.WORLD_LABELS,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'none',
            }}
          >
            {visiblePrompts.map((prompt, i) => {
              const isNPC = prompt.type === 'npc';
              const accentColor = isNPC ? '#ffb828' : '#00ffe8';
              const accentRgba = isNPC ? '255, 184, 40' : '0, 255, 232';
              const isPrimary = i === 0; // Closest prompt is primary
              return (
                <div
                  key={prompt.id}
                  style={{
                    background: isPrimary
                      ? `rgba(2, 4, 15, 0.94)`
                      : `rgba(2, 4, 15, 0.82)`,
                    color: isPrimary ? '#fff' : 'rgba(200, 210, 230, 0.9)',
                    padding: isPrimary ? '8px 20px' : '6px 14px',
                    borderRadius: '4px',
                    fontSize: isPrimary ? '15px' : '13px',
                    fontWeight: isPrimary ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    border: isPrimary
                      ? `1px solid rgba(${accentRgba}, 0.8)`
                      : `1px solid rgba(${accentRgba}, 0.35)`,
                    boxShadow: isPrimary
                      ? `0 0 20px rgba(${accentRgba}, 0.25), 0 0 6px rgba(${accentRgba}, 0.15), inset 0 0 8px rgba(${accentRgba}, 0.06)`
                      : `0 0 10px rgba(${accentRgba}, 0.12), 0 0 3px rgba(${accentRgba}, 0.08)`,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    letterSpacing: '0.04em',
                    opacity: 0,
                    animation: `promptFadeIn 0.25s ease ${i * 0.08}s forwards`,
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    color: accentColor,
                    marginRight: '6px',
                    textShadow: `0 0 8px rgba(${accentRgba}, 0.5)`,
                    fontWeight: 'bold',
                    fontSize: isPrimary ? '14px' : '12px',
                  }}>
                    [E]
                  </span>
                  <span style={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    fontSize: isPrimary ? '14px' : '12px',
                    letterSpacing: '0.02em',
                  }}>
                    {prompt.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Inline keyframes for prompt fade-in */}
          <style>{`
            @keyframes promptFadeIn {
              from { opacity: 0; transform: translateY(12px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}

/** Internal type for distance sorting */
interface PromptEntry {
  id: string;
  distance: number;
}

/**
 * NPC proximity triggers that show [E] tooltip near NPCs
 * and start the staged interaction flow instead of instant dialogue.
 * Only shows NPCs that are in the current scene per the schedule engine.
 */
function NPCProximityTriggers({
  livePlayerPositionRef,
  allowedIdsRef,
  registerPrompt,
  unregisterPrompt,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  allowedIdsRef: React.MutableRefObject<Set<string>>;
  registerPrompt: (data: PromptData) => void;
  unregisterPrompt: (id: string) => void;
}) {
  // Get NPCs in current scene using schedule engine
  const sceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const npcsInScene = useMemo(() => {
    const npcIds = getNPCsForScene(sceneId, timeOfDay);
    return npcIds
      .map((id) => {
        const def = NPC_DEFINITIONS.find((n) => n.id === id);
        if (!def) return null;
        const entry = getCurrentScheduleEntry(id, timeOfDay);
        return {
          definition: def,
          position: entry?.position ?? def.defaultPosition,
        };
      })
      .filter(Boolean) as Array<{
        definition: typeof NPC_DEFINITIONS[number];
        position: [number, number, number];
      }>;
  }, [sceneId, timeOfDay]);

  return (
    <group>
      {npcsInScene.map(({ definition, position }) => (
        <NPCProximityTrigger
          key={definition.id}
          npcId={definition.id}
          npcName={definition.name}
          position={position}
          dialogueNodeId={definition.dialogueNodeId}
          livePlayerPositionRef={livePlayerPositionRef}
          allowedIdsRef={allowedIdsRef}
          registerPrompt={registerPrompt}
          unregisterPrompt={unregisterPrompt}
        />
      ))}
    </group>
  );
}

/** Proximity trigger for a single NPC */
function NPCProximityTrigger({
  npcId,
  npcName,
  position,
  dialogueNodeId,
  livePlayerPositionRef,
  allowedIdsRef,
  registerPrompt,
  unregisterPrompt,
}: {
  npcId: string;
  npcName: string;
  position: [number, number, number];
  dialogueNodeId?: string;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  allowedIdsRef: React.MutableRefObject<Set<string>>;
  registerPrompt: (data: PromptData) => void;
  unregisterPrompt: (id: string) => void;
}) {
  const promptId = `npc_${npcId}`;
  const [showIndicator, setShowIndicator] = useState(false);
  const showIndicatorRef = useRef(false);
  const eKeyConsumedRef = useRef(false);

  // Pre-allocated temp Vector3 — avoids per-frame allocation (P0-2.2)
  const tempVecRef = useRef(new THREE.Vector3());

  useFrame(() => {
    const playerPos = livePlayerPositionRef.current;
    tempVecRef.current.set(...position);
    const dist = playerPos.distanceTo(tempVecRef.current);

    const isNear = dist < 3.0 && !isInteractionLocked();

    if (isNear !== showIndicatorRef.current) {
      showIndicatorRef.current = isNear;
      setShowIndicator(isNear);

      if (isNear) {
        registerPrompt({
          id: promptId,
          label: `Поговорить с ${npcName}`,
          distance: dist,
          type: 'npc' as const,
        });
      } else {
        unregisterPrompt(promptId);
      }
    } else if (isNear) {
      // Update distance for sorting
      registerPrompt({
        id: promptId,
        label: `Поговорить с ${npcName}`,
        distance: dist,
        type: 'npc' as const,
      });
    }
  });

  // E-key listener for NPC interaction — only if allowed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      if (e.repeat) return;
      if (!showIndicatorRef.current) return;
      if (isInteractionLocked()) return;
      // Global debounce: prevent multiple triggers from firing on same key press
      if (globalEKeyConsumed) return;
      if (eKeyConsumedRef.current) return;
      // Only respond if this prompt is in the allowed set (closest prompts)
      if (!allowedIdsRef.current.has(promptId)) return;
      globalEKeyConsumed = true;
      eKeyConsumedRef.current = true;
      // Also set on window for cross-component debounce (SceneExitIndicator)
      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => {
        globalEKeyConsumed = false;
        eKeyConsumedRef.current = false;
        (window as any).__volodka_ekey_consumed = false;
      }, 200);

      // Start the staged interaction flow instead of instant dialogue
      eventBus.emit('interaction:start', { npcId });
    };

    // EventBus listener for mobile interact button
    const handleInteractPress = () => {
      if (!showIndicatorRef.current) return;
      if (isInteractionLocked()) return;
      if (globalEKeyConsumed) return;
      if (eKeyConsumedRef.current) return;
      if (!allowedIdsRef.current.has(promptId)) return;
      globalEKeyConsumed = true;
      eKeyConsumedRef.current = true;
      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => {
        globalEKeyConsumed = false;
        eKeyConsumedRef.current = false;
        (window as any).__volodka_ekey_consumed = false;
      }, 200);
      eventBus.emit('interaction:start', { npcId });
    };

    window.addEventListener('keydown', handleKeyDown);
    const unsubInteract = eventBus.on('interact:press', handleInteractPress);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubInteract();
    };
  }, [npcId, promptId, allowedIdsRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterPrompt(promptId);
    };
  }, [promptId, unregisterPrompt]);

  // No individual Html prompt — rendered centrally in parent
  return <group position={position} />;
}

/** Internal particle data stored in ref — not React state to avoid per-frame re-renders (P0-2.3) */
interface ParticleData {
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
}

// Pre-computed identity matrix for InstancedMesh reset
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

/** Single trigger zone with proximity detection and E-key interaction */
function TriggerZoneComponent({
  zone,
  livePlayerPositionRef,
  allowedIdsRef,
  registerPrompt,
  unregisterPrompt,
}: {
  zone: TriggerZone;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  allowedIdsRef: React.MutableRefObject<Set<string>>;
  registerPrompt: (data: PromptData) => void;
  unregisterPrompt: (id: string) => void;
}) {
  const showIndicatorRef = useRef(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const triggeredRef = useRef(false);
  const triggerCooldown = useRef(0);
  const eKeyConsumedRef = useRef(false);

  // Particle burst state — stored in ref, not useState, to avoid per-frame re-renders (P0-2.3)
  const particlesRef = useRef<ParticleData[]>([]);

  // Pulse animation — stored in ref, updated imperatively via material refs (P0-2.3)
  const pulsePhaseRef = useRef(0);
  const outlineBoxMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowRingMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Outline flash state — turns white briefly when E is pressed
  const outlineFlashRef = useRef(false);
  const outlineFlashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pre-allocated temp Vector3 — avoids per-frame allocation (P0-2.2)
  const tempVecRef = useRef(new THREE.Vector3());

  // InstancedMesh refs for particles — one draw call for all 8 particles (P0-2.3)
  const particleInstanceRef = useRef<THREE.InstancedMesh>(null);
  const particleGeo = useMemo(() => new THREE.SphereGeometry(0.06, 4, 4), []);
  const particleMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#44ffff',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }), []);

  // Dispose particle geometry/material on unmount
  useEffect(() => {
    const geo = particleGeo;
    const mat = particleMat;
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [particleGeo, particleMat]);

  useFrame((_, delta) => {
    const playerPos = livePlayerPositionRef.current;
    tempVecRef.current.set(...zone.position);
    const dist = playerPos.distanceTo(tempVecRef.current);

    // Show "Press E" if player is within trigger range
    const range = Math.max(zone.size[0], zone.size[2]) / 2 + 1.0;
    const isNear = dist < range && !isInteractionLocked();

    // Only update React state when value actually changes
    if (isNear !== showIndicatorRef.current) {
      showIndicatorRef.current = isNear;
      setShowIndicator(isNear);

      if (isNear) {
        registerPrompt({
          id: zone.id,
          label: zone.interactionLabel ?? INTERACTION_LABELS[zone.interactionType ?? 'default'],
          distance: dist,
          type: 'zone',
        });
      } else {
        unregisterPrompt(zone.id);
      }
    } else if (isNear) {
      // Update distance for sorting
      registerPrompt({
        id: zone.id,
        label: zone.interactionLabel ?? INTERACTION_LABELS[zone.interactionType ?? 'default'],
        distance: dist,
        type: 'zone',
      });
    }

    // Pulse animation for glow ring — imperative update via material refs (P0-2.3)
    if (isNear) {
      pulsePhaseRef.current += delta * 3;
    }
    const pulseOpacity = 0.35 + Math.sin(pulsePhaseRef.current) * 0.15;
    const isFlashing = outlineFlashRef.current;
    const outlineOpacity = isFlashing ? 0.9 : pulseOpacity;

    // Update outline box material imperatively
    if (outlineBoxMatRef.current) {
      outlineBoxMatRef.current.color.set(isFlashing ? '#ffffff' : '#00ffee');
      outlineBoxMatRef.current.opacity = isFlashing ? 0.35 : pulseOpacity * 0.3;
    }

    // Update glow ring material imperatively
    if (glowRingMatRef.current) {
      glowRingMatRef.current.color.set(isFlashing ? '#ffffff' : '#00ffee');
      glowRingMatRef.current.opacity = outlineOpacity;
    }

    // Cooldown
    triggerCooldown.current = Math.max(0, triggerCooldown.current - delta);

    // Auto-trigger toast on proximity
    if (isNear && !triggeredRef.current && triggerCooldown.current <= 0) {
      triggeredRef.current = true;
      triggerCooldown.current = 10;
      if (zone.enterToast) {
        eventBus.emit('ui:exploration_message', { text: zone.enterToast });
      }
    }

    if (dist > range + 0.5) {
      triggeredRef.current = false;
    }

    // Update particles imperatively via InstancedMesh (P0-2.3)
    const particles = particlesRef.current;
    if (particles.length > 0) {
      let writeIdx = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += delta;
        if (p.life > 0.8) continue; // particle expired — skip

        p.position[0] += p.velocity[0] * delta;
        p.position[1] += p.velocity[1] * delta;
        p.position[2] += p.velocity[2] * delta;
        p.velocity[0] *= 0.95;
        p.velocity[1] = p.velocity[1] * 0.95 - delta * 2;
        p.velocity[2] *= 0.95;

        const opacity = Math.max(0, 1 - p.life / 0.8);
        const scale = 0.06 * opacity;

        // Update instance matrix — position + scale
        tempMatrix.makeScale(scale, scale, scale);
        tempMatrix.setPosition(p.position[0], p.position[1], p.position[2]);
        if (particleInstanceRef.current) {
          particleInstanceRef.current.setMatrixAt(writeIdx, tempMatrix);
        }

        // Update instance color with opacity baked into brightness
        tempColor.setRGB(0.27 * opacity, 1.0 * opacity, 1.0 * opacity);
        if (particleInstanceRef.current) {
          particleInstanceRef.current.setColorAt(writeIdx, tempColor);
        }

        // Compact: move surviving particle forward
        if (writeIdx !== i) {
          particles[writeIdx] = p;
        }
        writeIdx++;
      }
      // Trim dead particles
      particles.length = writeIdx;

      if (particleInstanceRef.current) {
        // Hide unused instances by setting scale to 0
        for (let i = writeIdx; i < MAX_PARTICLES; i++) {
          tempMatrix.makeScale(0, 0, 0);
          particleInstanceRef.current.setMatrixAt(i, tempMatrix);
        }
        particleInstanceRef.current.instanceMatrix.needsUpdate = true;
        if (particleInstanceRef.current.instanceColor) {
          particleInstanceRef.current.instanceColor.needsUpdate = true;
        }
      }
    }
  });

  // Spawn particle burst — writes to ref, no setState (P0-2.3)
  const spawnParticles = useCallback(() => {
    const newParticles: ParticleData[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / MAX_PARTICLES;
      newParticles.push({
        position: [0, zone.size[1] / 2, 0],
        velocity: [
          Math.cos(angle) * (1.5 + Math.random()),
          2 + Math.random() * 2,
          Math.sin(angle) * (1.5 + Math.random()),
        ],
        life: 0,
      });
    }
    particlesRef.current = newParticles;

    // Initialize InstancedMesh with zero-scale for all instances
    if (particleInstanceRef.current) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        tempMatrix.makeScale(0, 0, 0);
        particleInstanceRef.current.setMatrixAt(i, tempMatrix);
      }
      particleInstanceRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [zone.size]);

  // ── E-key listener — only if allowed (in closest prompts) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      if (e.repeat) return;
      // Only interact if player is currently near this trigger zone
      if (!showIndicatorRef.current) return;
      // Don't interact if in an active interaction
      if (isInteractionLocked()) return;
      // Only respond if this prompt is in the allowed set
      if (!allowedIdsRef.current.has(zone.id)) return;
      // Global debounce: prevent multiple triggers from firing on same key press
      if (globalEKeyConsumed) return;
      // Prevent double-fire in same frame
      if (eKeyConsumedRef.current) return;
      globalEKeyConsumed = true;
      eKeyConsumedRef.current = true;
      // Also set on window for cross-component debounce (SceneExitIndicator)
      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => {
        globalEKeyConsumed = false;
        eKeyConsumedRef.current = false;
        (window as any).__volodka_ekey_consumed = false;
      }, 200);

      const sceneId = getGameStore().exploration.currentSceneId;

      // Check if this trigger zone is linked to an NPC dialogue
      // If so, route through the staged interaction system
      if (zone.linkedDialogueNodeId) {
        const npcDef = NPC_DEFINITIONS.find(
          (n) => n.dialogueNodeId === zone.linkedDialogueNodeId,
        );
        if (npcDef) {
          // Start staged interaction for this NPC
          eventBus.emit('interaction:start', { npcId: npcDef.id });
          spawnParticles();
          return;
        }
      }

      // Default: emit the standard object:interact event
      eventBus.emit('object:interact', {
        objectId: zone.id,
        sceneId,
        triggerZoneId: zone.id,
      });

      // Also emit highlight event for 3D glow effect on the object
      eventBus.emit('object:highlight', {
        triggerZoneId: zone.id,
        position: zone.position,
        size: zone.size,
      });

      // Spawn sparkle particles on interaction
      spawnParticles();

      // Flash outline white on E press — using ref instead of setState (P0-2.3)
      outlineFlashRef.current = true;
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
      outlineFlashTimer.current = setTimeout(() => {
        outlineFlashRef.current = false;
      }, 200);
    };

    // EventBus listener for mobile interact button — same logic as KeyE
    const handleInteractPress = () => {
      if (!showIndicatorRef.current) return;
      if (isInteractionLocked()) return;
      if (!allowedIdsRef.current.has(zone.id)) return;
      if (globalEKeyConsumed) return;
      if (eKeyConsumedRef.current) return;
      globalEKeyConsumed = true;
      eKeyConsumedRef.current = true;
      (window as any).__volodka_ekey_consumed = true;
      setTimeout(() => {
        globalEKeyConsumed = false;
        eKeyConsumedRef.current = false;
        (window as any).__volodka_ekey_consumed = false;
      }, 200);

      const sceneId = getGameStore().exploration.currentSceneId;

      if (zone.linkedDialogueNodeId) {
        const npcDef = NPC_DEFINITIONS.find(
          (n) => n.dialogueNodeId === zone.linkedDialogueNodeId,
        );
        if (npcDef) {
          eventBus.emit('interaction:start', { npcId: npcDef.id });
          spawnParticles();
          return;
        }
      }

      eventBus.emit('object:interact', {
        objectId: zone.id,
        sceneId,
        triggerZoneId: zone.id,
      });

      eventBus.emit('object:highlight', {
        triggerZoneId: zone.id,
        position: zone.position,
        size: zone.size,
      });

      spawnParticles();

      outlineFlashRef.current = true;
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
      outlineFlashTimer.current = setTimeout(() => {
        outlineFlashRef.current = false;
      }, 200);
    };

    window.addEventListener('keydown', handleKeyDown);
    const unsubInteract = eventBus.on('interact:press', handleInteractPress);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubInteract();
      if (outlineFlashTimer.current) clearTimeout(outlineFlashTimer.current);
    };
  }, [zone.id, zone.linkedDialogueNodeId, spawnParticles, allowedIdsRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterPrompt(zone.id);
    };
  }, [zone.id, unregisterPrompt]);

  return (
    <group position={zone.position}>
      {/* Emissive outline box — slightly larger than zone, transparent with glow */}
      {showIndicator && (
        <mesh position={[0, zone.size[1] / 2, 0]}>
          <boxGeometry
            args={[
              zone.size[0] + 0.12,
              zone.size[1] + 0.12,
              zone.size[2] + 0.12,
            ]}
          />
          <meshBasicMaterial
            ref={outlineBoxMatRef}
            color="#00ffee"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Glow ring around interactive object when near */}
      {showIndicator && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <ringGeometry
            args={[
              Math.max(zone.size[0], zone.size[2]) / 2,
              Math.max(zone.size[0], zone.size[2]) / 2 + 0.15,
              32,
            ]}
          />
          <meshBasicMaterial
            ref={glowRingMatRef}
            color="#00ffee"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* No individual Html prompt — rendered centrally in parent */}

      {/* Sparkle particles — single InstancedMesh instead of 8 separate meshes (P0-2.3) */}
      <instancedMesh
        ref={particleInstanceRef}
        args={[particleGeo, particleMat, MAX_PARTICLES]}
        frustumCulled={false}
      />
    </group>
  );
}

/** World item that can be picked up — bobs up and down */
export function WorldItem({
  id,
  position,
  label,
  onPickup,
}: {
  id: string;
  position: [number, number, number];
  label: string;
  onPickup?: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseY = position[1];
  const time = useRef(0);
  const [picked, setPicked] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current || picked) return;
    time.current += delta;
    // Bob animation
    meshRef.current.position.y = baseY + Math.sin(time.current * 2) * 0.08;
    // Slow rotation
    meshRef.current.rotation.y += delta * 0.5;
  });

  if (picked) return null;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => {
          setPicked(true);
          onPickup?.(id);
          eventBus.emit('object:interact', {
            objectId: id,
            sceneId: getGameStore().exploration.currentSceneId,
          });
        }}
      >
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ffaa44"
          emissive="#ff8800"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#ffcc44',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            userSelect: 'none',
            zIndex: 20,
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}
