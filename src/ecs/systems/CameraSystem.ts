import type { ISystem, SystemContext } from '@/shared/ecs';

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
    // TODO: перенести orbit + collision из FollowCamera после единого SoT rigid body.
  }
}
