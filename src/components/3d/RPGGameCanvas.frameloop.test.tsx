/**
 * Regression test for the "black screen after cutscene/dialogue handoff" bug.
 *
 * Root cause: `CanvasFrameloopController` had useEffect deps `[idle, invalidate]`
 * where `idle = physicsPaused || !tabVisible`. The parent switches frameloop to
 * 'demand' when `isStaticScreen = showStoryOverlay && !activeCutsceneId`, but
 * neither flag was in the deps — so the always→demand transition never called
 * invalidate() and the canvas froze on a stale frame.
 *
 * Fix: subscribe to `showStoryOverlay` and `activeCutsceneId` inside the
 * controller and add them to the effect deps.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import React from 'react';

// --- Mock @react-three/fiber: stub useThree to return a spy invalidate ---
const invalidateSpy = vi.fn();
vi.mock('@react-three/fiber', () => ({
  useThree: (selector?: (s: unknown) => unknown) =>
    selector ? selector({ invalidate: invalidateSpy }) : { invalidate: invalidateSpy },
  Canvas: () => null,
}));

// --- Mock heavy sibling components so the module loads without WebGL/Rapier ---
vi.mock('./SimplePlayer', () => ({ SimplePlayer: () => null }));
vi.mock('./FollowCamera', () => ({ FollowCamera: () => null }));
vi.mock('./ExplorationPostFX', () => ({ ExplorationPostFX: () => null }));
vi.mock('./Lighting', () => ({ ExplorationLighting: () => null }));
vi.mock('./SceneEnvironment', () => ({ SceneEnvironment: () => null }));
vi.mock('./MatrixRain', () => ({ MatrixRain: () => null }));
vi.mock('./GlitchEffect', () => ({ GlitchEffect: () => null }));
vi.mock('./NoirOverlay', () => ({ NoirOverlay: () => null }));
vi.mock('./WeatherController', () => ({ WeatherController: () => null }));
vi.mock('./AtmosphericEffects', () => ({ AtmosphericEffects: () => null }));
vi.mock('./VisualizationLayers', () => ({ VisualizationLayers: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('./FrameBudgetRunner', () => ({ FrameBudgetRunner: () => null }));
vi.mock('./PostFrameBudgetRunner', () => ({ PostFrameBudgetRunner: () => null }));
vi.mock('./RotationSyncBridge', () => ({ RotationSyncBridge: () => null }));
vi.mock('./assets/GltfPipelineInit', () => ({ GltfPipelineInit: () => null }));

vi.mock('@/engine/graphics/useGraphicsQuality', () => ({ useGraphicsQuality: () => ({ preset: { dpr: [1, 1] as [number, number] } }) }));
vi.mock('@/hooks/useDynamicDPR', () => ({ useDynamicDPR: () => [1, 1] as [number, number] }));
vi.mock('@/engine/frame/useFrameTick', () => ({ useFrameTick: () => {}, usePostFrameTick: () => {} }));
vi.mock('@/engine/VirtualControlsState', () => ({ useVirtualControlsRef: () => ({ current: {} }) }));

// Real stores — manipulated via setState
import { useUIStore } from '@/store/stores/uiStore';
import { useCutsceneStore } from '@/store/stores/cutsceneStore';
import { CanvasFrameloopController } from './RPGGameCanvas';

function resetStores() {
  act(() => {
    useUIStore.setState({
      mainMenuOpen: false,
      introActive: false,
      combatActive: false,
      showStoryOverlay: false,
    } as Partial<ReturnType<typeof useUIStore.getState>>);
    useCutsceneStore.setState({
      activeCutsceneId: null,
    } as Partial<ReturnType<typeof useCutsceneStore.getState>>);
  });
}

describe('CanvasFrameloopController — invalidate on frameloop-flipping state changes', () => {
  beforeEach(() => {
    invalidateSpy.mockClear();
    resetStores();
  });

  it('calls invalidate() on mount (boot path)', () => {
    render(<CanvasFrameloopController idle={false} />);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('calls invalidate() when idle flips (existing behavior preserved)', () => {
    const { rerender } = render(<CanvasFrameloopController idle={false} />);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    rerender(<CanvasFrameloopController idle={true} />);
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it('REGRESSION: calls invalidate() when showStoryOverlay flips true (dialogue opens → demand mode)', () => {
    render(<CanvasFrameloopController idle={false} />);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    // Dialogue opens — parent switches frameloop always→demand.
    act(() => {
      useUIStore.setState({ showStoryOverlay: true });
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it('REGRESSION: calls invalidate() when activeCutsceneId changes (cutscene start/end)', () => {
    render(<CanvasFrameloopController idle={false} />);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    // Cutscene starts — frameloop stays 'always' but the dep must still fire
    // so the transition is painted.
    act(() => {
      useCutsceneStore.setState({ activeCutsceneId: 'intro_wakeup' });
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    // Cutscene ends — this is the killer transition (cutscene→dialogue handoff
    // where frameloop can flip to demand).
    act(() => {
      useCutsceneStore.setState({ activeCutsceneId: null });
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
    cleanup();
  });
});
