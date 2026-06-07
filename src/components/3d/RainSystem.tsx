
/* ─── Volodka RPG – AAA Rain Particle System ───
 *  GPU-driven rain via vertex shader (uTime uniform only per frame)
 *  Adaptive particle counts for mobile / desktop
 *  Probabilistic ground splashes with shader-based expansion
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGlobalWeatherControls } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

/** Rain configuration */
interface RainConfig {
  count: number;
  boxSize: [number, number, number];
  fallSpeedRange: [number, number];
  windAngle: number;
  windStrength: number;
  dropLength: number;
  color: string;
  opacity: number;
}

type RainLevel = 'light' | 'medium' | 'heavy';

const RAIN_BASE: Record<RainLevel, Omit<RainConfig, 'count'>> = {
  light: {
    boxSize: [30, 25, 30],
    fallSpeedRange: [10, 14],
    windAngle: 0.1,
    windStrength: 1.5,
    dropLength: 0.4,
    color: '#a8c0d8',
    opacity: 0.35,
  },
  medium: {
    boxSize: [40, 28, 40],
    fallSpeedRange: [12, 18],
    windAngle: 0.15,
    windStrength: 2.5,
    dropLength: 0.5,
    color: '#9ab4cc',
    opacity: 0.45,
  },
  heavy: {
    boxSize: [50, 30, 50],
    fallSpeedRange: [14, 22],
    windAngle: 0.2,
    windStrength: 3.5,
    dropLength: 0.6,
    color: '#88a8c4',
    opacity: 0.55,
  },
};

/** Desktop particle counts — medium rain: 5000 */
const DESKTOP_COUNTS: Record<RainLevel, number> = {
  light: 3000,
  medium: 5000,
  heavy: 7000,
};

/** Mobile particle counts — medium rain: 2000 */
const MOBILE_COUNTS: Record<RainLevel, number> = {
  light: 1200,
  medium: 2000,
  heavy: 2800,
};

const MAX_SPLASHES_BASE = 300;
const SPLASH_LIFETIME = 0.4;

function buildRainConfig(level: RainLevel, isMobile: boolean, visualLite: boolean): RainConfig {
  const desktop = DESKTOP_COUNTS[level];
  const mobile = MOBILE_COUNTS[level];
  const count = visualLite
    ? getParticleCount(isMobile ? mobile : desktop, false, true)
    : isMobile
      ? mobile
      : desktop;

  return {
    ...RAIN_BASE[level],
    count,
  };
}

const RAIN_VERT = /* glsl */ `
  attribute vec3 aVelocity;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uBoxSize;
  uniform float uPointSize;

  void main() {
    float t = uTime * uIntensity;
    float bx = uBoxSize.x;
    float bz = uBoxSize.z;
    float minY = -0.5;
    float maxY = uBoxSize.y + 5.0;
    float yRange = maxY - minY;

    float rawY = position.y + aVelocity.y * t;
    float y = minY + mod(rawY - minY + yRange, yRange);

    float rawX = position.x + aVelocity.x * t;
    float x = mod(rawX + bx * 0.5, bx) - bx * 0.5;

    float rawZ = position.z + aVelocity.z * t;
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
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.2, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** High-performance rain particle system */
export function RainSystem({ intensity = 1 }: { intensity?: number }) {
  const { weatherEnabled: rainEnabled, rainIntensity } = useGlobalWeatherControls();
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();

  const configLevel = useMemo(() => {
    const effectiveIntensity = intensity * rainIntensity;
    if (effectiveIntensity < 0.33) return 'light' as const;
    if (effectiveIntensity < 0.66) return 'medium' as const;
    return 'heavy' as const;
  }, [intensity, rainIntensity]);

  const config = useMemo(
    () => buildRainConfig(configLevel, isMobile, visualLite),
    [configLevel, isMobile, visualLite],
  );

  const maxSplashes = useMemo(
    () => getParticleCount(MAX_SPLASHES_BASE, isMobile, visualLite, effectsScale),
    [isMobile, visualLite, effectsScale],
  );

  if (!rainEnabled) return null;

  return (
    <RainParticles
      config={config}
      intensity={intensity * rainIntensity}
      maxSplashes={maxSplashes}
    />
  );
}

function RainParticles({
  config,
  intensity,
  maxSplashes,
}: {
  config: RainConfig;
  intensity: number;
  maxSplashes: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const splashRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const hasEmittedEvent = useRef(false);
  const splashPoolIdx = useRef(0);
  const splashSpawnAccum = useRef(0);
  const splashDirty = useRef(false);

  const [bx, by, bz] = config.boxSize;

  const { rainGeometry, rainMaterial, rainUniforms } = useMemo(() => {
    const count = config.count;
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

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));

    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uBoxSize: { value: new THREE.Vector3(bx, by, bz) },
      uPointSize: { value: config.dropLength },
      uColor: { value: new THREE.Color(config.color) },
      uOpacity: { value: config.opacity * intensity },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms,
      vertexShader: RAIN_VERT,
      fragmentShader: RAIN_FRAG,
    });

    return { rainGeometry: geo, rainMaterial: mat, rainUniforms: uniforms };
  }, [config, bx, by, bz, intensity]);

  const { splashGeometry, splashMaterial, splashUniforms, splashAttrs } = useMemo(() => {
    const positions = new Float32Array(maxSplashes * 3);
    const birthTimes = new Float32Array(maxSplashes);
    const baseSizes = new Float32Array(maxSplashes);

    for (let i = 0; i < maxSplashes; i++) {
      birthTimes[i] = -SPLASH_LIFETIME - 1;
      baseSizes[i] = 0;
    }

    const posAttr = new THREE.BufferAttribute(positions, 3);
    const birthAttr = new THREE.BufferAttribute(birthTimes, 1);
    const sizeAttr = new THREE.BufferAttribute(baseSizes, 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aBirthTime', birthAttr);
    geo.setAttribute('aBaseSize', sizeAttr);

    const uniforms = {
      uTime: { value: 0 },
      uSplashLifetime: { value: SPLASH_LIFETIME },
      uColor: { value: new THREE.Color('#b0c8e0') },
      uOpacity: { value: 0.4 * intensity },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
  }, [maxSplashes, intensity]);

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
  }, [rainUniforms, bx, by, bz, config.dropLength, config.color]);

  useFrameTick('weather', ({ delta }) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const clampedDelta = Math.min(delta, 0.05);

    rainUniforms.uTime.value = t;
    rainUniforms.uIntensity.value = intensity;
    const breathe = config.opacity + Math.sin(t * 0.5) * 0.03;
    rainUniforms.uOpacity.value = breathe * intensity;

    splashUniforms.uTime.value = t;
    splashUniforms.uOpacity.value = 0.4 * intensity;

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
