import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PipelineLoadingOverlay } from '@/components/game/PipelineLoadingOverlay';
import { PIPELINE_LOADING_OVERLAY_LABELS } from '@/engine/loading/pipelineLoadingOverlayConstants';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import {
  LOADING_PLAYABLE_DISMISS_MS,
  LOADING_PLAYABLE_HOLD_MS,
} from '@/shared/constants/transitionTimings';

const useEffectiveReducedMotionMock = vi.fn(() => true);

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => useEffectiveReducedMotionMock(),
}));

vi.mock('@/hooks/useLoadingPipeline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useLoadingPipeline')>();
  const { loadingPipeline: pipeline } = await import('@/engine/loading/LoadingPipeline');
  return {
    ...actual,
    useAnimatedLoadingProgress: () => Math.round(pipeline.getSnapshot().pct),
  };
});

describe('PipelineLoadingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useEffectiveReducedMotionMock.mockReturnValue(true);
    loadingPipeline.reset();
  });

  afterEach(() => {
    loadingPipeline.reset();
    vi.useRealTimers();
  });

  describe('progress display', () => {
    it('binds to pipeline progress and custom message', () => {
      render(<PipelineLoadingOverlay message="Кастомное сообщение" />);

      expect(screen.getByRole('progressbar', { name: 'Кастомное сообщение' })).toBeInTheDocument();
    });

    it('shows progressbar with initial progress and a11y attributes', () => {
      render(<PipelineLoadingOverlay />);
      const bar = screen.getByRole('progressbar');

      expect(bar).toHaveAttribute('aria-valuenow', '0');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    it('updates progress when pipeline advances', () => {
      render(<PipelineLoadingOverlay />);

      act(() => {
        loadingPipeline.reportStage('boot_data');
      });

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '12');
    });
  });

  describe('playable transition', () => {
    it('calls onPlayable once when pipeline reaches playable', async () => {
      const onPlayable = vi.fn();
      render(<PipelineLoadingOverlay onPlayable={onPlayable} />);

      act(() => {
        loadingPipeline.reportStage('playable');
      });

      await waitFor(() => expect(onPlayable).toHaveBeenCalledOnce());
    });

    it('auto-dismisses when requireStartConfirm is false', async () => {
      render(<PipelineLoadingOverlay />);

      act(() => {
        loadingPipeline.reportStage('playable');
      });

      act(() => {
        vi.advanceTimersByTime(LOADING_PLAYABLE_DISMISS_MS);
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('shows start button and keeps overlay until confirmed', async () => {
      render(<PipelineLoadingOverlay requireStartConfirm />);

      act(() => {
        loadingPipeline.reportStage('playable');
      });

      const startButton = await screen.findByRole('button', {
        name: PIPELINE_LOADING_OVERLAY_LABELS.startAria,
      });
      expect(startButton).toHaveFocus();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: PIPELINE_LOADING_OVERLAY_LABELS.startAria }),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('complete dismissal', () => {
    it('hides when pipeline reaches complete with start confirm', async () => {
      render(<PipelineLoadingOverlay requireStartConfirm />);

      act(() => {
        loadingPipeline.reportStage('playable');
      });

      await screen.findByRole('button', { name: PIPELINE_LOADING_OVERLAY_LABELS.startAria });

      act(() => {
        vi.advanceTimersByTime(LOADING_PLAYABLE_HOLD_MS);
        loadingPipeline.reportStage('complete');
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('reduced motion', () => {
    it('dismisses without exit animation delay when reduced motion is active', async () => {
      useEffectiveReducedMotionMock.mockReturnValue(true);
      render(<PipelineLoadingOverlay />);

      act(() => {
        loadingPipeline.reportStage('playable');
        vi.advanceTimersByTime(LOADING_PLAYABLE_DISMISS_MS);
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  it('calls onPlayable when mounted at complete without a playable frame', async () => {
    const onPlayable = vi.fn();
    act(() => {
      loadingPipeline.reportStage('playable');
      vi.advanceTimersByTime(LOADING_PLAYABLE_HOLD_MS);
      loadingPipeline.reportStage('complete');
    });

    render(<PipelineLoadingOverlay onPlayable={onPlayable} />);

    await waitFor(() => expect(onPlayable).toHaveBeenCalledOnce());
  });

  it('exposes dialog semantics on the loading shell', () => {
    render(<PipelineLoadingOverlay message="Кастомное сообщение" />);
    expect(screen.getByRole('dialog', { name: 'Кастомное сообщение' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });
});
