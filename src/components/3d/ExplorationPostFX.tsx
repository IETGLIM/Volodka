/* ─── Volodka RPG – AAA Post-Processing Pipeline ───
 *  Dynamic bloom per scene, stress-reactive vignette, color grading, tone mapping
 *  Session 9: Added cinematic DOF for dialogue/cutscene moments
 *
 *  ЭТАП 98 (persistent composer): смена сцены больше НЕ пересобирает
 *  EffectComposer. Раньше pipelineKey = `${sceneId}-${lite|ao|full}${-smaa}`
 *  ремaунтил композер → 8–10 перекомпиляций шейдеров = 250–2000 мс stall на
 *  каждом переходе. Теперь дети композера — фиксированный суперсед пассов с
 *  КОНСТАНТНЫМИ props (любое изменение props обёртки @react-three/postprocessing
 *  пересоздаёт инстанс эффекта через args-мемо), а все пер-сценные вариации
 *  применяются императивно: сеттеры эффектов (Bloom/Vignette/HueSaturation/
 *  BrightnessContrast/ChromaticAberration/ToneMapping/LUT/GodRays), uniform-
 *  запись, pass.enabled (N8AO/SMAA/GodRays) и LUT-swap (нейтральная identity-
 *  текстура для сцен без LUT). Композер ремaунтится только при смене
 *  renderer'а (glInstanceKey — context restore / HMR). Профиль сцены — чистая
 *  resolveScenePostFxProfile; применение — applyScenePostFx на монтировании,
 *  на событии scene:transition_start (под визиром SceneTransitionVeil) и на
 *  изменение настроек. Стресс/энергия/поэм-буст уточняются покадровым тиком
 *  (getState — без store-подписок на рендер).
 *
 *  FIX: EffectComposer.addPass() accesses renderer.getContext().getContextAttributes().alpha
 *  which returns null if WebGL context isn't ready. We guard with useThree readiness check.
 *
 *  PERF: Classic SSAO removed in favor of gated N8AO. DOF only during dialogue/cutscene.
 *  AA: native MSAA disabled on composer (multisampling=0); SMAA closes edge crawl on high/ultra.
 *
 *  DEPTH: postprocessing 6.39 stable-depth blit used DepthTexture.clone() which shares
 *  Three.js Source → identical GL depth image on blit (GL_INVALID_OPERATION). Patched
 *  in patchPostprocessingDepthBlit with a self-healing fallback: if sources still
 *  collide, the depth render target is reallocated with a fresh texture instead
 *  of silently dropping depth data.
 */

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, type ComponentProps } from 'react';
import { useThree } from '@react-three/fiber';
import { Mesh, Vector2, Vector3 } from 'three';
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
import { usePostFxSceneState, useGamePhase } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { resolvePoemTTLPostFxBoost } from '@/engine/poemWorld/poemPostFxBoost';
import { useMobileVisualPerf, useIsMobileVisual } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { isPostProcessingEnabled } from '@/engine/graphics/qualityPresets';
import { useVisualSettings } from '@/hooks/useVisualSettings';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import { resolveSceneRenderingPipeline, type SceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import { disposeEffectComposer, type PostprocessingComposerLike } from '@/engine/three/disposeThreeResources';
import { setPostfxActive } from '@/engine/graphics/postfxActiveState';
import { getNeutralProceduralLut3DTexture } from '@/engine/graphics/proceduralLutTextures';
import { shouldUseDenseSceneAmbientOcclusion } from '@/config/sceneVisualProfiles';
import { GodRaysSunMesh } from '@/components/3d/GodRaysSunMesh';
import { MotionBlurEffect } from '@/components/3d/MotionBlurEffect';
import { eventBus } from '@/engine/EventBus';
import {
  resolveScenePostFxProfile,
  type ScenePostFxProfile,
} from '@/engine/graphics/scenePostFxProfiles';
import {
  applyScenePostFx,
  computeBloomRuntime,
  computeVignetteRuntime,
  computeChromaticRuntime,
  setEffectPassEnabled,
  type BloomLike,
  type VignetteLike,
  type HueSaturationLike,
  type BrightnessContrastLike,
  type ChromaticAberrationLike,
  type BlendModeHostLike,
  type LutLike,
  type ToneMappingLike,
  type N8aoLike,
  type ScenePostFxTargets,
} from '@/engine/graphics/applyScenePostFx';
import type { SceneId } from '@/shared/types/game';

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

/** Композер ремaунтится ТОЛЬКО при смене renderer'а (glInstanceKey) — этап 98. */
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

/** Структурный тип ref-хранилища композера (без React-импортов). */
type ComposerRefLike = { current: EffectComposerImpl | null };

/**
 * Ключевой инстанс композера: dispose при unmount и context restore.
 * @react-three/postprocessing держит EffectComposer в useMemo и не вызывает
 * dispose() при смене gl — ключ + layout-cleanup гарантируют освобождение
 * пассов и RT. composerRef прокидывается пропом (владелец — PostFXPipeline:
 * аплаеру нужен живой список пассов для точечных pass.enabled).
 */
function ManagedEffectComposer({ children, composerRef, ...props }: ComponentProps<typeof EffectComposer> & { composerRef: ComposerRefLike }) {
  const glInstanceKey = useGlInstanceKey();

  // Dispose passes + composer before the next paint on unmount (этап 98:
  // пер-сценные переходы больше не диспозят композер — он персистентен).
  useLayoutEffect(() => {
    return () => {
      disposeEffectComposer(composerRef.current as PostprocessingComposerLike | null);
      composerRef.current = null;
    };
  }, [composerRef]);

  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;

    function handleContextLost(event: Event) {
      event.preventDefault();
      disposeEffectComposer(composerRef.current as PostprocessingComposerLike | null);
      composerRef.current = null;
    }

    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [gl, composerRef]);

  return (
    <EffectComposer key={glInstanceKey} ref={composerRef} {...props}>
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
  const {
    brightness: userBrightness,
    agxToneMapping,
    vignetteEnabled,
    chromaticAberrationEnabled,
    filmGrainEnabled,
  } = useVisualSettings();
  const reducedMotion = useEffectiveReducedMotion();

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

  // AgX tone mapping (ultra-only, user-toggleable via SettingsPanel →
  // volodka_agx). Режим переключается сеттером ToneMappingEffect.mode.
  const useAgx = agxToneMapping && preset.id === 'ultra' && selectedPreset === 'ultra';
  const toneMappingMode = useAgx ? ToneMappingMode.AGX : ToneMappingMode.ACES_FILMIC;
  const userBrightnessOffset = (userBrightness - 1) * 0.3;

  // Тир-гейты (структурные — меняются только в меню/при смене устройства).
  const isUltraTier = preset.id === 'ultra' && selectedPreset === 'ultra';
  const isHighOrUltraTier =
    (preset.id === 'high' || preset.id === 'ultra')
    && (selectedPreset === 'high' || selectedPreset === 'ultra');
  // Bloom kernel: HUGE on ultra (soft filmic), MEDIUM on high (perf-friendly),
  // SMALL on medium/low. LARGE was too heavy for sustained 60fps on mid GPUs.
  const bloomKernelSize =
    preset.id === 'ultra' ? KernelSize.HUGE
    : preset.id === 'high' ? KernelSize.MEDIUM
    : KernelSize.SMALL;
  const noiseOpacity = preset.id === 'ultra' ? 0.018 : 0.035;
  // SMAA: Ultra=MEDIUM, High=LOW, Medium/Low=disabled.
  // SMAA is GPU-heavy; on Medium it's not worth the cost vs. native browser AA.
  const wantsSmaa = !visualLite && !coarsePointer && (preset.id === 'high' || preset.id === 'ultra');
  const smaaPreset = preset.id === 'ultra' ? SMAAPreset.MEDIUM : SMAAPreset.LOW;
  const dofHeight = preset.id === 'ultra' ? 720 : 480;

  // ── Part 5: GodRays postprocessing (screen-space volumetric light shafts) ──
  // Ultra-only, reduced-motion-gated. Пасс персистентен: пер-сценное
  // вкл/выкл — через pass.enabled (applier), opacity анимируется тиком.
  const wantsGodRaysMount = isUltraTier && !reducedMotion && !visualLite && !coarsePointer;
  const godRaysSunRef = useRef<Mesh | null>(null);
  // Track whether the GodRaysSunMesh has mounted and its ref is populated.
  // The @react-three/postprocessing GodRays wrapper creates GodRaysEffect in a
  // useMemo that reads sun.current at construction. If the effect mounts before
  // the sun mesh commits (React 19 concurrent mode under stress), sun.current
  // is null → GodRaysEffect.update() throws every frame ("Cannot read parent of
  // null") → EffectComposer render loop crashes → scene goes black.
  const [godRaysSunReady, setGodRaysSunReady] = useState(false);
  // Reset ready state when the sun mesh should unmount (tier gate flip)
  // so a stale ref can't feed a null/wrong sun to GodRays.
  useEffect(() => {
    if (!wantsGodRaysMount) setGodRaysSunReady(false);
  }, [wantsGodRaysMount]);
  const handleSunMount = useCallback(() => setGodRaysSunReady(true), []);

  // ── Refs на инстансы эффектов (императивное применение) ──
  const bloomRef = useRef<BloomLike | null>(null);
  const vignetteRef = useRef<VignetteLike | null>(null);
  const hueSatRef = useRef<HueSaturationLike | null>(null);
  const brightnessContrastRef = useRef<BrightnessContrastLike | null>(null);
  const chromaticRef = useRef<ChromaticAberrationLike | null>(null);
  const scanlineRef = useRef<BlendModeHostLike | null>(null);
  const noiseRef = useRef<BlendModeHostLike | null>(null);
  const lutRef = useRef<LutLike | null>(null);
  const toneMappingRef = useRef<ToneMappingLike | null>(null);
  const n8aoRef = useRef<N8aoLike | null>(null);
  const godRaysEffectRef = useRef<GodRaysEffect | null>(null);
  const smaaEffectRef = useRef<unknown>(null);

  const neutralLut = useMemo(() => getNeutralProceduralLut3DTexture(), []);
  // Стабильный вектор смещения хроматики — мутируется uniform'ом на месте.
  const chromaticOffsetBase = useMemo(() => new Vector2(0, 0), []);

  // ── Part 3: Cinematic DOF — always mounted on high/ultra desktop, bokehScale
  // animated 0↔target via ref (see useFrameTick). Focus target follows the
  // active NPC (dialogueFocusTarget singleton). ──
  const dofRef = useRef<DepthOfFieldEffect | null>(null);
  const dofFocusTarget = useMemo(() => new Vector3(0, DOF_NPC_FOCUS_HEIGHT_M, -3), []);
  const dofTransitionRef = useRef({
    current: 0,
    target: 0,
    start: 0,
    elapsed: 0,
    duration: 0.4,
  });
  const wantsCinematicDOF = !reducedMotion && !visualLite && !coarsePointer && isHighOrUltraTier;

  const godRaysTransitionRef = useRef({
    current: 0,
    target: 0,
    start: 0,
    elapsed: 0,
    duration: 0.5,
  });
  // Текущее фактическое состояние pass.enabled GodRays (чтобы не ходить по
  // пассам каждый кадр — только при изменении soft-budget/сцены).
  const godRaysEnabledRef = useRef(true);
  const GODRAYS_TARGET_OPACITY = 0.55;

  const isLite = rendering.useLitePostFx;

  // ── Структурный ключ: дети композера пересобираются ТОЛЬКО на этих изменениях
  // (меню качества/настройки/устройство/godrays-ready). Смена сцены НЕ входит. ──
  const structuralKey = [
    isLite ? 'lite' : 'full',
    preset.id,
    selectedPreset,
    visualLite ? 'vl' : 'd',
    coarsePointer ? 'cp' : 'm',
    reducedMotion ? 'rm' : 'm',
    useAgx ? 'agx' : 'aces',
    wantsGodRaysMount && godRaysSunReady ? 'gr' : '-',
    vignetteEnabled ? 'v' : '-',
  ].join(':');

  // ── Дети композера: фиксированный суперсед пассов, props — константы.
  // Все реальные значения применяются applyScenePostFx до первой отрисовки
  // (layout-фаза) и уточняются покадровым тиком. TS-1: React 19 stricter
  // children types — null cast to any. ──
  const composerChildren = useMemo(() => {
    if (isLite) {
      // Lite-ветка: минимальный стек ( Bloom/Vignette/BC/ToneMapping ),
      // пер-сценные вариации — императивно (applier + тик).
      return (
        <>
          <Bloom
            ref={bloomRef as any}
            intensity={0.45}
            luminanceThreshold={0.75}
            luminanceSmoothing={0.9}
            mipmapBlur
            kernelSize={KernelSize.LARGE}
          />
          {vignetteEnabled ? (
            <Vignette
              ref={vignetteRef as any}
              offset={0.38}
              darkness={0.28 * SCENE_VISIBILITY.vignetteDarknessScale}
              blendFunction={BlendFunction.NORMAL}
            />
          ) : null as any}
          <BrightnessContrast
            ref={brightnessContrastRef as any}
            brightness={SCENE_VISIBILITY.postFxBrightnessLift}
            contrast={-0.02}
            blendFunction={BlendFunction.NORMAL}
          />
          <ToneMapping ref={toneMappingRef as any} mode={toneMappingMode} exposure={SCENE_VISIBILITY.toneExposure} />
          {wantsSmaa ? <SMAA ref={smaaEffectRef as any} preset={smaaPreset} /> : null as any}
        </>
      );
    }

    return (
      <>
        <Bloom
          ref={bloomRef as any}
          intensity={0.5}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.5}
          mipmapBlur
          kernelSize={bloomKernelSize}
        />
        {/* radialModulation: fringing concentrates at screen edges (true lens behaviour)
            instead of uniform subpixel fringing across the whole frame.
            offset мутируется uniform'ом на месте (константный Vector2). */}
        <ChromaticAberration
          ref={chromaticRef as any}
          offset={chromaticOffsetBase}
          radialModulation
          modulationOffset={0.4}
          blendFunction={BlendFunction.NORMAL}
        />
        <Scanline ref={scanlineRef as any} blendFunction={BlendFunction.OVERLAY} density={1.2} />
        {/* halfRes=false: N8AO half-res MRT can share depth with composer input and
            trigger the same glBlitFramebuffer identical-attachment error (n8ao#53).
            Пер-сценные вкл/выкл и конфигурация — через pass.enabled/configuration. */}
        <N8AO
          ref={n8aoRef as any}
          aoRadius={0.45}
          intensity={2.5}
          distanceFalloff={0.5}
          halfRes={false}
          color="black"
        />
        {/* Part 3: Cinematic DOF — always mounted on high/ultra desktop, bokehScale animated 0↔target via ref.
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
            Ultra-only. Персистентный sun mesh рендерится рядом (вне детей) и
            переживает смену сцен; пер-сценное вкл/выкл — pass.enabled (applier),
            opacity анимируется тиком 0↔0.55 (гаснет в диалогах/кат-сценах). */}
        {wantsGodRaysMount && godRaysSunReady && godRaysSunRef.current ? (
          <GodRays
            ref={godRaysEffectRef as any}
            sun={godRaysSunRef.current}
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
        ) : null as any}
        <Vignette
          ref={vignetteRef as any}
          offset={0.4}
          darkness={0.32}
          blendFunction={BlendFunction.NORMAL}
        />
        <HueSaturation ref={hueSatRef as any} hue={0} saturation={0} blendFunction={BlendFunction.NORMAL} />
        <BrightnessContrast ref={brightnessContrastRef as any} brightness={0} contrast={0.15} blendFunction={BlendFunction.NORMAL} />
        {/* LUT живёт постоянно: пер-сценная подмена — effect.lut = texture
            (нейтральная identity-текстура для сцен без LUT). */}
        <LUT ref={lutRef as any} lut={neutralLut} tetrahedralInterpolation blendFunction={BlendFunction.NORMAL} />
        {/* Зерно: premultiply константен, вкл/выкл — blendMode.opacity. */}
        <Noise ref={noiseRef as any} premultiply blendFunction={BlendFunction.NORMAL} opacity={0} />
        {/* Cinematic radial motion blur — ultra-only, force-enabled during cutscene/dialogue on high+ultra. */}
        <MotionBlurEffect />
        {/* exposure — исторический no-op (ToneMappingEffect без exposure в 6.39),
            поведение сохранено; реальный режим — mode (сеттер). */}
        <ToneMapping ref={toneMappingRef as any} mode={toneMappingMode} exposure={SCENE_VISIBILITY.toneExposure} />
        {wantsSmaa ? <SMAA ref={smaaEffectRef as any} preset={smaaPreset} /> : null as any}
      </>
    );
    // Все тир/гейт-значения (isLite/preset/smaa/dof/agx/vignette/godrays)
    // кодируются в structuralKey; refs и текстуры — стабильные синглтоны.
    // Смена сцены детей НЕ пересобирает.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    structuralKey,
    neutralLut,
    chromaticOffsetBase,
    dofFocusTarget,
  ]);

  // ── Императивное применение профиля сцены ──
  const profileRef = useRef<ScenePostFxProfile | null>(null);
  const renderingRef = useRef<SceneRenderingPipeline>(rendering);
  const godRaysWantedRef = useRef(false);
  // Последняя ПРИМЕНЁННАЯ сцена: transition_start применяет профиль раньше,
  // чем стор обновит sceneId — тик должен быть согласован с аплаером.
  const lastSceneRef = useRef<SceneId>(sceneId);
  // Живой инстанс композера (владелец — этот компонент; прокидывается пропом
  // в ManagedEffectComposer). Нужен аплаеру/тику для точечных pass.enabled.
  const composerRef = useRef<EffectComposerImpl | null>(null);

  const buildTargets = useCallback((): ScenePostFxTargets => ({
    bloom: bloomRef.current,
    vignette: vignetteRef.current,
    hueSaturation: hueSatRef.current,
    brightnessContrast: brightnessContrastRef.current,
    chromatic: chromaticRef.current,
    scanline: scanlineRef.current,
    noise: noiseRef.current,
    lut: lutRef.current,
    toneMapping: toneMappingRef.current,
    n8ao: n8aoRef.current,
    godRays: godRaysEffectRef.current,
    composer: (composerRef.current as unknown as { passes: unknown[] } | null),
    smaaEffect: smaaEffectRef.current,
    godRaysEffect: godRaysEffectRef.current,
  }), []);

  const applyProfile = useCallback((targetSceneId: SceneId) => {
    const profile = resolveScenePostFxProfile(targetSceneId);
    const rend = resolveSceneRenderingPipeline(
      targetSceneId,
      preset,
      visualLite,
      selectedPreset,
      coarsePointer,
    );
    const state = useGameStore.getState();
    const stress = state.playerState.stress;
    const energy = state.playerState.energy ?? 100;
    const poemBoost = resolvePoemTTLPostFxBoost(state.activeTTLFlags ?? {}, reducedMotion);
    const softOk = isSoftWorkAffordable();
    const aoGate = rend.useAmbientOcclusion
      && shouldUseDenseSceneAmbientOcclusion(targetSceneId, softOk);
    const chromaticEligible =
      softOk
      && !reducedMotion
      && !visualLite
      && !coarsePointer
      && chromaticAberrationEnabled
      && isHighOrUltraTier;

    const targets = buildTargets();
    applyScenePostFx(targets, {
      profile,
      rendering: rend,
      useAmbientOcclusion: aoGate,
      noirMode,
      userBrightnessOffset,
      vignetteEnabled,
      filmGrainEnabled,
      toneMappingMode,
      isUltraPreset: isUltraTier,
      noiseOpacity,
      stress,
      energy,
      poemBoost,
      chromaticEligible,
      chromaticStressRampEligible: chromaticEligible && preset.id === 'high',
      godRaysMounted: wantsGodRaysMount && godRaysSunReady,
      smaaWanted: wantsSmaa,
    });

    profileRef.current = profile;
    renderingRef.current = rend;
    godRaysWantedRef.current = wantsGodRaysMount && godRaysSunReady && !!profile.godRaysSun;
    lastSceneRef.current = targetSceneId;
  }, [
    buildTargets,
    preset,
    visualLite,
    selectedPreset,
    coarsePointer,
    reducedMotion,
    noirMode,
    userBrightnessOffset,
    vignetteEnabled,
    filmGrainEnabled,
    chromaticAberrationEnabled,
    toneMappingMode,
    isUltraTier,
    noiseOpacity,
    isHighOrUltraTier,
    wantsGodRaysMount,
    godRaysSunReady,
    wantsSmaa,
  ]);

  // Применение на монтировании/смене сцены (idempotent) + событие перехода
  // (scene:transition_start приходит ДО записи сцены в стор — применение
  // происходит под визиром SceneTransitionVeil, мгновенно и без ре-рендеров).
  useLayoutEffect(() => {
    applyProfile(sceneId);
  }, [applyProfile, sceneId]);

  useEffect(() => {
    return eventBus.on('scene:transition_start', ({ targetScene }) => {
      applyProfile(targetScene);
    });
  }, [applyProfile]);

  // ── Единый покадровый тик: DOF bokeh, GodRays opacity, стресс/энергия/поэм-
  // буст для bloom/vignette/chromatic, soft-budget гейты. getState() — без
  // store-подписок на рендер. ──
  useFrameTick('postfx', ({ delta }) => {
    const state = useGameStore.getState();
    const stress = state.playerState.stress;
    const energy = state.playerState.energy ?? 100;
    const poemBoost = resolvePoemTTLPostFxBoost(state.activeTTLFlags ?? {}, reducedMotion);
    const profile = profileRef.current;
    const rend = renderingRef.current;
    const softOk = isSoftWorkAffordable();

    // ── Bloom: стресс + поэм-буст. ──
    const bloom = bloomRef.current;
    if (bloom && profile) {
      const bloomRuntime = computeBloomRuntime(
        rend.useLitePostFx,
        profile,
        rend.bloomIntensityScale,
        stress / 100,
        poemBoost,
      );
      bloom.intensity = bloomRuntime.intensity;
    }

    // ── Vignette: стресс-порог + энергия (lite — фиксированная формула + поэм-буст). ──
    const vignette = vignetteRef.current;
    if (vignette && profile) {
      const vignetteRuntime = computeVignetteRuntime(profile, {
        lite: rend.useLitePostFx,
        noirMode,
        stress,
        energy,
        poemBoost,
      });
      vignette.darkness = vignetteRuntime.darkness;
      vignette.offset = vignetteRuntime.offset;
    }

    // ── Chromatic: база + стресс-рампа (fresh softOk — бюджет восстанавливается). ──
    const chromatic = chromaticRef.current;
    if (chromatic && profile) {
      const eligible =
        softOk
        && !reducedMotion
        && !visualLite
        && !coarsePointer
        && chromaticAberrationEnabled
        && isHighOrUltraTier;
      const chromaticRuntime = computeChromaticRuntime(profile, {
        eligible,
        stressRampEligible: eligible && preset.id === 'high',
        stress,
      });
      const offsetValue = chromatic.uniforms.get('offset')?.value as { x: number; y: number } | undefined;
      if (offsetValue && typeof offsetValue.x === 'number') {
        offsetValue.x = chromaticRuntime.offsetX;
        offsetValue.y = chromaticRuntime.offsetY;
      }
    }

    // ── GodRays: soft-budget гейт — переключаем только при изменении. ──
    const n8ao = n8aoRef.current;
    if (n8ao && profile) {
      const aoWanted = rend.useAmbientOcclusion
        && shouldUseDenseSceneAmbientOcclusion(lastSceneRef.current, softOk);
      if (n8ao.enabled !== aoWanted) n8ao.enabled = aoWanted;
    }
    if (profile) {
      const godRaysWanted = godRaysWantedRef.current && softOk;
      if (godRaysEnabledRef.current !== godRaysWanted) {
        godRaysEnabledRef.current = setEffectPassEnabled(
          (composerRef.current as unknown as { passes: unknown[] } | null),
          godRaysEffectRef.current,
          godRaysWanted,
        )
          ? godRaysWanted
          : true; // пасс не найден/слит — считаем включённым (прежнее поведение)
      }
    }

    // ── DOF: bokehScale 0↔target (диалог/кат-сцена), фокус на активном NPC. ──
    const dofEffect = dofRef.current;
    if (dofEffect) {
      // Refresh the live NPC position from the registry (cheap).
      dialogueFocusTarget.refresh();
      const npcPos = dialogueFocusTarget.peekPosition();
      if (npcPos) {
        dofFocusTarget.set(npcPos.x, npcPos.y + DOF_NPC_FOCUS_HEIGHT_M, npcPos.z);
      }

      const isInDialogue = !!state.showStoryOverlay;
      const isInCutscene = !!state.activeCutsceneId;
      const dialogueActive = dialogueFocusTarget.isActive() || isInDialogue;
      const targetBokeh = isInCutscene
        ? DOF_CUTSCENE_BOKEH
        : dialogueActive
          ? DOF_DIALOGUE_BOKEH
          : 0;

      const t = dofTransitionRef.current;
      if (t.target !== targetBokeh) {
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

      dofEffect.bokehScale = t.current;
    }

    // ── GodRays opacity: гаснет в диалогах/кат-сценах; вне godrays-сцен — 0. ──
    const godRaysEffect = godRaysEffectRef.current;
    if (godRaysEffect) {
      const godRaysWanted = godRaysWantedRef.current;
      const isInDialogue = !!state.showStoryOverlay;
      const isInCutscene = !!state.activeCutsceneId;
      const dialogueActive = dialogueFocusTarget.isActive() || isInDialogue;
      // Target opacity: 0 during dialogue/cutscene (rays distract from text),
      // full when exploring. Вне godrays-сцен аплаер выключил пасс — держим 0.
      const targetOpacity = !godRaysWanted || isInCutscene || dialogueActive
        ? 0
        : GODRAYS_TARGET_OPACITY;

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

      godRaysEffect.blendMode.opacity.value = t.current;
    }
  });

  return (
    <>
      {/* Персистентный GodRays-«солнце» — живёт между сценами, вне детей
          композера; GodRaysEffect переносит его в свой lightScene. */}
      {wantsGodRaysMount ? (
        <GodRaysSunMesh
          ref={godRaysSunRef}
          sceneId={sceneId as SceneId}
          onMount={handleSunMount}
        />
      ) : null}
      <ManagedEffectComposer
        composerRef={composerRef}
        multisampling={0}
        depthBuffer
        stencilBuffer={false}
      >
        {composerChildren}
      </ManagedEffectComposer>
    </>
  );
}
