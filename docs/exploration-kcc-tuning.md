# Kinematic Character Controller (обход) — настройка

Реализация: [`createExplorationKinematicCharacterController`](../src/engine/physics/CharacterController.ts) (Rapier 3D, compat build).

## Параметры пресета

| Параметр | Значение | Смысл |
|----------|----------|--------|
| Character offset | `0.06` | Люфт KCC от геометрии коллайдера |
| Slide | enabled | Скольжение вдоль препятствий |
| Up vector | `(0,1,0)` | Мир не наклонен |
| **Autostep** | `minWidth=0.35`, `maxHeight=0.25`, `includeDynamic=false` | Ступеньки/пороги до ~25 см «с шагом» без прыжка |
| **Snap to ground** | `0.45` | Подтягивание к полу при сходе с крошечного уступа |
| **Max slope climb** | `0.45 * π` rad (~81°) | Взлёсткие наклоны; слишком круто — толкает вдоль |
| Горизонталь в `integrateKinematicLocomotionDelta` | `HORIZONTAL_ACCEL=12`, `HORIZONTAL_DECEL=18` | Ощущение веса: мягче старт, жёстче стоп |

## Когда менять

- **Новая сцена с лестницей / крутым пандусом:** сначала геометрия коллайдеров и `spawnPoint`; при «натыкании» — снизить `maxSlope` или увеличить `autostep` maxHeight (осторожно: слишком большой autostep → «телепорты»).
- **Парит/проваливается герой:** не KCC первым делом — [`explorationHeroStreamingIntegrity.test.ts`](../src/config/explorationHeroStreamingIntegrity.test.ts) + `PhysicsSceneColliders` + `spawnPoint` в [`scenes.ts`](../src/config/scenes.ts).
- **Камера дёргается:** сначала [`FollowCamera`](../src/ui/3d/exploration/FollowCamera.tsx) и `clampPhysicsTimestep` в `CharacterController.ts`, не KCC.

## Связь с тестами

- Стабильность спавна/пола: `npx vitest run src/config/explorationHeroStreamingIntegrity.test.ts`
- Ручной дымок: [volodka-room-smoke.md](./volodka-room-smoke.md) (WASD, без провалов).
