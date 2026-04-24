'use client';

/**
 * Шаг 3 (анти-мерцание): отдельного `AnimationController` нет — клипы ведёт **`useAnimations`**
 * (`@react-three/drei`) в **`PhysicsPlayer` → `GLBPlayerModel`** и **`NPC` → `GLTFLoader`**.
 *
 * Стабилизация позиции игрока (шаг 4 / root motion): см. **`ui/3d/player/AnimationController.tsx`** и
 * **`lib/stripExplorationPlayerRootMotionFromClips`** (клоны клипов перед **`useAnimations`** в **`GLBPlayerModel`**).
 *
 * Эффекты, которые делают **`fadeOut` / `reset().play()`**, не должны зависеть от **ссылки** на объект
 * `actions`, если она меняется чаще, чем реально меняется набор клипов (иначе лишние сбросы → мерцание).
 * В коде игрока и NPC зависимости завязаны на **стабильные сигнатуры** ключей (`actionKeysSig`,
 * при NPC ещё **`animMappingSig`**).
 */

export {};
