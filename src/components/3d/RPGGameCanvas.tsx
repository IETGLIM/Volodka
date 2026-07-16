
/* ─── Volodka RPG – Main 3D Canvas ─── */

import { Suspense, lazy, useRef, useEffect, useState, memo, Component, Fragment, type ComponentProps, type ReactNode, type ErrorInfo } from 'react';
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
import { useUIStore } from '@/store/stores/uiStore';
import { useCutsceneStore } from '@/store/stores/cutsceneStore';
import { getGamePhase } from '@/shared/gamePhase';
import { useGameStore } from '@/store/gameStore';
import {
  getCanvasFirstFrameSession,
  claimCanvasFirstFrameEmit,
  markCanvasFirstFrameSessionLost,
  registerCanvasForFirstFrame,
  unregisterCanvasForFirstFrame,
} from '@/engine/canvas/canvasFirstFrameSession';
import { forceDisposeOrphanedWebGLResources } from '@/engine/canvas/canvasRendererRegistry';
import { adoptCanvasWebGlRenderer } from '@/engine/canvas/webGlRendererSingleton';
import { markCanvasMounted, markFirstFrame } from '@/engine/performance/LoadingTimeline';

const LazyPhysicsSceneInner = lazy(() =>
  import('./PhysicsSceneInner').then((m) => ({ default: m.PhysicsSceneInner })),
);

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

  componentDidCatch(error: Error, _info: ErrorInfo) {
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

  componentDidCatch(error: Error, _info: ErrorInfo) {
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
    forceDisposeOrphanedWebGLResources('canvas3d-error-boundary');

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
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.4)',
              background: 'rgb(var(--cyber-cyan-rgb) / 0.1)',
              color: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
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

/** Stable camera config — inline objects on `<Canvas>` recreate the default camera each render. */
const EXPLORATION_CAMERA = {
  fov: 55,
  near: 0.2,
  far: 200,
  position: [0, 2.8, 2.5] as [number, number, number],
};

type CanvasGlProp = NonNullable<ComponentProps<typeof Canvas>['gl']>;

/** Cached renderer factories keyed by antialias — R3F recreates WebGLRenderer when `gl` identity changes. */
const webGlRendererFactoryCache = new Map<boolean, CanvasGlProp>();

function getWebGlRendererFactory(antialias: boolean): CanvasGlProp {
  let factory = webGlRendererFactoryCache.get(antialias);
  if (!factory) {
    const created = ({ canvas }: { canvas: HTMLCanvasElement }) => {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias,
        stencil: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 1);
      return adoptCanvasWebGlRenderer(renderer);
    };
    factory = created as CanvasGlProp;
    webGlRendererFactoryCache.set(antialias, factory);
  }
  return factory;
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
export function RPGGameCanvas({ focusable = true }: { focusable?: boolean } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const livePlayerPositionRef = useRef(new THREE.Vector3(0, 0.01, -1.0));
  const livePlayerRotationRef = useRef(Math.PI);
  const virtualControlsRef = useVirtualControlsRef();

  const { preset } = useGraphicsQuality();

  // P3-FIX: Pause physics when game is in menu/intro mode to save CPU.
  // Read directly from slice stores — the facade flush uses RAF which
  // doesn't fire under 'demand' frameloop (chicken-and-egg problem).
  const mainMenuOpen = useUIStore((s) => s.mainMenuOpen);
  const introActive = useUIStore((s) => s.introActive);
  const combatActive = useUIStore((s) => s.combatActive);
  const activeCutsceneId = useCutsceneStore((s) => s.activeCutsceneId);
  const showStoryOverlay = useUIStore((s) => s.showStoryOverlay);
  const gameMode = getGamePhase({ mainMenuOpen, introActive, combatActive, activeCutsceneId });
  const physicsPaused = gameMode === 'menu' || gameMode === 'intro';
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  // Use 'demand' frameloop when:
  // - In menu/intro (no 3D world to render)
  // - Tab not visible (background tab — browser throttles anyway)
  // - Story overlay is open AND no cutscene (3D scene is static behind dialogue)
  // The story-overlay 'demand' mode saves CPU, but CanvasFrameloopController
  // must call invalidate() when showStoryOverlay changes to ensure the scene
  // renders at least once before the loop pauses.
  const isStaticScreen = showStoryOverlay && !activeCutsceneId;
  const canvasFrameloop = (physicsPaused || !tabVisible || isStaticScreen) ? 'demand' : 'always';

  useEffect(() => {
    const onVisibilityChange = () => {
      setTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

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
    if (focusable && containerRef.current) {
      containerRef.current.focus();
    }
  }, [focusable]);

  useEffect(() => {
    if (focusable) return;
    const container = containerRef.current;
    if (container?.contains(document.activeElement)) {
      container.blur();
    }
  }, [focusable]);

  // Props passed directly to fallback components — these are already stable refs
  // so no intermediate useRef wrapper is needed (avoids "Cannot access refs during render").

  // Note: InteractionSystemBridge reads the player rigid body directly via
  // getPlayerRigidBody() from PlayerRigidBodyState — no polling needed.
  // PhysicsPlayer writes to the shared state on mount.

  return (
    <div
      ref={containerRef}
      tabIndex={focusable ? 0 : -1}
      data-game-canvas=""
      role="application"
      aria-label="Игровой мир Володьки — исследование от первого лица"
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
        <RPGGameCanvasShell
          frameloop={canvasFrameloop}
          dpr={dpr}
          shadows={preset.shadows}
          antialias={preset.antialias}
          idle={physicsPaused || !tabVisible}
          livePlayerPositionRef={livePlayerPositionRef}
          livePlayerRotationRef={livePlayerRotationRef}
          virtualControlsRef={virtualControlsRef}
        />
      </Canvas3DErrorBoundary>

      {/* ── Visual overlays (CSS-based, outside Canvas for performance) ── */}
      <MatrixRain />
      <GlitchEffect />
      <NoirOverlay />

      {/* Mobile virtual controls are handled by ExplorationMobileHud in GameOrchestrator */}
    </div>
  );
}

type RPGGameCanvasShellProps = {
  frameloop: 'always' | 'demand';
  dpr: [number, number];
  shadows: boolean;
  antialias: boolean;
  idle: boolean;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef: React.MutableRefObject<VirtualControls>;
};

/**
 * Memoized R3F shell — Canvas props (especially `gl`) must stay referentially stable
 * across unrelated store updates or R3F allocates a new WebGLRenderer each render.
 */
const RPGGameCanvasShell = memo(function RPGGameCanvasShell({
  frameloop,
  dpr,
  shadows,
  antialias,
  idle,
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
}: RPGGameCanvasShellProps) {
  return (
    <Canvas
      flat
      frameloop={frameloop}
      dpr={dpr}
      camera={EXPLORATION_CAMERA}
      shadows={shadows}
      gl={getWebGlRendererFactory(antialias)}
      style={{ background: '#000' }}
    >
      <RPGGameCanvasScene
        idle={idle}
        livePlayerPositionRef={livePlayerPositionRef}
        livePlayerRotationRef={livePlayerRotationRef}
        virtualControlsRef={virtualControlsRef}
      />
    </Canvas>
  );
});

function RPGGameCanvasScene({
  idle,
  livePlayerPositionRef,
  livePlayerRotationRef,
  virtualControlsRef,
}: Omit<RPGGameCanvasShellProps, 'frameloop' | 'dpr' | 'shadows' | 'antialias'>) {
  const gameMode = getGamePhase({ mainMenuOpen: useUIStore((s) => s.mainMenuOpen), introActive: useUIStore((s) => s.introActive), combatActive: useUIStore((s) => s.combatActive), activeCutsceneId: useCutsceneStore((s) => s.activeCutsceneId) });
  const devToolsArmed = useGameStore((s) => s.devToolsArmed);
  const physicsPaused = gameMode === 'menu' || gameMode === 'intro';

  return (
    <>
      <GltfPipelineInit />
      <CanvasFrameloopController idle={idle} />
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

      <WeatherController />

      {!physicsPaused && <AtmosphericEffects />}

      {!physicsPaused && (
        <PostFXErrorBoundary>
          <ExplorationPostFX />
        </PostFXErrorBoundary>
      )}

      {devToolsArmed && (
        <Suspense fallback={null}>
          <LazyFrameProfilerBridge />
        </Suspense>
      )}

      <CanvasGuardSystem />
    </>
  );
}

/** Kick the render loop on mount, when leaving idle mode, or when the tab becomes visible.
 *  Also invalidates when story overlay opens/closes and on scene transitions to
 *  ensure the 3D scene renders at least once before the 'demand' frameloop pauses. */
function CanvasFrameloopController({ idle }: { idle: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  // Subscribe to story overlay state so we can invalidate when it changes.
  const showStoryOverlay = useUIStore((s) => s.showStoryOverlay);
  const activeCutsceneId = useCutsceneStore((s) => s.activeCutsceneId);
  const isStaticScreen = showStoryOverlay && !activeCutsceneId;

  useEffect(() => {
    // Demand frameloop does not paint until invalidated — required for canvas:first-frame
    // during intro/menu boot while the loading pipeline waits at canvas_init (82%).
    invalidate();
  }, [idle, invalidate]);

  // Invalidate when story overlay state changes — ensures the 3D scene renders
  // before the 'demand' loop pauses (story overlay open) or resumes (overlay close).
  useEffect(() => {
    invalidate();
  }, [isStaticScreen, invalidate]);

  // Invalidate on scene transitions — breaks the circular dependency between
  // scene:loaded (needs canvas:first-frame) and canvas:first-frame (needs render)
  // and canvas:first-frame (needs invalidate). By invalidating on scene:enter
  // (which fires BEFORE scene:loaded), we kick the render loop early so
  // canvas:first-frame can fire, which then emits scene:loaded.
  useEffect(() => {
    const unsubs = [
      eventBus.on('scene:transition_start', () => {
        invalidate();
        requestAnimationFrame(() => invalidate());
      }),
      eventBus.on('scene:enter', () => {
        invalidate();
        requestAnimationFrame(() => invalidate());
      }),
      eventBus.on('scene:loaded', () => {
        invalidate();
        requestAnimationFrame(() => invalidate());
      }),
      // CRITICAL: sceneLoadedGate retries call invalidateCanvasFirstFrame()
      // which emits this event. Without a listener, those retries are silently
      // lost and the watchdog always times out on slow devices.
      eventBus.on('canvas:invalidate-first-frame', () => {
        invalidate();
        requestAnimationFrame(() => invalidate());
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [invalidate]);

  // Safety net: invalidate a few times on mount to ensure the first frame renders.
  useEffect(() => {
    const intervals = [100, 500, 1500];
    const timers = intervals.map((ms) => setTimeout(() => invalidate(), ms));
    return () => timers.forEach(clearTimeout);
  }, [invalidate]);

  return null;
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
      
      // Force disposal of any orphaned GPU resources before rebuild
      try {
        forceDisposeOrphanedWebGLResources('context-restored');
      } catch (e) {
        devWarn('[CanvasGuard] Error disposing orphaned resources:', e);
      }
      
      // Notify engine systems so module-level GPU resource caches (materials,
      // geometries, textures) can rebuild. R3F re-renders the scene tree
      // automatically, but module-level singletons need a nudge to drop
      // references to now-invalid GL objects.
      eventBus.emit('canvas:context-restored', {});
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
        if (ctx.state.gl.outputColorSpace !== THREE.SRGBColorSpace) {
          ctx.state.gl.outputColorSpace = THREE.SRGBColorSpace;
        }
        toneMappingEnforced.current = true;
      } catch {
        // WebGL context lost or renderer disposed — ignore silently
      }

      const session = getCanvasFirstFrameSession(canvas);
      if (ctx.state.gl.info.render.frame < 1) return;

      const restored = session.contextLost;
      const generation = claimCanvasFirstFrameEmit(canvas);
      if (generation === null) return;

      markFirstFrame();
      if (restored) {
        devLog('[CanvasGuard] Re-signalling after context restore');
      }
      eventBus.emit('canvas:first-frame', { generation });
    },
    { label: 'CanvasGuard', priority: 1 },
  );

  return null;
}
