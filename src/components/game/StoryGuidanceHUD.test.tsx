import { render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryGuidanceHUD } from './StoryGuidanceHUD';
import { EXPLORATION_HUD_HANDOFF } from '@/shared/constants/transitionTimings';
import type { GameplayPresentationProfile } from '@/hooks/useGameplayPresentationProfile';

const hudMocks = vi.hoisted(() => ({
  profile: 'exploration' as GameplayPresentationProfile,
  showStoryOverlay: false,
  narrativeKind: null as 'story' | 'dialogue' | null,
  diegeticNarrative: null as { nodeId: string; kind: 'story' | 'dialogue' } | null,
  interactionLocked: false,
  guidance: {
    objectiveText: 'Исследуй комнату',
    actNumber: 1,
    chapterTitle: 'Пробуждение',
    urgency: 'normal' as const,
    targetSceneId: 'volodka_room' as const,
  },
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

vi.mock('@/hooks/useGameplayPresentationProfile', () => ({
  useGameplayPresentationProfile: () => hudMocks.profile,
  isExplorationHudProfile: (p: GameplayPresentationProfile) => p === 'exploration',
}));

vi.mock('@/store/selectors', () => ({
  useQuests: () => [],
  useCurrentSceneId: () => 'volodka_room',
  useOrchestratorNarrativeOverlay: () => ({
    showStoryOverlay: hudMocks.showStoryOverlay,
    narrativeKind: hudMocks.narrativeKind,
    diegeticNarrative: hudMocks.diegeticNarrative,
  }),
}));

vi.mock('@/store/questStore', () => ({
  getNextTrackedObjective: () => null,
  areDependenciesMet: () => ({ met: false, missing: [] }),
  getQuestMarker: () => null,
}));

vi.mock('@/engine/GuidedStoryManager', () => ({
  getCurrentGuidance: () => hudMocks.guidance,
}));

vi.mock('@/engine/interaction/interactionSession', () => ({
  isInteractionLocked: () => hudMocks.interactionLocked,
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    on: () => () => {},
  },
}));

describe('StoryGuidanceHUD', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    hudMocks.profile = 'exploration';
    hudMocks.showStoryOverlay = false;
    hudMocks.narrativeKind = null;
    hudMocks.diegeticNarrative = null;
    hudMocks.interactionLocked = false;
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('defers reveal until handoff delay elapses', () => {
    render(<StoryGuidanceHUD />);

    expect(screen.queryByTestId('story-guidance-hud')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS - 1);
    });
    expect(screen.queryByTestId('story-guidance-hud')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('story-guidance-hud')).toBeInTheDocument();
    expect(screen.getByText('Исследуй комнату')).toBeInTheDocument();
  });

  it('stays hidden while story overlay is open', () => {
    hudMocks.showStoryOverlay = true;
    hudMocks.narrativeKind = 'story';

    render(<StoryGuidanceHUD />);
    act(() => {
      vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS + 100);
    });

    expect(screen.queryByTestId('story-guidance-hud')).not.toBeInTheDocument();
  });

  it('stays hidden during narrative kind recovery', () => {
    hudMocks.showStoryOverlay = true;
    hudMocks.narrativeKind = null;

    render(<StoryGuidanceHUD />);
    act(() => {
      vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS + 100);
    });

    expect(screen.queryByTestId('story-guidance-hud')).not.toBeInTheDocument();
  });

  it('stays hidden during scene transition profile', () => {
    hudMocks.profile = 'transition';

    render(<StoryGuidanceHUD />);
    act(() => {
      vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS + 100);
    });

    expect(screen.queryByTestId('story-guidance-hud')).not.toBeInTheDocument();
  });

  it('stays hidden during diegetic dialogue', () => {
    hudMocks.diegeticNarrative = { nodeId: 'kitchen_table', kind: 'story' };

    render(<StoryGuidanceHUD />);
    act(() => {
      vi.advanceTimersByTime(EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS + 100);
    });

    expect(screen.queryByTestId('story-guidance-hud')).not.toBeInTheDocument();
  });
});
