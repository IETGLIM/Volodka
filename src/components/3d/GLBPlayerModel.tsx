
/* ─── GLB Player Model — loads CesiumMan, with animation ───
 *  Single-animation fallback: when GLB has only animation_0,
 *  control playback speed per state (idle 0.6x, walk 1.0x, run 1.8x).
 *  Procedural override for stand-up (CesiumMan has no sit→stand).
 *  Consolidated animation init: NO duplicate play calls.
 */

import { useRef, useEffect, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

import { getDefaultPlayerModelPath } from '@/config/modelUrls';
import { PLAYER_GLB_TARGET_VISUAL_METERS } from '@/data/constants';
import { ProceduralPlayerModel } from './ProceduralPlayerModel';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

// Preload the GLB model so it's ready when the component mounts.
// This eliminates the visible delay where the procedural model shows first.
// Direct call to useGLTF.preload() — it's a static method (not a hook),
// so it's safe to call at module level. Since useGLTF is already imported
// at the top of this file, we avoid the latency of a dynamic import.
if (typeof window !== 'undefined') {
  try {
    useGLTF.preload(getDefaultPlayerModelPath());
  } catch {
    // Preload failed — model will load on mount instead
  }
}

/** Error boundary that catches GLB model rendering errors and falls back to procedural */
export class GLBModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[GLBPlayerModel] Rendering error, using procedural fallback:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function GLBPlayerModel({
  modelScale,
  karmaGlow,
  currentAnimRef,
  rotationRef,
}: {
  modelScale: number;
  karmaGlow: string;
  currentAnimRef: React.MutableRefObject<string>;
  rotationRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const modelPath = getDefaultPlayerModelPath();
  const { scene, animations } = useGLTF(modelPath);

  // Use the scene directly for animations — it contains the skeleton
  const playerScene = scene;

  // ── Suppress THREE.Skeleton bone mismatch warnings ──
  // CesiumMan and other GLB models may have animation clips that reference
  // bones not present in the skeleton. This is harmless — Three.js logs a
  // warning but the animation still plays. We suppress the warning to keep
  // the console clean.
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const msg = args[0]?.toString?.() ?? '';
      if (typeof msg === 'string' && (
        msg.includes('THREE.Skeleton') ||
        msg.includes('bone mismatch') ||
        msg.includes('Could not find bone')
      )) {
        return; // Suppress skeleton warnings
      }
      originalWarn.apply(console, args);
    };
    return () => { console.warn = originalWarn; };
  }, []);

  // Pass the actual scene to useAnimations
  const { actions } = useAnimations(animations, playerScene);

  // ── Animation init state machine ──
  // Avoids duplicate play calls by tracking whether animation has been started.
  // 'pending' = waiting for actions, 'started' = animation is playing
  const animInitRef = useRef<'pending' | 'started'>('pending');

  const currentAnimRefLocal = useRef<string>('idle');
  const crossfadeDuration = 0.3;

  // ── Single-animation fallback refs ──
  const singleAnimActionRef = useRef<THREE.AnimationAction | null>(null);
  const hasMultipleAnimsRef = useRef(true);

  // ── Procedural override for stand-up animation ──
  // useState (not useRef) so React re-renders when switching models.
  // Lazy initializer: check game mode at mount time to decide initial override state.
  const [useProceduralOverride, setUseProceduralOverride] = useState(() => {
    if (typeof window !== 'undefined') {
      const store = useGameStore.getState();
      return store.mode !== 'exploration';
    }
    return false;
  });

  // Ref mirror to avoid stale closures in subscribe callbacks
  const proceduralOverrideRef = useRef(useProceduralOverride);

  // Keep ref in sync with state
  useEffect(() => {
    proceduralOverrideRef.current = useProceduralOverride;
  }, [useProceduralOverride]);

  // ── Safety: auto-stand when game enters exploration without a stand_up event ──
  // Handles two cases:
  //   1. Story flow is skipped (loading a save, etc.)
  //   2. The player:stand_up event was emitted BEFORE this component mounted
  //      (race condition: StoryRenderer emits the event, but the 3D canvas
  //      hasn't mounted yet, so nobody was listening)
  //
  // The lazy initializer of useProceduralOverride already handles the initial
  // mount state (returns false when mode === 'exploration'). The subscription
  // below handles runtime mode transitions by emitting player:stand_up, which
  // triggers the stand-up animation effect.
  useEffect(() => {
    // If somehow the ref is out of sync on mount (edge case: mode changed
    // between useState lazy init and this effect), sync the ref now.
    // Note: we only update the ref, not setState — the lazy initializer
    // already set the correct initial state for the current mode.
    const store = useGameStore.getState();
    if (store.mode === 'exploration' && proceduralOverrideRef.current) {
      proceduralOverrideRef.current = false;
      currentAnimRef.current = 'idle';
    }

    // Subscribe to mode changes for runtime transitions
    const unsub = useGameStore.subscribe((state) => {
      if (state.mode === 'exploration' && proceduralOverrideRef.current) {
        eventBus.emit('player:stand_up', {});
      }
    });
    return unsub;
  }, []);

  // ── Listen for player:stand_up event ──
  useEffect(() => {
    const unsub = eventBus.on('player:stand_up', () => {
      setUseProceduralOverride(true);
      proceduralOverrideRef.current = true;
      currentAnimRef.current = 'stand_up';
      // After stand-up animation, switch back to GLB
      setTimeout(() => {
        setUseProceduralOverride(false);
        proceduralOverrideRef.current = false;
        currentAnimRef.current = 'idle';
        // Restart GLB animation after returning from procedural
        animInitRef.current = 'pending';
      }, 1800);
    });
    return unsub;
  }, []);

  // ── Scale model to target height AND position feet at y=0 ──
  // CRITICAL FIX: After scaling, the model's bounding box may not start at y=0.
  // Many GLB models (including CesiumMan) have their origin at the center,
  // not at the feet. Without this offset, the model appears half-buried
  // in the floor because the RigidBody origin is at the character's feet.
  useEffect(() => {
    if (!playerScene) return;
    // Reset position before computing bounding box
    playerScene.position.set(0, 0, 0);
    playerScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(playerScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const currentHeight = size.y;
    if (currentHeight > 0) {
      const scaleFactor = (PLAYER_GLB_TARGET_VISUAL_METERS / currentHeight) * modelScale;
      playerScene.scale.setScalar(scaleFactor);
    }

    // After scaling, re-compute the bounding box and offset so feet are at y=0
    playerScene.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(playerScene);
    // Offset: move model up so its bottom (feet) align with y=0 in local space
    // This ensures the visual model's feet match the RigidBody position (y=0.01 world)
    playerScene.position.y = -scaledBox.min.y;
  }, [playerScene, modelScale]);

  // ── CONSOLIDATED animation initialization ──
  // Single place that starts the animation — no duplicate play calls.
  // Detects single-animation models and uses speed control.
  useEffect(() => {
    if (!actions || !animations || animations.length === 0) return;
    if (animInitRef.current === 'started') return; // Already started — skip

    const actionKeys = Object.keys(actions);
    if (actionKeys.length === 0) return;

    // Mark as started immediately to prevent race conditions
    animInitRef.current = 'started';

    if (actionKeys.length === 1) {
      // ── Single-animation mode ──
      hasMultipleAnimsRef.current = false;
      singleAnimActionRef.current = actions[actionKeys[0]] ?? null;
      const singleAction = singleAnimActionRef.current;
      if (singleAction) {
        // Stop first, then start fresh to avoid conflicts
        singleAction.stop();
        singleAction.setEffectiveTimeScale(0.6);
        singleAction.setEffectiveWeight(1.0);
        singleAction.reset().fadeIn(0.3).play();
      }
    } else {
      // ── Multi-animation mode ──
      hasMultipleAnimsRef.current = true;
      singleAnimActionRef.current = null;

      // Find idle animation
      const idleVariants = [
        'idle', 'Idle', 'IDLE',
        'Cesium_Man_idles', 'Cesium_Man_Idle',
        'Armature|idle', 'Armature|Idle',
        '0', 'animation_0',
      ];
      let idleAction: THREE.AnimationAction | null = null;
      for (const name of idleVariants) {
        if (actions[name]) { idleAction = actions[name]; break; }
      }
      if (!idleAction) {
        // Partial name match
        for (const [key, action] of Object.entries(actions)) {
          if (key.toLowerCase().includes('idle') || key.toLowerCase().includes('stand')) {
            idleAction = action ?? null; break;
          }
        }
      }
      if (!idleAction) {
        // Last resort: first animation
        idleAction = actions[actionKeys[0]] ?? null;
      }
      if (idleAction) {
        // Stop all, then play idle
        for (const action of Object.values(actions)) { action?.stop(); }
        idleAction.reset().fadeIn(0.3).play();
      }
    }

    return () => {
      // Cleanup: stop all animations on unmount
      for (const action of Object.values(actions)) { action?.stop(); }
    };
  }, [actions, animations]);

  // ── Per-frame animation update ──
  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y = rotationRef.current;

    const targetState = currentAnimRef.current;

    // Don't change animation during stand_up phase
    if (targetState === 'stand_up' && currentAnimRefLocal.current === 'stand_up') return;

    if (targetState !== currentAnimRefLocal.current && actions) {
      currentAnimRefLocal.current = targetState;

      // ── Single-animation fallback: adjust playback speed ──
      if (!hasMultipleAnimsRef.current && singleAnimActionRef.current) {
        const singleAction = singleAnimActionRef.current;
        let speed = 0.6; // idle default
        if (targetState === 'walk') speed = 1.0;
        else if (targetState === 'run') speed = 1.8;
        singleAction.setEffectiveTimeScale(speed);
        singleAction.setEffectiveWeight(1.0);
        if (!singleAction.isRunning()) {
          singleAction.reset().fadeIn(crossfadeDuration).play();
        }
        return;
      }

      // ── Multi-animation crossfade ──
      const variants = [
        targetState,
        targetState.charAt(0).toUpperCase() + targetState.slice(1),
        targetState.toUpperCase(),
        'Cesium_Man_' + targetState,
        'Armature|' + targetState,
      ];
      if (targetState === 'idle') variants.push('Cesium_Man_idles', '0', 'animation_0');
      if (targetState === 'walk') variants.push('1', 'animation_1');
      if (targetState === 'run') variants.push('2', 'animation_2');

      let targetAction: THREE.AnimationAction | null = null;
      for (const name of variants) {
        if (actions[name]) { targetAction = actions[name]; break; }
      }
      // Partial name match
      if (!targetAction) {
        for (const [key, action] of Object.entries(actions)) {
          if (key.toLowerCase().includes(targetState.toLowerCase())) {
            targetAction = action ?? null; break;
          }
        }
      }
      // Last resort for idle: first animation
      if (!targetAction && targetState === 'idle') {
        const firstKey = Object.keys(actions)[0];
        if (firstKey) targetAction = actions[firstKey] ?? null;
      }

      if (targetAction) {
        for (const action of Object.values(actions)) {
          if (action === targetAction) {
            action?.reset().fadeIn(crossfadeDuration).play();
          } else {
            action?.fadeOut(crossfadeDuration);
          }
        }
      }
    }
  });

  // ── If procedural override is active, use ProceduralPlayerModel ──
  if (useProceduralOverride) {
    return <ProceduralPlayerModel modelScale={modelScale} karmaGlow={karmaGlow} currentAnimRef={currentAnimRef} rotationRef={rotationRef} />;
  }

  if (!playerScene) return <ProceduralPlayerModel modelScale={modelScale} karmaGlow={karmaGlow} currentAnimRef={currentAnimRef} rotationRef={rotationRef} />;

  return (
    <group ref={groupRef}>
      <primitive object={playerScene} castShadow />
      <pointLight
        position={[0, 1.0, 0.15]}
        color={karmaGlow}
        intensity={0.5}
        distance={2.5}
      />
      {/* Rim light behind GLB model for silhouette separation */}
      <pointLight
        position={[0, 1.2, -0.5]}
        color="#ffaa66"
        intensity={0.1}
        distance={1.5}
      />
    </group>
  );
}
