'use client';

/**
 * Шаг 4 (анти-мерцание): прозрачность и порядок относительно окружения.
 *
 * - **`applyGltfCharacterDepthWrite`** (`lib/gltfCharacterMaterialPolicy.ts`) вызывается для
 *   загруженных персонажей в **`PhysicsPlayer` → `GLBPlayerModel`** и **`NPC` → `GLTFLoader`**
 *   (после настройки теней на мешах).
 * - Декоративные прозрачные меши сцены (**`OptimizedSceneEnvironment`**, **`SceneComponents`**, тени следов
 *   и т.д.) намеренно могут держать **`depthWrite={false}`** — это не тот же класс проблемы, что у
 *   цельного персонажа в обходе.
 *
 * Для cutout (волосы/ресницы) в исходном GLB предпочтительнее **`alphaTest`**, чем полноценный
 * альфа-блендинг между перекрывающимися подмешами одной модели.
 */

export { applyGltfCharacterDepthWrite } from '@/lib/gltfCharacterMaterialPolicy';
