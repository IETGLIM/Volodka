import { Box3, Vector3, type Object3D } from 'three';

/**
 * Нормализует **локальный** масштаб объекта по AABB так, чтобы высота стала `targetHeight` (метры сцены).
 * Сохраняет пропорции при `preserveAspect === true` (uniform scale).
 *
 * Вызывать после того, как у объекта заполнена иерархия мешей; перед измерением выполняется `updateMatrixWorld(true)`.
 * Не трогает `position` / `rotation` — только `scale` (умножает текущий масштаб).
 */
export function normalizePropHeight(
  object: Object3D,
  targetHeight: number = 1.0,
  preserveAspect: boolean = true,
): void {
  if (!Number.isFinite(targetHeight) || targetHeight <= 0) return;

  object.updateMatrixWorld(true);
  const bbox = new Box3().setFromObject(object);
  const size = new Vector3();
  bbox.getSize(size);

  if (!Number.isFinite(size.y) || size.y <= 1e-6) return;

  const scaleFactor = targetHeight / size.y;
  if (preserveAspect) {
    object.scale.multiplyScalar(scaleFactor);
  } else {
    object.scale.y *= scaleFactor;
  }
}

export function getModelDimensions(object: Object3D): { width: number; height: number; depth: number } {
  object.updateMatrixWorld(true);
  const bbox = new Box3().setFromObject(object);
  const size = new Vector3();
  bbox.getSize(size);
  return { width: size.x, height: size.y, depth: size.z };
}

/** Минимальный размер по любой оси AABB (м) — для uniform-масштаба по «габариту», не по высоте. */
export function normalizePropMaxExtent(
  object: Object3D,
  targetMaxExtentM: number,
  preserveAspect: boolean = true,
): void {
  if (!Number.isFinite(targetMaxExtentM) || targetMaxExtentM <= 0) return;

  object.updateMatrixWorld(true);
  const bbox = new Box3().setFromObject(object);
  const size = new Vector3();
  bbox.getSize(size);
  const max = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(max) || max <= 1e-6) return;

  const scaleFactor = targetMaxExtentM / max;
  if (preserveAspect) {
    object.scale.multiplyScalar(scaleFactor);
  } else {
    const ax = size.x >= max - 1e-6;
    const ay = size.y >= max - 1e-6;
    const az = size.z >= max - 1e-6;
    if (ax) object.scale.x *= scaleFactor;
    if (ay) object.scale.y *= scaleFactor;
    if (az) object.scale.z *= scaleFactor;
  }
}
