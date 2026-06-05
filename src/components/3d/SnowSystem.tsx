
/* ─── Volodka RPG – AAA Snow Particle System ───
 *  GPU-driven snow via vertex shader (uTime uniform only per frame)
 *  Organic drift encoded in aPhase attribute
 *  Adaptive particle counts for mobile / desktop
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/** Snow configuration */
interface SnowConfig {
  count: number;
  boxSize: [number, number, number];
  fallSpeedRange: [number, number];
  driftStrength: number;
  driftFrequency: number;
  sizeRange: [number, number];
  opacity: number;
  color: string;
}

type SnowLevel = 'light' | 'medium' | 'heavy';

const SNOW_BASE: Record<SnowLevel, Omit<SnowConfig, 'count'>> = {
  light: {
    boxSize: [40, 25, 40],
    fallSpeedRange: [0.3, 0.7],
    driftStrength: 0.6,
    driftFrequency: 0.4,
    sizeRange: [0.05, 0.12],
    opacity: 0.7,
    color: '#f0f0ff',
  },
  medium: {
    boxSize: [45, 28, 45],
    fallSpeedRange: [0.4, 0.9],
    driftStrength: 0.8,
    driftFrequency: 0.35,
    sizeRange: [0.06, 0.15],
    opacity: 0.8,
    color: '#e8e8f8',
  },
  heavy: {
    boxSize: [50, 30, 50],
    fallSpeedRange: [0.5, 1.2],
    driftStrength: 1.0,
    driftFrequency: 0.3,
    sizeRange: [0.07, 0.18],
    opacity: 0.85,
    color: '#dde0f0',
  },
};

const DESKTOP_COUNTS: Record<SnowLevel, number> = {
  light: 4000,
  medium: 7000,
  heavy: 10000,
};

function buildSnowConfig(level: SnowLevel, isMobile: boolean, visualLite: boolean): SnowConfig {
  return {
    ...SNOW_BASE[level],
    count: getParticleCount(DESKTOP_COUNTS[level], isMobile, visualLite),
  };
}

const SNOW_VERT = /* glsl */ `
  attribute vec3 aVelocity;
  attribute float aPhase;
  attribute float aSize;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uBoxSize;
  uniform float uDriftStrength;
  uniform float uDriftFrequency;

  void main() {
    float t = uTime * uIntensity;
    float bx = uBoxSize.x;
    float bz = uBoxSize.z;
    float minY = -0.5;
    float maxY = uBoxSize.y + 3.0;
    float yRange = maxY - minY;

    float rawY = position.y + aVelocity.y * t;
    float y = minY + mod(rawY - minY + yRange, yRange);

    float driftX = sin(t * uDriftFrequency + aPhase) * uDriftStrength;
    float driftZ = cos(t * uDriftFrequency * 0.7 + aPhase * 1.3) * uDriftStrength * 0.6;
    float wobbleY = sin(t * uDriftFrequency * 1.5 + aPhase * 2.1) * 0.08;

    float rawX = position.x + aVelocity.x * t + driftX;
    float x = mod(rawX + bx * 0.5, bx) - bx * 0.5;

    float rawZ = position.z + aVelocity.z * t + driftZ;
    float z = mod(rawZ + bz * 0.5, bz) - bz * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(x, y + wobbleY, z, 1.0);
    gl_PointSize = aSize * 300.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SNOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** High-performance snow particle system */
export function SnowSystem({ intensity = 1 }: { intensity?: number }) {
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const isMobile = useIsMobileVisual();
  const { visualLite } = useMobileVisualPerf();

  const configLevel = useMemo(() => {
    const effective = intensity * rainIntensity;
    if (effective < 0.33) return 'light' as const;
    if (effective < 0.66) return 'medium' as const;
    return 'heavy' as const;
  }, [intensity, rainIntensity]);

  const config = useMemo(
    () => buildSnowConfig(configLevel, isMobile, visualLite),
    [configLevel, isMobile, visualLite],
  );

  if (!weatherEnabled) return null;

  return <SnowParticles config={config} intensity={intensity * rainIntensity} />;
}

function SnowParticles({ config, intensity }: { config: SnowConfig; intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const hasEmittedEvent = useRef(false);

  const [bx, by, bz] = config.boxSize;

  const { snowGeometry, snowMaterial, snowUniforms } = useMemo(() => {
    const count = config.count;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * bx;
      positions[i3 + 1] = Math.random() * by;
      positions[i3 + 2] = (Math.random() - 0.5) * bz;

      const fallSpeed =
        config.fallSpeedRange[0] +
        Math.random() * (config.fallSpeedRange[1] - config.fallSpeedRange[0]);
      velocities[i3] = (Math.random() - 0.5) * 0.3;
      velocities[i3 + 1] = -fallSpeed;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;

      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] =
        config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uBoxSize: { value: new THREE.Vector3(bx, by, bz) },
      uDriftStrength: { value: config.driftStrength },
      uDriftFrequency: { value: config.driftFrequency },
      uColor: { value: new THREE.Color(config.color) },
      uOpacity: { value: config.opacity * intensity },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms,
      vertexShader: SNOW_VERT,
      fragmentShader: SNOW_FRAG,
    });

    return { snowGeometry: geo, snowMaterial: mat, snowUniforms: uniforms };
  }, [config, bx, by, bz, intensity]);

  useEffect(() => {
    return () => {
      snowGeometry.dispose();
      snowMaterial.dispose();
    };
  }, [snowGeometry, snowMaterial]);

  useEffect(() => {
    if (!hasEmittedEvent.current) {
      eventBus.emit('weather:snow', { active: true, intensity });
      hasEmittedEvent.current = true;
    }
    return () => {
      if (hasEmittedEvent.current) {
        eventBus.emit('weather:snow', { active: false, intensity: 0 });
        hasEmittedEvent.current = false;
      }
    };
  }, [intensity]);

  useEffect(() => {
    snowUniforms.uBoxSize.value.set(bx, by, bz);
    snowUniforms.uDriftStrength.value = config.driftStrength;
    snowUniforms.uDriftFrequency.value = config.driftFrequency;
    snowUniforms.uColor.value.set(config.color);
  }, [snowUniforms, bx, by, bz, config.driftStrength, config.driftFrequency, config.color]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    snowUniforms.uTime.value = t;
    snowUniforms.uIntensity.value = intensity;
    const breathe = config.opacity + Math.sin(t * 0.3) * 0.05;
    snowUniforms.uOpacity.value = breathe * intensity;
  });

  return <points ref={pointsRef} geometry={snowGeometry} material={snowMaterial} />;
}
