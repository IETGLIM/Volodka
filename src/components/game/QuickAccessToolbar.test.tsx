/* v4.56.6 — регресс-тест наложении «Голос × панель интерфейса».
 *
 * Баг (репорт игрока): плашка диегетической наррации «Голос: Ты
 * просыпаешься…» (kind 'story') открыта, нижний стек HUD скрыт
 * (QuickUseBar/PoetryPowerBar/MobileActionButtons honor
 * useExplorationBottomHudVisible), а QuickAccessToolbar оставался видим,
 * потому что resolveContext прятал панель только при kind==='dialogue'.
 * WoW-хотбар с XP-полосой рисовался поверх текста плашки и вариантов
 * выбора. Контракт: при открытой диегетической плашке хотбар скрыт при
 * ЛЮБОМ kind ('story' и 'dialogue'); при закрытой — виден в exploration. */

import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickAccessToolbar } from './QuickAccessToolbar';

const hudMocks = vi.hoisted(() => ({
  mode: 'exploration',
  mainMenuOpen: false,
  showStoryOverlay: false,
  narrativeKind: null as 'story' | 'dialogue' | null,
  diegeticNarrative: null as { nodeId: string; kind: 'story' | 'dialogue' } | null,
}));

vi.mock('@/store/selectors', () => ({
  useOrchestratorShell: () => ({
    mode: hudMocks.mode,
    introSeen: true,
    mainMenuOpen: hudMocks.mainMenuOpen,
    devToolsArmed: false,
  }),
  useOrchestratorNarrativeOverlay: () => ({
    showStoryOverlay: hudMocks.showStoryOverlay,
    narrativeKind: hudMocks.narrativeKind,
    diegeticNarrative: hudMocks.diegeticNarrative,
  }),
  /* Читается реальным хуком useExplorationBottomHud → единый сигнал
   * подавления нижнего стека, как в живой сборке. */
  useDiegeticNarrativeState: () => hudMocks.diegeticNarrative,
  useProgressionSummary: () => ({ level: 1, xp: 5, xpToNextLevel: 100 }),
}));

vi.mock('@/shared/constants/uiTheme', () => ({ CLASSIC_UI: true }));

vi.mock('@/engine/input/panelShortcutDispatcher', () => ({
  firePanelShortcut: vi.fn(),
}));

vi.mock('@/i18n', () => ({
  t: (_key: string, fallback: string) => fallback,
}));

const noop = () => {};

function renderToolbar() {
  return render(
    <QuickAccessToolbar
      onOpenQuests={noop}
      onOpenInventory={noop}
      onOpenPoetry={noop}
      onOpenJournal={noop}
      onOpenMenu={noop}
    />,
  );
}

/** Внутренний «Show toolbar after a short delay» = 800мс. */
async function appear() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
}

describe('QuickAccessToolbar — diegetic narrative suppression (v4.56.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    hudMocks.mode = 'exploration';
    hudMocks.mainMenuOpen = false;
    hudMocks.showStoryOverlay = false;
    hudMocks.narrativeKind = null;
    hudMocks.diegeticNarrative = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('REGRESSION: скрыт при открытой story-плашке («Голос: Ты просыпаешься…»)', async () => {
    hudMocks.showStoryOverlay = true;
    hudMocks.narrativeKind = 'story';
    hudMocks.diegeticNarrative = { nodeId: 'start', kind: 'story' };
    renderToolbar();
    await appear();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('скрыт при открытой dialogue-плашке', async () => {
    hudMocks.showStoryOverlay = true;
    hudMocks.narrativeKind = 'dialogue';
    hudMocks.diegeticNarrative = { nodeId: 'npc_a', kind: 'dialogue' };
    renderToolbar();
    await appear();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('виден в exploration, когда диегетическая плашка закрыта', async () => {
    renderToolbar();
    await appear();
    expect(screen.getByRole('toolbar')).toBeTruthy();
  });

  it('возвращается после закрытия плашки', async () => {
    hudMocks.showStoryOverlay = true;
    hudMocks.narrativeKind = 'story';
    hudMocks.diegeticNarrative = { nodeId: 'start', kind: 'story' };
    const view = renderToolbar();
    await appear();
    expect(screen.queryByRole('toolbar')).toBeNull();

    view.rerender(
      <QuickAccessToolbar
        onOpenQuests={noop}
        onOpenInventory={noop}
        onOpenPoetry={noop}
        onOpenJournal={noop}
        onOpenMenu={noop}
      />,
    );
    hudMocks.showStoryOverlay = false;
    hudMocks.narrativeKind = null;
    hudMocks.diegeticNarrative = null;
    await act(async () => {
      view.rerender(
        <QuickAccessToolbar
          onOpenQuests={noop}
          onOpenInventory={noop}
          onOpenPoetry={noop}
          onOpenJournal={noop}
          onOpenMenu={noop}
        />,
      );
    });
    expect(screen.getByRole('toolbar')).toBeTruthy();
  });

  it('классическая XP-полоса рендерится вместе с панелью', async () => {
    renderToolbar();
    await appear();
    expect(screen.getByRole('progressbar', { name: /Опыт до уровня/i })).toBeTruthy();
  });
});
