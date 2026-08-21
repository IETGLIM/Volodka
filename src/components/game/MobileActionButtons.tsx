
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
import { Hand, Zap, FlaskConical, ArrowUp, Package, BookOpen } from 'lucide-react';
import { useGamePhase, useHotbarSlots } from '@/store/selectors';
import { useConsumableActions, useInventory } from '@/store/selectors';
import { usePlayerLevel } from '@/store/selectors/playerSelectors';
import { useCollectedPoems } from '@/store/selectors/worldSelectors';
import { areSharedVirtualControlsWritable, useVirtualControlsRef, clearSharedVirtualControls } from '@/engine/VirtualControlsState';
import { fireInteractPress } from '@/engine/input/fireInteractPress';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useIsMobile } from '@/hooks/use-mobile';
import { countCollectedMainPoems } from '@/data/poemCollectionMeta';
import { getItemDefinition } from '@/data/items';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { hapticLight, hapticMedium, hapticItemPickup } from '@/shared/utils/hapticFeedback';

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

  /* ── Open panel via synthetic keyboard event (I=inventory, J=journal) ── */
  const openPanelViaKey = useCallback((code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  }, []);

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

      {/* Secondary row: Use Item + Run Toggle */}
      <div className="flex items-center gap-2">
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
              openPanelViaKey('KeyI');
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
              openPanelViaKey('KeyJ');
            }}
          >
            <BookOpen size={18} aria-hidden="true" />
          </button>
          <span className="mobile-action-btn__label">Журнал</span>
        </div>
      </div>
    </div>
  );
}
