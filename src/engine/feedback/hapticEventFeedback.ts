/* ─── Volodka RPG – событийная тактильная отдача (v4.8.6) ───
 *
 * Модуль-одиночка: подписывается на типизированный eventBus и переводит
 * ключевые игровые события в вибрацию на мобильных. До этого хелперы
 * haptic* дёргались только из UI-обработчиков касаний (кнопки, джойстик),
 * а сами СОБЫТИЯ игры (урон, уровень, квест, перк) тактильно не отвечали.
 *
 * События → отклик:
 *   • combat:damage      — combat-hit «удар» (троттлинг 350 мс: пошаговый
 *                          бой может emit'ить несколько ударов в один тик)
 *   • player:levelup     — триумфальный тройной пульс
 *   • skill:level_up     — средний тап
 *   • quest:completed    — восходящий «завершённый квест»
 *   • perk:unlocked      — средний тап
 *   • player:physics_degraded (degraded=true) — короткий «ошибка»
 *
 * Жизненный цикл: подписка устанавливается при загрузке модуля и переустанавливается
 * через registerModuleGlobalCleanupBinder (reviveGameEngine), ровно как
 * sprint-launch в explorationStrategy — иначе после dispose/revive шины
 * (ErrorBoundary/StrictMode) вибрация молча умирала бы.
 *
 * Десктоп-нулевая цена: navigator.vibrate отсутствует → getVibrateFn
 * кэширует null, все вызовы — один boolean-чтение localStorage. Мастер-гейт
 * «Виброотклик» применяется внутри hapticFeedback.
 */

import { eventBus } from '@/engine/EventBus';
import { registerModuleGlobalCleanupBinder } from '@/engine/core/GlobalCleanupService';
import {
  hapticCombatHit,
  hapticError,
  hapticHeavy,
  hapticLevelUp,
  hapticMedium,
  hapticQuestComplete,
  hapticStealthStrike,
} from '@/shared/utils/hapticFeedback';

/** Минимальный интервал между combat-вибрациями (защита от серий). */
const COMBAT_HAPTIC_THROTTLE_MS = 350;

const unsubscribers: Array<() => void> = [];
let lastCombatHapticAt = 0;

function bindHapticEventListeners(): void {
  // Расчистить прежние подписки (повторный bind после revive).
  for (const unsub of unsubscribers) {
    try {
      unsub();
    } catch {
      /* шина уже сброшена — не важно */
    }
  }
  unsubscribers.length = 0;

  if (typeof window === 'undefined') return;

  unsubscribers.push(
    eventBus.on('combat:damage', () => {
      const now = performance.now();
      if (now - lastCombatHapticAt < COMBAT_HAPTIC_THROTTLE_MS) return;
      lastCombatHapticAt = now;
      hapticCombatHit();
    }),

    eventBus.on('player:levelup', () => {
      hapticLevelUp();
    }),

    eventBus.on('skill:level_up', () => {
      hapticMedium();
    }),

    eventBus.on('quest:completed', () => {
      hapticQuestComplete();
    }),

    eventBus.on('perk:unlocked', () => {
      hapticMedium();
    }),

    eventBus.on('player:physics_degraded', (payload) => {
      if (payload.degraded) hapticError();
    }),

    // v4.8.7 «Опережающий удар» — тактильный отклик попадания до боя
    // (см. engine/combat/realtime/meleeStrike.ts). v4.8.8: добивание
    // ощущается тяжелее — враг повержен без боя. v4.11.0: удар в спину —
    // «два шага подкрадывания и глухой удар» (стелс громче наград).
    eventBus.on('combat:melee_strike', ({ finished, backstab }) => {
      const now = performance.now();
      if (now - lastCombatHapticAt < COMBAT_HAPTIC_THROTTLE_MS) return;
      lastCombatHapticAt = now;
      if (backstab) {
        hapticStealthStrike();
      } else if (finished) {
        hapticHeavy();
      } else {
        hapticCombatHit();
      }
    }),
  );
}

registerModuleGlobalCleanupBinder(bindHapticEventListeners);
bindHapticEventListeners();
