
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
import { useGamePhase, useHotbarSlots } from '@/store/selectors';
import { useConsumableActions, useInventory } from '@/store/selectors';
import { usePlayerLevel } from '@/store/selectors/playerSelectors';
import { useCollectedPoems } from '@/store/selectors/worldSelectors';
import { areSharedVirtualControlsWritable, useVirtualControlsRef, clearSharedVirtualControls } from '@/engine/VirtualControlsState';
import { fireInteractPress } from '@/engine/input/fireInteractPress';
import { firePanelShortcut } from '@/engine/input/panelShortcutDispatcher';
import { quickSaveGame, quickLoadGame } from './save/quickSaveLoad';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useIsMobile } from '@/hooks/use-mobile';
import { countCollectedMainPoems } from '@/data/poemCollectionMeta';
import { getItemDefinition } from '@/data/items';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { hapticLight, hapticMedium, hapticItemPickup, hapticError } from '@/shared/utils/hapticFeedback';
import { attemptMeleeStrike } from '@/engine/combat/realtime/meleeStrike';
import { eventBus } from '@/engine/EventBus';

const TAP_DEBOUNCE_MS = 280;

export function MobileActionButtons() {
  const isTouchDevice = useTouchDevice();
  const isMobile = useIsMobile();
  const mode = useGamePhase();
  const bottomHudVisible = useExplorationBottomHudVisible();
  const virtualControlsRef = useVirtualControlsRef();
  const [runToggled, setRunToggled] = useState(false);
  const lastTapAtRef = useRef(0);

  /* ── Jump handler — writes to shared virtual controls ── */
  const handleJump = useCallback(() => {
    if (!areSharedVirtualControlsWritable()) return;
    virtualControlsRef.current.jump = 1;
    // Reset after one frame — engine reads this in the next physics step
    requestAnimationFrame(() => { virtualControlsRef.current.jump = 0; });
  }, [virtualControlsRef]);

  /* ── Onboarding gate: hide during first minutes ── */
  const level = usePlayerLevel();
  const collectedPoems = useCollectedPoems();
  const mainPoemCount = countCollectedMainPoems(collectedPoems);
  const isOnboarding = level <= 1 && mainPoemCount <= 1;

  /* ── Quick-use item: use first slot from hotbar ── */
  const inventory = useInventory();
  const hotbarSlots = useHotbarSlots();
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
        text: 'Не хватает выносливости для удара',
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
    setRunToggled((prev) => {
      const next = !prev;
      virtualControlsRef.current.run = next ? 1 : 0;
      return next;
    });
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
      setRunToggled(false);
      clearSharedVirtualControls();
    }
  }, [mode]);

  if (!isVisible) return null;

  const hasUsableItem = hotbarSlots.some((id) => id !== null);

  return (
    <div
      className="mobile-action-buttons"
      data-exploration-ui
      data-testid="mobile-action-buttons"
      aria-label="Экранные кнопки действий"
    >
      {/* Primary: Interact */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="mobile-action-btn mobile-action-btn--interact"
          aria-label="Взаимодействовать"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            makeTapHandler(handleInteract)();
          }}
        >
          <Hand size={24} aria-hidden="true" />
        </button>
        <span className="mobile-action-btn__label">Действие</span>
      </div>

      {/* Secondary row: Strike + Use Item + Run Toggle */}
      <div className="flex items-center gap-2">
        {/* Опережающий удар (v4.8.7) — янтарный акцент, как «Сохранить» */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--strike"
            aria-label="Опережающий удар"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleStrike)();
            }}
          >
            <Sword size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Удар</span>
        </div>

        {/* Use Item */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className={`mobile-action-btn mobile-action-btn--secondary ${!hasUsableItem ? 'opacity-30 pointer-events-none' : ''}`}
            aria-label="Использовать предмет"
            disabled={!hasUsableItem}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleUseItem)();
            }}
          >
            <FlaskConical size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Предмет</span>
        </div>

        {/* Run/Sprint Toggle */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className={`mobile-action-btn mobile-action-btn--secondary ${runToggled ? 'mobile-action-btn--run-active' : ''}`}
            aria-label={runToggled ? 'Бег выключен' : 'Бег включён'}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleToggleRun)();
            }}
          >
            <Zap size={18} aria-hidden="true" />
          </button>
          <span className={`mobile-action-btn__label ${runToggled ? 'mobile-action-btn__label--active' : ''}`}>
            {runToggled ? 'Бег вкл' : 'Бег выкл'}
          </span>
        </div>

        {/* Jump */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--secondary"
            aria-label="Прыжок"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleJump)();
            }}
          >
            <ArrowUp size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Прыжок</span>
        </div>

        {/* Inventory */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--secondary"
            aria-label="Инвентарь"
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
          <span className="mobile-action-btn__label">Сумка</span>
        </div>

        {/* Journal */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--secondary"
            aria-label="Журнал"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              hapticLight();
              firePanelShortcut('KeyJ');
            }}
          >
            <BookOpen size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Журнал</span>
        </div>
      </div>

      {/* Быстрое сохранение/загрузка — компактная пара под кластером действий.
          Прямые вызовы движка (quickSaveLoad) — честные тосты, без клавиш. */}
      <div className="mobile-save-load-row" role="group" aria-label="Сохранение и загрузка">
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--save"
            aria-label="Быстрое сохранение"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleQuickSave)();
            }}
          >
            <Save size={16} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Сохранить</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="mobile-action-btn mobile-action-btn--load"
            aria-label="Быстрая загрузка"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              makeTapHandler(handleQuickLoad)();
            }}
          >
            <FolderOpen size={16} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Загрузить</span>
        </div>
      </div>
    </div>
  );
}
