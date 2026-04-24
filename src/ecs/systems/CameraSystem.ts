import type { ISystem, SystemContext } from '@/shared/ecs';
import * as THREE from 'three';

/**
 * Эталонное смещение камеры от цели в локальной системе «сзади + чуть выше глаз» (м).
 * Сейчас TPS реализован орбитой в `FollowCamera` и числовыми пресетами в `RPGGameCanvas`;
 * при переносе в ECS — строить world-space target из yaw игрока и этого вектора (без bbox-масштаба модели).
 */
export const EXPLORATION_TPS_CAMERA_OFFSET_LOCAL_M = new THREE.Vector3(0, 1.6, 4);

/**
 * Только чтение позиции из Rapier (`rigidBody.translation()` / rotation) → цель камеры.
 * Запрещено: Zustand, React refs, хранение «своей» позиции камеры вне `THREE.Camera`.
 * Разрешено: `camera.position.lerp(target, …)` от вычисленного world-space target.
 *
 * Приоритет выше AI/interaction — см. `registerSystem` order.
 */
export class CameraSystem implements ISystem {
  readonly name = 'camera';
  readonly priority = 100;

  update(_ctx: SystemContext): void {
    // TODO: перенести orbit + collision из FollowCamera; ориентир offset — `EXPLORATION_TPS_CAMERA_OFFSET_LOCAL_M`.
  }
}
