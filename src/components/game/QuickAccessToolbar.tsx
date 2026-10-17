'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Map, Backpack, ScrollText, BookOpen, NotebookPen, Sparkles } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { CLASSIC_UI } from '@/shared/constants/uiTheme';
import { useOrchestratorNarrativeOverlay, useOrchestratorShell } from '@/store/selectors';
import { useProgressionSummary } from '@/store/selectors';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { firePanelShortcut } from '@/engine/input/panelShortcutDispatcher';
import { t } from '@/i18n';

/* i18n (этап 115): с волны 4 подписи слотов — шаблоны каталога с плейсхолдерами
 * {name} и параметрами t(key, fallback, params); ключи литеральные, фолбэки
 * байт-в-байт повторяют прежние литералы. */

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

type ToolbarContext = 'exploration' | 'combat' | 'dialogue' | 'menu';

type ToolbarSlot = {
  id: string;
  icon: ReactNode;
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
   Slot definitions — Russian labels, letter shortcuts (WoW-style)
   v4.52.0: цифры 1–9 отданы навыкам и хотбару (панель действий),
   панели живут на буквах: M/I/L/K/J/P. Клавиатурный слушатель цифр
   снят — единственным владельцем цифр остаётся геймплей.
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
    /* v4.45.0: цветные эмодзи (🗺🎒📋📖📝) ломали монохромную дисциплину
     * «Ночной тетради» — заменены на штриховые иконки Lucide. */
    /* v4.52.0: подписи слотов — их буквенные клавиши, цифры = навыки. */
    { id: 'map', icon: <Map className="size-[18px]" strokeWidth={1.6} />, label: t('hud.toolbar.map', 'Карта'), shortcut: 'M', action: () => { firePanelShortcut('KeyM'); } },
    { id: 'inventory', icon: <Backpack className="size-[18px]" strokeWidth={1.6} />, label: t('hud.toolbar.inventory', 'Инвентарь'), shortcut: 'I', action: openers.onOpenInventory },
    { id: 'quests', icon: <ScrollText className="size-[18px]" strokeWidth={1.6} />, label: t('hud.toolbar.quests', 'Задания'), shortcut: 'L', action: openers.onOpenQuests },
    { id: 'codex', icon: <BookOpen className="size-[18px]" strokeWidth={1.6} />, label: t('hud.toolbar.codex', 'Кодекс'), shortcut: 'K', action: () => { firePanelShortcut('KeyK'); } },
    { id: 'journal', icon: <NotebookPen className="size-[18px]" strokeWidth={1.6} />, label: t('hud.toolbar.journal', 'Журнал'), shortcut: 'J', action: openers.onOpenJournal },
    { id: 'poems', icon: <Sparkles className="size-[18px]" strokeWidth={1.6} />, label: t('hud.toolbar.poems', 'Стихи'), shortcut: 'P', action: openers.onOpenPoetry },
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
  /* v4.56.6 FIX (overlap «Голос × панель интерфейса»): диегетическая плашка
   * наррации («Голос: Ты просыпаешься…») опускается к нижнему краю
   * (diegeticDialogueBottomPadCss → 16px) и считает весь нижний стек скрытым.
   * QuickUseBar/PoetryPowerBar/MobileActionButtons подчиняются сигналу
   * useExplorationBottomHudVisible, а хотбар — нет: resolveContext прятал
   * панель только при kind==='dialogue', поэтому при story-плашке WoW-хотбар
   * с XP-полосой рисовался поверх текста и вариантов выбора. Теперь панель
   * живёт тем же контрактом, что и весь нижний стек. */
  const bottomHudVisible = useExplorationBottomHudVisible();
  // v4.51.0: классическая XP-полоса под панелью (как в WoW — над панелью
  // действий). Узкая подписка на прогрессию.
  const { level, xp, xpToNextLevel: xpToNext } = useProgressionSummary();
  const xpPct = Math.min(100, Math.max(0, (xp / Math.max(1, xpToNext)) * 100));
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
  const active = context === 'exploration' && bottomHudVisible;

  // Show toolbar after a short delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  /* v4.52.0: клавиатурный слушатель 1–6 СНЯТ — цифры принадлежат силам
   * стихов (1–5) и хотбару предметов (6–9). Панели открываются буквами
   * M/I/L/K/J/P (панельный свитчборд) и кликами по слотам. */

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

          {CLASSIC_UI && (
            <div
              className="vk-xp-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(xpPct)}
              aria-label={t('hud.xpBar.aria', `Опыт до уровня ${level + 1}: ${Math.round(xpPct)}%`, {
                level: level + 1,
                pct: Math.round(xpPct),
              })}
            >
              <div className="vk-xp-bar-fill" style={{ width: `${xpPct}%` }} />
              <span className="vk-xp-bar-text">
                {t('hud.xpBar.label', `Опыт ${Math.round(xp)} / ${Math.round(xpToNext)} · Ур. ${level}`, {
                  xp: Math.round(xp),
                  toNext: Math.round(xpToNext),
                  level,
                })}
              </span>
            </div>
          )}
          <div className="quick-access-toolbar-inner">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`quick-access-slot ${hoveredSlot === slot.id ? 'quick-access-slot--hover' : ''}`}
                onClick={() => handleSlotAction(slot)}
                onMouseEnter={() => setHoveredSlot(slot.id)}
                onMouseLeave={() => setHoveredSlot(null)}
                aria-label={t('hud.toolbar.slotAria', `${slot.label} (${slot.shortcut})`, { label: slot.label, shortcut: slot.shortcut })}
                title={t('hud.toolbar.slotTitle', `${slot.label} [${slot.shortcut}]`, { label: slot.label, shortcut: slot.shortcut })}
              >
                <span className="quick-access-slot-icon" aria-hidden="true">{slot.icon}</span>
                <span className="quick-access-slot-label">{slot.label}</span>
                {/* v4.51.0: клавиша слота видима ВСЕГДА (классика WoW — цифра
                 * в левом верхнем углу слота), а не только на ховере. */}
                <span
                  key={`kbd-${slot.id}`}
                  className="quick-access-slot-kbd quick-access-slot-kbd--enter"
                >
                  {slot.shortcut}
                </span>
              </button>
            ))}
          </div>
      </nav>
    ) : null
  );
}
