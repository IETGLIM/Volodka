/**
 * Coherent film grain post-processing effect.
 * Unlike the postprocessing library's Noise (random per-pixel per frame), this uses
 * a large-scale value noise pattern that slowly drifts over time, producing the
 * structured, film-like grain of real celluloid instead of TV static.
 *
 * Usage: Replace `<Noise>` in ExplorationPostFX with `<CoherentNoise>` on ultra.
 */

import { Uniform } from 'three';
import { Effect } from 'postprocessing';

const fragmentShader = /* glsl */ `
  uniform float opacity;
  uniform float time;
  uniform vec2 resolution;

  // Coherent 2D value noise — slow-drifting, spatially continuous
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);  // smoothstep
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // FBM: 3 octaves for medium-frequency grain
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += valueNoise(p) * a;
      p *= 2.17;  // irrational scale avoids tiling
      a *= 0.5;
    }
    return v;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Scale noise to screen — high frequency for film grain look
    // Resolution-adaptive: larger screens get finer grain
    float minRes = min(resolution.x, resolution.y);
    float grainScale = minRes * 0.7;  // 0.7 grain cycles per screen-min-dimension
    vec2 grainUv = uv * grainScale;

    // Slow temporal drift: grain pattern slides ~2 pixels/second → reads as film
    grainUv += time * vec2(1.7, 2.3);  // irrational direction avoids axis-aligned crawl

    float grain = fbm(grainUv);
    // Remap from [0,1] to [-1,1] centered
    grain = grain * 2.0 - 1.0;

    // Apply: premultiplied additive grain (matches film exposure model)
    float grainAmount = grain * opacity;
    outputColor = vec4(inputColor.rgb + vec3(grainAmount), inputColor.a);
  }
`;

export class CoherentNoiseEffect extends Effect {
  constructor({ opacity = 0.022, premultiply = false } = {} as { opacity?: number; premultiply?: boolean }) {
    super('CoherentNoiseEffect', fragmentShader, {
      blendFunction: premultiply
        ? undefined  // normal blend
        : undefined,
      uniforms: new Map<string, Uniform>([
        ['opacity', new Uniform(opacity)],
        ['time', new Uniform(0)],
        ['resolution', new Uniform(new Float32Array([1920, 1080]))],
      ]),
    });
  }

  /** Update time uniform — call once per frame */
  updateTime(time: number): void {
    this.uniforms.get('time')!.value = time;
  }

  /** Update resolution when viewport changes */
  updateResolution(width: number, height: number): void {
    const res = this.uniforms.get('resolution')!.value as Float32Array;
    res[0] = width;
    res[1] = height;
  }

  get opacity(): number {
    return this.uniforms.get('opacity')!.value as number;
  }
  set opacity(value: number) {
    this.uniforms.get('opacity')!.value = value;
  }
}

/** R3F-compatible wrapper component for CoherentNoiseEffect */
import { forwardRef, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import type { RefObject } from 'react';
import { BlendFunction } from 'postprocessing';

interface CoherentNoiseProps {
  opacity?: number;
  premultiply?: boolean;
  blendFunction?: BlendFunction;
}

export const CoherentNoise = forwardRef<CoherentNoiseEffect, CoherentNoiseProps>(
  function CoherentNoise({ opacity = 0.022, premultiply = false, blendFunction: _blendFunction = BlendFunction.NORMAL }, ref) {
    const effect = useMemo(() => new CoherentNoiseEffect({ opacity, premultiply }), [opacity, premultiply]);
    const size = useThree((s) => s.size);

    useFrame(({ clock }) => {
      effect.updateTime(clock.getElapsedTime());
    });

    // Update resolution on viewport change
    useThree(() => {
      effect.updateResolution(size.width, size.height);
    });

    // Expose ref
    if (typeof ref === 'function') ref(effect);
    else if (ref) (ref as RefObject<CoherentNoiseEffect>).current = effect;

    return null;
  },
);
