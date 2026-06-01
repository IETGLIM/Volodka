'use client';

/* ─── Volodka RPG – Main 3D Canvas ─── */

import { useRef, useEffect, useState, Component, type ReactNode, type ErrorInfo, Suspense, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';

/** Error boundary specifically for the post-processing pipeline.
 *  If EffectComposer crashes (e.g., WebGL context not ready), the 3D scene
 *  continues to work without post-processing effects. */
class PostFXErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[PostFX] EffectComposer failed, disabling post-processing:', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing — post-processing is optional
      return null;
    }
    return this.props.children;
  }
}
import { SceneColliderSelector } from './SceneColliderSelector';
import { PhysicsPlayer } from './PhysicsPlayer';
import { SimplePlayer } from './SimplePlayer';
import { FollowCamera } from './FollowCamera';
import { NPCSystem } from './NPCSystem';
import { InteractiveTriggers } from './InteractiveTriggers';
import { InteractionHighlight } from './InteractionHighlight';
import { SceneExitIndicator } from './SceneExitIndicator';
import { QuestWaypoints } from './QuestWaypoints';
import { ChoiceReactivity } from './ChoiceReactivity';
import { SceneTransitionHandler } from './SceneTransitionHandler';
import { ExplorationPostFX } from './ExplorationPostFX';
// ExplorationParticles removed (P1-3.2) — duplicated WeatherParticles + WeatherController
import { ExplorationLighting } from './Lighting';
import { SceneEnvironment } from './SceneEnvironment';
import { MatrixRain } from './MatrixRain';
import { GlitchEffect } from './GlitchEffect';
import { NoirOverlay } from './NoirOverlay';
import { WeatherController } from './WeatherController';
import { AtmosphericEffects } from './AtmosphericEffects';
import { ProximityReactivityRenderer } from './ProximityReactivityRenderer';
import { VisualizationLayers } from './VisualizationLayers';
import { EnvironmentalAnimator } from './EnvironmentalAnimator';
import { InteractionSystemBridge, getInteractionState, getInteractionTargetNPCId } from './InteractionSystemBridge';
import { RendererInfoBridge } from './RendererInfoBridge';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useDynamicDPR } from '@/hooks/useDynamicDPR';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useVirtualControlsRef } from '@/engine/VirtualControlsState';
import { sharedPlayerRotationRef } from '@/engine/PlayerRotationState';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { type VirtualControls } from '@/hooks/useGamePhysics';
import { useGameStore } from '@/store/gameStore';

/** Error boundary for the Rapier Physics component.
 *  If Rapier WASM fails to load (common on Vercel edge, slow connections),
 *  falls back to SimplePlayer which uses direct position manipulation
 *  without collision detection. The game is still playable. */
class PhysicsErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[PhysicsErrorBoundary] Rapier physics failed, using SimplePlayer fallback:', error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/** Error boundary for Three.js / R3F components — catches rendering errors
 *  and auto-retries up to MAX_RETRIES times before showing a permanent fallback.
 *
 *  FIX (Code Review #1): Timer ID is now stored and cleared in componentWillUnmount
 *  to prevent setState on unmounted component. */
class Canvas3DErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; retryCount: number }
> {
  static MAX_RETRIES = 3;

  state = { hasError: false, retryCount: 0 };

  /** FIX: Store retry timer ID so it can be cleared on unmount */
  private retryTimerId: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(): Partial<Canvas3DErrorBoundary['state']> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RPGGameCanvas] 3D rendering error:', error, info);

    // Auto-retry with a short delay if under the retry limit
    if (this.state.retryCount < Canvas3DErrorBoundary.MAX_RETRIES) {
      const nextCount = this.state.retryCount + 1;
      console.log(`[RPGGameCanvas] Auto-retry ${nextCount}/${Canvas3DErrorBoundary.MAX_RETRIES}...`);
      // FIX: Save timer ID and clear any existing timer before setting a new one
      if (this.retryTimerId !== null) {
        clearTimeout(this.retryTimerId);
      }
      this.retryTimerId = setTimeout(() => {
        this.retryTimerId = null;
        this.setState({ hasError: false, retryCount: nextCount });
      }, 500 * nextCount); // Exponential backoff: 500ms, 1000ms, 1500ms
    }
  }

  /** FIX: Clear pending retry timer to prevent setState on unmounted component */
  componentWillUnmount() {
    if (this.retryTimerId !== null) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }
  }

  handleManualRetry = () => {
    if (this.retryTimerId !== null) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }
    this.setState({ hasError: false, retryCount: 0 });
  };

  render() {
    if (this.state.hasError && this.state.retryCount >= Canvas3DErrorBoundary.MAX_RETRIES) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: 'rgba(200, 220, 255, 0.6)',
            fontFamily: 'monospace',
            fontSize: '14px',
            letterSpacing: '0.1em',
            gap: '16px',
          }}
        >
          <div>3D engine error</div>
          <button
            onClick={this.handleManualRetry}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              background: 'rgba(0, 229, 255, 0.1)',
              color: 'rgba(0, 229, 255, 0.8)',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
            }}
          >
            RETRY
          </button>
        </div>
      );
    }
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: 'rgba(200, 220, 255, 0.6)',
            fontFamily: 'monospace',
            fontSize: '14px',
            letterSpacing: '0.1em',
          }}
        >
          Loading...
        </div>
      );
    }
    return this.props.children;
  }
}

/** FIX (Code Review #2): Extracted shared fallback scene used by both
 *  Suspense (WASM loading) and PhysicsErrorBoundary (Rapier failure).
 *  Previously duplicated — now a single component for maintainability. */
function SimpleSceneFallback({
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef: React.MutableRefObject<VirtualControls>;
}) {
  return (
    <group>
      {/* Basic floor for visibility — at y=0.01 matching CuboidCollider top */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.95} />
      </mesh>
      <SimplePlayer
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        virtualControlsRef={virtualControlsRef}
        onInteractPress={() => {}}
      />
      <FollowCamera
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
      />
      <ExplorationLighting />
      <SceneEnvironment />
    </group>
  );
}

/** Main 3D canvas for the RPG exploration mode */
export function RPGGameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const livePlayerPositionRef = useRef(new THREE.Vector3(0, 0.01, -1.0));
  const livePlayerRotationRef = useRef(Math.PI);
  const virtualControlsRef = useVirtualControlsRef();

  const isMobile = useIsMobileVisual();
  const { visualLite } = useMobileVisualPerf();

  // P3-FIX: Pause physics when game is in menu/intro mode to save CPU.
  // Uses useShallow to select just the mode string (primitive) so this
  // only re-renders when mode actually changes, not on every store update.
  const gameMode = useGameStore((s) => s.mode);
  const physicsPaused = gameMode === 'menu' || gameMode === 'intro';

  // Dynamic DPR scaling based on measured FPS
  const targetDpr: [number, number] = isMobile ? [1, 1.5] : [1, 2];
  const dpr = useDynamicDPR({
    targetDpr,
    lowFpsThreshold: 25,
    highFpsThreshold: 45,
    minDpr: isMobile ? 0.75 : 1,
    step: 0.1,
    windowMs: 2000,
  });

  // Auto-focus canvas on mount for keyboard events
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Props passed directly to fallback components — these are already stable refs
  // so no intermediate useRef wrapper is needed (avoids "Cannot access refs during render").

  // Note: InteractionSystemBridge reads the player rigid body directly via
  // getPlayerRigidBody() from PlayerRigidBodyState — no polling needed.
  // PhysicsPlayer writes to the shared state on mount.

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        width: '100%',
        height: '100%',
        outline: 'none',
        position: 'relative',
        // zIndex is handled by the parent wrapper in GameOrchestrator
        // to prevent double-stacking when Canvas is always-mounted
      }}
      onFocus={() => {
        // Canvas is focused — input is active
      }}
    >
      <Canvas3DErrorBoundary>
        <Canvas
          flat
          frameloop="always"
          dpr={dpr}
          camera={{ fov: 55, near: 0.1, far: 200, position: [0, 2.35, 2.5] }}
          shadows={!visualLite ? true : false}
          // Use factory function to create the WebGLRenderer with explicit settings.
          // R3F v9: the `gl` prop callback receives a defaultProps object
          // { canvas: HTMLCanvasElement, powerPreference, antialias, alpha },
          // NOT just the canvas element. We must destructure `canvas` from it.
          // Failing to do so passes the whole object to THREE.WebGLRenderer as
          // the `canvas` parameter, causing "U.addEventListener is not a function"
          // because a plain object doesn't have DOM event methods.
          //
          // FIX (Code Review #4): Removed unnecessary `async` — WebGLRenderer
          // construction is synchronous; async adds nothing and may confuse readers.
          gl={({ canvas }) => {
            const renderer = new THREE.WebGLRenderer({
              canvas,
              antialias: !visualLite,
              stencil: true,
              alpha: false,
              powerPreference: 'high-performance',
            });
            // SAFETY: Ensure NoToneMapping — prevents double tone mapping with
            // EffectComposer's ToneMapping pass (white screen).
            renderer.toneMapping = THREE.NoToneMapping;
            renderer.toneMappingExposure = 1.0;
            renderer.setClearColor(0x000000, 1);
            return renderer;
          }}
          style={{ background: '#000' }}
        >
        <VisualizationLayers livePlayerPositionRef={livePlayerPositionRef}>
          {/* FIX (Code Review #2): Both Suspense fallback and PhysicsErrorBoundary
              now use the shared SimpleSceneFallback component instead of duplicating
              the same floor + SimplePlayer + FollowCamera + lighting + environment. */}
          <Suspense fallback={
            <SimpleSceneFallback
              livePlayerPositionRef={livePlayerPositionRef}
              livePlayerRotationRef={livePlayerRotationRef}
              virtualControlsRef={virtualControlsRef}
            />
          }>
          <PhysicsErrorBoundary
            fallback={
              /* ── Rapier fallback: SimplePlayer without physics ──
               *  Renders a basic scene floor + SimplePlayer that moves
               *  without collision detection. Game is still playable. */
              <SimpleSceneFallback
                livePlayerPositionRef={livePlayerPositionRef}
                livePlayerRotationRef={livePlayerRotationRef}
                virtualControlsRef={virtualControlsRef}
              />
            }
          >
          {/* P3-FIX: Pause physics when game is in menu/intro mode to save CPU.
              The Physics component's `paused` prop stops the Rapier world from
              stepping, which saves ~1-2ms/frame on mobile when the 3D scene is
              not interactive (menu, loading, intro). The canvas is still rendered
              (for intro wake-up cutscene), but physics bodies are frozen. */}
          <Physics gravity={[0, -15, 0]} timeStep={1/60} interpolate={true} debug={false} paused={physicsPaused}>
            {/* Scene visual + colliders (now with layer separation) */}
            <SceneColliderSelector livePlayerPositionRef={livePlayerPositionRef} />

            {/* Environmental animations — flickering lights, steam, neon, etc. */}
            <EnvironmentalAnimator livePlayerPositionRef={livePlayerPositionRef} />

            {/* Player */}
            <PhysicsPlayer
              livePlayerPositionRef={livePlayerPositionRef}
              livePlayerRotationRef={livePlayerRotationRef}
              virtualControlsRef={virtualControlsRef}
              onInteractPress={() => {}}
            />

            {/* Camera */}
            <FollowCamera
              livePlayerPositionRef={livePlayerPositionRef}
              livePlayerRotationRef={livePlayerRotationRef}
            />

            {/* NPCs — passes interaction state from module-level store */}
            <NPCSystemWrapper livePlayerPositionRef={livePlayerPositionRef} />

            {/* Interactive triggers */}
            <InteractiveTriggers livePlayerPositionRef={livePlayerPositionRef} />

            {/* Interaction highlight glow effect on E-press */}
            <InteractionHighlight />

            {/* Proximity reactivity — lights, sounds, effects near player */}
            <ProximityReactivityRenderer livePlayerPositionRef={livePlayerPositionRef} />

            {/* Scene exit indicators */}
            <SceneExitIndicator livePlayerPositionRef={livePlayerPositionRef} />

            {/* Quest waypoint arrows toward active objectives */}
            <QuestWaypoints livePlayerPositionRef={livePlayerPositionRef} />

            {/* Visual feedback for moral choices — karma/NPC reaction pulses */}
            <ChoiceReactivity />

            {/* Scene transition handler (no visual output) */}
            <SceneTransitionHandler />

            {/* Interaction system bridge — runs state machine every frame */}
            <InteractionSystemBridge
              livePlayerPositionRef={livePlayerPositionRef}
              livePlayerRotationRef={livePlayerRotationRef}
            />

            {/* Sync player rotation to shared state for CompassHUD */}
            <RotationSyncBridge livePlayerRotationRef={livePlayerRotationRef} />

            {/* Lighting */}
            <ExplorationLighting />

            {/* Environment */}
            <SceneEnvironment />
          </Physics>
          </PhysicsErrorBoundary>
          </Suspense>
        </VisualizationLayers>

        {/* Rain / Snow weather system */}
        <WeatherController />

        {/* Volumetric fog, god rays, and atmospheric effects */}
        <AtmosphericEffects />

        {/* Post-processing — wrapped in inner error boundary so 3D scene
            still works even if EffectComposer fails to initialize */}
        <PostFXErrorBoundary>
          <ExplorationPostFX />
        </PostFXErrorBoundary>

        {/* Renderer info bridge — writes renderer.info to shared state for DevPanel */}
        <RendererInfoBridge />

        {/* FIX (Code Review #6): Consolidated ToneMappingGuard, WebGLContextGuard,
            and CanvasFirstFrameSignal into a single useFrame callback to reduce
            the number of per-frame hooks. Each "guard" is now a function called
            from the consolidated CanvasGuardSystem component. */}
        <CanvasGuardSystem />

        </Canvas>
      </Canvas3DErrorBoundary>

      {/* ── Visual overlays (CSS-based, outside Canvas for performance) ── */}
      <MatrixRain />
      <GlitchEffect />
      <NoirOverlay />

      {/* Mobile virtual controls are handled by ExplorationMobileHud in GameOrchestrator */}
    </div>
  );
}

/** Syncs livePlayerRotationRef to shared module-level state for CompassHUD */
function RotationSyncBridge({ livePlayerRotationRef }: { livePlayerRotationRef: React.MutableRefObject<number> }) {
  useFrame(() => {
    sharedPlayerRotationRef.current = livePlayerRotationRef.current;
  });
  return null;
}

/** FIX (Code Review #6): Consolidated canvas guard system.
 *  Combines ToneMappingGuard, WebGLContextGuard, and CanvasFirstFrameSignal
 *  into a single component with one useFrame callback instead of three.
 *  This reduces the overhead of multiple per-frame hooks while preserving
 *  all the same functionality. */
function CanvasGuardSystem() {
  const gl = useThree((state) => state.gl);
  const toneMappingEnforced = useRef(false);
  const firstFrameEmitted = useRef(false);
  const contextLost = useRef(false);

  // WebGL context loss handlers (attached to canvas element)
  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[CanvasGuard] WebGL context LOST — attempting recovery...');
      contextLost.current = true;
      firstFrameEmitted.current = false;
      toneMappingEnforced.current = false;
      eventBus.emit('canvas:context-lost', {});
    };

    const handleContextRestored = () => {
      console.log('[CanvasGuard] WebGL context RESTORED');
      // first-frame will be re-emitted on next useFrame call
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  // Single useFrame that handles all guard duties
  useFrame((state) => {
    // ── Guard 1: Enforce NoToneMapping ──
    try {
      if (state.gl.toneMapping !== THREE.NoToneMapping) {
        state.gl.toneMapping = THREE.NoToneMapping;
      }
      toneMappingEnforced.current = true;
    } catch {
      // WebGL context lost or renderer disposed — ignore silently
    }

    // ── Guard 2: Emit first-frame signal ──
    if (!firstFrameEmitted.current) {
      firstFrameEmitted.current = true;
      if (contextLost.current) {
        console.log('[CanvasGuard] Re-signalling after context restore');
        contextLost.current = false;
      }
      eventBus.emit('canvas:first-frame', {});
    }
  });

  return null;
}

/** FIX (Code Review #3): NPCSystemWrapper wrapped with React.memo and
 *  uses a single state object to reduce re-renders. Previously, every
 *  interaction:state_change event caused TWO setState calls (state + target),
 *  triggering two re-renders. Now batched into a single state update.
 *  Also wrapped with React.memo to prevent re-renders when parent re-renders
 *  but interaction state hasn't changed. */

const NPCSystemWrapper = memo(function NPCSystemWrapper({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  // Batch interaction state and target into a single state object
  // to reduce re-renders from two setState calls to one
  const [interaction, setInteraction] = useState<{
    state: InteractionState;
    targetNPCId: string | null;
  }>(() => ({
    state: getInteractionState(),
    targetNPCId: getInteractionTargetNPCId(),
  }));

  useEffect(() => {
    const unsub = eventBus.on('interaction:state_change', ({ state, npcId }) => {
      // Batch both updates into a single setState call
      setInteraction({
        state,
        // When transitioning to Idle, always clear the target NPC ID
        // so isInteractionTarget becomes false for the previously-targeted NPC.
        targetNPCId: state === InteractionState.Idle ? null : (npcId ?? null),
      });
    });
    return unsub;
  }, []);

  return (
    <NPCSystem
      livePlayerPositionRef={livePlayerPositionRef}
      interactionState={interaction.state}
      interactionTargetNPCId={interaction.targetNPCId}
    />
  );
});
