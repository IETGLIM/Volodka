/* ─── Volodka RPG – AAA Post-Processing Pipeline ───
 *  Dynamic bloom per scene, stress-reactive vignette, color grading, tone mapping
 *  Session 9: Added cinematic DOF for dialogue/cutscene moments
 *
 *  FIX: EffectComposer.addPass() accesses renderer.getContext().getContextAttributes().alpha
 *  which returns null if WebGL context isn't ready. We guard with useThree readiness check.
 *
 *  PERF: Classic SSAO removed in favor of gated N8AO. DOF only during dialogue/cutscene.
 *  AA: native MSAA disabled on composer (multisampling=0); SMAA closes edge crawl on high/ultra.
 *
 *  DEPTH: postprocessing 6.39 stable-depth blit used DepthTexture.clone() which shares
 *  Three.js Source → identical GL depth image on blit (GL_INVALID_OPERATION). Patched in
 *  patchPostprocessingDepthBlit before any EffectComposer mounts.
 */

import { useState, useEffect, useLayoutEffect, useRef, useMemo, type ComponentProps } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
// Side-effect: patch EffectComposer depth blit before R3F postprocessing mounts.
import '@/engine/three/patchPostprocessingDepthBlit';
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
  GodRays,
  SMAA,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode, SMAAPreset } from 'postprocessing';
import type { EffectComposer as EffectComposerImpl, DepthOfFieldEffect, GodRaysEffect } from 'postprocessing';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { dialogueFocusTarget } from '@/engine/graphics/dialogueFocusTarget';
import { isSoftWorkAffordable } from '@/engine/graphics/softWorkBudget';
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
import { shouldUseDenseSceneAmbientOcclusion } from '@/config/sceneVisualProfiles';
import { GodRaysSunMesh, GODRAYS_POST_SCENES } from '@/components/3d/GodRaysSunMesh';
import type { SceneId } from '@/shared/types/game';

/** Per-scene color grading overrides for CyberPunk2077 / Noir / Gothic feel */
const SCENE_COLOR_GRADE: Record<string, { hue: number; saturation: number; brightness: number; contrast: number }> = {
  volodka_room:       { hue: -0.05, saturation: 0.08, brightness: 0.01, contrast: 0.22 }, // CRT room — filmic, not candy
  volodka_corridor:   { hue: -0.04, saturation: -0.18, brightness: 0.0, contrast: 0.24 }, // oppressive noir
  home_evening:       { hue: 0.05,  saturation: 0.12, brightness: 0.015, contrast: 0.13 }, // warm amber mood
  street_night:       { hue: 0.04,  saturation: 0.12, brightness: 0.02, contrast: 0.28 }, // wet noir — not candy neon
  procedural_aaa:     { hue: 0.03,  saturation: 0.11, brightness: 0.02, contrast: 0.26 },
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
  procedural_aaa:     { offset: 0.36, darkness: 0.34 },
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
  street_night:       { intensity: 0.62, threshold: 0.52, smoothing: 0.48 }, // wet neon — restrained
  procedural_aaa:     { intensity: 0.58, threshold: 0.5, smoothing: 0.5 },
  cafe_evening:       { intensity: 0.58, threshold: 0.52, smoothing: 0.46 }, // blue neon bar glow
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
  city_square:        { intensity: 0.58, threshold: 0.55, smoothing: 0.48 }, // plaza — wet filmic, not candy
  underground_bunker: { intensity: 0.48, threshold: 0.55, smoothing: 0.46 }, // resistance CRT glow
  guild_mainframe:    { intensity: 0.6,  threshold: 0.5,  smoothing: 0.42 }, // server rack bloom
};
const DEFAULT_BLOOM = { intensity: 0.5, threshold: 0.7, smoothing: 0.5 };

/** Hero mood scenes — get the most authored post-FX treatment (eskil vignette, etc.).
 *  These are the 6 strongest practical-light / hero IBL scenes where the extra
 *  photographic falloff reads as a real lens rather than a game-engine overlay. */
const HERO_POSTFX_SCENES = new Set<SceneId>([
  'volodka_room', 'street_night', 'city_square', 'cafe_evening', 'library_day', 'home_evening',
]);

/** Tinted ambient-occlusion color per scene. Black AO reads as game-engine SSAO;
 *  a hue-matched AO reads as physically absorbed light — the single biggest
 *  "deplasticizer" lever. Default falls back to black (stock behaviour). */
const SCENE_AO_COLOR: Record<string, string> = {
  street_night:       '#0a0a14', // cool blue-black neon shadow
  city_square:        '#0c0e16', // cool plaza shadow
  home_evening:       '#140d08', // warm amber lamp shadow
  volodka_room:       '#0c0a14', // monitor-lit blue-black
  cafe_evening:       '#0a0c14', // blue neon shadow
  factory_basement:   '#08120c', // green Zarya-M shadow
  chk_campfire_night: '#100804', // warm fire shadow
  underground_bunker: '#08120c', // resistance green CRT shadow
  library_day:        '#100c06', // dusty amber reading shadow
  river_pier:         '#100a04', // warm fire-on-water shadow
};

/** Per-scene ACES tone-mapping exposure. The global `SCENE_VISIBILITY.toneExposure`
 *  is a flat 1.22 — this table unlocks authored per-scene exposure keys so a
 *  battle reads darker/more contrasty than a sunset dream. Falls back to global. */
const SCENE_TONE_EXPOSURE: Record<string, number> = {
  battle:             1.05, // darker, more contrast for combat
  sleep_dream:        1.35, // lifted ethereal
  rooftop_edge:       1.30, // sunset glow
  factory_roof:       1.28,
  street_winter:      1.30, // bright snow
  volodka_corridor:   1.12, // crushed noir corridor
  underground_bunker: 1.10, // CRT-dark
};

/** DOF — third-person dialogue focuses via world-space NPC target (autofocus).
 *  Fallback focusDistance used only when no dialogueFocusTarget is resolved yet. */
const DOF_DIALOGUE_FOCUS = 0.02;
const DOF_DIALOGUE_BOKEH = 3;      // how many meters of depth are blurred
const DOF_CUTSCENE_BOKEH = 2.5;
/** Approximate NPC chest/face height for dialogue autofocus (meters). */
const DOF_NPC_FOCUS_HEIGHT_M = 1.45;

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
  const invalidate = useThree((state) => state.invalidate);

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

  useLayoutEffect(() => {
    // Clear synchronously when the readiness/preset/viewport gate closes.
    // The committed pipeline below owns the active=true lifetime.
    if (!willMount) {
      setPostfxActive(false);
      invalidate();
    }
  }, [invalidate, willMount]);

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
  const invalidate = useThree((state) => state.invalidate);
  const { sceneId, noirMode } = usePostFxSceneState();
  const { visualLite } = useMobileVisualPerf();
  const coarsePointer = useIsMobileVisual();
  const { preset, selectedPreset } = useGraphicsQuality();

  useLayoutEffect(() => {
    setPostfxActive(true);
    invalidate();
    return () => {
      setPostfxActive(false);
      invalidate();
    };
  }, [invalidate]);

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

  // Authored per-scene post-FX keys (deplasticize + cinematic mood).
  const aoColor = SCENE_AO_COLOR[sceneId]
    ?? SCENE_AO_COLOR[resolveDerivedSceneId(sceneId as SceneId)]
    ?? 'black';
  const toneExposure = SCENE_TONE_EXPOSURE[sceneId]
    ?? SCENE_TONE_EXPOSURE[resolveDerivedSceneId(sceneId as SceneId)]
    ?? SCENE_VISIBILITY.toneExposure;
  // Ultra-only refinements: HUGE bloom kernel (softer filmic falloff), eskil
  // vignette (photographic falloff) on hero scenes, higher DOF CoC resolution.
  const bloomKernelSize = preset.id === 'ultra' ? KernelSize.HUGE : KernelSize.LARGE;
  const vignetteEskil = preset.id === 'ultra' && HERO_POSTFX_SCENES.has(sceneId as SceneId);
  const dofHeight = preset.id === 'ultra' ? 720 : 480;

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
  const softOk = isSoftWorkAffordable();
  // Film grain for cinematic texture. High keeps the classic 0.035 opacity; Ultra now gets a fainter
  // 0.022 layer (Session 9 polish — Ultra previously skipped grain entirely, leaving the image too
  // clean/"plastic". A subtle grain restores filmic tactility without the 60fps risk, soft-work gated).
  const wantsNoise =
    softOk
    && (preset.id === 'high' || preset.id === 'ultra')
    && (selectedPreset === 'high' || selectedPreset === 'ultra')
    && NOISE_SCENES.has(sceneId);
  const noiseOpacity = preset.id === 'ultra' ? 0.022 : 0.035;
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

  // ── Part 4: Chromatic aberration (cinematic lens fringing) ──
  // Two composed layers (desktop, non-reduced-motion, soft-work-budget OK):
  //  (a) A constant, barely-perceptible BASE fringing on high/ultra — gives the image a filmic
  //      lens character instead of the sterile "plastic clean" digital look. ~0.0004 offset.
  //  (b) The existing stress ramp on high (stress ≥ 70 → max 0.002 offset at stress=100).
  // Ultra intentionally keeps only the base layer (clean but not sterile).
  const chromaticEligible =
    softOk
    && !reducedMotion
    && !visualLite
    && !coarsePointer
    && (preset.id === 'high' || preset.id === 'ultra')
    && (selectedPreset === 'high' || selectedPreset === 'ultra');
  // Stress ramp only on high preset (ultra stays composed/clean).
  const stressRampEligible = chromaticEligible && preset.id === 'high';
  const stressChromaticAmount = stressRampEligible
    ? Math.max(0, (stress - 70) / 30)  // 0 at stress≤70, 1 at stress=100
    : 0;
  // Base fringing = 0.2 of the stress scale → ≈0.0004 offset (all-subpixel, reads as filmic).
  const baseChromaticAmount = chromaticEligible ? 0.2 : 0;
  const totalChromaticAmount = baseChromaticAmount + stressChromaticAmount;
  const showChromatic = totalChromaticAmount > 0;
  const chromaticOffset = useMemo(
    () => new THREE.Vector2(totalChromaticAmount * 0.002, totalChromaticAmount * 0.0015),
    [totalChromaticAmount],
  );

  // ── Part 3: Cinematic DOF for dialogue / cutscene moments ──
  // DOF is ALWAYS MOUNTED on high/ultra — its `bokehScale` is animated 0↔target via the
  // `dofRef` imperative ref below (see useFrameTick). Mounting/unmounting the pass on
  // dialogue open/close would force a full EffectComposer remount (pipelineKey change) →
  // 8–10 shader recompiles = 250–2000ms main-thread stall per dialogue. That was the root
  // cause of the 12s INP stalls on Ultra. Always-mounted + bokehScale=0 costs ~0.2ms/frame
  // (the pass is a no-op when bokehScale=0) — far cheaper than recompiling shaders.
  // Session 9 perf fix: decoupled from pipelineKey.
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const activeCutsceneId = useGameStore((s) => s.activeCutsceneId);
  const isInDialogue = showStoryOverlay;
  const isInCutscene = !!activeCutsceneId;
  const wantsCinematicDOF =
    !reducedMotion && !visualLite && !coarsePointer
    && (
      (preset.id === 'high' && selectedPreset === 'high')
      || (preset.id === 'ultra' && selectedPreset === 'ultra')
    );
  // `isInDialogue` / `isInCutscene` are consumed by the useFrameTick below to drive bokehScale
  // (0 when idle → DOF pass is a no-op; target bokeh when dialogue/cutscene active).

  // Refs + transition state for smooth DOF bokehScale animation.
  const dofRef = useRef<DepthOfFieldEffect | null>(null);
  const dofFocusTarget = useMemo(() => new THREE.Vector3(0, DOF_NPC_FOCUS_HEIGHT_M, -3), []);
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
    const npcPos = dialogueFocusTarget.peekPosition();
    if (npcPos) {
      dofFocusTarget.set(npcPos.x, npcPos.y + DOF_NPC_FOCUS_HEIGHT_M, npcPos.z);
    }

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

  // ── Part 5: GodRays postprocessing (screen-space volumetric light shafts) ──
  // Ultra-only, reduced-motion-gated, hero-interior-scenes-only. Complements
  // the existing mesh-based GodRays.tsx (which renders cylinder/cone shafts
  // with dust motes) by adding screen-space god-ray scattering from the same
  // light origin. The two layers read as a single volumetric shaft.
  //
  // ALWAYS MOUNTED when gates pass — opacity is animated 0↔target via
  // godRaysRef imperative ref (same pattern as DOF). Mounting/unmounting on
  // dialogue open/close would force a full EffectComposer remount (pipelineKey
  // change) → 8-10 shader recompiles = 250-2000ms main-thread stall.
  const wantsGodRaysPost =
    !reducedMotion && !visualLite && !coarsePointer
    && softOk
    && preset.id === 'ultra'
    && selectedPreset === 'ultra'
    && GODRAYS_POST_SCENES.has(sceneId as SceneId);

  const godRaysSunRef = useRef<THREE.Mesh | null>(null);
  const godRaysRef = useRef<GodRaysEffect | null>(null);
  const godRaysTransitionRef = useRef({
    current: 0,
    target: 0,
    start: 0,
    elapsed: 0,
    duration: 0.5,
  });
  const GODRAYS_TARGET_OPACITY = 0.55;

  useFrameTick('postfx', ({ delta }) => {
    const effect = godRaysRef.current;
    if (!effect) return;

    // Target opacity: 0 during dialogue/cutscene (rays distract from text),
    // full when exploring. Reduced-motion fade-out is handled by the mount
    // gate — if reducedMotion toggles true after mount, this hook still runs
    // but the EffectComposer will be remounted on the next render without
    // GodRays (wantsGodRaysPost → false), so we just decay gracefully.
    const dialogueActive = dialogueFocusTarget.isActive() || isInDialogue;
    const targetOpacity = (isInCutscene || dialogueActive) ? 0 : GODRAYS_TARGET_OPACITY;

    const t = godRaysTransitionRef.current;
    if (t.target !== targetOpacity) {
      t.start = t.current;
      t.target = targetOpacity;
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

    // Apply animated opacity imperatively (avoids effect re-creation).
    effect.blendMode.opacity.value = t.current;
  });

  // SMAA: Medium=LOW, High=MEDIUM, Ultra=MEDIUM (Session 8 — Ultra no longer uses SMAA HIGH by default).
  const wantsSmaa =
    !visualLite
    && !coarsePointer
    && (preset.id === 'medium' || preset.id === 'high' || preset.id === 'ultra');
  const smaaPreset =
    preset.id === 'ultra' || preset.id === 'high'
      ? SMAAPreset.MEDIUM
      : SMAAPreset.LOW;

  const pipelineKey = `${sceneId}-${rendering.useLitePostFx ? 'lite' : rendering.useAmbientOcclusion ? 'ao' : 'full'}${wantsSmaa ? `-smaa${smaaPreset}` : ''}`;
  const lutKind = resolveProceduralLutKind(sceneId);
  const useAmbientOcclusion =
    rendering.useAmbientOcclusion
    && shouldUseDenseSceneAmbientOcclusion(sceneId as SceneId, softOk);
  const proceduralLut = useMemo(
    () => (lutKind ? getCachedProceduralLut3DTexture(lutKind) : null),
    [lutKind],
  );

  if (rendering.useLitePostFx) {
    return (
      <ManagedEffectComposer
        remountKey={pipelineKey}
        sceneId={sceneId}
        multisampling={0}
        depthBuffer
        stencilBuffer={false}
      >
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
        {wantsSmaa ? <SMAA preset={smaaPreset} /> : null as any}
      </ManagedEffectComposer>
    );
  }

  return (
    <ManagedEffectComposer
      remountKey={pipelineKey}
      sceneId={sceneId}
      multisampling={0}
      depthBuffer
      stencilBuffer={false}
    >
      <Bloom
        intensity={effectiveBloomIntensity}
        luminanceThreshold={bloomParams.threshold}
        luminanceSmoothing={bloomParams.smoothing}
        mipmapBlur
        kernelSize={bloomKernelSize}
      />
      {/* TS-1: React 19 stricter children types — null cast to any */}
      {/* radialModulation: fringing concentrates at screen edges (true lens behaviour)
          instead of uniform subpixel fringing across the whole frame. */}
      {showChromatic ? (
        <ChromaticAberration
          offset={chromaticOffset}
          radialModulation
          modulationOffset={0.4}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : null as any}
      {wantsScanlines ? <Scanline blendFunction={BlendFunction.OVERLAY} density={1.2} /> : null as any}
      {/* halfRes=false: N8AO half-res MRT can share depth with composer input and
          trigger the same glBlitFramebuffer identical-attachment error (n8ao#53). */}
      {useAmbientOcclusion ? (
        <N8AO
          aoRadius={rendering.aoRadius}
          intensity={rendering.aoIntensity}
          distanceFalloff={0.5}
          halfRes={false}
          color={aoColor}
        />
      ) : null as any}
      {/* Part 3: Cinematic DOF — always mounted on high/ultra, bokehScale animated 0↔target via ref.
          Smooth 0.4s easeInOutCubic transition when dialogue/cutscene opens/closes.
          Focus target follows the active NPC (dialogueFocusTarget singleton). */}
      {wantsCinematicDOF ? (
        <DepthOfField
          ref={dofRef as any}
          target={dofFocusTarget}
          focusDistance={DOF_DIALOGUE_FOCUS}
          focalLength={0.05}
          bokehScale={0}
          height={dofHeight}
        />
      ) : null as any}
      {/* Part 5: GodRays postprocessing — screen-space volumetric light shafts.
          Ultra-only, hero-interior-scenes-only. Complements the mesh-based
          GodRays.tsx shafts. Always mounted when gates pass; opacity animated
          0↔0.55 via godRaysRef (decays to 0 during dialogue/cutscene). The
          GodRaysSunMesh is a tiny emissive sphere that acts as the sun source
          for the effect — positioned at the scene's practical light origin. */}
      {wantsGodRaysPost ? (
        <>
          <GodRaysSunMesh ref={godRaysSunRef} sceneId={sceneId as SceneId} />
          <GodRays
            ref={godRaysRef as any}
            sun={godRaysSunRef as any}
            samples={60}
            density={0.96}
            decay={0.92}
            weight={0.4}
            exposure={0.6}
            clampMax={1}
            blur
            kernelSize={KernelSize.SMALL}
            resolutionScale={0.5}
            blendFunction={BlendFunction.SCREEN}
          />
        </>
      ) : null as any}
      <Vignette offset={stressVignetteOffset} darkness={stressVignetteDarkness} eskil={vignetteEskil} blendFunction={BlendFunction.NORMAL} />
      <HueSaturation hue={colorGrade.hue} saturation={effectiveSaturation} blendFunction={BlendFunction.NORMAL} />
      <BrightnessContrast brightness={effectiveBrightness} contrast={effectiveContrast} blendFunction={BlendFunction.NORMAL} />
      {proceduralLut ? <LUT lut={proceduralLut} tetrahedralInterpolation blendFunction={BlendFunction.NORMAL} /> : null as any}
      {wantsNoise ? <Noise premultiply blendFunction={BlendFunction.NORMAL} opacity={noiseOpacity} /> : null as any}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} exposure={toneExposure} />
      {wantsSmaa ? <SMAA preset={smaaPreset} /> : null as any}
    </ManagedEffectComposer>
  );
}