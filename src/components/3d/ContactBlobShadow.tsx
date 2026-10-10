import { useMemo } from 'react';
import { AdditiveBlending, CanvasTexture, LinearFilter } from 'three';

/**
 * PERF (v4.40, этап 28): контакт-блоб вместо point-light cube-теней.
 *
 * Раньше визуалы сцен захардкоживали pointLight с castShadow: каждая такая
 * лампа рендерила сцену 6 раз за кадр (кубическая теневая карта, 256²) —
 * 13 ламп ≈ до 78 лишних проходов рендера сцены. Теперь лампы светят без
 * теней, а «привязка к земле» под ключевой мебелью даётся дешёвым блобом:
 * один меш с общей радиальной текстурой, ноль света, ноль теневых карт.
 *
 * Текстура — модульный синглтон: все блобы сцены делят одну CanvasTexture.
 */

let sharedBlobTexture: CanvasTexture | null = null;

function getSharedBlobTexture(): CanvasTexture {
  if (sharedBlobTexture) return sharedBlobTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // Радиальный градиент: плотная середина → прозрачный край (мягкий контакт).
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  sharedBlobTexture = new CanvasTexture(canvas);
  sharedBlobTexture.minFilter = LinearFilter;
  sharedBlobTexture.magFilter = LinearFilter;
  sharedBlobTexture.generateMipmaps = false;
  return sharedBlobTexture;
}

interface ContactBlobShadowProps {
  position: [number, number, number];
  /** Радиус пятна в метрах. */
  radius?: number;
  /** Множитель непрозрачности (0-1). */
  opacity?: number;
  /** Эллиптичность: растяжка по X/Z (по умолчанию круг). */
  scaleXZ?: [number, number];
}

/** Дешёвая «контактная тень» под мебелью/NPC: без света, без теневых карт. */
export function ContactBlobShadow({
  position,
  radius = 0.9,
  opacity = 1,
  scaleXZ = [1, 1],
}: ContactBlobShadowProps) {
  const texture = useMemo(() => getSharedBlobTexture(), []);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[radius * scaleXZ[0], radius * scaleXZ[1], 1]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        colorWrite
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

/** Яркий световой пул под лампой (аддитивный) — читается как свет лампы на полу,
 *  когда у лампы отключены тени. Общая текстура с ContactBlobShadow. */
export function LightPoolDecal({
  position,
  radius = 1.6,
  opacity = 0.32,
  color = '#ffcc80',
  scaleXZ = [1, 1],
}: ContactBlobShadowProps & { color?: string }) {
  const texture = useMemo(() => getSharedBlobTexture(), []);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[radius * scaleXZ[0], radius * scaleXZ[1], 1]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
        color={color}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

/** Тестовый доступ к синглтону текстуры (сброс между тест-средами). */
export function resetContactBlobTextureForTests(): void {
  sharedBlobTexture?.dispose();
  sharedBlobTexture = null;
}
