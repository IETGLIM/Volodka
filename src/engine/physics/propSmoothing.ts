/* ─── Volodka RPG – выборочное визуальное сглаживание динамических пропсов ───
 * perf (v4.24, этап 99): интерполяция динамических физтел.
 *
 * Глобальный <Physics interpolate={false}> сохраняет кинематического игрока
 * идеально синхронным с камерой (см. PhysicsSceneInner.tsx): в
 * @react-three/rapier 2.x флаг интерполяции ВСЕГДО-ИЛИ-НИЧЕГО — per-body
 * опции нет, а включение глобально возвращает баг «аватар отстаёт от
 * камеры на шаг интерполяции». Единственные динамические тела в игре —
 * мелкий пинаемый реквизит (DynamicProps.tsx: банки/бутылки/ящики/бочки).
 *
 * Этот модуль возвращает интерполяцию ТОЛЬКО им: мировая EMA-follower-схема,
 * выполняющаяся в фазе post_physics — после снапа трансформаций Rapier.
 *
 * Как это работает:
 *  1. Rapier шагает мир с фиксированным шагом 1/60 с и каждый кадр ставит
 *     группу RigidBody в трансформ тела (interpolate=false → alpha=1).
 *     На дисплеях >60 Гц снап происходит каждый второй кадр → пропс
 *     «дёргается» (judder).
 *  2. Follower ведёт сглаженную мировую позицию W: W → lerp(W, p, α),
 *     где α = 1 − exp(−rate·dt) — сглаживание, независимое от частоты
 *     кадров. Внутренняя визуальная группа пропса ставится в точку W
 *     (переведённую в локальные координаты тела), поэтому на экране
 *     пропс скользит между физическими апдейтами.
 *  3. ВРАЩЕНИЕ не сглаживается (осознанный компромисс): дрожание вращения
 *     мелкого реквизита незаметно, а кватернионные оффсеты утроили бы
 *     стоимость без видимого выигрыша.
 *  4. Спящие тела и телепорты (> MAX_CORRECTION_M за кадр) снапаются
 *     мгновенно — никаких «шлейфов» через уровень.
 *
 * Побочные эффекты на геймплей отсутствуют: коллизии считаются по
 * физическим телам (не по визуалу), а боевые системы читают позиции
 * крипов/игрока, не пропсов.
 */

import type { RapierRigidBody } from '@react-three/rapier';
import { Matrix4, Object3D, Vector3 } from 'three';

/** Скорость сходимости EMA (1/с): α за кадр = 1 − exp(−rate·dt).
 *  22 ≈ полупериод 31 мс — визуал догоняет физику за ~1–2 шага. */
export const PROP_SMOOTHING_RATE = 22;

/** Порог снапа (м): если физика ушла дальше за один кадр — это телепорт
 *  (респаун/ремаунт/взрывной импульс), плавность не нужна. */
export const PROP_SMOOTHING_SNAP_M = 0.5;

/** Состояние follower'а одного пропса (аллоцируется один раз на пропс). */
export interface PropSmoothFollower {
  initialized: boolean;
  /** Сглаженная мировая позиция визуала. */
  wx: number;
  wy: number;
  wz: number;
}

export function createPropSmoothFollower(): PropSmoothFollower {
  return { initialized: false, wx: 0, wy: 0, wz: 0 };
}

/* Переиспользуемые временные объекты — ноль аллокаций в кадре. */
const _bodyWorldInv = new Matrix4();
const _target = new Vector3();

/**
 * Один шаг follower'а: вызывается в фазе post_physics КАЖДОГО кадра,
 * после того как Rapier синхронизировал группы тел с физическим миром.
 *
 * @param follower  состояние пропса (создать через createPropSmoothFollower)
 * @param body      RapierRigidBody пропса (источник физической трансформы)
 * @param visual    внутренняя визуальная группа внутри <RigidBody>
 * @param deltaS    dt кадра, с
 */
export function updatePropSmoothFollower(
  follower: PropSmoothFollower,
  body: RapierRigidBody,
  visual: Object3D,
  deltaS: number,
): void {
  const t = body.translation();

  // Спящее тело не двигается — визуал строго в физической позиции.
  if (body.isSleeping()) {
    follower.initialized = true;
    follower.wx = t.x;
    follower.wy = t.y;
    follower.wz = t.z;
    applyVisualWorldPos(follower, visual);
    return;
  }

  if (!follower.initialized) {
    follower.initialized = true;
    follower.wx = t.x;
    follower.wy = t.y;
    follower.wz = t.z;
    applyVisualWorldPos(follower, visual);
    return;
  }

  const distSq =
    (t.x - follower.wx) ** 2 + (t.y - follower.wy) ** 2 + (t.z - follower.wz) ** 2;

  if (distSq > PROP_SMOOTHING_SNAP_M * PROP_SMOOTHING_SNAP_M) {
    // Телепорт — снап без сглаживания.
    follower.wx = t.x;
    follower.wy = t.y;
    follower.wz = t.z;
  } else {
    // Кадронезависимая EMA-сходимость к физической позиции.
    const alpha = 1 - Math.exp(-PROP_SMOOTHING_RATE * Math.max(0, deltaS));
    follower.wx += (t.x - follower.wx) * alpha;
    follower.wy += (t.y - follower.wy) * alpha;
    follower.wz += (t.z - follower.wz) * alpha;
  }

  applyVisualWorldPos(follower, visual);
}

/** Ставит визуальную группу в мировую точку W (follower.wx/wy/wz). */
function applyVisualWorldPos(
  follower: PropSmoothFollower,
  visual: Object3D,
): void {
  const parent = visual.parent;
  if (!parent) return;

  // Обновляем матрицу мира ТЕЛА (Rapier только что выставил position/
  // quaternion напрямую, matrixWorld ещё прошлого кадра). updateWorldMatrix
  // (false,false) пересобирает только собственную matrixWorld — предки
  // статичны (сценовые группы), их прошлокадровая матрица корректна.
  parent.updateWorldMatrix(false, false);
  _bodyWorldInv.copy(parent.matrixWorld).invert();

  // Локальная позиция визуала = inv(bodyWorld) · W — после снапа тела
  // визуал окажется ровно в сглаженной мировой точке W.
  _target.set(follower.wx, follower.wy, follower.wz).applyMatrix4(_bodyWorldInv);
  visual.position.copy(_target);
}
