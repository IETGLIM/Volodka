
/* ─── Volodka RPG – Main 3D Canvas ─── */

import { Suspense, lazy, useRef, useMemo, useEffect, useState, Component, Fragment, type ReactNode, type ErrorInfo, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
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
import { WakeUpSequence } from './WakeUpSequence';
import { SceneColliderSelector } from './SceneColliderSelector';
import { PhysicsPlayer } from './PhysicsPlayer';
import { SimplePlayer } from './SimplePlayer';
import { FollowCamera } from './FollowCamera';
import { NPCSystem } from './NPCSystem';
import { AmbientNPCs } from './AmbientNPCs';
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
import { useGameStore } from '@/store/gameStore';

import { FrameBudgetRunner } from './FrameBudgetRunner';

const LazyFrameProfilerBridge = lazy(() =>
  import('./FrameProfilerBridge').then((m) => ({ default: m.FrameProfilerBridge })),
);

import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useDynamicDPR } from '@/hooks/useDynamicDPR';
import { GltfPipelineInit } from './assets/GltfPipelineInit';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useVirtualControlsRef } from '@/engine/VirtualControlsState';
import { sharedPlayerRotationRef } from '@/engine/PlayerRotationState';
import { eventBus } from '@/engine/EventBus';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { type VirtualControls } from '@/hooks/useGamePhysics';
import { useGameMode } from '@/store/selectors';
import { markCanvasMounted, markFirstFrame } from '@/engine/performance/LoadingTimeline';

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
 *  FIX (Code Review #1): Timer ID is stored and cleared on unmount.
 *  FIX (Code Review #9): Retry generation counter ignores stale timer completions;
 *  canvasKey forces atomic subtree remount; isRemounting disables rapid manual retry. */
class Canvas3DErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; retryCount: number; canvasKey: number; isRemounting: boolean }
> {
  static MAX_RETRIES = 3;

  state = { hasError: false, retryCount: 0, canvasKey: 0, isRemounting: false };

  private retryTimerId: ReturnType<typeof setTimeout> | null = null;
  /** Bumped on every new error or manual retry — stale timer callbacks no-op. */
  private retryGeneration = 0;

  static getDerivedStateFromError(): Partial<Canvas3DErrorBoundary['state']> {
    return { hasError: true, isRemounting: false };
  }

  private clearRetryTimer() {
    if (this.retryTimerId !== null) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }
  }

  /** Atomically clear error state and remount the Canvas subtree via canvasKey. */
  private applyRetry(retryCount: number) {
    this.setState(
      (prev) => ({
        hasError: false,
        retryCount,
        canvasKey: prev.canvasKey + 1,
        isRemounting: true,
      }),
      () => this.finishRemountGuard(),
    );
  }

  private scheduleAutoRetry(nextCount: number) {
    const generation = this.retryGeneration;
    this.clearRetryTimer();
    this.retryTimerId = setTimeout(() => {
      this.retryTimerId = null;
      if (generation !== this.retryGeneration) return;
      this.applyRetry(nextCount);
    }, 500 * nextCount);
  }

  /** Clear isRemounting after the keyed subtree has had a chance to mount. */
  private finishRemountGuard() {
    requestAnimationFrame(() => {
      this.setState((prev) => (prev.hasError ? null : { isRemounting: false }));
    });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RPGGameCanvas] 3D rendering error:', error, info);

    // Invalidate any in-flight retry and cancel its timer before scheduling anew.
    this.retryGeneration += 1;
    this.clearRetryTimer();

    const { retryCount } = this.state;
    if (retryCount < Canvas3DErrorBoundary.MAX_RETRIES) {
      const nextCount = retryCount + 1;
      console.log(`[RPGGameCanvas] Auto-retry ${nextCount}/${Canvas3DErrorBoundary.MAX_RETRIES}...`);
      this.scheduleAutoRetry(nextCount);
    }
  }

  componentWillUnmount() {
    this.retryGeneration += 1;
    this.clearRetryTimer();
  }

  handleManualRetry = () => {
    if (this.state.isRemounting) return;

    this.retryGeneration += 1;
    this.clearRetryTimer();
    this.applyRetry(0);
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
            disabled={this.state.isRemounting}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              background: 'rgba(0, 229, 255, 0.1)',
              color: 'rgba(0, 229, 255, 0.8)',
              cursor: this.state.isRemounting ? 'wait' : 'pointer',
              opacity: this.state.isRemounting ? 0.5 : 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              letterSpacing: '0.1em',
            }}
          >
            {this.state.isRemounting ? 'RETRYING...' : 'RETRY'}
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
    return <Fragment key={this.state.canvasKey}>{this.props.children}</Fragment>;
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

  const { preset } = useGraphicsQuality();

  // P3-FIX: Pause physics when game is in menu/intro mode to save CPU.
  // Uses useShallow to select just the mode string (primitive) so this
  // only re-renders when mode actually changes, not on every store update.
  const gameMode = useGameMode();
  const devToolsArmed = useGameStore((s) => s.devToolsArmed);
  const physicsPaused = gameMode === 'menu' || gameMode === 'intro';

  // Dynamic DPR scaling based on measured FPS + quality preset
  const dpr = useDynamicDPR({
    targetDpr: preset.dpr,
    lowFpsThreshold: 25,
    highFpsThreshold: 45,
    minDpr: preset.dpr[0],
    step: 0.1,
    windowMs: 2000,
  });

  // Auto-focus canvas on mount for keyboard events
  useEffect(() => {
    markCanvasMounted();
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
          shadows={preset.shadows}
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
              antialias: preset.antialias,
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
        <GltfPipelineInit />
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
          <Physics gravity={[0, -15, 0]} timeStep={1/60} interpolate={false} debug={false} paused={physicsPaused}>
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

            {/* Background ambient NPCs — lightweight, non-interactable, scene-populating */}
            <AmbientNPCs />

            {/* Wake-up cinematic sequence (intro only) */}
            <FrameBudgetRunner />

        <WakeUpSequence />

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

        {devToolsArmed && (
          <Suspense fallback={null}>
            <LazyFrameProfilerBridge />
          </Suspense>
        )}

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
  useFrameTick('player', () => {
    sharedPlayerRotationRef.current = livePlayerRotationRef.current;
  }, { label: 'RotationSync' });
  return null;
}

/** Per-canvas first-frame session — keyed by WebGL canvas element so the guard
 *  survives React Strict Mode child remounts (same canvas) but resets naturally
 *  when the Canvas is destroyed and a new element is created (error-boundary retry). */
type CanvasFirstFrameSession = { emitted: boolean; contextLost: boolean };
const canvasFirstFrameSessions = new WeakMap<HTMLCanvasElement, CanvasFirstFrameSession>();

function getCanvasFirstFrameSession(canvas: HTMLCanvasElement): CanvasFirstFrameSession {
  let session = canvasFirstFrameSessions.get(canvas);
  if (!session) {
    session = { emitted: false, contextLost: false };
    canvasFirstFrameSessions.set(canvas, session);
  }
  return session;
}

/** FIX (Code Review #6): Consolidated canvas guard system.
 *  Combines ToneMappingGuard, WebGLContextGuard, and CanvasFirstFrameSignal
 *  into a single component with one useFrame callback instead of three.
 *  This reduces the overhead of multiple per-frame hooks while preserving
 *  all the same functionality.
 *
 *  FIX (Code Review #11): first-frame emit is guarded by a per-canvas session
 *  flag so Strict Mode remounts and duplicate useFrame invocations cannot
 *  double-emit; the flag resets only on context loss or a new canvas element. */
function CanvasGuardSystem() {
  const gl = useThree((state) => state.gl);
  const toneMappingEnforced = useRef(false);

  // WebGL context loss handlers (attached to canvas element)
  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[CanvasGuard] WebGL context LOST — attempting recovery...');
      const session = canvasFirstFrameSessions.get(canvas);
      if (session) {
        session.emitted = false;
        session.contextLost = true;
      }
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

  // Single useFrame that handles all guard duties (priority 1 = after render)
  // Post-render guard — must stay on raw useFrame (priority 1, after draw)
  useFrame((state) => {
    const canvas = state.gl.domElement;
    if (!canvas) return;

    // ── Guard 1: Enforce NoToneMapping ──
    try {
      if (state.gl.toneMapping !== THREE.NoToneMapping) {
        state.gl.toneMapping = THREE.NoToneMapping;
      }
      toneMappingEnforced.current = true;
    } catch {
      // WebGL context lost or renderer disposed — ignore silently
    }

    // ── Guard 2: Emit first-frame signal (at most once per canvas session) ──
    const session = getCanvasFirstFrameSession(canvas);
    if (session.emitted) return;
    // Wait until the renderer has completed at least one draw call
    if (state.gl.info.render.frame < 1) return;

    session.emitted = true;
    markFirstFrame();
    if (session.contextLost) {
      console.log('[CanvasGuard] Re-signalling after context restore');
      session.contextLost = false;
    }
    eventBus.emit('canvas:first-frame', {});
  }, 1);

  return null;
}

/** FIX (Code Review #3): NPCSystemWrapper wrapped with React.memo and
 *  uses a single state object to reduce re-renders. Previously, every
 *  interaction:state_change event caused TWO setState calls (state + target),
 *  triggering two re-renders. Now batched into a single state update.
 *  Also wrapped with React.memo to prevent re-renders when parent re-renders
 *  but interaction state hasn't changed.
 *
 *  FIX (Code Review #10): Module-level interaction snapshot and NPCSystem props
 *  are derived via useMemo. livePlayerPositionRef stays a ref (mutable runtime
 *  position, not derived config). Scene/NPC roster updates remain in NPCSystem's
 *  own useMemo([sceneId, timeOfDay]). */

type InteractionSnapshot = {
  state: InteractionState;
  targetNPCId: string | null;
};

const NPCSystemWrapper = memo(function NPCSystemWrapper({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  // One-time read of module-level interaction store on mount (remount after
  // error-boundary retry also re-syncs). Empty deps — not re-derived on re-render.
  const initialInteraction = useMemo<InteractionSnapshot>(
    () => ({
      state: getInteractionState(),
      targetNPCId: getInteractionTargetNPCId(),
    }),
    [],
  );

  const [interaction, setInteraction] = useState<InteractionSnapshot>(initialInteraction);

  useEffect(() => {
    const unsub = eventBus.on('interaction:state_change', ({ state, npcId }) => {
      const targetNPCId =
        state === InteractionState.Idle ? null : (npcId ?? null);

      setInteraction((prev) => {
        if (prev.state === state && prev.targetNPCId === targetNPCId) {
          return prev;
        }
        return { state, targetNPCId };
      });
    });
    return unsub;
  }, []);

  const npcInteractionProps = useMemo(
    () => ({
      interactionState: interaction.state,
      interactionTargetNPCId: interaction.targetNPCId,
    }),
    [interaction.state, interaction.targetNPCId],
  );

  return (
    <NPCSystem
      livePlayerPositionRef={livePlayerPositionRef}
      interactionState={npcInteractionProps.interactionState}
      interactionTargetNPCId={npcInteractionProps.interactionTargetNPCId}
    />
  );
});
