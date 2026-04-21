/**
 * Публичная точка ECS для приложения. Реализация пока в `shared/ecs`
 * (перенос тела в этот каталог — шаг 4 плана без ломания импортов).
 */
export * from '@/shared/ecs';
export { SystemsRunner } from './systems/SystemsRunner';
export { CameraSystem } from './systems/CameraSystem';
export { InteractionSystem } from './systems/InteractionSystem';
export { AISystem } from './systems/AISystem';
