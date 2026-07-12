import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameplayNarrativeOverlay } from './OrchestratorGameplaySections';

const narrativeOverlayMock = vi.hoisted(() => ({
  mode: 'exploration' as 'exploration' | 'combat',
  showStoryOverlay: false,
  narrativeKind: null as 'story' | 'dialogue' | null,
}));

vi.mock('@/components/game/diegetic/DiegeticDialogueHud', () => ({
  DiegeticDialogueHud: () => null,
}));

vi.mock('@/store/selectors', () => ({
  useOrchestratorShell: () => ({ mode: narrativeOverlayMock.mode }),
  useOrchestratorNarrativeOverlay: () => ({
    showStoryOverlay: narrativeOverlayMock.showStoryOverlay,
    narrativeKind: narrativeOverlayMock.narrativeKind,
    diegeticNarrative: null,
  }),
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

vi.mock('@/hooks/useCinematicNarrativePresentation', () => ({
  useCinematicNarrativePresentation: vi.fn(),
}));

vi.mock('./lazyPanels', () => ({
  LazyStoryRenderer: () => <div data-testid="story-renderer">story</div>,
  LazyDialogueRenderer: () => <div data-testid="dialogue-renderer">dialogue</div>,
}));

describe('GameplayNarrativeOverlay', () => {
  beforeEach(() => {
    narrativeOverlayMock.mode = 'exploration';
    narrativeOverlayMock.showStoryOverlay = false;
    narrativeOverlayMock.narrativeKind = null;
  });

  it('shows scene loading recovery when overlay is on but narrativeKind is null', () => {
    narrativeOverlayMock.showStoryOverlay = true;
    narrativeOverlayMock.narrativeKind = null;

    render(<GameplayNarrativeOverlay />);

    expect(screen.getByTestId('narrative-kind-recovery')).toBeInTheDocument();
    expect(screen.getByText('Загрузка сцены…')).toBeInTheDocument();
  });

  it('mounts story renderer once narrativeKind resolves to story', () => {
    narrativeOverlayMock.showStoryOverlay = true;
    narrativeOverlayMock.narrativeKind = 'story';

    render(<GameplayNarrativeOverlay />);

    expect(screen.queryByTestId('narrative-kind-recovery')).not.toBeInTheDocument();
    expect(screen.getByTestId('story-renderer')).toBeInTheDocument();
  });

  it('mounts dialogue renderer when narrativeKind is dialogue', () => {
    narrativeOverlayMock.showStoryOverlay = true;
    narrativeOverlayMock.narrativeKind = 'dialogue';

    render(<GameplayNarrativeOverlay />);

    expect(screen.queryByTestId('narrative-kind-recovery')).not.toBeInTheDocument();
    expect(screen.getByTestId('dialogue-renderer')).toBeInTheDocument();
  });

  it('renders nothing in combat even when story overlay flags are set', () => {
    narrativeOverlayMock.mode = 'combat';
    narrativeOverlayMock.showStoryOverlay = true;
    narrativeOverlayMock.narrativeKind = null;

    render(<GameplayNarrativeOverlay />);

    expect(screen.queryByTestId('narrative-kind-recovery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('story-renderer')).not.toBeInTheDocument();
  });
});
