'use client';

/**
 * Стабилизация позиции игрока (шаг 4): анимации в обходе влияют **только на позу** (вращения костей и
 * локальные смещения), а не на перенос тела по миру. **Root motion** (translation на корневых костях
 * вроде `root`, `mixamorigHips`) отключается: **`RigidBody`** / Rapier уже задаёт траекторию.
 *
 * Реализация: **`cloneAnimationClipsWithoutExplorationPlayerRootMotion`** в
 * **`lib/stripExplorationPlayerRootMotionFromClips`**, вызывается из **`GLBPlayerModel`** в **`PhysicsPlayer`**
 * до **`useAnimations`**. Общий модуль про смену клипов без лишних сбросов — **`components/3d/AnimationController.tsx`**.
 */

export {};
