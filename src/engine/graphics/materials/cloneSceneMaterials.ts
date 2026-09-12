import { Material, Mesh, Object3D } from 'three';

/**
 * Клонировать материалы сцены ДО любых мутаций (tint / deplasticize / glow).
 *
 * SkeletonUtils.clone() и Object3D.clone() шарят материалы с кэшированной
 * сценой useGLTF, а NPC-риги переиспользуются несколькими персонажами.
 * Мутация общего материала заражает кэш и остальные живые клоны:
 *  • tint/glow одного NPC «протекает» на других NPC на том же риге;
 *  • roughnessMul применяется повторно на каждом маунте → дрейф параметров.
 *
 * Утилита заменяет каждый материал на уникальный клон. Связи «несколько мешей
 * → один материал» внутри клона сохраняются (Map-дедупликация), поэтому
 * количество уникальных шейдер-программ не растёт.
 *
 * Клонированные материалы НЕ входят в skip-сет исходной сцены, поэтому
 * dispose-инфраструктура (disposeSkinnedClone + createSourceSkipSet)
 корректно освободит их при unmount, не тронув кэш.
 */
export function cloneSceneMaterials(
  root: Object3D,
  /** Опциональная трансформация каждого клона (например, апгрейд до
   *  MeshPhysicalMaterial). Если возвращает ДРУГОЙ материал — промежуточный
   *  клон освобождается автоматически. */
  transform?: (cloned: Material, source: Material) => Material,
): void {
  const matMap = new Map<Material, Material>();

  const resolveClone = (source: Material): Material => {
    const cached = matMap.get(source);
    if (cached) return cached;

    let next = source.clone();
    if (transform) {
      const transformed = transform(next, source);
      if (transformed !== next) {
        // Трансформация вернула новый материал (например, Physical-апгрейд) —
        // освобождаем промежуточный клон, чтобы не течь.
        next.dispose();
        next = transformed;
      }
    }
    matMap.set(source, next);
    return next;
  };

  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => (m ? resolveClone(m) : m));
    } else if (mesh.material) {
      mesh.material = resolveClone(mesh.material);
    }
  });
}
