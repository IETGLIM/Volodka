/* ─── Volodka RPG – AAA Cinematic Atmosphere ───
 * Luxurious, filmi atmosphere layer: volumetric dust motes,
 * soft light scattering, air dust, subtle bokeh, god-ray dust.
 * Designed to make every scene feel alive, not sterile plastic.
 *
 * Gated on quality preset + reduced motion.
 *
 * PERF (v4.40): DustMoteCloud/HeroGodRayDust переведены с N отдельных
 * <mesh> (68-92 + 18 на hero-сценах, у каждого свой MeshBasicMaterial)
 * на одно THREE.Points-облако на слой. Раньше тик каждый кадр мутировал
 * position + material.opacity каждого меша: ~110 draw call'ов и ~110
 * пер-кадровых записей материалов + грязные world-матрицы.
 * Теперь дрейф считается в вершинном шейдере по uTime — CPU-тик пишет
 * только один uniform float, рендер — 1 draw call на слой.
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Points,
  ShaderMaterial,
} from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { isHeroScene } from '@/config/sceneVisualProfiles';
import type { SceneId } from '@/shared/types/game';

interface DustMoteParams {
  count: number;
  color: string;
  /** vertical / horizontal drift amplitudes (m) */
  ampY: number;
  ampXZ: number;
  /** opacity pulse: base + amp * sin(t * 0.4 + phase) */
  opacityBase: number;
  opacityAmp: number;
  /** world-space spread: [width, height, depth] */
  spread: [number, number, number];
  /** deterministic seed from scene id */
  seed: number;
  /** point sprite pixel scale (diameter-based perspective attenuation) */
  pointScale: number;
}

function buildDustGeometry(params: DustMoteParams): BufferGeometry {
  const { count, seed, spread } = params;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const opacities = new Float32Array(count);
  const drifts = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r1 = Math.sin((seed + i * 137.5) % 100) * 0.5 + 0.5;
    const r2 = Math.cos((seed + i * 271.3) % 100) * 0.5 + 0.5;
    const r3 = Math.sin((seed + i * 91.7) % 100 + 1.2) * 0.5 + 0.5;
    positions[i * 3] = (r1 - 0.5) * spread[0];
    positions[i * 3 + 1] = r2 * spread[1] + 0.1;
    positions[i * 3 + 2] = (r3 - 0.5) * spread[2];
    sizes[i] = 0.012 + r1 * 0.028;
    phases[i] = r3 * Math.PI * 2;
    opacities[i] = 0.12 + r2 * 0.24;
    drifts[i] = 0.08 + r2 * 0.22;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new BufferAttribute(phases, 1));
  geo.setAttribute('aOpacity', new BufferAttribute(opacities, 1));
  geo.setAttribute('aDrift', new BufferAttribute(drifts, 1));
  return geo;
}

function buildDustMaterial(params: DustMoteParams): ShaderMaterial {
  const vertexShader = /* glsl */ `
    uniform float uTime;
    attribute float aSize;
    attribute float aPhase;
    attribute float aOpacity;
    attribute float aDrift;
    varying float vOpacity;
    varying float vPhase;

    void main() {
      vec3 p = position;
      float t = uTime;
      // Дрейф 1:1 с прежней CPU-симуляцией (AaaCinematicAtmosphere v4.39)
      p.y += sin(t * aDrift * 0.3 + aPhase) * ${params.ampY.toFixed(4)};
      p.x += sin(t * aDrift * 0.14 + aPhase * 1.3) * ${params.ampXZ.toFixed(4)};
      p.z += cos(t * aDrift * 0.11 + aPhase * 0.7) * ${params.ampXZ.toFixed(4)};
      vOpacity = aOpacity;
      vPhase = aPhase;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      // Перспективное затухание размера (близко — крупнее)
      gl_PointSize = aSize * ${params.pointScale.toFixed(1)} / max(0.1, -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacityBase;
    uniform float uOpacityAmp;
    varying float vOpacity;
    varying float vPhase;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      // Мягкая круглая частица (радиальный спад) — аналог прежних сфер
      float falloff = smoothstep(0.5, 0.06, d);
      float pulse = uOpacityBase + uOpacityAmp * sin(uTime * 0.4 + vPhase);
      float alpha = vOpacity * pulse * falloff;
      if (alpha < 0.012) discard;
      gl_FragColor = vec4(uColor, alpha);
    }
  `;

  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(params.color) },
      uOpacityBase: { value: params.opacityBase },
      uOpacityAmp: { value: params.opacityAmp },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

interface DustPointsProps {
  params: DustMoteParams;
}

/**
 * Одно Points-облако: 1 draw call, дрейф в вершинном шейдере по uTime,
 * пер-кадровая CPU-работа = запись одного uniform-флоата.
 */
function DustPoints({ params }: DustPointsProps) {
  const geo = useMemo(() => buildDustGeometry(params), [params]);
  const material = useMemo(() => buildDustMaterial(params), [params]);
  const pointsRef = useRef<Points>(null);

  // Дискретный тик: только uTime (остальное делает GPU).
  useFrameTick('misc', ({ delta }) => {
    material.uniforms.uTime.value += delta;
  });

  // Клим самому — R3F не диспозит императивно созданные ресурсы.
  useEffect(() => {
    return () => {
      geo.dispose();
      material.dispose();
    };
  }, [geo, material]);

  return (
    <points
      ref={pointsRef}
      geometry={geo}
      material={material}
      frustumCulled={false}
    />
  );
}

export function AaaCinematicAtmosphere() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId) as SceneId;
  const { preset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();

  const isLow = preset.id === 'low';
  const isHero = isHeroScene(sceneId);
  // AAA boost: much denser, luxurious dust for hero scenes (feels like real air + light)
  const count = isHero
    ? (preset.id === 'ultra' ? 92 : preset.id === 'high' ? 68 : 38)
    : (preset.id === 'ultra' ? 52 : 28);

  const seed = sceneId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const isIndoor = !sceneId.includes('street') && !sceneId.includes('park') && !sceneId.includes('pier') && !sceneId.includes('rooftop');

  const dustParams: DustMoteParams = useMemo(() => ({
    count,
    color: sceneId.includes('volodka_room') || sceneId.includes('library')
      ? '#ffddb0'
      : sceneId.includes('cafe') || sceneId.includes('home')
        ? '#ffcc88'
        : '#d8e0f0',
    ampY: 0.12,
    ampXZ: 0.08,
    opacityBase: 0.7,
    opacityAmp: 0.3,
    spread: [isIndoor ? 8 : 18, isIndoor ? 2.6 : 5.5, isIndoor ? 8 : 18],
    seed,
    pointScale: 1800,
  }), [count, sceneId, isIndoor, seed]);

  if (isLow || reducedMotion) return null;

  return (
    <group key={`aaa-atmo-${sceneId}`}>
      <DustPoints params={dustParams} />
      <SoftVolumetricGlow sceneId={sceneId} />
      {/* Extra subtle god-ray dust layer on hero interiors for maximum cinematic depth */}
      {isHero && (preset.id === 'high' || preset.id === 'ultra') && (
        <HeroGodRayDust />
      )}
    </group>
  );
}

function SoftVolumetricGlow({ sceneId }: { sceneId: string }) {
  const isIndoor = !sceneId.includes('street') && !sceneId.includes('park') && !sceneId.includes('pier') && !sceneId.includes('river') && !sceneId.includes('rooftop');
  if (!isIndoor) return null;

  // Very soft volumetric glow cards — cheap fog planes that catch light
  return (
    <group>
      <mesh position={[0, 1.6, 0]} rotation-x={-0.15}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="#0a0a16" transparent opacity={0.04} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[9, 24]} />
        <meshBasicMaterial color={sceneId === 'volodka_room' ? '#1a1420' : '#0c0c18'} transparent opacity={0.06} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Extra god-ray dust for hero interiors — makes light shafts feel alive and thick (AAA)
 *  PERF (v4.40): 18 мешей → одно Points-облако (шейдерный дрейф, 1 draw call). */
function HeroGodRayDust() {
  const params: DustMoteParams = useMemo(() => ({
    count: 18,
    color: '#e8d8b0',
    ampY: 0.25,
    ampXZ: 0.1,
    opacityBase: 0.22,
    opacityAmp: 0.12,
    spread: [4.4, 2.1, 3.6],
    seed: 7.3,
    pointScale: 1800,
  }), []);

  return <DustPoints params={params} />;
}
