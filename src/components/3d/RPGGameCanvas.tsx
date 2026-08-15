
/* ─── Volodka RPG – Main 3D Canvas ─── */

import { Suspense, lazy, useRef, useEffect, useState, memo, Component, Fragment, type ComponentProps, type ReactNode, type ErrorInfo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { usePostFrameTick } from '@/engine/frame/useFrameTick';
import { ACESFilmicToneMapping, NoToneMapping, PCFSoftShadowMap, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
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
import { RainEffect } from './RainEffect';
import { AtmosphericEffects } from './AtmosphericEffects';
import { AtmosphericDust } from './AtmosphericDust';
import { VolumetricLightRays } from './VolumetricLightRays';
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
import { isPostfxActive } from '@/engine/graphics/postfxActiveState';
import { SCENE_OVERLAY_MS } from '@/shared/constants/transitionTimings';

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

type TransitionVeilPhase = 'hidden' | 'fadeOut' | 'hold' | 'reveal';

function SceneTransitionVeil() {
  const [phase, setPhase] = useState<TransitionVeilPhase>('hidden');
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const clearTimers = () => {
      for (const timer of timersRef.current) clearTimeout(timer);
      timersRef.current = [];
    };

    const unsubStart = eventBus.on('scene:transition_start', () => {
      clearTimers();
      setPhase('fadeOut');
      timersRef.current.push(setTimeout(() => setPhase('hold'), SCENE_OVERLAY_MS.WIPE_IN));
    });
    const unsubLoaded = eventBus.on('scene:loaded', () => {
      clearTimers();
      // Hold beat before reveal — lets camera rail + first frame settle (avoids hard pop).
      timersRef.current.push(setTimeout(() => setPhase('reveal'), SCENE_OVERLAY_MS.HOLD));
      timersRef.current.push(
        setTimeout(() => setPhase('hidden'), SCENE_OVERLAY_MS.HOLD + SCENE_OVERLAY_MS.REVEAL),
      );
    });
    const unsubFailed = eventBus.on('scene:transition_failed', () => {
      clearTimers();
      setPhase('reveal');
      timersRef.current.push(setTimeout(() => setPhase('hidden'), SCENE_OVERLAY_MS.REVEAL));
    });

    return () => {
      unsubStart();
      unsubLoaded();
      unsubFailed();
      clearTimers();
    };
  }, []);

  if (phase === 'hidden') return null;

  const opacity = phase === 'reveal' ? 0 : 1;
  const duration =
    phase === 'reveal'
      ? SCENE_OVERLAY_MS.REVEAL
      : phase === 'hold'
        ? SCENE_OVERLAY_MS.HOLD
        : SCENE_OVERLAY_MS.WIPE_IN;

  // AAA cinematic veil — softer, more luxurious filmic radial + subtle vignette for smooth no-cut feeling
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(
            circle at 50% 42%,
            rgba(16,18,28,0.96) 0%,
            rgba(6,8,14,0.985) 58%,
            rgba(0,0,0,0.995) 78%,
            #000000 100%
          )
        `,
        opacity,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        zIndex: 5,
      }}
    />
  );
}

type CanvasGlProp = NonNullable<ComponentProps<typeof Canvas>['gl']>;

/** Cached renderer factories keyed by antialias — R3F recreates WebGLRenderer when `gl` identity changes. */
const webGlRendererFactoryCache = new Map<boolean, CanvasGlProp>();

function getWebGlRendererFactory(antialias: boolean): CanvasGlProp {
  let factory = webGlRendererFactoryCache.get(antialias);
  if (!factory) {
    const created = ({ canvas }: { canvas: HTMLCanvasElement }) => {
      const renderer = new WebGLRenderer({
        canvas,
        antialias,
        stencil: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      // PCFSoftShadowMap reduces shadow aliasing artifacts for a noir/cinematic aesthetic
      renderer.shadowMap.type = PCFSoftShadowMap;
      // Default to ACESFilmic — when ExplorationPostFX's EffectComposer is
      // active, the post-frame guard below flips this to NoToneMapping
      // (the composer applies ACES as a pass to avoid double tone curve).
      // When postfx is OFF (user disabled, low preset, or menu), the guard
      // keeps ACESFilmic so the renderer applies the curve directly.
      // Starting from ACESFilmic avoids a 1-frame NoToneMapping flash on
      // first render before the guard runs.
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = SRGBColorSpace;
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
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  virtualControlsRef: React.MutableRefObject<VirtualControls>;
}) {
  return (
    <group>
      {/* Basic floor for visibility — at y=0.01 matching CuboidCollider top */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.95} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
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
      <RotationSyncBridge
        livePlayerRotationRef={livePlayerRotationRef}
        livePlayerPositionRef={livePlayerPositionRef}
      />
      <ExplorationLighting />
      <SceneEnvironment />
    </group>
  );
}

/** Main 3D canvas for the RPG exploration mode */
export function RPGGameCanvas({ focusable = true }: { focusable?: boolean } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const livePlayerPositionRef = useRef(new Vector3(0, 0.01, -1.0));
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

      <SceneTransitionVeil />

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
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
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
      <CanvasViewportSync />
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
      <QualityGatedRainEffect />
      <QualityGatedVolumetricLightRays />

      {!physicsPaused && <AtmosphericEffects />}
      {!physicsPaused && <AtmosphericDust />}

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

/** Geometry-based volumetric light rays — quality-gated to high/ultra.
 *  Complements the existing VolumetricLightShafts (custom shader) with
 *  simpler transparent cone meshes for wider scene coverage. */
function QualityGatedVolumetricLightRays() {
  const { preset } = useGraphicsQuality();
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  // Skip on low/medium quality — self-gated inside VolumetricLightRays too,
  // but early exit avoids hook invocation overhead
  if (preset.id === 'low' || preset.id === 'medium') return null;
  // The component internally checks both preset.id and selectedPreset
  return <VolumetricLightRays sceneId={sceneId} />;
}

/** GPU-efficient 3D rain (Points/ShaderMaterial) — quality-gated to medium+.
 *  Complements the existing RainSystem with a denser, more atmospheric layer.
 *  Reads weather state from explorationStore (fade in/out based on rainIntensity). */
function QualityGatedRainEffect() {
  const { preset } = useGraphicsQuality();
  // Skip on low quality — the basic RainSystem sprite rain is already sufficient
  if (preset.id === 'low') return null;
  // Scale density with quality tier
  const density = preset.id === 'ultra' ? 4500 : preset.id === 'high' ? 3000 : 2000;
  return <RainEffect density={density} />;
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

  // Keep-alive: while the frameloop is in 'demand' mode (story overlay open,
  // menu, intro, or tab hidden), periodically invalidate so the 3D scene
  // doesn't freeze permanently if a state change fails to invalidate. Without
  // this, a stuck showStoryOverlay=true would leave physics, camera, and input
  // frozen indefinitely. (Task 5-A #4.)
  useEffect(() => {
    if (!isStaticScreen && !idle) return;
    const interval = setInterval(() => {
      invalidate();
    }, 2000);
    return () => clearInterval(interval);
  }, [isStaticScreen, idle, invalidate]);

  return null;
}

/**
 * R3F's ResizeObserver remains the primary size owner. Mobile browsers can,
 * however, update the visual viewport without promptly notifying the observed
 * container. Re-read the canvas box on those signals and only call setSize when
 * R3F's state is actually stale; demand mode is explicitly invalidated.
 */
function CanvasViewportSync() {
  const gl = useThree((state) => state.gl);
  const get = useThree((state) => state.get);
  const setSize = useThree((state) => state.setSize);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let rafId: number | null = null;

    const sync = () => {
      rafId = null;
      const rect = gl.domElement.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const current = get().size;

      if (
        Math.abs(current.width - width) >= 1
        || Math.abs(current.height - height) >= 1
        || Math.abs(current.top - rect.top) >= 1
        || Math.abs(current.left - rect.left) >= 1
      ) {
        setSize(width, height, rect.top, rect.left);
      }
      invalidate();
    };

    const scheduleSync = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(sync);
    };

    scheduleSync();
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('orientationchange', scheduleSync);
    window.visualViewport?.addEventListener('resize', scheduleSync);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('orientationchange', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
    };
  }, [get, gl, invalidate, setSize]);

  return null;
}

/** Post-render guards: NoToneMapping enforcement + canvas:first-frame emit. */
function CanvasGuardSystem() {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const toneMappingEnforced = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;
    let restoreRafId: number | null = null;

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

      // This renderer is still owned by the live R3F root. Three.js restores
      // its internal GL state automatically; disposing it here destroys the
      // active scene and singleton renderer instead of recovering it.
      try {
        gl.resetState();
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = isPostfxActive()
          ? NoToneMapping
          : ACESFilmicToneMapping;
      } catch (e) {
        devWarn('[CanvasGuard] Error resetting restored renderer state:', e);
      }

      toneMappingEnforced.current = false;
      eventBus.emit('canvas:context-restored', {});
      invalidate();
      if (restoreRafId !== null) cancelAnimationFrame(restoreRafId);
      restoreRafId = requestAnimationFrame(() => {
        restoreRafId = null;
        invalidate();
      });
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      if (restoreRafId !== null) cancelAnimationFrame(restoreRafId);
      unregisterCanvasForFirstFrame(canvas);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, invalidate]);

  usePostFrameTick(
    'postfx',
    (ctx) => {
      const canvas = ctx.state.gl.domElement;
      if (!canvas) return;

      try {
        // When postfx is active, the EffectComposer applies ACESFilmic as a
        // pass — renderer must be NoToneMapping to avoid double tone curve.
        // When postfx is OFF, the renderer must apply ACESFilmic directly,
        // otherwise the scene renders with no tone curve → clipped highlights
        // and crushed darks. This was a P0 bug: postfx-off users saw a
        // harsh, flat image with blown-out skies and lose shadow detail.
        const desiredToneMapping = isPostfxActive()
          ? NoToneMapping
          : ACESFilmicToneMapping;
        if (ctx.state.gl.toneMapping !== desiredToneMapping) {
          ctx.state.gl.toneMapping = desiredToneMapping;
        }
        if (ctx.state.gl.outputColorSpace !== SRGBColorSpace) {
          ctx.state.gl.outputColorSpace = SRGBColorSpace;
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
