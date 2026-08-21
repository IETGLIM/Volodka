'use client';

/* ─── Volodka RPG – Cinematic Radial Motion Blur ───
 *  Custom post-processing effect: radial blur from screen center.
 *  Activated during cutscenes, dialogue camera drift, and scene transitions.
 *  Strength is driven imperatively via module-level state
 *  (src/engine/camera/motionBlurState.ts) to avoid React re-renders.
 *
 *  Quality gate: ULTRA only (or forceDuringCutscene=true for any tier).
 *  Always-mounted when gates pass; strength=0 is a no-op (~0.15ms/frame).
 *  Smooth 0.4s easeInOutCubic transition avoids jarring blur pops.
 *
 *  PERF: 8 texture samples per pixel, half-resolution-safe. The effect
 *  reads from inputBuffer (postprocessing's built-in sampler) so no
 *  additional render targets are allocated.
 */

import { useRef } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { wrapEffect } from '@react-three/postprocessing';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { getMotionBlurStrength } from '@/engine/camera/motionBlurState';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { isSoftWorkAffordable } from '@/engine/graphics/softWorkBudget';
import type { Effect as EffectType } from 'postprocessing';

/* ─── GLSL fragment shader ─── */
// Радиальное размытие от центра экрана — 8 семплов вдоль направления от центра.
// Сила размытия пропорциональна расстоянию от центра (в imitation настоящего
// motion blur при панорамировании камеры).
const RADIAL_BLUR_FRAGMENT_SHADER = /* glsl */ `
  uniform float strength;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Early-out when strength is negligible — skip all texture fetches.
    if (strength < 0.001) {
      outputColor = inputColor;
      return;
    }

    vec2 center = vec2(0.5);
    vec2 dir = uv - center;
    float dist = length(dir);

    // Distance-weighted: blur concentrates at screen edges (like real lens motion blur).
    float distWeight = smoothstep(0.0, 0.7, dist);
    float effectiveStrength = strength * distWeight * 0.06;

    vec4 color = vec4(0.0);
    float totalWeight = 0.0;

    // 8 samples along the radial direction from center through current pixel.
    for (int i = 0; i < 8; i++) {
      float t = float(i) / 8.0;
      vec2 offset = dir * t * effectiveStrength;
      color += texture2D(inputBuffer, uv + offset);
      totalWeight += 1.0;
    }

    outputColor = color / totalWeight;
  }
`;

/* ─── postprocessing Effect class ─── */
// Custom effect extending postprocessing's Effect base class.
// The mainImage function signature is required by the postprocessing pipeline.
class RadialBlurEffect extends Effect {
  constructor({ strength = 0 }: { strength?: number } = {}) {
    super('RadialBlurEffect', RADIAL_BLUR_FRAGMENT_SHADER, {
      blendFunction: 0, // BlendFunction.NORMAL — replace input, don't add
      uniforms: new Map([
        ['strength', new Uniform(strength)],
      ]),
    });
  }
}

/* ─── React wrapper via wrapEffect ─── */
// @react-three/postprocessing utility: wraps the Effect constructor into a
// declarative R3F element that can be placed inside <EffectComposer>.
const RadialBlur = wrapEffect(RadialBlurEffect);

/* ─── Transition animation state (same pattern as DOF in ExplorationPostFX) ─── */
interface BlurTransition {
  current: number;
  target: number;
  start: number;
  elapsed: number;
  duration: number;
}

const BLUR_TRANSITION_DURATION = 0.4; // seconds — easeInOutCubic ramp

/* ─── Public component ─── */

interface MotionBlurEffectProps {
  /** Force-enable on non-ultra presets during cutscenes (skip quality gate). */
  forceDuringCutscene?: boolean;
}

/**
 * Cinematic radial motion blur — mounts inside <ManagedEffectComposer> / <EffectComposer>.
 * Reads target strength from motionBlurState each frame; smoothly animates via ref.
 *
 * Usage (inside ExplorationPostFX.tsx):
 *   <MotionBlurEffect forceDuringCutscene={isInCutscene} />
 *
 * To trigger blur from cinematic camera code:
 *   import { setMotionBlurStrength } from '@/engine/camera/motionBlurState';
 *   setMotionBlurStrength(0.8);  // 0–1
 */
export function MotionBlurEffect({ forceDuringCutscene = false }: MotionBlurEffectProps) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();
  const isMobile = useIsMobileVisual();
  const effectRef = useRef<EffectType | null>(null);
  const transitionRef = useRef<BlurTransition>({
    current: 0,
    target: 0,
    start: 0,
    elapsed: 0,
    duration: BLUR_TRANSITION_DURATION,
  });

  // Quality gate: ultra-only by default; forceDuringCutscene opens the gate
  // on any preset that has postProcessing enabled (high/ultra).
  const isUltra = preset.id === 'ultra' && selectedPreset === 'ultra';
  const isHighOrUltra = (preset.id === 'high' || preset.id === 'ultra') && (selectedPreset === 'high' || selectedPreset === 'ultra');
  const softOk = isSoftWorkAffordable();
  const wantsMotionBlur =
    !reducedMotion
    && !isMobile
    && softOk
    && (isUltra || (forceDuringCutscene && isHighOrUltra));

  // Imperative per-frame update: read module-level state, animate transition.
  useFrameTick('postfx', () => {
    const effect = effectRef.current;
    if (!effect) return;

    const targetStrength = wantsMotionBlur ? getMotionBlurStrength() : 0;

    const t = transitionRef.current;
    if (t.target !== targetStrength) {
      // Start a new easeInOutCubic transition.
      t.start = t.current;
      t.target = targetStrength;
      t.elapsed = 0;
    }

    if (t.current !== t.target) {
      t.elapsed += 1 / 60; // approximate delta (FrameBudgetRegistry normalizes)
      const progress = Math.min(t.elapsed / t.duration, 1);
      // easeInOutCubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      t.current = t.start + (t.target - t.start) * eased;
    }

    // Update the uniform imperatively (avoids Effect re-creation on prop change).
    const strengthUniform = effect.uniforms.get('strength');
    if (strengthUniform) {
      strengthUniform.value = t.current;
    }
  });

  // Always mount when quality gates pass — strength=0 is a no-op in the shader.
  // Mounting/unmounting the pass would force a full EffectComposer remount →
  // expensive shader recompiles (same issue as DOF in ExplorationPostFX).
  if (!wantsMotionBlur) return null as any;

  return <RadialBlur ref={effectRef as any} strength={0} />;
}
