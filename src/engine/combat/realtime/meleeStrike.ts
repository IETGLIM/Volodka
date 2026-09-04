/* ─── Volodka RPG – «Опережающий удар»: реал-тайм слой до пошагового боя ───
 *                                                              (v4.8.8)
 *
 * Инкременты бэклога «реал-тайм 3D-комбат» (приоритет C):
 *   • v4.8.7 — удар первым: ЛКМ / кнопка «Удар» → секторный замах
 *     (meleeSweep.ts) → если враг в зоне и в конусе взгляда → бой
 *     стартует с ОСЛАБЛЕННЫМ врагом;
 *   • v4.8.8 — память HP крипов (creepVitality.ts): после побега игрока
 *     крип не «забывает» урон и вступает в новую встречу ослабленным, а
 *     сильно ослабленный (≤ 35%) ДОБИВАЕТСЯ ударом до боя — урезанные
 *     награды, без пошаговой фазы (computeCreepFinisherRewards).
 *
 * Архитектура (как PlayerRigidBodyState / interactionSession — модульные
 * одиночки движка, без стора и React):
 *   • PatrollingCreeps регистрирует цели (MeleeStrikeTarget) на маунт —
 *     провайдеры живой позиции, LOS и «выполнить удар» (вовлечение в бой);
 *   • attemptMeleeStrike — единая точка входа из ввода (ЛКМ/мобильная
 *     кнопка): гейты фазы → выносливость → кулдаун → замах → событие
 *     combat:melee_strike → добивание ИЛИ target.applyStrike() (старт
 *     встречи с introHpPct);
 *   • reportMeleeStrikeCandidate / getMeleeStrikeHint — зеркала для
 *     HUD-подсказки «враг в зоне удара» (поллинг без рендеров, паттерн
 *     StaminaBar).
 *
 * Пошаговый CombatSystem не тронут (кроме честного introHpPct-опциона):
 * слои не пересекаются — удар возможен только в фазе exploration.
 */

import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  getGameSnapshot,
} from '@/engine/GameActionDispatcher';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { isSceneTransitionInProgress } from '@/engine/core/sceneTransitionGuard';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import {
  consumePlayerStamina,
  getPlayerStamina,
} from '@/engine/player/playerStamina';
import { sharedCameraYawRef, sharedPlayerPositionRef } from '@/engine/PlayerRotationState';
import type { EnemyType } from '@/shared/types/game';
import { computeCreepFinisherRewards } from '../rewards';
import {
  clearCreepVitality,
  getCreepWeakenedHpPct,
  isCreepFinishable,
} from './creepVitality';
import {
  MELEE_STRIKE_REACH_M,
  resolveMeleeSweep,
} from './meleeSweep';

/** Доля HP, с которой враг вступает в бой после опережающего удара. */
export const MELEE_STRIKE_INTRO_ENEMY_HP_PCT = 0.75;

/** Цена замаха в единицах выносливости (шкала — STAMINA_MAX у playerConstants). */
export const MELEE_STRIKE_STAMINA_COST = 22;

/** Пауза между замахами (мс) — защита от спама кликов. */
export const MELEE_STRIKE_COOLDOWN_MS = 900;

/** Источник замаха — для событий и отладки. */
export type MeleeStrikeSource = 'mouse' | 'mobile_hud' | 'gamepad';

export interface MeleeStrikeTarget {
  /** Стабильный id (creepId) — попадает в combat:melee_strike. */
  readonly id: string;
  /** Русское имя (шаблон врага) — для тоста и HUD-подсказки. */
  readonly name: string;
  /** Тип врага — попадает в combat:creep_finished (награды по шаблону). */
  readonly enemyType: EnemyType;
  /** Живая позиция кинематического крипа (мировые координаты). */
  getPosition(): { x: number; y: number; z: number };
  /** Можно ли бить прямо сейчас (exploring, не engaged/cooldown/defeated). */
  canStrike(): boolean;
  /** Стено-проверка по vision-блокерам сцены (creepTactics.hasCreepLineOfSight). */
  hasLineOfSight(): boolean;
  /** XP-награда шаблона врага — для наград добивания (v4.8.8). */
  getFinisherXpReward?(): number;
  /** Выполнить удар: вовлечь крипа и стартовать встречу с introHpPct. */
  applyStrike(): void;
  /** Добивание (v4.8.8): крип повержен без пошаговой фазы. Провайдер
   *  ставит крипа в неагрессивное состояние — родитель снимает его с
   * цены по событию combat:creep_finished. Отсутствует → обычный путь. */
  applyFinisher?(): void;
}

/** Итог попытки удара — вызывающий ввод решает, «съедать» ли клик. */
export type MeleeStrikeOutcome =
  | { status: 'hit'; creepId: string; enemyName: string; finished: boolean }
  | { status: 'tired' }
  | { status: 'cooldown' }
  | { status: 'none' };

/* ── Реестр целей (живые крипы текущей сцены) ── */
const strikeTargets = new Map<string, MeleeStrikeTarget>();

/** Регистрирует цель замаха. Возвращает отписку (useEffect-cleanup крипа). */
export function registerMeleeStrikeTarget(target: MeleeStrikeTarget): () => void {
  strikeTargets.set(target.id, target);
  return () => {
    if (strikeTargets.get(target.id) === target) strikeTargets.delete(target.id);
  };
}

/* ── Зеркало HUD-подсказки «враг в зоне удара» (поллинг, без рендеров) ── */

export interface MeleeStrikeHintEntry {
  id: string;
  name: string;
  distM: number;
  /** Метка времени последнего отчёта крипа (кадр тика). */
  atMs: number;
  /** Бить можно, но выносливости не хватает. */
  tired: boolean;
  /** Цель ослаблена до порога добивания (v4.8.8). */
  finishable: boolean;
}

export interface MeleeStrikeHint {
  id: string;
  name: string;
  distM: number;
  tired: boolean;
  finishable: boolean;
}

const hintEntries = new Map<string, MeleeStrikeHintEntry>();
/** Отчёт устаревает — крипов мог уже не быть (смена сцены, вовлечение). */
const HINT_STALE_MS = 260;

/** Вызывается крипом каждый кадр тика (дешёвый map.set). */
export function reportMeleeStrikeCandidate(
  id: string,
  name: string,
  distM: number,
  eligible: boolean,
  finishable = false,
): void {
  if (!eligible) {
    hintEntries.delete(id);
    return;
  }
  const tired = getPlayerStamina().current < MELEE_STRIKE_STAMINA_COST;
  hintEntries.set(id, { id, name, distM, atMs: Date.now(), tired, finishable });
}

/** Ближайшая живая подсказка для HUD (null — показывать нечего). */
export function getMeleeStrikeHint(): MeleeStrikeHint | null {
  const now = Date.now();
  let best: MeleeStrikeHintEntry | null = null;
  for (const entry of hintEntries.values()) {
    if (now - entry.atMs > HINT_STALE_MS) continue;
    if (!best || entry.distM < best.distM) best = entry;
  }
  if (!best) return null;
  return {
    id: best.id,
    name: best.name,
    distM: best.distM,
    tired: best.tired,
    finishable: best.finishable,
  };
}

/* ── Замах ── */

let lastStrikeAtMs = 0;

/** Сброс кулдауна/реестра для юнит-тестов. */
export function resetMeleeStrikeForTests(): void {
  lastStrikeAtMs = 0;
  strikeTargets.clear();
  hintEntries.clear();
}

/**
 * Попытка опережающего удара. Гейты (фаза/замок/переход/катсцена) дают
 * { status: 'none' } — ввод НЕ consumed, ЛКМ проваливается во взаимодействие.
 * Кулдаун/выносливость проверяются ПОСЛЕ замаха: без цели в секторе «none» —
 * взаимодействие работает даже в паузу между ударами (не блокируем ЛКМ).
 * «tired»/«cooldown» — только когда игрок реально целился во врага: ввод
 * consumed, взаимодействие за ним не последует.
 */
export function attemptMeleeStrike(source: MeleeStrikeSource): MeleeStrikeOutcome {
  if (strikeTargets.size === 0) return { status: 'none' };

  // Фазовые гейты — слой живёт только в исследовании, как и PatrollingCreeps.
  let snapshot: ReturnType<typeof getGameSnapshot> | null = null;
  try {
    snapshot = getGameSnapshot();
    if (snapshot.mode !== 'exploration') return { status: 'none' };
  } catch {
    return { status: 'none' };
  }
  if (isInteractionLocked() || isSceneTransitionInProgress()) return { status: 'none' };
  if (isCinematicTimelineActive()) return { status: 'none' };

  const now = Date.now();

  // Кандидаты: живые, не вовлечённые крипы. Плоский тип (target + XZ) для
  // resolveMeleeSweep. Spread безопасен: зарегистрированные цели — замыкания
  // над ref-ами компонента (не используют this).
  const candidates: Array<MeleeStrikeTarget & { x: number; z: number }> = [];
  for (const target of strikeTargets.values()) {
    if (!target.canStrike()) continue;
    const pos = target.getPosition();
    candidates.push({ ...target, x: pos.x, z: pos.z });
  }
  if (candidates.length === 0) return { status: 'none' };

  // Взгляд: forward = (sin(yaw), cos(yaw)) — конвенция meleeSweep.ts.
  const yaw = sharedCameraYawRef.current;

  // Живая позиция игрока (кадровое зеркало PhysicsPlayer) — СТОРОВОЕ
  // exploration.playerPosition обновляется только на переходах/сейвах.
  const player = sharedPlayerPositionRef.current;
  const sweepHits = resolveMeleeSweep({
    px: player.x,
    pz: player.z,
    forwardX: Math.sin(yaw),
    forwardZ: Math.cos(yaw),
    reachM: MELEE_STRIKE_REACH_M,
    candidates,
  });
  if (sweepHits.length === 0) return { status: 'none' };

  // LOS-фильтр: сквозь стену не бьём (creep-провайдер, vision-блокеры сцены).
  const hit = sweepHits.find((h) => h.target.hasLineOfSight());
  if (!hit) return { status: 'none' };

  // Кулдаун — после замаха: цель есть, но замах ещё «на восстановлении».
  if (now - lastStrikeAtMs < MELEE_STRIKE_COOLDOWN_MS) return { status: 'cooldown' };

  // Выносливость: списываем ДО вовлечения; не хватило — замах сорван.
  if (!consumePlayerStamina(MELEE_STRIKE_STAMINA_COST)) return { status: 'tired' };

  lastStrikeAtMs = now;
  const target = hit.target;
  const pos = target.getPosition();

  // ── v4.8.8: добивание ослабленного крипа до пошагового боя ──
  // Крип с остатком HP ≤ MELEE_STRIKE_FINISHER_HP_PCT (после побега игрока
  // из прошлой встречи — creepVitality.ts) повержается одним ударом:
  // урезанные награды без боевого RNG-сеанса, лут не выпадает.
  const weakenedPct = getCreepWeakenedHpPct(target.id);
  if (
    weakenedPct !== null
    && isCreepFinishable(weakenedPct)
    && target.applyFinisher
  ) {
    const rewards = computeCreepFinisherRewards({
      xpReward: target.getFinisherXpReward?.() ?? 0,
      creditsMultiplier: snapshot?.difficultySettings?.creditsMultiplier ?? 1,
    });

    dispatchGameAction({ type: 'player/addKarma', amount: rewards.karmaGained });
    dispatchGameAction({ type: 'player/addXp', amount: rewards.xpGained });
    dispatchGameAction({ type: 'player/addCredits', amount: rewards.creditsGained });
    clearCreepVitality(target.id);

    eventBus.emit('combat:melee_strike', {
      source,
      hit: true,
      finished: true,
      creepId: target.id,
      enemyName: target.name,
      x: pos.x,
      y: pos.y,
      z: pos.z,
    });
    eventBus.emit('combat:creep_finished', {
      creepId: target.id,
      enemyType: target.enemyType,
      enemyName: target.name,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      xpGained: rewards.xpGained,
      karmaGained: rewards.karmaGained,
      creditsGained: rewards.creditsGained,
    });
    eventBus.emit('ui:exploration_message', {
      text: `☠ Добивание — ${target.name} повержен без боя!`,
    });

    // Крип снимается с цены (родитель уберёт его по combat:creep_finished).
    target.applyFinisher();

    return { status: 'hit', creepId: target.id, enemyName: target.name, finished: true };
  }

  eventBus.emit('combat:melee_strike', {
    source,
    hit: true,
    finished: false,
    creepId: target.id,
    enemyName: target.name,
    x: pos.x,
    y: pos.y,
    z: pos.z,
  });

  eventBus.emit('ui:exploration_message', {
    text: `⚡ Опережающий удар — ${target.name} ослаблен!`,
  });

  // Вовлечение крипа + старт встречи с ослабленным врагом (encounterTypes):
  // после побега из прошлой встречи крип вступает с ЗАПОМНЕННЫМ HP.
  target.applyStrike();

  return { status: 'hit', creepId: target.id, enemyName: target.name, finished: false };
}
