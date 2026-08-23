/* ─── Volodka RPG – диегетические 3D-маркеры hazard-зон ───
 *
 * Раньше зоны были невидимыми: игрок узнавал об опасности только постфактум
 * (тост/FX после входа). Теперь каждая активная зона имеет дешёвый
 * примитивный маркер — игрок видит опасность ЗАРАНЕЕ:
 *
 *   electric — мерцающие голубые искры + дуговое свечение у панели
 *   toxic    — полупрозрачная зелёная «лужа»-декаль на полу (circle)
 *   fall     — красная полоса с шеврон-разметкой вдоль края крыши
 *   drown    — тёмно-синяя водяная зона с «дыханием» (scale/opacity)
 *   fire     — оранжевое пульсирующее кольцо вокруг костра
 *
 * Все маркеры — примитивы THREE без внешних ассетов (зон всего 5, инстансинг
 * не нужен), материалы MeshBasicMaterial (не зависят от света, читаются как
 * emissive), пульсация — через useFrameTick по фазе.
 *
 * Гейт качества: на low-пресете/visualLite пульсация отключается
 * (useFrameTick не регистрируется) — зоны остаются читаемыми
 * статичными полупрозрачными маркерами.
 */

import { useRef } from 'react';
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { HAZARD_KIND_COLOR, type EnvironmentalHazard } from '@/data/environmentalHazards';

interface HazardZoneMarkerProps {
  hazard: EnvironmentalHazard;
  /** Пульсация — отключается на low-пресете/visualLite (статичные маркеры). */
  pulsate: boolean;
}

/** Диспетчер: одна зона — один маркер своего типа. */
export function HazardZoneMarker({ hazard, pulsate }: HazardZoneMarkerProps) {
  switch (hazard.kind) {
    case 'electric':
      return <ElectricSparksMarker hazard={hazard} pulsate={pulsate} />;
    case 'toxic':
      return <ToxicPuddleMarker hazard={hazard} pulsate={pulsate} />;
    case 'fall':
      return <RooftopEdgeStripeMarker hazard={hazard} pulsate={pulsate} />;
    case 'drown':
      return <DeepWaterMarker hazard={hazard} pulsate={pulsate} />;
    case 'fire':
      return <CampfireRingMarker hazard={hazard} pulsate={pulsate} />;
  }
}

/* ─── Общий хелпер пульсации ────────────────────────────────────────────────
 * Гонит фазу со скоростью speed и раз в кадр вызывает apply(phase).
 * При pulsate=false тик регистрируется сразу выключенным — callback не
 * выполняется вовсе (нулевая стоимость кадра), а JSX-значения материалов
 * остаются статичными. */
function useHazardPulse(
  pulsate: boolean,
  speed: number,
  apply: (phase: number) => void,
): void {
  const phaseRef = useRef(0);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useFrameTick(
    'misc',
    ({ delta }) => {
      phaseRef.current += delta * speed;
      applyRef.current(phaseRef.current);
    },
    { enabled: pulsate, label: 'hazard-marker-pulse' },
  );
}

/* ─── Электричество: мерцающие искры + дуговое свечение ─────────────────── */

/** Геометрия искр внутри триггер-AABB (высоко у панели, слабый разброс). */
const ELECTRIC_SPARKS = [
  { pos: [-0.45, 0.95, 0.2], freq: 11.3, offset: 0.0, size: 0.032 },
  { pos: [0.3, 1.2, -0.25], freq: 8.7, offset: 2.1, size: 0.04 },
  { pos: [-0.15, 1.45, 0.35], freq: 13.1, offset: 4.2, size: 0.026 },
  { pos: [0.42, 1.6, 0.1], freq: 9.9, offset: 1.3, size: 0.03 },
] as const;

function ElectricSparksMarker({ hazard, pulsate }: HazardZoneMarkerProps) {
  const color = HAZARD_KIND_COLOR.electric;
  const sparkMatRefs = useRef<Array<MeshBasicMaterial | null>>([]);
  const glowMatRef = useRef<MeshBasicMaterial>(null);

  useHazardPulse(pulsate, 1, (phase) => {
    // Каждая искра мерцает со своей частотой; max(0, sin) даёт «бликовый»
    // ритм настоящего короткого замыкания, а не плавный маяк.
    for (let i = 0; i < ELECTRIC_SPARKS.length; i++) {
      const mat = sparkMatRefs.current[i];
      if (!mat) continue;
      const spark = ELECTRIC_SPARKS[i];
      const flicker = Math.max(0, Math.sin(phase * spark.freq + spark.offset));
      mat.opacity = 0.25 + flicker * 0.65;
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = 0.16 + Math.max(0, Math.sin(phase * 5.3)) * 0.14;
    }
  });

  return (
    <group position={hazard.position}>
      {ELECTRIC_SPARKS.map((spark, i) => (
        <mesh key={i} position={[spark.pos[0], spark.pos[1], spark.pos[2]]} renderOrder={3}>
          <sphereGeometry args={[spark.size, 8, 6]} />
          <meshBasicMaterial
            ref={(mat) => { sparkMatRefs.current[i] = mat; }}
            color={color}
            transparent
            opacity={0.7}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Дуговое свечение — мягкая сфера-нимб в центре скопления искр. */}
      <mesh position={[0, 1.25, 0]} renderOrder={3}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={color}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Токсичная лужа: зелёная декаль на полу с пульсом ───────────────────── */

function ToxicPuddleMarker({ hazard, pulsate }: HazardZoneMarkerProps) {
  const color = HAZARD_KIND_COLOR.toxic;
  // Радиус лужи — по меньшей полуоси триггера (круг вписан в зону).
  const radius = Math.min(hazard.halfExtents[0], hazard.halfExtents[2]);
  const puddleMatRef = useRef<MeshBasicMaterial>(null);
  const rimMatRef = useRef<MeshBasicMaterial>(null);

  useHazardPulse(pulsate, 1.3, (phase) => {
    const pulse = 0.5 + 0.5 * Math.sin(phase);
    if (puddleMatRef.current) puddleMatRef.current.opacity = 0.22 + pulse * 0.08;
    if (rimMatRef.current) rimMatRef.current.opacity = 0.1 + pulse * 0.12;
  });

  return (
    <group position={hazard.position}>
      {/* Сама лужа — полупрозрачный круг чуть выше пола. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={2}>
        <circleGeometry args={[radius, 24]} />
        <meshBasicMaterial
          ref={puddleMatRef}
          color={color}
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>
      {/* Край разлива — тонкое кольцо, обозначающее границу зоны. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} renderOrder={2}>
        <ringGeometry args={[radius * 0.94, radius, 24]} />
        <meshBasicMaterial
          ref={rimMatRef}
          color={color}
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Край крыши: красная полоса с шеврон-разметкой опасности ────────────── */

function RooftopEdgeStripeMarker({ hazard, pulsate }: HazardZoneMarkerProps) {
  const color = HAZARD_KIND_COLOR.fall;
  const [halfX, , halfZ] = hazard.halfExtents;
  const stripWidth = halfX * 2;
  const stripDepth = halfZ * 2;
  // Диагональные шевроны вдоль всей полосы — как промышленная разметка.
  const chevronCount = Math.max(3, Math.round(stripWidth / 0.85));
  const chevronMatRefs = useRef<Array<MeshBasicMaterial | null>>([]);

  useHazardPulse(pulsate, 2.2, (phase) => {
    const pulse = 0.5 + 0.5 * Math.sin(phase);
    for (const mat of chevronMatRefs.current) {
      if (mat) mat.opacity = 0.3 + pulse * 0.25;
    }
  });

  return (
    <group position={hazard.position}>
      {/* Базовая красная полоса по всей площади триггера. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} renderOrder={2}>
        <planeGeometry args={[stripWidth, stripDepth]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.13}
          depthWrite={false}
        />
      </mesh>
      {/* Шевроны — плоские диагональные штрихи поверх полосы (общая пульсация). */}
      {Array.from({ length: chevronCount }, (_, i) => {
        const x = -halfX + (stripWidth / (chevronCount - 1)) * i;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, Math.PI / 4]}
            position={[x, 0.035, 0]}
            renderOrder={3}
          >
            <planeGeometry args={[0.14, stripDepth * 0.85]} />
            <meshBasicMaterial
              ref={(mat) => { chevronMatRefs.current[i] = mat; }}
              color={color}
              transparent
              opacity={0.42}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ─── Глубокая вода: тёмно-синяя зона с волновым «дыханием» ─────────────── */

function DeepWaterMarker({ hazard, pulsate }: HazardZoneMarkerProps) {
  const color = HAZARD_KIND_COLOR.drown;
  const [halfX, , halfZ] = hazard.halfExtents;
  const waterMatRef = useRef<MeshBasicMaterial>(null);
  const shimmerMatRef = useRef<MeshBasicMaterial>(null);
  const waterMeshRef = useRef<Mesh>(null);

  useHazardPulse(pulsate, 1.1, (phase) => {
    const wave = Math.sin(phase);
    if (waterMatRef.current) waterMatRef.current.opacity = 0.3 + wave * 0.08;
    // Лёгкое «дыхание» масштаба — вода как будто колышится.
    if (waterMeshRef.current) {
      const scale = 1 + wave * 0.025;
      waterMeshRef.current.scale.set(scale, 1, scale);
    }
    // Верхний «блик» — в противофазе с глубиной: мерцание поверхности.
    if (shimmerMatRef.current) shimmerMatRef.current.opacity = 0.07 - wave * 0.05;
  });

  return (
    <group position={hazard.position}>
      {/* Тёмная толща воды — прямоугольник по границам триггера. */}
      <mesh
        ref={waterMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[halfX * 2, halfZ * 2]} />
        <meshBasicMaterial
          ref={waterMatRef}
          color="#12315e"
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </mesh>
      {/* Светящийся блик поверхности — чуть меньше зоны, additive. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} renderOrder={2}>
        <planeGeometry args={[halfX * 1.6, halfZ * 1.6]} />
        <meshBasicMaterial
          ref={shimmerMatRef}
          color={color}
          transparent
          opacity={0.07}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Огонь костра: оранжевое пульсирующее кольцо по периметру ───────────── */

function CampfireRingMarker({ hazard, pulsate }: HazardZoneMarkerProps) {
  const color = HAZARD_KIND_COLOR.fire;
  // Костёр-проп рендерится сценой — добавляем только danger-кольцо.
  const ringMatRef = useRef<MeshBasicMaterial>(null);
  const outerMatRef = useRef<MeshBasicMaterial>(null);

  useHazardPulse(pulsate, 3.2, (phase) => {
    const heat = 0.5 + 0.5 * Math.sin(phase);
    if (ringMatRef.current) ringMatRef.current.opacity = 0.26 + heat * 0.2;
    if (outerMatRef.current) outerMatRef.current.opacity = 0.06 + heat * 0.08;
  });

  return (
    <group position={hazard.position}>
      {/* Основное danger-кольцо вокруг костра. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} renderOrder={3}>
        <ringGeometry args={[0.5, 0.82, 24]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={0.34}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      {/* Внешний жар-ореол — мягкое свечение по периметру зоны. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]} renderOrder={2}>
        <ringGeometry args={[0.88, 1.04, 24]} />
        <meshBasicMaterial
          ref={outerMatRef}
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
