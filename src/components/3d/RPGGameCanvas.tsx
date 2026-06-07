
/* ─── Volodka RPG – Main 3D Canvas ─── */

import { Suspense, lazy, useRef, useEffect, Component, Fragment, type ReactNode, type ErrorInfo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { usePostFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { devLog, devWarn } from '@/shared/utils/devLog';
import { SimplePlayer } from './SimplePlayer';
import { FollowCamera } from './FollowCamera';
import { ExplorationPostFX } from './ExplorationPostFX';
import { ExplorationLighting } from './Lighting';
import { SceneEnvironment } from './SceneEnvironment';
import { MatrixRain } from './MatrixRain';
import { GlitchEffect } from './GlitchEffect';
import { NoirOverlay } from './NoirOverlay';
import { WeatherController } from './WeatherController';
import { AtmosphericEffects } from './AtmosphericEffects';
import { VisualizationLayers } from './VisualizationLayers';
import { FrameBudgetRunner } from './FrameBudgetRunner';
import { PostFrameBudgetRunner } from './PostFrameBudgetRunner';
import { RotationSyncBridge } from './RotationSyncBridge';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useDynamicDPR } from '@/hooks/useDynamicDPR';
import { GltfPipelineInit } from './assets/GltfPipelineInit';
import { useVirtualControlsRef } from '@/engine/VirtualControlsState';
import { eventBus } from '@/engine/EventBus';
import { type VirtualControls } from '@/hooks/useGamePhysics';
import { useGameMode } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import {
  getCanvasFirstFrameSession,
  markCanvasFirstFrameEmitted,
  markCanvasFirstFrameSessionLost,
  registerCanvasForFirstFrame,
  unregisterCanvasForFirstFrame,
} from '@/engine/canvas/canvasFirstFrameSession';
import { markCanvasMounted, markFirstFrame } from '@/engine/performance/LoadingTimeline';

const LazyPhysicsSceneInner = lazy(() => import('./PhysicsSceneInner'));

const LazyFrameProfilerBridge = lazy(() =>
  import('./FrameProfilerBridge').then((m) => ({ default: m.FrameProfilerBridge })),
);

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
    devWarn('[PostFX] EffectComposer failed, disabling post-processing:', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing — post-processing is optional
      return null;
    }
    return this.props.children;
  }
}

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
    devWarn('[PhysicsErrorBoundary] Rapier physics failed, using SimplePlayer fallback:', error.message);
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
      devLog(`[RPGGameCanvas] Auto-retry ${nextCount}/${Canvas3DErrorBoundary.MAX_RETRIES}...`);
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

/** Fallback while Rapier WASM loads or after physics init failure. */
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
      <RotationSyncBridge livePlayerRotationRef={livePlayerRotationRef} />
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
          <Suspense
            fallback={
              <SimpleSceneFallback
                livePlayerPositionRef={livePlayerPositionRef}
                livePlayerRotationRef={livePlayerRotationRef}
                virtualControlsRef={virtualControlsRef}
              />
            }
          >
          <PhysicsErrorBoundary
            fallback={
              <SimpleSceneFallback
                livePlayerPositionRef={livePlayerPositionRef}
                livePlayerRotationRef={livePlayerRotationRef}
                virtualControlsRef={virtualControlsRef}
              />
            }
          >
          <LazyPhysicsSceneInner
            livePlayerPositionRef={livePlayerPositionRef}
            livePlayerRotationRef={livePlayerRotationRef}
            virtualControlsRef={virtualControlsRef}
            physicsPaused={physicsPaused}
          />
          </PhysicsErrorBoundary>
          </Suspense>
        </VisualizationLayers>

        <FrameBudgetRunner />
        <PostFrameBudgetRunner />

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

        {/* Post-render canvas guards (tone mapping, first-frame signal). */}
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

/** Post-render guards: NoToneMapping enforcement + canvas:first-frame emit. */
function CanvasGuardSystem() {
  const gl = useThree((state) => state.gl);
  const toneMappingEnforced = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    registerCanvasForFirstFrame(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      devWarn('[CanvasGuard] WebGL context LOST — attempting recovery...');
      markCanvasFirstFrameSessionLost(canvas);
      toneMappingEnforced.current = false;
      eventBus.emit('canvas:context-lost', {});
    };

    const handleContextRestored = () => {
      devLog('[CanvasGuard] WebGL context RESTORED');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      unregisterCanvasForFirstFrame(canvas);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  usePostFrameTick(
    'postfx',
    (ctx) => {
      const canvas = ctx.state.gl.domElement;
      if (!canvas) return;

      try {
        if (ctx.state.gl.toneMapping !== THREE.NoToneMapping) {
          ctx.state.gl.toneMapping = THREE.NoToneMapping;
        }
        toneMappingEnforced.current = true;
      } catch {
        // WebGL context lost or renderer disposed — ignore silently
      }

      const session = getCanvasFirstFrameSession(canvas);
      if (session.emitted) return;
      if (ctx.state.gl.info.render.frame < 1) return;

      const restored = session.contextLost;
      markCanvasFirstFrameEmitted(canvas);
      markFirstFrame();
      if (restored) {
        devLog('[CanvasGuard] Re-signalling after context restore');
      }
      eventBus.emit('canvas:first-frame', {});
    },
    { label: 'CanvasGuard', priority: 1 },
  );

  return null;
}
