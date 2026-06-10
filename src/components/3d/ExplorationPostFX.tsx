
/* ─── Volodka RPG – AAA Post-Processing Pipeline ───
 *  Dynamic bloom per scene, stress-reactive vignette, color grading, tone mapping
 *
 *  FIX: EffectComposer.addPass() accesses renderer.getContext().getContextAttributes().alpha
 *  which returns null if WebGL context isn't ready. We guard with useThree readiness check.
 *
 *  PERF: SSAO + DoF removed (~40% GPU savings). Bloom + Vignette are sufficient.
 */

import { useState, useEffect, useLayoutEffect, useRef, type ComponentProps } from 'react';
import { useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import type { EffectComposer as EffectComposerImpl } from 'postprocessing';
import { usePostFxSceneState, usePlayerStress } from '@/store/selectors';
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import { disposeEffectComposer, type PostprocessingComposerLike } from '@/engine/three/disposeThreeResources';

/** Per-scene color grading overrides for CyberPunk2077 / Noir / Gothic feel */
const SCENE_COLOR_GRADE: Record<string, { hue: number; saturation: number; brightness: number; contrast: number }> = {
  volodka_room:       { hue: -0.05, saturation: 0.2,  brightness: -0.02, contrast: 0.25 }, // cold green monitor glow
  volodka_corridor:   { hue: -0.03, saturation: -0.1, brightness: -0.05, contrast: 0.15 }, // dim noir
  home_evening:       { hue: 0.04,  saturation: 0.1,  brightness: 0.0,  contrast: 0.1  }, // warm amber
  street_night:       { hue: -0.02, saturation: 0.38, brightness: 0.05,  contrast: 0.24 }, // cooler cyberpunk neon
  street_winter:      { hue: -0.02, saturation: -0.12, brightness: 0.12, contrast: 0.08  },
  cafe_evening:       { hue: 0.03,  saturation: 0.1,  brightness: 0.0,  contrast: 0.15 }, // amber smoke
  office_day:         { hue: -0.01, saturation: -0.15, brightness: 0.03, contrast: 0.05 }, // sterile
  park_day:           { hue: -0.04, saturation: -0.1, brightness: 0.0,  contrast: 0.1  }, // gothic mist
  library_day:        { hue: 0.02,  saturation: -0.05, brightness: 0.0,  contrast: 0.1  }, // aged paper
  battle:             { hue: 0.08,  saturation: 0.2,  brightness: -0.05, contrast: 0.3  }, // intense combat
  sleep_dream:        { hue: 0.12,  saturation: 0.3,  brightness: -0.03, contrast: 0.15 }, // dark fantasy
  rooftop_edge:       { hue: 0.05,  saturation: 0.15, brightness: 0.0,  contrast: 0.2  }, // noir sunset
  abandoned_factory:  { hue: 0.06,  saturation: -0.05, brightness: -0.03, contrast: 0.2  }, // rust gothic
  zarema_albert_room: { hue: 0.02,  saturation: 0.05, brightness: 0.0,  contrast: 0.1  }, // warm domestic
  chk_forest_zorge:   { hue: 0.03,  saturation: 0.08, brightness: 0.02, contrast: 0.12 }, // campfire warmth
};

const DEFAULT_COLOR_GRADE = { hue: 0, saturation: 0, brightness: 0, contrast: 0.15 };

/** Scene-specific vignette darkness — noir scenes get heavier vignette */
const SCENE_VIGNETTE: Record<string, { offset: number; darkness: number }> = {
  volodka_room:       { offset: 0.3,  darkness: 0.5 },  // heavy noir vignette
  volodka_corridor:   { offset: 0.3,  darkness: 0.45 },
  home_evening:       { offset: 0.4,  darkness: 0.35 },
  street_night:       { offset: 0.42, darkness: 0.22 },
  cafe_evening:       { offset: 0.35, darkness: 0.35 },
  sleep_dream:        { offset: 0.25, darkness: 0.5 },
  abandoned_factory:  { offset: 0.3,  darkness: 0.45 },
  rooftop_edge:       { offset: 0.3,  darkness: 0.4 },
  battle:             { offset: 0.2,  darkness: 0.55 },
  office_day:         { offset: 0.4,  darkness: 0.3 },
  park_day:           { offset: 0.35, darkness: 0.35 },
  library_day:        { offset: 0.4,  darkness: 0.3 },
  street_winter:      { offset: 0.42, darkness: 0.2 },
  zarema_albert_room: { offset: 0.4,  darkness: 0.3 },
  chk_forest_zorge:   { offset: 0.4,  darkness: 0.28 },
};
const DEFAULT_VIGNETTE = { offset: 0.4, darkness: 0.32 };

/** Dynamic bloom intensity per scene — neon scenes bloom brighter */
const SCENE_BLOOM: Record<string, { intensity: number; threshold: number; smoothing: number }> = {
  volodka_room:       { intensity: 0.6,  threshold: 0.6,  smoothing: 0.5 },  // monitor glow bloom (tamed)
  volodka_corridor:   { intensity: 0.3,  threshold: 0.8,  smoothing: 0.6 },  // dim
  home_evening:       { intensity: 0.4,  threshold: 0.7,  smoothing: 0.5 },  // warm
  street_night:       { intensity: 1.0,  threshold: 0.38, smoothing: 0.32 }, // strong neon bloom
  cafe_evening:       { intensity: 0.5,  threshold: 0.6,  smoothing: 0.5 },  // neon bar + warm
  office_day:         { intensity: 0.2,  threshold: 0.85, smoothing: 0.6 },  // sterile
  park_day:           { intensity: 0.3,  threshold: 0.85, smoothing: 0.6 },  // natural
  library_day:        { intensity: 0.2,  threshold: 0.85, smoothing: 0.6 },  // quiet
  battle:             { intensity: 0.8,  threshold: 0.5,  smoothing: 0.4 },  // intense combat flash
  sleep_dream:        { intensity: 0.5,  threshold: 0.6,  smoothing: 0.5 },  // ethereal glow
  rooftop_edge:       { intensity: 0.5,  threshold: 0.6,  smoothing: 0.5 },  // sunset bloom
  abandoned_factory:  { intensity: 0.35, threshold: 0.7, smoothing: 0.55 },  // ember glow (lighter GPU load)
  street_winter:      { intensity: 0.3,  threshold: 0.8,  smoothing: 0.6 },  // cold
  zarema_albert_room: { intensity: 0.3,  threshold: 0.75, smoothing: 0.5 },  // warm domestic
  chk_forest_zorge:   { intensity: 0.45, threshold: 0.55, smoothing: 0.45 }, // campfire bloom
};
const DEFAULT_BLOOM = { intensity: 0.5, threshold: 0.7, smoothing: 0.5 };

/** Check if the WebGL renderer context is fully initialized.
 *  postprocessing v6.39 EffectComposer.addPass() calls
 *  `renderer.getContext().getContextAttributes().alpha` — this crashes if the
 *  context isn't ready (getContextAttributes() returns null).
 *
 *  Features:
 *  - Polling with exponential backoff (up to 10 attempts)
 *  - WebGL context-loss recovery (resets ready state on contextlost,
 *    re-checks on contextrestored)
 */
function useRendererReady(): boolean {
  const gl = useThree((state) => state.gl);
  const [ready, setReady] = useState(false);

  // FIX: Reset ready state when gl changes — prevents stale "true" from
  // a previous renderer instance. Without this, if the Canvas recreates the
  // WebGL renderer (HMR, mode change), ready stays true while the new gl's
  // context isn't initialized yet, causing EffectComposer to crash with
  // "Cannot read properties of null (reading 'alpha')".
  const prevGlRef = useRef(gl);
  // P3-FIX: Move ref access from render phase to useEffect to comply with
  // React strict mode rules (Cannot access/update ref during render).
  useEffect(() => {
    if (prevGlRef.current !== gl) {
      prevGlRef.current = gl;
      // React will re-render with ready=false, preventing the crash.
      setReady(false);
    }
  }, [gl]);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 10;
    const baseDelay = 50;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Reset ready on every new gl — use flushSync alternative:
    // schedule state reset via microtask to avoid cascading render warning.
    queueMicrotask(() => { if (!cancelled) setReady(false); });

    function check() {
      if (cancelled) return;

      try {
        const ctx = gl.getContext();
        const attrs = ctx?.getContextAttributes();
        if (ctx && attrs && attrs.alpha !== undefined) {
          if (!cancelled) setReady(true);
          return;
        }
      } catch {
        // Context not ready yet
      }

      attempt++;
      if (attempt < maxAttempts) {
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ...
        const delay = baseDelay * Math.pow(2, attempt - 1);
        retryTimer = setTimeout(check, delay);
      }
    }

    // Listen for WebGL context loss/restored events
    const canvas = gl.domElement;

    function handleContextLost() {
      if (!cancelled) {
        setReady(false);
      }
    }

    function handleContextRestored() {
      if (!cancelled) {
        // Reset and re-check
        attempt = 0;
        check();
      }
    }

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Start checking after first animation frame
    const rafId = requestAnimationFrame(check);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (retryTimer) clearTimeout(retryTimer);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return ready;
}

/** AAA Post-Processing: dynamic bloom, stress-reactive vignette,
 *  color grading (teal/orange CyberPunk2077), tone mapping
 *
 *  Wrapped in a double-readiness gate:
 *  1. useRendererReady() — async polling that confirms context is initialized
 *  2. Synchronous context check — prevents race condition if gl changes
 *     between the polling success and EffectComposer mount
 *
 *  This prevents the `null.alpha` crash in postprocessing's EffectComposer.addPass(). */
export function ExplorationPostFX() {
  const rendererReady = useRendererReady();

  // Synchronous double-check: even if useRendererReady says true,
  // verify the context is actually valid RIGHT NOW before mounting
  // EffectComposer. This catches the race condition where gl changes
  // but ready hasn't been reset yet.
  const gl = useThree((state) => state.gl);
  if (!rendererReady) return null;
  try {
    const ctx = gl.getContext();
    const attrs = ctx?.getContextAttributes();
    if (!ctx || !attrs || attrs.alpha === undefined) return null;
  } catch {
    return null;
  }

  return <PostFXPipeline />;
}

type ManagedComposerProps = ComponentProps<typeof EffectComposer> & {
  /** Scene / pipeline identity — remounts composer so RTs and passes are disposed. */
  remountKey: string;
  sceneId: string;
};

function useGlInstanceKey(): number {
  const gl = useThree((state) => state.gl);
  const prevGlRef = useRef(gl);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (prevGlRef.current !== gl) {
      prevGlRef.current = gl;
      setInstanceKey((key) => key + 1);
    }
  }, [gl]);

  return instanceKey;
}

/**
 * @react-three/postprocessing keeps EffectComposer in useMemo and does not call
 * dispose() when gl/camera/scene deps change. Keyed inner instance + layout
 * cleanup guarantees composer.dispose() (and pass RTs) are released.
 */
function ManagedEffectComposer({ remountKey, sceneId, children, ...props }: ManagedComposerProps) {
  const glInstanceKey = useGlInstanceKey();

  return (
    <EffectComposerInstance
      key={`${glInstanceKey}-${remountKey}`}
      sceneId={sceneId}
      {...props}
    >
      {children}
    </EffectComposerInstance>
  );
}

function EffectComposerInstance({
  sceneId,
  children,
  ...props
}: ComponentProps<typeof EffectComposer> & { sceneId: string }) {
  const gl = useThree((state) => state.gl);
  const composerRef = useRef<EffectComposerImpl | null>(null);

  // Dispose passes + composer before the next scene paints (sceneId / pipeline change).
  useLayoutEffect(() => {
    return () => {
      disposeEffectComposer(composerRef.current as PostprocessingComposerLike | null);
      composerRef.current = null;
    };
  }, [sceneId]);

  useEffect(() => {
    const canvas = gl.domElement;

    function handleContextLost(event: Event) {
      event.preventDefault();
      disposeEffectComposer(composerRef.current as PostprocessingComposerLike | null);
      composerRef.current = null;
    }

    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [gl]);

  return (
    <EffectComposer ref={composerRef} {...props}>
      {children}
    </EffectComposer>
  );
}

/** Inner component — all hooks called unconditionally (Rules of Hooks compliant) */
function PostFXPipeline() {
  const { sceneId, noirMode } = usePostFxSceneState();
  const { visualLite } = useMobileVisualPerf();

  // NOTE: Renderer toneMapping is set to NoToneMapping in RPGGameCanvas.tsx
  // to prevent double tone mapping with this EffectComposer's ToneMapping pass.

  // Scene-driven color grading
  const colorGrade = SCENE_COLOR_GRADE[sceneId] ?? DEFAULT_COLOR_GRADE;
  const vignetteParams = SCENE_VIGNETTE[sceneId] ?? DEFAULT_VIGNETTE;
  const bloomParams = SCENE_BLOOM[sceneId] ?? DEFAULT_BLOOM;

  // Noir mode: desaturate, boost contrast, darken vignette
  const effectiveSaturation = noirMode
    ? Math.min(colorGrade.saturation - 0.35, 0)
    : colorGrade.saturation;
  const effectiveContrast = Math.max(
    0,
    (noirMode ? colorGrade.contrast + 0.15 : colorGrade.contrast)
      - SCENE_VISIBILITY.postFxContrastReduction,
  );
  const effectiveVignetteDarkness = Math.min(
    (noirMode ? Math.min(vignetteParams.darkness + 0.15, 0.95) : vignetteParams.darkness)
      * SCENE_VISIBILITY.vignetteDarknessScale,
    0.75,
  );
  const effectiveBrightness =
    colorGrade.brightness + SCENE_VISIBILITY.postFxBrightnessLift;

  // Stress-driven effects: higher stress = heavier vignette
  const stress = usePlayerStress();
  const stressFactor = stress / 100; // 0-1

  // Dynamic bloom: boost slightly with stress for a "pressure" feel
  const effectiveBloomIntensity = bloomParams.intensity + stressFactor * 0.1;

  // Stress-reactive vignette: darkness increases with stress
  const stressVignetteDarkness = Math.min(
    effectiveVignetteDarkness + stressFactor * 0.12,
    0.75,
  );
  // Vignette offset shrinks with stress (tighter focus / tunnel vision)
  const stressVignetteOffset = Math.max(
    vignetteParams.offset - stressFactor * 0.15,
    0.1,
  );

  // ── Lite post-FX: mobile/low quality, or heavy scenes on any preset ──
  const useLitePostFx = visualLite || sceneId === 'abandoned_factory';
  const pipelineKey = `${sceneId}-${useLitePostFx ? 'lite' : 'full'}`;

  if (useLitePostFx) {
    const liteBloom = bloomParams.intensity * 0.75;
    const liteVignetteDarkness = Math.min(
      (vignetteParams.darkness + stressFactor * 0.08) * SCENE_VISIBILITY.vignetteDarknessScale,
      0.65,
    );
    return (
      <ManagedEffectComposer remountKey={pipelineKey} sceneId={sceneId} multisampling={0}>
        <Bloom
          intensity={liteBloom}
          luminanceThreshold={bloomParams.threshold}
          luminanceSmoothing={bloomParams.smoothing}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
        <Vignette
          offset={vignetteParams.offset}
          darkness={liteVignetteDarkness}
          blendFunction={BlendFunction.NORMAL}
        />
        <HueSaturation
          hue={colorGrade.hue}
          saturation={noirMode ? Math.min(colorGrade.saturation - 0.25, 0) : colorGrade.saturation * 0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <BrightnessContrast
          brightness={effectiveBrightness}
          contrast={effectiveContrast * 0.6}
          blendFunction={BlendFunction.NORMAL}
        />
        <ToneMapping
          mode={ToneMappingMode.ACES_FILMIC}
          exposure={SCENE_VISIBILITY.toneExposure}
        />
      </ManagedEffectComposer>
    );
  }

  return (
    <ManagedEffectComposer remountKey={pipelineKey} sceneId={sceneId} multisampling={0}>
      {/* ── Bloom — dynamic intensity per scene, stress-boosted ── */}
      <Bloom
        intensity={effectiveBloomIntensity}
        luminanceThreshold={bloomParams.threshold}
        luminanceSmoothing={bloomParams.smoothing}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />

      {/* ── Vignette — stress-reactive: darker + tighter at high stress ── */}
      <Vignette
        offset={stressVignetteOffset}
        darkness={stressVignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* ── Color Grading — teal/orange CyberPunk2077 look ── */}
      <HueSaturation
        hue={colorGrade.hue}
        saturation={effectiveSaturation}
        blendFunction={BlendFunction.NORMAL}
      />
      <BrightnessContrast
        brightness={effectiveBrightness}
        contrast={effectiveContrast}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* ── Tone Mapping — cinematic ACES with readability exposure ── */}
      <ToneMapping
        mode={ToneMappingMode.ACES_FILMIC}
        exposure={SCENE_VISIBILITY.toneExposure}
      />
    </ManagedEffectComposer>
  );
}
