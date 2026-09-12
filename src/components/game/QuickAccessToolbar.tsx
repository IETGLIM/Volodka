'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useOrchestratorNarrativeOverlay, useOrchestratorShell } from '@/store/selectors';
import { firePanelShortcut } from '@/engine/input/panelShortcutDispatcher';
import { t } from '@/i18n';

/* i18n (этап 115): ключи динамических подписей слотов. Они сознательно НЕ добавлены
 * в статический каталог RU_MESSAGES: t() возвращает RU_MESSAGES[key] ?? fallback,
 * и статичная запись перебила бы интерполяцию значений внутри fallback (видимый
 * текст менялся бы). Фолбэк внутри t() байт-в-байт повторяет прежний литерал. */
const HUD_DYNAMIC_KEYS = {
  slotAria: 'hud.toolbar.slotAria',
  slotTitle: 'hud.toolbar.slotTitle',
} as const;

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

type ToolbarContext = 'exploration' | 'combat' | 'dialogue' | 'menu';

type ToolbarSlot = {
  id: string;
  icon: string;
  label: string;
  shortcut: string;
  action: () => void;
};

/* ══════════════════════════════════════════════════════════════
   Context resolver
   ══════════════════════════════════════════════════════════════ */

function resolveContext(
  mode: string,
  showStoryOverlay: boolean,
  narrativeKind: string | undefined,
  mainMenuOpen: boolean,
): ToolbarContext {
  if (mainMenuOpen) return 'menu';
  if (mode === 'combat') return 'combat';
  if (showStoryOverlay && narrativeKind === 'dialogue') return 'dialogue';
  return 'exploration';
}

/* ══════════════════════════════════════════════════════════════
   Slot definitions — Russian labels, keyboard shortcuts 1-6
   ══════════════════════════════════════════════════════════════ */

function getExplorationSlots(
  openers: {
    onOpenQuests: () => void;
    onOpenInventory: () => void;
    onOpenPoetry: () => void;
    onOpenJournal: () => void;
    onOpenMenu: () => void;
  },
): ToolbarSlot[] {
  return [
    /* FIX: слоты «Карта» и «Кодекс» были заглушками (action: () => {}).
     * Теперь они открывают реальные панели через панельный диспетчер —
     * тот же путь, что и клавиши M / K. */
    { id: 'map', icon: '🗺', label: t('hud.toolbar.map', 'Карта'), shortcut: '1', action: () => { firePanelShortcut('KeyM'); } },
    { id: 'inventory', icon: '🎒', label: t('hud.toolbar.inventory', 'Инвентарь'), shortcut: '2', action: openers.onOpenInventory },
    { id: 'quests', icon: '📋', label: t('hud.toolbar.quests', 'Задания'), shortcut: '3', action: openers.onOpenQuests },
    { id: 'codex', icon: '📖', label: t('hud.toolbar.codex', 'Кодекс'), shortcut: '4', action: () => { firePanelShortcut('KeyK'); } },
    { id: 'journal', icon: '📝', label: t('hud.toolbar.journal', 'Журнал'), shortcut: '5', action: openers.onOpenJournal },
    { id: 'poems', icon: '✦', label: t('hud.toolbar.poems', 'Стихи'), shortcut: '6', action: openers.onOpenPoetry },
  ];
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

type QuickAccessToolbarProps = {
  onOpenQuests: () => void;
  onOpenInventory: () => void;
  onOpenPoetry: () => void;
  onOpenJournal: () => void;
  onOpenMenu: () => void;
};

export function QuickAccessToolbar({
  onOpenQuests,
  onOpenInventory,
  onOpenPoetry,
  onOpenJournal,
  onOpenMenu,
}: QuickAccessToolbarProps) {
  const { mode, mainMenuOpen } = useOrchestratorShell();
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();
  const [visible, setVisible] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const context = resolveContext(mode, showStoryOverlay, narrativeKind ?? undefined, mainMenuOpen);

  /* FIX: слоты для combat/dialogue/menu были нерабочими заглушками —
   * эти контексты уже имеют собственные органы управления
   * (CombatTouchControls, диалог, меню). Показываем тулбар только там,
   * где кнопки реально работают — в исследовании. */
  const slots: ToolbarSlot[] = getExplorationSlots({
    onOpenQuests,
    onOpenInventory,
    onOpenPoetry,
    onOpenJournal,
    onOpenMenu,
  });
  const active = context === 'exploration';

  // Show toolbar after a short delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Keyboard shortcuts 1-6
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6) {
        const slot = slots[num - 1];
        if (slot) { e.preventDefault(); slot.action(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, slots]);

  // Swipe gesture for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (dy < -40) setVisible(false);
    if (dy > 40) setVisible(true);
    touchStartRef.current = null;
  }, []);

  const handleSlotAction = useCallback((slot: ToolbarSlot) => {
    slot.action();
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  return (
    active && visible ? (
      <nav
        key="quick-access-toolbar"
        className="quick-access-toolbar quick-access-toolbar--enter"
        style={{ zIndex: UI_LAYERS.MOBILE_CONTROLS - 1 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="toolbar"
        aria-label={t('hud.toolbar.aria', 'Быстрый доступ')}
      >
          <div className="quick-access-toolbar-inner">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`quick-access-slot ${hoveredSlot === slot.id ? 'quick-access-slot--hover' : ''}`}
                onClick={() => handleSlotAction(slot)}
                onMouseEnter={() => setHoveredSlot(slot.id)}
                onMouseLeave={() => setHoveredSlot(null)}
                aria-label={t(HUD_DYNAMIC_KEYS.slotAria, `${slot.label} (${slot.shortcut})`)}
                title={t(HUD_DYNAMIC_KEYS.slotTitle, `${slot.label} [${slot.shortcut}]`)}
              >
                <span className="quick-access-slot-icon" aria-hidden="true">{slot.icon}</span>
                <span className="quick-access-slot-label">{slot.label}</span>
                {hoveredSlot === slot.id && (
                  <span
                    key={`kbd-${slot.id}`}
                    className="quick-access-slot-kbd quick-access-slot-kbd--enter"
                  >
                    {slot.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
      </nav>
    ) : null
  );
}
