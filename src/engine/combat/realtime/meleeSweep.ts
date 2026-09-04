/* ─── Volodka RPG – реал-тайм замах: чистая математика сектора удара (v4.8.7) ───
 *
 * Первый шаг бэклога «реал-тайм 3D-комбат» (приоритет C): до пошагового боя
 * игрок может ударить первым. Модуль — чистая геометрия «hit-сектора»:
 * сфера-достижимость (reach) + конус перед взглядом (half angle).
 *
 * ПРАВИЛО СЛОЯ: никаких импортов Three/Rapier/стора — как creepTactics.ts.
 * Вызывается из meleeStrike.ts (движок) и юнит-тестов.
 *
 * Конвенция «взгляд вперёд»: forward = (sin(yaw), cos(yaw)) при
 * yaw = sharedCameraYawRef.current. Эта конвенция подтверждена двумя
 * независимыми проверенными потребителями:
 *   • QuestDirectionArrow.tsx — относительный угол `atan2(dx,dz) − camYaw`,
 *     0° = «вперёд от камеры»;
 *   • interactionTargetQuery.scoreInteractionTarget — тот же sin/cos.
 */

/** Дальность удара от игрока до центра цели (метры). Слегка больше
 *  CONTACT_DISTANCE (1.15 м) — удар «достаёт» преследователя раньше касания. */
export const MELEE_STRIKE_REACH_M = 2.7;

/** Полу-раствор конуса удара (радианы, ~58°) — щедрая дуга «что вижу, то бью». */
export const MELEE_STRIKE_HALF_ANGLE_RAD = 1.02;

/** Ниже этой дистанции конус не проверяется — вплотную бьём всегда. */
export const MELEE_STRIKE_POINT_BLANK_M = 1.4;

/** Косинус полу-угла (один раз, без Math.acos в горячем пути). */
const STRIKE_HALF_ANGLE_COS = Math.cos(MELEE_STRIKE_HALF_ANGLE_RAD);

export interface MeleeSweepInput<T> {
  px: number;
  pz: number;
  /** Единичный вектор взгляда (см. конвенцию в шапке файла). */
  forwardX: number;
  forwardZ: number;
  reachM: number;
  /** Кандидаты с живой позицией (XZ). */
  candidates: ReadonlyArray<T & { x: number; z: number }>;
}

export interface MeleeSweepHit<T> {
  target: T;
  /** Расстояние до центра цели (метры). */
  distM: number;
}

/**
 * Секторная проверка: цель поражена, если она в пределах reachM и либо
 * вплотную (≤ MELEE_STRIKE_POINT_BLANK_M), либо внутри конуса взгляда.
 * Возвращает попадания, отсортированные по возрастанию дистанции.
 */
export function resolveMeleeSweep<T>(
  input: MeleeSweepInput<T>,
): Array<MeleeSweepHit<T>> {
  const { px, pz, forwardX, forwardZ, reachM, candidates } = input;
  const hits: Array<MeleeSweepHit<T>> = [];

  const fwdLenSq = forwardX * forwardX + forwardZ * forwardZ;
  const invFwd = fwdLenSq > 1e-9 ? 1 / Math.sqrt(fwdLenSq) : 0;

  for (const target of candidates) {
    const dx = target.x - px;
    const dz = target.z - pz;
    const distSq = dx * dx + dz * dz;
    if (distSq > reachM * reachM) continue;

    const dist = Math.sqrt(distSq);
    if (dist <= MELEE_STRIKE_POINT_BLANK_M) {
      hits.push({ target, distM: dist });
      continue;
    }

    // Косинус угла между взглядом и направлением на цель (через скалярное
    // произведение единичных векторов; dist > 0 здесь гарантировано).
    const dot = (forwardX * invFwd * dx + forwardZ * invFwd * dz) / dist;
    if (dot >= STRIKE_HALF_ANGLE_COS) {
      hits.push({ target, distM: dist });
    }
  }

  hits.sort((a, b) => a.distM - b.distM);
  return hits;
}
