
/* ─── Volodka RPG – Mobile Action Buttons (non-combat) ───
 * Right-side action cluster for touch devices.
 * Mirror of the D-pad on the left side (ExplorationMobileHud).
 * Uses CSS classes from hud-mobile-responsive.css for styling.
 *
 * Buttons:
 *   - Interact (E key equivalent) — primary, larger
 *   - Use Item — quick-use first consumable from hotbar slot 1
 *   - Run/Sprint toggle — amber glow when active
 *
 * Shown only on touch devices during exploration mode.
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { Hand, Zap, FlaskConical, ArrowUp, Package, BookOpen, Save, FolderOpen, Sword } from 'lucide-react';
import { useConsumableActions, useQuickUseHotbarState } from '@/store/selectors';
import { areSharedVirtualControlsWritable, useVirtualControlsRef, clearSharedVirtualControls, subscribeVirtualControlsGate } from '@/engine/VirtualControlsState';
import { fireInteractPress } from '@/engine/input/fireInteractPress';
import { firePanelShortcut } from '@/engine/input/panelShortcutDispatcher';
import { quickSaveGame, quickLoadGame } from './save/quickSaveLoad';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useIsMobile } from '@/hooks/use-mobile';
import { getItemDefinition } from '@/data/items';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { hapticLight, hapticMedium, hapticItemPickup, hapticError } from '@/shared/utils/hapticFeedback';
import { attemptMeleeStrike } from '@/engine/combat/realtime/meleeStrike';
import { eventBus } from '@/engine/EventBus';
import { t } from '@/i18n';

const TAP_DEBOUNCE_MS = 280;

export function MobileActionButtons() {
  const isTouchDevice = useTouchDevice();
  const isMobile = useIsMobile();
  const bottomHudVisible = useExplorationBottomHudVisible();
  const virtualControlsRef = useVirtualControlsRef();
  const [runToggled, setRunToggled] = useState(false);
  // FIX (v4.17.1): ref-зеркало для обработчиков — раньше сайд-эффект записи
  // в shared-оси выполнялся ВНУТРИ setState-апдейтера (двойной вызов в
  // StrictMode ломал тоггл). Пишем оси после вычисления значения.
  const runToggledRef = useRef(false);
  const jumpResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapAtRef = useRef(0);

  /* ── Jump handler — writes to shared virtual controls ── */
  const handleJump = useCallback(() => {
    if (!areSharedVirtualControlsWritable()) return;
    // FIX (v4.17.1): одноразовый rAF-импульс мог сбрасываться ДО физического
    // шага (порядок rAF против R3F-кадра не детерминирован) — прыжок терялся.
    // Держим флаг 120мс: несколько физических кадров гарантированно видят его,
    // а повторный прыжок исключён кулдауном (playerMainMovement JUMP_COOLDOWN).
    virtualControlsRef.current.jump = 1;
    if (jumpResetTimerRef.current) clearTimeout(jumpResetTimerRef.current);
    jumpResetTimerRef.current = setTimeout(() => {
      virtualControlsRef.current.jump = 0;
      jumpResetTimerRef.current = null;
    }, 120);
  }, [virtualControlsRef]);

  /* ── Onboarding gate + хотбар — один shallow-бандл (этап 100, волна 2) ── */
  const { mode, inventory, hotbarSlots, level, mainPoemCount } = useQuickUseHotbarState();
  const isOnboarding = level <= 1 && mainPoemCount <= 1;
  const { addEnergy, addStress, addKarma, addSkill, removeItem } = useConsumableActions();

  /* ── Interact handler ── */
  const handleInteract = useCallback(() => {
    hapticMedium();
    fireInteractPress('mobile_hud');
  }, []);

  /* ── Опережающий удар (v4.8.7) — реал-тайм замах до пошагового боя. ── */
  const handleStrike = useCallback(() => {
    const outcome = attemptMeleeStrike('mobile_hud');
    if (outcome.status === 'hit') {
      hapticMedium(); // дубль к событийной тактильности — прямой отклик кнопки
      return;
    }
    if (outcome.status === 'tired') {
      hapticError();
      eventBus.emit('ui:exploration_message', {
        text: t('hud.mobileActions.noStamina', 'Не хватает выносливости для удара'),
      });
      return;
    }
    if (outcome.status === 'cooldown') {
      hapticError();
      return;
    }
    if (outcome.status === 'miss') {
      // v4.12.0: тактильность промаха приходит по событию combat:melee_miss
      // (hapticMiss, общий с боевыми троттлинг) — без дублей на кнопке.
      return;
    }
    // «none» — врагов в зоне нет: короткий отклик без спама тостами.
    hapticLight();
  }, []);

  /* ── Use Item handler — uses first hotbar slot's consumable ── */
  const handleUseItem = useCallback(() => {
    hapticItemPickup();

    // Find first occupied hotbar slot
    const firstItemId = hotbarSlots.find((id) => id !== null);
    if (!firstItemId) return;

    const invItem = inventory.find((i) => i.id === firstItemId);
    if (!invItem) return;

    const def = getItemDefinition(invItem.id);
    if (!def || invItem.quantity <= 0) return;

    // Apply effects
    for (const effect of def.effects) {
      if (effect.stat === 'energy') addEnergy(effect.value);
      else if (effect.stat === 'stress') addStress(effect.value);
      else if (effect.stat === 'karma') addKarma(effect.value);
      else if (effect.skill) addSkill(effect.skill, effect.value);
    }

    removeItem(invItem.id, 1);
  }, [hotbarSlots, inventory, addEnergy, addStress, addKarma, addSkill, removeItem]);

  /* ── Run toggle handler ── */
  const handleToggleRun = useCallback(() => {
    hapticLight();
    if (!areSharedVirtualControlsWritable()) return;
    // FIX (v4.17.1): вычисляем значение из ref-зеркала (не из замыкания state)
    // и пишем shared-ось ПОСЛЕ setState — без сайд-эффектов внутри апдейтера.
    const next = !runToggledRef.current;
    runToggledRef.current = next;
    setRunToggled(next);
    virtualControlsRef.current.run = next ? 1 : 0;
  }, [virtualControlsRef]);

  /* ── Быстрое сохранение/загрузка (v4.8.6) — прямой вызов движка,
   * честный тост по исходу; без синтетических клавиш. ── */
  const handleQuickSave = useCallback(() => {
    hapticLight();
    quickSaveGame();
  }, []);

  const handleQuickLoad = useCallback(() => {
    hapticLight();
    quickLoadGame();
  }, []);

  /* ── Debounced tap wrapper ── */
  const makeTapHandler = useCallback(
    (action: () => void) => () => {
      const now = performance.now();
      if (now - lastTapAtRef.current < TAP_DEBOUNCE_MS) return;
      lastTapAtRef.current = now;
      action();
    },
    [],
  );

  /* ── Visibility gate: touch + mobile + exploration + not onboarding ── */
  const isVisible = isTouchDevice && isMobile && mode === 'exploration' && bottomHudVisible && !isOnboarding;

  /* ── Reset run on mode change (via useEffect to avoid setState during render) ── */
  useEffect(() => {
    if (mode !== 'exploration') {
      runToggledRef.current = false;
      setRunToggled(false);
      clearSharedVirtualControls();
    }
  }, [mode]);

  /* ── FIX (v4.17.1): синхронизация тоггла «Бег» с write-гейтом. При закрытии
   * гейта (диалог/кат-сцена/лок) shared-оси обнуляются, но runToggled
   * оставался true — кнопка показывала «Бег вкл» без бега до второго тапа. ── */
  useEffect(() => subscribeVirtualControlsGate((writable) => {
    if (!writable && runToggledRef.current) {
      runToggledRef.current = false;
      setRunToggled(false);
    }
  }), []);

  /* ── FIX (v4.17.1): снимаем висящий таймер прыжка при анмаунте ── */
  useEffect(() => () => {
    if (jumpResetTimerRef.current) clearTimeout(jumpResetTimerRef.current);
  }, []);

  if (!isVisible) return null;

  const hasUsableItem = hotbarSlots.some((id) => id !== null);

  return (
    <div
      className="mobile-action-buttons"
      data-exploration-ui
      data-testid="mobile-action-buttons"
      aria-label={t('hud.mobileActions.aria', 'Экранные кнопки действий')}
    >
      {/* Primary: Interact */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="mobile-action-btn mobile-action-btn--interact"
          aria-label={t('hud.mobileActions.interact', 'Взаимодействовать')}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            makeTapHandler(handleInteract)();
          }}
        >
          <Hand size={24} aria-hidden="true" />
        </button>
        <span className="mobile-action-btn__label">{t('hud.mobileActions.interactLabel', 'Действие')}</span>
      </div>

      {/* Secondary row: Strike + Use Item + Run Toggle */}
      <div className="flex items-center gap-2">
        {/* Опережающий удар (v4.8.7) — янтарный акцент, как «Сохранить» */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--strike"
            aria-label={t('hud.mobileActions.strike', 'Опережающий удар')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleStrike)();
            }}
          >
            <Sword size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.strikeLabel', 'Удар')}</span>
        </div>

        {/* Use Item */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className={`mobile-action-btn mobile-action-btn--secondary ${!hasUsableItem ? 'opacity-30 pointer-events-none' : ''}`}
            aria-label={t('hud.mobileActions.useItem', 'Использовать предмет')}
            disabled={!hasUsableItem}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleUseItem)();
            }}
          >
            <FlaskConical size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.itemLabel', 'Предмет')}</span>
        </div>

        {/* Run/Sprint Toggle */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className={`mobile-action-btn mobile-action-btn--secondary ${runToggled ? 'mobile-action-btn--run-active' : ''}`}
            aria-label={runToggled ? t('hud.mobileActions.runOnAria', 'Бег выключен') : t('hud.mobileActions.runOffAria', 'Бег включён')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleToggleRun)();
            }}
          >
            <Zap size={18} aria-hidden="true" />
          </button>
          <span className={`mobile-action-btn__label ${runToggled ? 'mobile-action-btn__label--active' : ''}`}>
            {runToggled ? t('hud.mobileActions.runOn', 'Бег вкл') : t('hud.mobileActions.runOff', 'Бег выкл')}
          </span>
        </div>

        {/* Jump */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--secondary"
            aria-label={t('hud.mobileActions.jump', 'Прыжок')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleJump)();
            }}
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.jumpLabel', 'Прыжок')}</span>
        </div>

        {/* Inventory */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--secondary"
            aria-label={t('hud.mobileActions.inventory', 'Инвентарь')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              hapticLight();
              // Прямой вызов панельного свитчборда — без синтетического KeyI,
              // которое раньше проходило по всем window-подписчикам.
              firePanelShortcut('KeyI');
            }}
          >
            <Package size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.bagLabel', 'Сумка')}</span>
        </div>

        {/* Journal */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--secondary"
            aria-label={t('hud.mobileActions.journal', 'Журнал')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              hapticLight();
              firePanelShortcut('KeyJ');
            }}
          >
            <BookOpen size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.journalLabel', 'Журнал')}</span>
        </div>
      </div>

      {/* Быстрое сохранение/загрузка — компактная пара под кластером действий.
          Прямые вызовы движка (quickSaveLoad) — честные тосты, без клавиш. */}
      <div className="mobile-save-load-row" role="group" aria-label={t('hud.mobileActions.saveGroupAria', 'Сохранение и загрузка')}>
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--save"
            aria-label={t('hud.mobileActions.quickSave', 'Быстрое сохранение')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleQuickSave)();
            }}
          >
            <Save size={16} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.saveLabel', 'Сохранить')}</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--load"
            aria-label={t('hud.mobileActions.quickLoad', 'Быстрая загрузка')}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleQuickLoad)();
            }}
          >
            <FolderOpen size={16} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">{t('hud.mobileActions.loadLabel', 'Загрузить')}</span>
        </div>
      </div>
    </div>
  );
}
