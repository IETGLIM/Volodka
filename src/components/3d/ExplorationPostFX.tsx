/* ─── Volodka RPG – AAA Post-Processing Pipeline ───
 *  Dynamic bloom per scene, stress-reactive vignette, color grading, tone mapping
 *  Session 9: Added cinematic DOF for dialogue/cutscene moments
 *
 *  FIX: EffectComposer.addPass() accesses renderer.getContext().getContextAttributes().alpha
 *  which returns null if WebGL context isn't ready. We guard with useThree readiness check.
 *
 *  PERF: SSAO removed. DOF only active during dialogue/cutscene (~0% GPU in exploration).
 */

import { useState, useEffect, useLayoutEffect, useRef, useMemo, type ComponentProps } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  HueSaturation,
  BrightnessContrast,
  ToneMapping,
  N8AO,
  LUT,
  ChromaticAberration,
  Scanline,
  Noise,
  DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import type { EffectComposer as EffectComposerImpl, DepthOfFieldEffect } from 'postprocessing';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { dialogueFocusTarget } from '@/engine/graphics/dialogueFocusTarget';
import { usePostFxSceneState, usePlayerStress, useGamePhase } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { resolvePoemTTLPostFxBoost } from '@/engine/poemWorld/poemPostFxBoost';
import { useMobileVisualPerf, useIsMobileVisual } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { isPostProcessingEnabled } from '@/engine/graphics/qualityPresets';
import { useVisualSettings } from '@/hooks/useVisualSettings';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import { resolveSceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import { disposeEffectComposer, type PostprocessingComposerLike } from '@/engine/three/disposeThreeResources';
import { setPostfxActive } from '@/engine/graphics/postfxActiveState';
import {
  getCachedProceduralLut3DTexture,
  resolveProceduralLutKind,
} from '@/engine/graphics/proceduralLutTextures';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { SceneId } from '@/shared/types/game';

/** Per-scene color grading overrides for CyberPunk2077 / Noir / Gothic feel */
const SCENE_COLOR_GRADE: Record<string, { hue: number; saturation: number; brightness: number; contrast: number }> = {
  volodka_room:       { hue: -0.08, saturation: 0.15, brightness: 0.04, contrast: 0.28 }, // matrix monitor glow
  volodka_corridor:   { hue: -0.05, saturation: -0.15, brightness: 0.01, contrast: 0.22 }, // oppressive noir
  home_evening:       { hue: 0.06,  saturation: 0.16, brightness: 0.02, contrast: 0.14 }, // warm amber mood
  street_night:       { hue: 0.08,  saturation: 0.22, brightness: 0.05, contrast: 0.35 }, // synthwave neon rain
  street_winter:      { hue: -0.02, saturation: -0.12, brightness: 0.12, contrast: 0.08  },
  cafe_evening:       { hue: 0.06,  saturation: 0.20, brightness: 0.02, contrast: 0.16 }, // hazy blue-neon café
  office_day:         { hue: -0.02, saturation: -0.12, brightness: 0.04, contrast: 0.08 }, // sterile overcast
  park_day:           { hue: -0.02, saturation: 0.02, brightness: 0.06, contrast: 0.14 }, // gothic haze
  library_day:        { hue: 0.03,  saturation: 0.06, brightness: 0.02, contrast: 0.12 }, // dusty amber reading light
  battle:             { hue: 0.08,  saturation: 0.2,  brightness: -0.05, contrast: 0.35 }, // intense combat
  sleep_dream:        { hue: 0.22,  saturation: 0.55, brightness: 0.06, contrast: 0.18 }, // galaxy dream grade
  rooftop_edge:       { hue: 0.07,  saturation: 0.20, brightness: 0.06, contrast: 0.22 }, // galaxy sunset noir
  abandoned_factory:  { hue: 0.06,  saturation: -0.03, brightness: 0.02, contrast: 0.16 },
  factory_basement:   { hue: -0.04, saturation: -0.05, brightness: 0.0,  contrast: 0.2 },
  zarema_albert_room: { hue: 0.02,  saturation: 0.05, brightness: 0.03, contrast: 0.08 },
  solnysh_room:       { hue: 0.05,  saturation: 0.12, brightness: 0.02, contrast: 0.1  }, // warm cozy carpets
  chk_forest_zorge:   { hue: 0.03,  saturation: 0.08, brightness: 0.05, contrast: 0.1 }, // campfire warmth
  river_pier:         { hue: 0.04,  saturation: 0.1,  brightness: 0.04, contrast: 0.12 }, // warm fire vs cold water
  pier_evening:       { hue: 0.05,  saturation: 0.12, brightness: 0.02, contrast: 0.14 }, // amber pier dusk
  chk_campfire_night: { hue: 0.05,  saturation: 0.14, brightness: 0.03, contrast: 0.14 }, // fire-lit noir
  factory_roof:       { hue: 0.02,  saturation: -0.04, brightness: 0.03, contrast: 0.16 }, // industrial dusk
  city_square:        { hue: -0.02, saturation: 0.08, brightness: 0.02, contrast: 0.16 }, // cool plaza neon
  underground_bunker: { hue: -0.06, saturation: -0.02, brightness: -0.02, contrast: 0.22 }, // resistance green CRT
};

const DEFAULT_COLOR_GRADE = { hue: 0, saturation: 0, brightness: 0, contrast: 0.15 };

/** Indoor scenes that get subtle film grain for cinematic feel (high/ultra) */
const NOISE_SCENES = new Set([
  'volodka_room', 'volodka_corridor', 'home_evening', 'library_day',
  'factory_basement', 'zarema_albert_room', 'solnysh_room',
  'guild_mainframe', 'albert_backroom', 'zarema_room',
  'library_basement', 'underground_bunker', 'sleep_dream',
]);

/** Scenes that get CRT scanline overlay for cyberpunk terminal aesthetic */
const SCANLINE_SCENES = new Set(['guild_mainframe', 'office_day']);

/** Scene-specific vignette darkness — noir scenes get heavier vignette */
const SCENE_VIGNETTE: Record<string, { offset: number; darkness: number }> = {
  volodka_room:       { offset: 0.32, darkness: 0.42 },
  volodka_corridor:   { offset: 0.28, darkness: 0.40 },
  home_evening:       { offset: 0.4,  darkness: 0.35 },
  street_night:       { offset: 0.4,  darkness: 0.3 },
  cafe_evening:       { offset: 0.34, darkness: 0.36 },
  sleep_dream:        { offset: 0.25, darkness: 0.42 },
  abandoned_factory:  { offset: 0.32, darkness: 0.36 },
  rooftop_edge:       { offset: 0.3,  darkness: 0.32 },
  battle:             { offset: 0.2,  darkness: 0.6 },
  office_day:         { offset: 0.4,  darkness: 0.3 },
  park_day:           { offset: 0.35, darkness: 0.35 },
  library_day:        { offset: 0.4,  darkness: 0.3 },
  street_winter:      { offset: 0.44, darkness: 0.18 },
  zarema_albert_room: { offset: 0.4,  darkness: 0.3 },
  solnysh_room:       { offset: 0.42, darkness: 0.28 },
  chk_forest_zorge:   { offset: 0.4,  darkness: 0.28 },
  factory_basement:   { offset: 0.3,  darkness: 0.38 },
  river_pier:         { offset: 0.4,  darkness: 0.26 },
  pier_evening:       { offset: 0.38, darkness: 0.3 },
  chk_campfire_night: { offset: 0.36, darkness: 0.34 },
  factory_roof:       { offset: 0.34, darkness: 0.3 },
  city_square:        { offset: 0.38, darkness: 0.28 },
  underground_bunker: { offset: 0.28, darkness: 0.4 },
  guild_mainframe:    { offset: 0.3,  darkness: 0.36 },
  albert_backroom:    { offset: 0.36, darkness: 0.32 },
  zarema_room:        { offset: 0.38, darkness: 0.3 },
  library_basement:   { offset: 0.3,  darkness: 0.4 },
};
const DEFAULT_VIGNETTE = { offset: 0.4, darkness: 0.32 };

/** Dynamic bloom intensity per scene — neon scenes bloom brighter */
const SCENE_BLOOM: Record<string, { intensity: number; threshold: number; smoothing: number }> = {
  volodka_room:       { intensity: 0.78, threshold: 0.45, smoothing: 0.45 }, // monitor glow bloom
  volodka_corridor:   { intensity: 0.35, threshold: 0.72, smoothing: 0.55 }, // dim corridor haze
  home_evening:       { intensity: 0.48, threshold: 0.66, smoothing: 0.48 },  // warm lamp bloom
  street_night:       { intensity: 0.83, threshold: 0.45, smoothing: 0.44 }, // wet neon reflections
  cafe_evening:       { intensity: 0.75, threshold: 0.45, smoothing: 0.41 }, // blue neon bar glow
  office_day:         { intensity: 0.28, threshold: 0.82, smoothing: 0.58 }, // fluorescent spill
  park_day:           { intensity: 0.42, threshold: 0.74, smoothing: 0.52 },
  library_day:        { intensity: 0.32, threshold: 0.78, smoothing: 0.55 },  // banker-lamp glow
  battle:             { intensity: 0.9,  threshold: 0.5,  smoothing: 0.4 },  // intense combat flash
  sleep_dream:        { intensity: 0.68, threshold: 0.52, smoothing: 0.44 }, // galaxy ethereal glow
  rooftop_edge:       { intensity: 0.58, threshold: 0.54, smoothing: 0.46 }, // galaxy sunset bloom
  abandoned_factory:  { intensity: 0.35, threshold: 0.7, smoothing: 0.55 },  // ember glow (lighter GPU load)
  street_winter:      { intensity: 0.3,  threshold: 0.8, smoothing: 0.6 },  // cold
  zarema_albert_room: { intensity: 0.35, threshold: 0.72, smoothing: 0.5 },  // warm domestic lamp glow
  solnysh_room:       { intensity: 0.38, threshold: 0.68, smoothing: 0.48 }, // warm lamp glow
  chk_forest_zorge:   { intensity: 0.45, threshold: 0.55, smoothing: 0.45 }, // campfire bloom
  factory_basement:   { intensity: 0.55, threshold: 0.5,  smoothing: 0.45 }, // Заря-М core glow
  river_pier:         { intensity: 0.5,  threshold: 0.55, smoothing: 0.45 }, // fire + string lights
  pier_evening:       { intensity: 0.55, threshold: 0.52, smoothing: 0.44 }, // evening pier neon
  chk_campfire_night: { intensity: 0.62, threshold: 0.48, smoothing: 0.42 }, // fire bloom
  factory_roof:       { intensity: 0.4,  threshold: 0.62, smoothing: 0.5 },  // dusk skyline
  city_square:        { intensity: 0.72, threshold: 0.48, smoothing: 0.44 }, // plaza neon spill
  underground_bunker: { intensity: 0.48, threshold: 0.55, smoothing: 0.46 }, // resistance CRT glow
  guild_mainframe:    { intensity: 0.6,  threshold: 0.5,  smoothing: 0.42 }, // server rack bloom
};
const DEFAULT_BLOOM = { intensity: 0.5, threshold: 0.7, smoothing: 0.5 };

/** DOF focus distance for dialogue — third-person camera ~3m from subject */
const DOF_DIALOGUE_FOCUS = 0.0;    // focus at camera depth (near subject)
const DOF_DIALOGUE_BOKEH = 3;      // how many meters of depth are blurred
const DOF_CUTSCENE_BOKEH = 2.5;

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
 *  color grading (teal/orange CyberPunk2077), tone mapping, cinematic DOF
 *
 *  Wrapped in a double-readiness gate:
 *  1. useRendererReady() — async polling that confirms context is initialized
 *  2. Synchronous context check — prevents race condition if gl changes
 *     between the polling success and EffectComposer mount
 *
 *  This prevents the `null.alpha` crash in postprocessing's EffectComposer.addPass(). */
export function ExplorationPostFX() {
  const rendererReady = useRendererReady();
  const gamePhase = useGamePhase();
  const { postfxEnabled } = useVisualSettings();
  const { preset } = useGraphicsQuality();
  const postfxActive = isPostProcessingEnabled(preset, postfxEnabled);

  // Synchronous double-check: even if useRendererReady says true,
  // verify the context is actually valid RIGHT NOW before mounting
  // EffectComposer. This catches the race condition where gl changes
  // but ready hasn't been reset yet.
  const gl = useThree((state) => state.gl);

  // Determine whether the EffectComposer will actually mount this render.
  // postfxActive alone is not sufficient — renderer readiness, menu phase,
  // and WebGL context validity also gate the mount. The canvas guard reads
  // `isPostfxActive()` to decide whether to enforce NoToneMapping (postfx
  // applies ACES via the composer) or ACESFilmicToneMapping (no composer,
  // renderer must apply the curve directly). A false positive here would
  // leave the scene with no tone curve at all → clipped highlights.
  let willMount = postfxActive && gamePhase !== 'menu' && rendererReady;
  if (willMount) {
    try {
      const ctx = gl.getContext();
      const attrs = ctx?.getContextAttributes();
      if (!ctx || !attrs || attrs.alpha === undefined) willMount = false;
    } catch {
      willMount = false;
    }
  }

  useEffect(() => {
    setPostfxActive(willMount);
    return () => {
      // Only clear if we were the one that set it. This prevents a remount
      // race where the new mount sets true, then the old unmount clears it.
      if (willMount) setPostfxActive(false);
    };
  }, [willMount]);

  if (!willMount) return null;

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
  const coarsePointer = useIsMobileVisual();
  const { preset, selectedPreset } = useGraphicsQuality();
  const rendering = resolveSceneRenderingPipeline(
    sceneId,
    preset,
    visualLite,
    selectedPreset,
    coarsePointer,
  );
  const { brightness: userBrightness } = useVisualSettings();
  const userBrightnessOffset = (userBrightness - 1) * 0.3;

  const colorGrade = SCENE_COLOR_GRADE[sceneId]
    ?? SCENE_COLOR_GRADE[resolveDerivedSceneId(sceneId as SceneId)]
    ?? DEFAULT_COLOR_GRADE;
  const vignetteParams = SCENE_VIGNETTE[sceneId]
    ?? SCENE_VIGNETTE[resolveDerivedSceneId(sceneId as SceneId)]
    ?? DEFAULT_VIGNETTE;
  const bloomParams = SCENE_BLOOM[sceneId]
    ?? SCENE_BLOOM[resolveDerivedSceneId(sceneId as SceneId)]
    ?? DEFAULT_BLOOM;

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
    colorGrade.brightness + SCENE_VISIBILITY.postFxBrightnessLift + userBrightnessOffset;

  const stress = usePlayerStress();
  const stressFactor = stress / 100;
  const wantsScanlines = SCANLINE_SCENES.has(sceneId);
  const wantsNoise = NOISE_SCENES.has(sceneId) && (preset.id === 'high' || preset.id === 'ultra');
  const activeTTLFlags = useGameStore((s) => s.activeTTLFlags ?? {});
  const reducedMotion = useEffectiveReducedMotion();
  const poemBoost = resolvePoemTTLPostFxBoost(activeTTLFlags, reducedMotion);

  const effectiveBloomIntensity =
    (bloomParams.intensity + stressFactor * 0.1 + poemBoost.bloomIntensity) * rendering.bloomIntensityScale;

  const stressVignetteDarkness = Math.min(
    effectiveVignetteDarkness + stressFactor * 0.12 + poemBoost.vignetteDarkness,
    0.75,
  );
  const stressVignetteOffset = Math.max(
    vignetteParams.offset - stressFactor * 0.15,
    0.1,
  );

  // ── Part 4: Stress-driven chromatic aberration ──
  // Activates when stress ≥ 70, scales linearly to max offset 0.002 at stress=100.
  // Disabled on mobile, medium quality, and reduced-motion.
  const stressChromaticEligible =
    !reducedMotion
    && !visualLite
    && !coarsePointer
    && (preset.id === 'high' || preset.id === 'ultra')
    && (selectedPreset === 'high' || selectedPreset === 'ultra');
  const stressChromaticAmount = stressChromaticEligible
    ? Math.max(0, (stress - 70) / 30)  // 0 at stress≤70, 1 at stress=100
    : 0;
  const showChromatic = stressChromaticAmount > 0;
  const chromaticOffset = useMemo(
    () => new THREE.Vector2(stressChromaticAmount * 0.002, stressChromaticAmount * 0.0015),
    [stressChromaticAmount],
  );

  // ── Part 3: Cinematic DOF for dialogue / cutscene moments ──
  // On high/ultra: render DOF always (with animated bokehScale 0↔target).
  // Smooth 0.4s easeInOutCubic transition when dialogue opens/closes.
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const activeCutsceneId = useGameStore((s) => s.activeCutsceneId);
  const isInDialogue = showStoryOverlay;
  const isInCutscene = !!activeCutsceneId;
  // DOF only on high/ultra quality, not on mobile, not with reduced motion.
  // Always mounted when eligible — bokehScale animated per-frame via ref.
  const wantsCinematicDOF =
    !reducedMotion && !visualLite && !coarsePointer &&
    (preset.id === 'high' || preset.id === 'ultra') &&
    (selectedPreset === 'high' || selectedPreset === 'ultra');

  // Refs + transition state for smooth DOF bokehScale animation.
  const dofRef = useRef<DepthOfFieldEffect | null>(null);
  const dofTransitionRef = useRef({
    current: 0,
    target: 0,
    start: 0,
    elapsed: 0,
    duration: 0.4,
  });

  useFrameTick('postfx', ({ delta }) => {
    const effect = dofRef.current;
    if (!effect) return;

    // Refresh the live NPC position from the registry (cheap).
    dialogueFocusTarget.refresh();

    // Determine target bokehScale based on dialogue / cutscene state.
    const dialogueActive = dialogueFocusTarget.isActive() || isInDialogue;
    const targetBokeh = isInCutscene
      ? DOF_CUTSCENE_BOKEH
      : dialogueActive
        ? DOF_DIALOGUE_BOKEH
        : 0;

    const t = dofTransitionRef.current;
    if (t.target !== targetBokeh) {
      // Start a new transition.
      t.start = t.current;
      t.target = targetBokeh;
      t.elapsed = 0;
    }

    if (t.current !== t.target) {
      t.elapsed += delta;
      const progress = Math.min(t.elapsed / t.duration, 1);
      // easeInOutCubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      t.current = t.start + (t.target - t.start) * eased;
    }

    // Apply animated bokehScale imperatively (avoids effect re-creation).
    effect.bokehScale = t.current;
  });

  const pipelineKey = `${sceneId}-${rendering.useLitePostFx ? 'lite' : rendering.useAmbientOcclusion ? 'ao' : 'full'}${wantsCinematicDOF ? '-dof' : ''}`;
  const lutKind = resolveProceduralLutKind(sceneId);
  const proceduralLut = useMemo(
    () => (lutKind ? getCachedProceduralLut3DTexture(lutKind) : null),
    [lutKind],
  );

  if (rendering.useLitePostFx) {
    return (
      <ManagedEffectComposer remountKey={pipelineKey} sceneId={sceneId} multisampling={0}>
        <Bloom
          intensity={(0.45 + poemBoost.bloomIntensity) * rendering.bloomIntensityScale}
          luminanceThreshold={0.75}
          luminanceSmoothing={0.9}
          mipmapBlur
          kernelSize={KernelSize.LARGE}
        />
        <Vignette
          offset={0.38}
          darkness={Math.min(0.28 * SCENE_VISIBILITY.vignetteDarknessScale + poemBoost.vignetteDarkness, 0.75)}
          blendFunction={BlendFunction.NORMAL}
        />
        <BrightnessContrast
          brightness={SCENE_VISIBILITY.postFxBrightnessLift + userBrightnessOffset}
          contrast={-0.02}
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
      <Bloom
        intensity={effectiveBloomIntensity}
        luminanceThreshold={bloomParams.threshold}
        luminanceSmoothing={bloomParams.smoothing}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />
      {/* TS-1: React 19 stricter children types — null cast to any */}
      {showChromatic ? <ChromaticAberration offset={chromaticOffset} blendFunction={BlendFunction.NORMAL} /> : null as any}
      {wantsScanlines ? <Scanline blendFunction={BlendFunction.OVERLAY} density={1.2} /> : null as any}
      {rendering.useAmbientOcclusion ? <N8AO aoRadius={rendering.aoRadius} intensity={rendering.aoIntensity} distanceFalloff={0.5} halfRes color="black" /> : null as any}
      {/* Part 3: Cinematic DOF — always mounted on high/ultra, bokehScale animated 0↔target via ref.
          Smooth 0.4s easeInOutCubic transition when dialogue/cutscene opens/closes.
          Focus target follows the active NPC (dialogueFocusTarget singleton). */}
      {wantsCinematicDOF ? (
        <DepthOfField
          ref={dofRef as any}
          focusDistance={DOF_DIALOGUE_FOCUS}
          focalLength={0.05}
          bokehScale={0}
          height={480}
        />
      ) : null as any}
      <Vignette offset={stressVignetteOffset} darkness={stressVignetteDarkness} blendFunction={BlendFunction.NORMAL} />
      <HueSaturation hue={colorGrade.hue} saturation={effectiveSaturation} blendFunction={BlendFunction.NORMAL} />
      <BrightnessContrast brightness={effectiveBrightness} contrast={effectiveContrast} blendFunction={BlendFunction.NORMAL} />
      {proceduralLut ? <LUT lut={proceduralLut} tetrahedralInterpolation blendFunction={BlendFunction.NORMAL} /> : null as any}
      {wantsNoise ? <Noise premultiply blendFunction={BlendFunction.NORMAL} opacity={0.035} /> : null as any}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} exposure={SCENE_VISIBILITY.toneExposure} />
    </ManagedEffectComposer>
  );
}