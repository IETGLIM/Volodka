
/* ─── Volodka RPG – AAA Rain Particle System ───
 *  GPU-driven rain via vertex shader (uTime uniform only per frame)
 *  Adaptive particle counts for mobile / desktop
 *  Probabilistic ground splashes with shader-based expansion
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, Vector3 } from 'three';
import { useGlobalWeatherControls } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';
import {
  buildRainConfig,
  resolveRainLevel,
  type RainConfig,
} from './rainSystemUtils';

const MAX_SPLASHES_BASE = 300;
const SPLASH_LIFETIME = 0.4;

function seedRainBuffers(config: RainConfig, count: number) {
  const [bx, by, bz] = config.boxSize;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * bx;
    positions[i3 + 1] = Math.random() * by;
    positions[i3 + 2] = (Math.random() - 0.5) * bz;

    const fallSpeed =
      config.fallSpeedRange[0] +
      Math.random() * (config.fallSpeedRange[1] - config.fallSpeedRange[0]);
    velocities[i3] = Math.sin(config.windAngle) * config.windStrength * (0.8 + Math.random() * 0.4);
    velocities[i3 + 1] = -fallSpeed;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
  }

  return { positions, velocities };
}

const RAIN_VERT = /* glsl */ `
  attribute vec3 aVelocity;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uBoxSize;
  uniform float uPointSize;
  uniform float uWindGustX;
  uniform float uWindGustZ;
  uniform float uWindAngle;  // Base wind direction for consistent rain angle

  void main() {
    float t = uTime * uIntensity;
    float bx = uBoxSize.x;
    float bz = uBoxSize.z;
    float minY = -0.5;
    float maxY = uBoxSize.y + 5.0;
    float yRange = maxY - minY;

    float rawY = position.y + aVelocity.y * t;
    float y = minY + mod(rawY - minY + yRange, yRange);

    // Wind gust adds organic horizontal drift that varies over time
    float gustInfluence = smoothstep(0.0, 0.3, y) * (1.0 - smoothstep(maxY * 0.7, maxY, y));
    // Combine base wind angle with gust for more realistic wind interaction
    float baseWindX = sin(uWindAngle) * 2.0;
    float baseWindZ = cos(uWindAngle) * 0.5;
    float rawX = position.x + aVelocity.x * t + (uWindGustX + baseWindX) * gustInfluence * t;
    float x = mod(rawX + bx * 0.5, bx) - bx * 0.5;

    float rawZ = position.z + aVelocity.z * t + (uWindGustZ + baseWindZ) * gustInfluence * t;
    float z = mod(rawZ + bz * 0.5, bz) - bz * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_PointSize = uPointSize * 300.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RAIN_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const SPLASH_VERT = /* glsl */ `
  attribute float aBirthTime;
  attribute float aBaseSize;

  uniform float uTime;
  uniform float uSplashLifetime;

  void main() {
    float age = uTime - aBirthTime;
    if (age < 0.0 || age > uSplashLifetime) {
      gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    float t = age / uSplashLifetime;
    float size = aBaseSize * t * (1.0 - t * t) * 2.0;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 300.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SPLASH_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Elliptical splash: wider than tall for more realistic crown-splash shape
    vec2 centered = gl_PointCoord - vec2(0.5);
    float elliptical = length(centered * vec2(1.0, 0.6));
    if (elliptical > 0.5) discard;
    // Soft ring: bright ring fading to transparent center (crown splash effect)
    float ring = smoothstep(0.3, 0.42, elliptical) * (1.0 - smoothstep(0.42, 0.5, elliptical));
    float fill = smoothstep(0.5, 0.35, elliptical);
    float alpha = max(ring * 1.4, fill) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** High-performance rain particle system */
export function RainSystem({ intensity = 1 }: { intensity?: number }) {
  const { weatherEnabled: rainEnabled, rainIntensity } = useGlobalWeatherControls();
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const reducedMotion = useEffectiveReducedMotion();

  const effectiveIntensity = intensity * rainIntensity;

  const configLevel = useMemo(
    () => resolveRainLevel(effectiveIntensity),
    [effectiveIntensity],
  );

  const config = useMemo(
    () => buildRainConfig(configLevel, isMobile, visualLite, reducedMotion),
    [configLevel, isMobile, visualLite, reducedMotion],
  );

  const capacityConfig = useMemo(
    () => buildRainConfig('heavy', isMobile, visualLite, reducedMotion),
    [isMobile, visualLite, reducedMotion],
  );

  const maxSplashes = useMemo(
    () => getParticleCount(MAX_SPLASHES_BASE, isMobile, visualLite, effectsScale, reducedMotion),
    [isMobile, visualLite, effectsScale, reducedMotion],
  );

  if (!rainEnabled) return null;

  return (
    <RainParticles
      config={config}
      capacityConfig={capacityConfig}
      intensity={effectiveIntensity}
      maxSplashes={maxSplashes}
    />
  );
}

function RainParticles({
  config,
  capacityConfig,
  intensity,
  maxSplashes,
}: {
  config: RainConfig;
  capacityConfig: RainConfig;
  intensity: number;
  maxSplashes: number;
}) {
  const pointsRef = useRef<Points>(null);
  const splashRef = useRef<Points>(null);
  const timeRef = useRef(0);
  const hasEmittedEvent = useRef(false);
  const splashPoolIdx = useRef(0);
  const splashSpawnAccum = useRef(0);
  const splashDirty = useRef(false);
  const intensityRef = useRef(intensity);

  const [bx, by, bz] = config.boxSize;

  const { rainGeometry, rainMaterial, rainUniforms } = useMemo(() => {
    const maxCount = capacityConfig.count;
    const { positions, velocities } = seedRainBuffers(capacityConfig, maxCount);
    const [cbx, cby, cbz] = capacityConfig.boxSize;

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('aVelocity', new BufferAttribute(velocities, 3));
    geo.setDrawRange(0, 0);

    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uBoxSize: { value: new Vector3(cbx, cby, cbz) },
      uPointSize: { value: capacityConfig.dropLength },
      uColor: { value: new Color(capacityConfig.color) },
      uOpacity: { value: capacityConfig.opacity },
      uWindGustX: { value: 0 },
      uWindGustZ: { value: 0 },
      uWindAngle: { value: capacityConfig.windAngle },
    };

    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms,
      vertexShader: RAIN_VERT,
      fragmentShader: RAIN_FRAG,
    });

    return { rainGeometry: geo, rainMaterial: mat, rainUniforms: uniforms };
  }, [capacityConfig]);

  const { splashGeometry, splashMaterial, splashUniforms, splashAttrs } = useMemo(() => {
    const positions = new Float32Array(maxSplashes * 3);
    const birthTimes = new Float32Array(maxSplashes);
    const baseSizes = new Float32Array(maxSplashes);

    for (let i = 0; i < maxSplashes; i++) {
      birthTimes[i] = -SPLASH_LIFETIME - 1;
      baseSizes[i] = 0;
    }

    const posAttr = new BufferAttribute(positions, 3);
    const birthAttr = new BufferAttribute(birthTimes, 1);
    const sizeAttr = new BufferAttribute(baseSizes, 1);

    const geo = new BufferGeometry();
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aBirthTime', birthAttr);
    geo.setAttribute('aBaseSize', sizeAttr);

    const uniforms = {
      uTime: { value: 0 },
      uSplashLifetime: { value: SPLASH_LIFETIME },
      uColor: { value: new Color('#b0c8e0') },
      uOpacity: { value: 0.4 },
    };

    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms,
      vertexShader: SPLASH_VERT,
      fragmentShader: SPLASH_FRAG,
    });

    return {
      splashGeometry: geo,
      splashMaterial: mat,
      splashUniforms: uniforms,
      splashAttrs: { posAttr, birthAttr, sizeAttr },
    };
  }, [maxSplashes]);

  useEffect(() => {
    return () => {
      rainGeometry.dispose();
      rainMaterial.dispose();
      splashGeometry.dispose();
      splashMaterial.dispose();
    };
  }, [rainGeometry, rainMaterial, splashGeometry, splashMaterial]);

  useEffect(() => {
    if (!hasEmittedEvent.current) {
      eventBus.emit('weather:rain', { active: true, intensity });
      hasEmittedEvent.current = true;
    }
    return () => {
      if (hasEmittedEvent.current) {
        eventBus.emit('weather:rain', { active: false, intensity: 0 });
        hasEmittedEvent.current = false;
      }
    };
  }, [intensity]);

  useEffect(() => {
    rainUniforms.uBoxSize.value.set(bx, by, bz);
    rainUniforms.uPointSize.value = config.dropLength;
    rainUniforms.uColor.value.set(config.color);
    rainGeometry.setDrawRange(0, config.count);

    if (intensityRef.current !== intensity) {
      intensityRef.current = intensity;
      rainUniforms.uIntensity.value = intensity;
      rainUniforms.uOpacity.value = config.opacity * intensity;
    }
  }, [
    rainUniforms,
    rainGeometry,
    bx,
    by,
    bz,
    config.dropLength,
    config.color,
    config.opacity,
    config.count,
    intensity,
  ]);

  useFrameTick('weather', ({ delta }) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const clampedDelta = Math.min(delta, 0.05);

    rainUniforms.uTime.value = t;
    if (intensityRef.current !== intensity) {
      intensityRef.current = intensity;
      rainUniforms.uIntensity.value = intensity;
      splashUniforms.uOpacity.value = 0.4 * intensity;
    }
    const breathe = config.opacity + Math.sin(t * 0.5) * 0.03;
    rainUniforms.uOpacity.value = breathe * intensityRef.current;

    // Dynamic wind gusts — layered sine waves at different frequencies
    // create organic, non-repeating wind patterns
    const gustX = Math.sin(t * 0.12) * 0.8 + Math.sin(t * 0.31) * 0.4 + Math.sin(t * 0.73) * 0.15;
    const gustZ = Math.cos(t * 0.17) * 0.5 + Math.sin(t * 0.41) * 0.25;
    rainUniforms.uWindGustX.value = gustX * intensityRef.current;
    rainUniforms.uWindGustZ.value = gustZ * intensityRef.current;

    splashUniforms.uTime.value = t;

    const spawnRate = config.count * 0.006 * intensity;
    splashSpawnAccum.current += spawnRate * clampedDelta;
    while (splashSpawnAccum.current >= 1) {
      splashSpawnAccum.current -= 1;
      const idx = splashPoolIdx.current % maxSplashes;
      splashPoolIdx.current++;

      const posArr = splashAttrs.posAttr.array as Float32Array;
      const birthArr = splashAttrs.birthAttr.array as Float32Array;
      const sizeArr = splashAttrs.sizeAttr.array as Float32Array;
      const i3 = idx * 3;

      posArr[i3] = (Math.random() - 0.5) * bx;
      posArr[i3 + 1] = 0.02;
      posArr[i3 + 2] = (Math.random() - 0.5) * bz;
      birthArr[idx] = t;
      sizeArr[idx] = 0.1 + Math.random() * 0.15;
      splashDirty.current = true;
    }

    if (splashDirty.current) {
      splashAttrs.posAttr.needsUpdate = true;
      splashAttrs.birthAttr.needsUpdate = true;
      splashAttrs.sizeAttr.needsUpdate = true;
      splashDirty.current = false;
    }
  }, { label: 'RainSystem' });

  return (
    <group>
      <points ref={pointsRef} geometry={rainGeometry} material={rainMaterial} />
      <points ref={splashRef} geometry={splashGeometry} material={splashMaterial} />
    </group>
  );
}
